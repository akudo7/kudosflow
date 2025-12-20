/**
 * Server state enumeration
 */
export enum ServerState {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * Server status information
 */
export interface ServerStatus {
  state: ServerState;
  panelId?: string;
  port?: number;
  pid?: number;
  endpoints?: ServerEndpoints;
  error?: string;
  startTime?: Date;
}

/**
 * A2A Server endpoints
 */
export interface ServerEndpoints {
  agentCard: string;      // http://localhost:3000/.well-known/agent.json
  messageSend: string;    // http://localhost:3000/message/send
  tasks: string;          // http://localhost:3000/tasks
}

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  autoRestart: boolean;
  timeout: number;
}

/**
 * Message types for Extension <-> Webview communication
 */

// Extension -> Webview
export interface ServerStatusMessage {
  command: 'serverStatus';
  status: ServerStatus;
}

// Webview -> Extension
export interface StartServerMessage {
  command: 'startA2AServer';
  filePath: string;
  port?: number;
}

export interface StopServerMessage {
  command: 'stopA2AServer';
}

export interface GetServerStatusMessage {
  command: 'getServerStatus';
}

export interface RestartServerMessage {
  command: 'restartServer';
}

/**
 * Execution-related types
 */

/**
 * Execution state for a workflow session
 */
export interface ExecutionState {
  sessionId: string;
  threadId: string;
  isExecuting: boolean;
  isWaitingForInterrupt: boolean;
  currentInterrupt?: any; // GraphInterrupt from @kudos/scene-graph-manager
  engine?: any; // WorkflowEngine instance
}

/**
 * Message types for Execution <-> Webview communication
 */

// Extension -> Webview
export interface ExecutionReadyMessage {
  command: 'executionReady';
  sessionId: string;
  threadId: string;
}

export interface ExecutionStartedMessage {
  command: 'executionStarted';
}

export interface ExecutionMessageMessage {
  command: 'executionMessage';
  role: 'user' | 'assistant' | 'system' | 'interrupt';
  content: string;
}

export interface InterruptRequiredMessage {
  command: 'interruptRequired';
  message: string;
}

export interface ExecutionCompleteMessage {
  command: 'executionComplete';
  result: any;
}

export interface ExecutionErrorMessage {
  command: 'executionError';
  error: string;
}

export interface ExecutionStateMessage {
  command: 'executionState';
  state?: ExecutionState;
}

// Webview -> Extension
export interface InitializeWorkflowMessage {
  command: 'initializeWorkflow';
  sessionId: string;
  filePath: string;
}

export interface ExecuteWorkflowMessage {
  command: 'executeWorkflow';
  sessionId: string;
  input: string;
}

export interface ResumeWorkflowMessage {
  command: 'resumeWorkflow';
  sessionId: string;
  input: string;
}

export interface GetExecutionStateMessage {
  command: 'getExecutionState';
  sessionId: string;
}

export interface ClearSessionMessage {
  command: 'clearSession';
  sessionId: string;
}
