import * as vscode from 'vscode';
import * as fs from 'fs';
import { ExecutionState } from './types';

/**
 * WorkflowExecutor manages workflow execution lifecycle
 *
 * Responsibilities:
 * - Initialize WorkflowEngine from JSON config
 * - Execute workflows with user input
 * - Handle GraphInterrupt detection and processing
 * - Resume execution after interrupts
 * - Stream execution messages to webview
 * - Manage session state and thread IDs
 */
export class WorkflowExecutor {
  private sessions: Map<string, ExecutionState> = new Map();

  constructor(private panel: vscode.WebviewPanel) {}

  /**
   * Initialize workflow for execution
   * Loads workflow config and creates WorkflowEngine instance
   */
  async initializeWorkflow(
    sessionId: string,
    workflowPath: string
  ): Promise<void> {
    try {
      // Load workflow config
      const configContent = fs.readFileSync(workflowPath, 'utf-8');
      const workflowConfig = JSON.parse(configContent);

      // Dynamically import WorkflowEngine
      let WorkflowEngine: any;
      try {
        const sceneGraphModule = await import('@kudos/scene-graph-manager');
        WorkflowEngine = sceneGraphModule.WorkflowEngine;
      } catch (error: any) {
        throw new Error(
          `Failed to load WorkflowEngine: ${error.message}. ` +
          'Make sure @kudos/scene-graph-manager is installed.'
        );
      }

      // Create workflow engine
      const engine = new WorkflowEngine(workflowConfig);

      // Build the workflow graph
      await engine.build();

      // Generate thread ID
      const threadId = this.generateThreadId();

      // Store session state
      this.sessions.set(sessionId, {
        sessionId,
        threadId,
        isExecuting: false,
        isWaitingForInterrupt: false,
        engine
      });

      // Notify webview
      this.sendMessage({
        command: 'executionReady',
        sessionId,
        threadId
      });
    } catch (error: any) {
      this.sendError(`Failed to initialize workflow: ${error.message}`);
    }
  }

  /**
   * Execute workflow with user input
   */
  async execute(sessionId: string, input: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.engine) {
      throw new Error('Session not initialized');
    }

