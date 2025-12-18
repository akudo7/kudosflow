import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types/chat.types';

declare const vscode: any;

export interface UseWorkflowExecutionOptions {
  filePath?: string;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

export interface UseWorkflowExecutionReturn {
  sessionId: string;
  isReady: boolean;
  isExecuting: boolean;
  isWaitingForInterrupt: boolean;
  interruptMessage: string;
  messages: ChatMessage[];
  execute: (input: string) => void;
  resume: (input: string) => void;
  clear: () => void;
}

/**
 * Custom hook for managing workflow execution
 *
 * Features:
 * - Initialize workflow session
 * - Execute workflow with user input
 * - Handle interrupts and resume
 * - Manage execution state
 * - Track chat messages
 */
export function useWorkflowExecution(
  options: UseWorkflowExecutionOptions
): UseWorkflowExecutionReturn {
  const { filePath, onMessage, onError } = options;

  // Generate a unique session ID once
  const [sessionId] = useState(() => uuidv4());

  // Execution state
  const [isReady, setIsReady] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isWaitingForInterrupt, setIsWaitingForInterrupt] = useState(false);
  const [interruptMessage, setInterruptMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Use ref to avoid recreating callbacks on every render
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  // Initialize workflow when filePath changes
  useEffect(() => {
    if (filePath) {
      console.log('[useWorkflowExecution] Initializing workflow:', sessionId, filePath);
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
      console.warn('[useWorkflowExecution] Cannot execute: not ready or already executing');
      return;
    }

    console.log('[useWorkflowExecution] Executing workflow:', input);

    // Send to extension
    vscode.postMessage({
      command: 'executeWorkflow',
      sessionId,
      input
    });
  }, [isReady, isExecuting, sessionId]);

  // Resume after interrupt
  const resume = useCallback((input: string) => {
    if (!isWaitingForInterrupt) {
      console.warn('[useWorkflowExecution] Cannot resume: not waiting for interrupt');
      return;
    }

    console.log('[useWorkflowExecution] Resuming workflow:', input);

    // Send to extension
    vscode.postMessage({
      command: 'resumeWorkflow',
      sessionId,
      input
    });
  }, [isWaitingForInterrupt, sessionId]);

  // Clear session
  const clear = useCallback(() => {
    console.log('[useWorkflowExecution] Clearing session:', sessionId);

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

      // Only process messages for this session or global messages
      if (message.sessionId && message.sessionId !== sessionId) {
        return;
      }

      switch (message.command) {
        case 'executionReady':
          console.log('[useWorkflowExecution] Execution ready');
          setIsReady(true);
          break;

        case 'executionStarted':
          console.log('[useWorkflowExecution] Execution started');
          setIsExecuting(true);
          break;

        case 'executionMessage':
          console.log('[useWorkflowExecution] Execution message:', message.role, message.content);
          const newMessage: ChatMessage = {
            id: uuidv4(),
            role: message.role,
            content: message.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newMessage]);
          onMessageRef.current?.(newMessage);
          break;

        case 'interruptRequired':
          console.log('[useWorkflowExecution] Interrupt required:', message.message);
          setIsWaitingForInterrupt(true);
          setInterruptMessage(message.message);
          setIsExecuting(false);
          break;

        case 'executionComplete':
          console.log('[useWorkflowExecution] Execution complete');
          setIsExecuting(false);
          setIsWaitingForInterrupt(false);
          setInterruptMessage('');
          break;

        case 'executionError':
          console.log('[useWorkflowExecution] Execution error:', message.error);
          setIsExecuting(false);
          setIsWaitingForInterrupt(false);
          setInterruptMessage('');

          // Add error message to chat
          const errorMessage: ChatMessage = {
            id: uuidv4(),
            role: 'system',
            content: `❌ Error: ${message.error}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          onErrorRef.current?.(message.error);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId]);

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
