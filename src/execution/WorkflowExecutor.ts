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
      const result = await session.engine.invoke(
        { input },
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
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