    try {
      // Update state
      session.isExecuting = true;
      this.sendMessage({ command: 'executionStarted' });

      // Execute workflow
      // Convert user input to a message format
      const result = await session.engine.invoke(
        {
          messages: [
            {
              role: 'user',
              content: input
            }
          ]
        },
        {
          configurable: {
            thread_id: session.threadId
          }
        }
      );

      // Handle result
      await this.handleExecutionResult(session, result);

    } catch (error: any) {
      // Check if this is a GraphInterrupt (which is thrown as an error by LangGraph)
      if (error && typeof error === 'object' && 'interrupts' in error) {
        // This is a GraphInterrupt - extract the interrupt data
        const interruptData = error.interrupts && error.interrupts.length > 0 ? error.interrupts[0] : null;

        if (interruptData) {
          // Store interrupt state
          session.currentInterrupt = interruptData;
          session.isExecuting = false;
          session.isWaitingForInterrupt = true;

          // Send interrupt message to chat
          const interruptMessage = interruptData.value || 'User input required';
          this.sendMessage({
            command: 'executionMessage',
            role: 'interrupt',
            content: interruptMessage
          });

          // Notify webview to show interrupt prompt
          this.sendMessage({
            command: 'interruptRequired',
            message: interruptMessage
          });

          return;
        }
      }

      // Handle as normal error
      this.handleExecutionError(session, error);
    }
  }

  /**
   * Resume workflow after interrupt
   */
  async resume(sessionId: string, input: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.engine || !session.currentInterrupt) {
      throw new Error('No interrupt to resume');
    }

    try {
      // Update state
      session.isExecuting = true;
      session.isWaitingForInterrupt = false;

      // Resume execution with Command to resume from interrupt
      // Import Command from @kudos/scene-graph-manager if needed
      const { Command } = await import('@kudos/scene-graph-manager');

      const resumeCommand = new Command({
        resume: input
      });

      const result = await session.engine.invoke(
        resumeCommand,
        {
          configurable: {
            thread_id: session.threadId
          }
        }
      );

      // Clear interrupt
      session.currentInterrupt = undefined;

      // Handle result
      await this.handleExecutionResult(session, result);

    } catch (error: any) {
      // Check if this is a GraphInterrupt (which is thrown as an error by LangGraph)
      if (error && typeof error === 'object' && 'interrupts' in error) {
        // This is a GraphInterrupt - extract the interrupt data
        const interruptData = error.interrupts && error.interrupts.length > 0 ? error.interrupts[0] : null;

        if (interruptData) {
          // Store interrupt state (can have multiple interrupts in sequence)
          session.currentInterrupt = interruptData;
          session.isExecuting = false;
          session.isWaitingForInterrupt = true;

          // Send interrupt message to chat
          const interruptMessage = interruptData.value || 'User input required';
          this.sendMessage({
            command: 'executionMessage',
            role: 'interrupt',
            content: interruptMessage
          });

          // Notify webview to show interrupt prompt
          this.sendMessage({
            command: 'interruptRequired',
            message: interruptMessage
          });

          return;
        }
      }

      // Handle as normal error
      this.handleExecutionError(session, error);
    }
  }

  /**
   * Handle execution result (including interrupts)
   */
  private async handleExecutionResult(
    session: ExecutionState,
    result: any
  ): Promise<void> {
    // Check if result is an interrupt
    // GraphInterrupt is a class from @kudos/scene-graph-manager
    const isInterrupt = result && result.constructor && result.constructor.name === 'GraphInterrupt';

    if (isInterrupt) {
      // Store interrupt state
      session.currentInterrupt = result;
      session.isExecuting = false;
      session.isWaitingForInterrupt = true;

      // Send interrupt message to chat
      this.sendMessage({
        command: 'executionMessage',
        role: 'interrupt',
        content: result.message || 'User input required'
      });

      // Notify webview to show interrupt prompt
      this.sendMessage({
        command: 'interruptRequired',
        message: result.message || 'User input required'
      });

      return;
    }

    // Normal completion
    session.isExecuting = false;

    // Send result to chat
    if (result && result.output) {
      this.sendMessage({
        command: 'executionMessage',
        role: 'assistant',
        content: this.formatOutput(result.output)
      });
    }

    // Notify completion
    this.sendMessage({
      command: 'executionComplete',
      result
    });
  }

  /**
   * Handle execution error
   */
  private handleExecutionError(session: ExecutionState, error: any): void {
    session.isExecuting = false;
    session.isWaitingForInterrupt = false;

    this.sendMessage({
      command: 'executionError',
      error: error.message || 'Unknown error'
    });
  }

  /**
   * Format output for display
   */
  private formatOutput(output: any): string {
    if (typeof output === 'string') {
      return output;
    }

    if (output && output.response) {
      return output.response;
    }

    // Handle array outputs
    if (Array.isArray(output)) {
      return output.map((item, index) => {
        if (typeof item === 'string') {
          return item;
        }
        return JSON.stringify(item, null, 2);
      }).join('\n\n');
    }

    // Fallback to JSON stringify
    return JSON.stringify(output, null, 2);
  }

  /**
   * Generate unique thread ID
   */
  private generateThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clear chat history for a specific session
   * Resets thread_id and execution state
   * Also deletes the thread from MemorySaver using LangGraph's deleteThread()
   *
   * @param sessionId - The session to clear
   * @param newThreadId - Optional new thread_id. If not provided, generates a new one.
   * @returns The new thread_id that was set
   */
  async clearChatHistory(sessionId: string, newThreadId?: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[WorkflowExecutor] Session ${sessionId} not found`);
      throw new Error(`Session ${sessionId} not found`);
    }

    // Store old thread_id for logging
    const oldThreadId = session.threadId;

    // Delete old thread from MemorySaver using LangGraph's deleteThread()
    try {
      const checkpointer = (session.engine as any)?.checkpointer;
      if (checkpointer && typeof checkpointer.deleteThread === 'function') {
        await checkpointer.deleteThread(oldThreadId);
        console.log(`[WorkflowExecutor] Deleted MemorySaver state for thread: ${oldThreadId}`);
      } else {
        console.warn(`[WorkflowExecutor] Checkpointer does not support deleteThread()`);
      }
    } catch (error: any) {
      console.error(`[WorkflowExecutor] Failed to delete thread ${oldThreadId}:`, error.message);
      // Continue with thread_id reset even if deletion fails
    }

    // Use provided thread_id or generate new one
    const effectiveThreadId = newThreadId || this.generateThreadId();
    session.threadId = effectiveThreadId;

    // Reset execution state
    session.isExecuting = false;
    session.isWaitingForInterrupt = false;
    session.currentInterrupt = undefined;

    console.log(`[WorkflowExecutor] Chat history cleared for session ${sessionId}`);
    console.log(`  Old thread_id: ${oldThreadId}`);
    console.log(`  New thread_id: ${effectiveThreadId}`);
    console.log(`  Source: ${newThreadId ? 'provided' : 'auto-generated'}`);

    // Notify webview
    this.sendMessage({
      command: 'chatHistoryCleared',
      sessionId,
      threadId: effectiveThreadId
    });

    return effectiveThreadId;
  }

  /**
   * Clear chat history for all sessions
   * Resets thread_id and execution state for every active session
   *
   * @returns Map of sessionId to new thread_id
   */
  async clearAllChatHistory(): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    console.log(`[WorkflowExecutor] Clearing all chat history (${this.sessions.size} sessions)`);

    for (const [sessionId, session] of this.sessions.entries()) {
      const oldThreadId = session.threadId;

      // Delete old thread from MemorySaver
      try {
        const checkpointer = (session.engine as any)?.checkpointer;
        if (checkpointer && typeof checkpointer.deleteThread === 'function') {
          await checkpointer.deleteThread(oldThreadId);
          console.log(`  Deleted MemorySaver state for thread: ${oldThreadId}`);
        }
      } catch (error: any) {
        console.error(`  Failed to delete thread ${oldThreadId}:`, error.message);
      }

      const newThreadId = this.generateThreadId();

      session.threadId = newThreadId;
      session.isExecuting = false;
      session.isWaitingForInterrupt = false;
      session.currentInterrupt = undefined;

      results.set(sessionId, newThreadId);

      console.log(`  Session ${sessionId}: ${oldThreadId} → ${newThreadId}`);

      // Notify webview for each session
      this.sendMessage({
        command: 'chatHistoryCleared',
        sessionId,
        threadId: newThreadId
      });
    }

    console.log(`[WorkflowExecutor] All chat history cleared`);

    return results;
  }

  /**
   * Get execution state for a session
   */
  getExecutionState(sessionId: string): ExecutionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clear session and clean up resources
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Send message to webview
   */
  private sendMessage(message: any): void {
    this.panel.webview.postMessage(message);
  }

  /**
   * Send error to webview
   */
  private sendError(error: string): void {
    this.sendMessage({
      command: 'executionError',
      error
    });
  }

  /**
   * Dispose executor and clean up all sessions
   */
  dispose(): void {
    this.sessions.clear();
  }
}
