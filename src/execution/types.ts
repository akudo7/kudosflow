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
