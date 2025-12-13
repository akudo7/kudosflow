# Phase 10C: Workflow Execution Engine Integration

**Status**: ⬜ 未開始
**Time**: 4-5 days
**Complexity**: Very High
**Priority**: ⭐ Critical

## Overview

Execute workflows using WorkflowEngine with full interrupt handling. This is the core phase that brings workflow execution capabilities to the editor, connecting the Chat UI (Phase 10B) with the actual WorkflowEngine from SceneGraphManager.

## Goal

Enable users to:
- Execute workflows interactively via chat
- Handle workflow interrupts (user input required)
- Resume execution after providing input
- See real-time execution messages
- Manage execution sessions

## Architecture

### Execution Flow

```
User Input (Chat)
    ↓
Webview postMessage
    ↓
WorkflowEditorPanel handler
    ↓
WorkflowExecutor.execute()
    ↓
WorkflowEngine (SceneGraphManager)
    ↓
Stream messages to webview
    ↓
Display in Chat UI
```

### Interrupt Handling Pattern

Reference: `/Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/kudos.tsx` (lines 180-250)

```typescript
// Execute workflow
const result = await engine.execute({ input: userMessage, thread_id });

// Check for interrupt
if (result instanceof GraphInterrupt) {
  // Wait for user input
  const userInput = await getUserInput(result.message);

  // Resume with input
  const resumeResult = await engine.execute({
    input: userInput,
    thread_id,
    resumeFrom: result
  });
}
```

## Implementation Tasks

### Task 1: Workflow Executor (`src/execution/WorkflowExecutor.ts`)

Core execution manager (400-500 lines):

```typescript
import { WorkflowEngine, GraphInterrupt } from '@kudos/scene-graph-manager';
import * as vscode from 'vscode';
import * as fs from 'fs';

export interface ExecutionState {
  sessionId: string;
  threadId: string;
  isExecuting: boolean;
  isWaitingForInterrupt: boolean;
  currentInterrupt?: GraphInterrupt;
  engine?: WorkflowEngine;
}

export class WorkflowExecutor {
  private sessions: Map<string, ExecutionState> = new Map();
  private messageCallback?: (message: any) => void;

  constructor(private panel: vscode.WebviewPanel) {}

  /**
   * Initialize workflow for execution
   */
  async initializeWorkflow(
    sessionId: string,
    workflowPath: string
  ): Promise<void> {
    try {
      // Load workflow config
      const configContent = fs.readFileSync(workflowPath, 'utf-8');
      const workflowConfig = JSON.parse(configContent);

      // Create workflow engine
      const engine = new WorkflowEngine(workflowConfig);

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

      // Send user message to chat
      this.sendMessage({
        command: 'executionMessage',
        role: 'user',
        content: input
      });

      // Execute workflow
      const result = await session.engine.execute({
        input,
        thread_id: session.threadId
      });

      // Handle result
      await this.handleExecutionResult(session, result);

    } catch (error: any) {
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

      // Send user input to chat
      this.sendMessage({
        command: 'executionMessage',
        role: 'user',
        content: input
      });

      // Resume execution
      const result = await session.engine.execute({
        input,
        thread_id: session.threadId,
        resumeFrom: session.currentInterrupt
      });

      // Clear interrupt
      session.currentInterrupt = undefined;

      // Handle result
      await this.handleExecutionResult(session, result);

    } catch (error: any) {
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
    if (result instanceof GraphInterrupt) {
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
        message: result.message
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

    return JSON.stringify(output, null, 2);
  }

  /**
   * Generate unique thread ID
   */
  private generateThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get execution state
   */
  getExecutionState(sessionId: string): ExecutionState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clear session
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
   * Dispose executor
   */
  dispose(): void {
    this.sessions.clear();
  }
}
```

### Task 2: Interrupt Handler (`src/execution/InterruptHandler.ts`)

Specialized interrupt management (100-150 lines):

