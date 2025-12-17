/**
 * Chat Types for Workflow Execution
 * Phase 10B: Chat UI Foundation
 */

/**
 * Role of chat message sender
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'interrupt';

/**
 * Individual chat message
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;

  /** Sender role */
  role: MessageRole;

  /** Message content */
  content: string;

  /** Message timestamp */
  timestamp: Date;
}

/**
 * Chat execution state
 */
export interface ChatState {
  /** All messages in current session */
  messages: ChatMessage[];

  /** Whether workflow is currently executing */
  isExecuting: boolean;

  /** Whether workflow is waiting for user interrupt response */
  isWaitingForInterrupt: boolean;

  /** Optional message for interrupt prompt */
  interruptMessage?: string;

  /** Current execution session ID */
  sessionId: string;

  /** Unread message count (when chat panel is closed) */
  unreadCount: number;
}

/**
 * Props for InterruptPrompt component
 */
export interface InterruptPromptProps {
  /** Whether to show the interrupt prompt */
  show: boolean;

  /** Message to display in interrupt prompt */
  message?: string;
}

/**
 * Props for ChatMessage component
 */
export interface ChatMessageProps extends ChatMessage {}

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  /** Array of messages to display */
  messages: ChatMessage[];
}

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
  /** Callback when user sends a message */
  onSend: (message: string) => void;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Placeholder text */
  placeholder?: string;
}

/**
 * Props for ChatPanel component
 */
export interface ChatPanelProps {
  /** Whether chat panel is open */
  open: boolean;

  /** Callback when user closes chat panel */
  onClose: () => void;

  /** Path to current workflow file */
  workflowPath: string;

  /** All chat messages */
  messages: ChatMessage[];

  /** Callback when user sends a message */
  onSendMessage: (message: string) => void;

  /** Whether workflow is executing */
  isExecuting: boolean;

  /** Whether waiting for interrupt response */
  isWaitingForInterrupt: boolean;

  /** Optional interrupt message */
  interruptMessage?: string;

  /** Callback when user clears chat */
  onClearChat: () => void;
}