```typescript
import { GraphInterrupt } from '@kudos/scene-graph-manager';

export interface InterruptState {
  interrupt: GraphInterrupt;
  message: string;
  timestamp: Date;
}

export class InterruptHandler {
  private currentInterrupt?: InterruptState;

  /**
   * Set current interrupt
   */
  setInterrupt(interrupt: GraphInterrupt): void {
    this.currentInterrupt = {
      interrupt,
      message: interrupt.message || 'User input required',
      timestamp: new Date()
    };
  }

  /**
   * Get current interrupt
   */
  getInterrupt(): InterruptState | undefined {
    return this.currentInterrupt;
  }

  /**
   * Clear interrupt
   */
  clearInterrupt(): void {
    this.currentInterrupt = undefined;
  }

  /**
   * Check if waiting for interrupt
   */
  isWaitingForInterrupt(): boolean {
    return this.currentInterrupt !== undefined;
  }

  /**
   * Get resume data for WorkflowEngine
   */
  getResumeData(): GraphInterrupt | undefined {
    return this.currentInterrupt?.interrupt;
  }
}
```

### Task 3: Message Handlers (`src/panels/WorkflowEditorPanel.ts`)

Add execution message handlers (+200 lines):

```typescript
// Add to class properties
private _workflowExecutor?: WorkflowExecutor;

// Initialize in constructor
this._workflowExecutor = new WorkflowExecutor(this._panel);

// Add to message handler
private async _handleMessageFromWebview(message: any) {
  switch (message.command) {
    // ... existing handlers

    case "initializeWorkflow":
      await this._initializeWorkflow(message.sessionId, message.filePath);
      break;

    case "executeWorkflow":
      await this._executeWorkflow(message.sessionId, message.input);
      break;

    case "resumeWorkflow":
      await this._resumeWorkflow(message.sessionId, message.input);
      break;

    case "getExecutionState":
      this._sendExecutionState(message.sessionId);
      break;

    case "clearSession":
      this._clearSession(message.sessionId);
      break;
  }
}

private async _initializeWorkflow(sessionId: string, filePath: string) {
  try {
    await this._workflowExecutor?.initializeWorkflow(sessionId, filePath);
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to initialize: ${error.message}`);
  }
}

private async _executeWorkflow(sessionId: string, input: string) {
  try {
    await this._workflowExecutor?.execute(sessionId, input);
  } catch (error: any) {
    vscode.window.showErrorMessage(`Execution error: ${error.message}`);
  }
}

private async _resumeWorkflow(sessionId: string, input: string) {
  try {
    await this._workflowExecutor?.resume(sessionId, input);
  } catch (error: any) {
    vscode.window.showErrorMessage(`Resume error: ${error.message}`);
  }
}

private _sendExecutionState(sessionId: string) {
  const state = this._workflowExecutor?.getExecutionState(sessionId);
  this._panel.webview.postMessage({
    command: 'executionState',
    state
  });
}

private _clearSession(sessionId: string) {
  this._workflowExecutor?.clearSession(sessionId);
}

// Dispose executor
public dispose() {
  // ... existing dispose logic
  this._workflowExecutor?.dispose();
}
```

### Task 4: Webview Message Handlers (`webview-ui/src/workflow-editor/WorkflowEditor.tsx`)

Handle execution messages (+150 lines):

```typescript
// Initialize workflow on mount
useEffect(() => {
  if (currentFilePath) {
    vscode.postMessage({
      command: 'initializeWorkflow',
      sessionId,
      filePath: currentFilePath
    });
  }
}, [currentFilePath, sessionId]);

// Enhanced message listener
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    switch (message.command) {
      case 'executionReady':
        // Workflow initialized, ready for execution
        console.log('Workflow ready for execution');
        break;

      case 'executionStarted':
        setIsExecuting(true);
        break;

      case 'executionMessage':
        const newMessage: ChatMessage = {
          id: uuidv4(),
          role: message.role,
          content: message.content,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, newMessage]);

        // Increment unread if chat is closed
        if (!showChat) {
          setUnreadCount(prev => prev + 1);
        }
        break;

      case 'interruptRequired':
        setIsWaitingForInterrupt(true);
        setInterruptMessage(message.message);
        setIsExecuting(false);
        break;

      case 'executionComplete':
        setIsExecuting(false);
        setIsWaitingForInterrupt(false);
        setInterruptMessage('');
        break;

      case 'executionError':
        setIsExecuting(false);
        setIsWaitingForInterrupt(false);
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'system',
          content: `❌ Error: ${message.error}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [showChat, sessionId]);
```

### Task 5: Execution Hook (`webview-ui/src/workflow-editor/hooks/useWorkflowExecution.ts`)

Custom hook for execution state (150-200 lines):

```typescript
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types/chat.types';

export interface UseWorkflowExecutionOptions {
  filePath?: string;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

export function useWorkflowExecution(options: UseWorkflowExecutionOptions) {
  const { filePath, onMessage, onError } = options;

  const [sessionId] = useState(() => uuidv4());
  const [isReady, setIsReady] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isWaitingForInterrupt, setIsWaitingForInterrupt] = useState(false);
  const [interruptMessage, setInterruptMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize workflow
  useEffect(() => {
    if (filePath) {
      vscode.postMessage({
        command: 'initializeWorkflow',
        sessionId,
        filePath
      });
    }
  }, [filePath, sessionId]);

  // Execute workflow
  const execute = useCallback((input: string) => {
    if (!isReady || isExecuting) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to extension
    vscode.postMessage({
      command: 'executeWorkflow',
      sessionId,
      input
    });

    setIsExecuting(true);
  }, [isReady, isExecuting, sessionId]);

  // Resume after interrupt
  const resume = useCallback((input: string) => {
    if (!isWaitingForInterrupt) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to extension
    vscode.postMessage({
      command: 'resumeWorkflow',
      sessionId,
      input
    });

    setIsExecuting(true);
    setIsWaitingForInterrupt(false);
  }, [isWaitingForInterrupt, sessionId]);

  // Clear session
  const clear = useCallback(() => {
    vscode.postMessage({
      command: 'clearSession',
      sessionId
    });

    setMessages([]);
    setIsExecuting(false);
    setIsWaitingForInterrupt(false);
    setInterruptMessage('');
  }, [sessionId]);

  // Message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'executionReady':
          setIsReady(true);
          break;

        case 'executionStarted':
          setIsExecuting(true);
          break;

        case 'executionMessage':
          const newMessage: ChatMessage = {
            id: uuidv4(),
            role: message.role,
            content: message.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newMessage]);
          onMessage?.(newMessage);
          break;

        case 'interruptRequired':
          setIsWaitingForInterrupt(true);
          setInterruptMessage(message.message);
          setIsExecuting(false);
          break;

        case 'executionComplete':
          setIsExecuting(false);
          setIsWaitingForInterrupt(false);
          break;

        case 'executionError':
          setIsExecuting(false);
          setIsWaitingForInterrupt(false);
          onError?.(message.error);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMessage, onError]);

  return {
    sessionId,
    isReady,
    isExecuting,
    isWaitingForInterrupt,
    interruptMessage,
    messages,
    execute,
    resume,
    clear
  };
}
```

## Files to Create

1. `src/execution/WorkflowExecutor.ts` (400-500 lines)
2. `src/execution/InterruptHandler.ts` (100-150 lines)
3. `webview-ui/src/workflow-editor/hooks/useWorkflowExecution.ts` (150-200 lines)

## Files to Modify

1. `src/panels/WorkflowEditorPanel.ts` (+200 lines) - Message handlers, executor integration
2. `webview-ui/src/workflow-editor/WorkflowEditor.tsx` (+150 lines) - Message handlers, execution state
3. `webview-ui/src/workflow-editor/ChatPanel.tsx` (+50 lines) - Connect to execution hook

## Testing Checklist

- [ ] Workflow initializes correctly
- [ ] Simple workflow execution completes successfully
- [ ] Messages stream to chat UI
- [ ] Interrupt detected and displayed
- [ ] User input resumes execution correctly
- [ ] Multiple interrupts handled in sequence
- [ ] Error messages displayed clearly
- [ ] Session state persists across messages
- [ ] Thread ID maintained throughout session
- [ ] Clear session works correctly
- [ ] Multiple sessions can coexist
- [ ] No memory leaks on repeated executions

## Success Criteria

Phase 10C is complete when:

- ✓ Workflows execute successfully
- ✓ Chat displays execution messages
- ✓ Interrupts handled correctly
- ✓ Resume functionality works
- ✓ Error handling robust
- ✓ Session management functional
- ✓ No crashes or hangs
- ✓ Ready for Phase 10D enhancements

## Next Phase

After completing Phase 10C, proceed to [Phase 10D: Advanced Features & Polish](PHASE10D_ADVANCED_FEATURES.md) to add visual feedback, history, and other enhancements.
