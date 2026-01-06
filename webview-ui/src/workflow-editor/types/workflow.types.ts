import { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';

// A2A Server Configuration
export interface A2AServerConfig {
  cardUrl: string;      // Agent card endpoint URL
  timeout: number;       // Request timeout in milliseconds
  [key: string]: any;   // Allow additional properties
}

// MCP Server Configuration
export interface MCPServerConfig {
  transport: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;  // For SSE transport
  [key: string]: any;
}

// Workflow Configuration Settings
export interface WorkflowConfigSettings {
  recursionLimit?: number;
  eventEmitter?: {
    defaultMaxListeners?: number;
  };
  mcpServers?: {
    config?: {
      throwOnLoadError?: boolean;
      prefixToolNameWithServerName?: boolean;
      additionalToolNamePrefix?: string;
    };
  };
  [key: string]: any;
}

// SceneGraphManager types
export interface WorkflowConfig {
  config?: WorkflowConfigSettings;
  a2aServers?: Record<string, A2AServerConfig>;
  mcpServers?: Record<string, MCPServerConfig>;
  stateAnnotation: {
    name: string;
    type: "Annotation.Root";
  };
  annotation: Record<string, AnnotationField>;
  models?: ModelConfig[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stateGraph: any;
}

export interface WorkflowNode {
  id: string;
  type?: string;  // "ToolNode" or undefined (function node)
  useA2AClients?: boolean;  // For ToolNode
  useMcpServers?: boolean;  // For ToolNode MCP binding
  handler?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    function: string;
  };
  ends?: string[];
}

// Conditional Edge Condition
export interface ConditionalEdgeCondition {
  name: string;
  handler: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    function: string;
  };
}

export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: ConditionalEdgeCondition;
  // possibleTargets is auto-extracted from condition.handler.function
}

export interface AnnotationField {
  type: string;
  reducer?: string;
  default?: any;
}

export interface ModelConfig {
  id: string;
  type: string;  // "OpenAI" | "Anthropic" | "Ollama" | etc.
  config: {
    model: string;
    temperature?: number;
    [key: string]: any;
  };
  bindA2AClients?: boolean;
  bindMcpServers?: boolean;  // For Phase 9E (MCP Server integration)
  systemPrompt?: string;
}

// React Flow types
export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  nodeType?: string;  // "ToolNode" or undefined
  useA2AClients?: boolean;  // For ToolNode
  useMcpServers?: boolean;  // For ToolNode MCP binding
  function?: string;
  parameters?: Array<{ name: string; type: string; modelRef?: string }>;
  ends?: string[];
  models?: ModelConfig[];  // Available models for modelRef dropdown
  onNodeNameChange?: (oldId: string, newId: string) => void;
}

export type ReactFlowNode = FlowNode<CustomNodeData>;

// Extended ReactFlowEdge with conditional edge support
export interface ReactFlowEdge extends FlowEdge {
  data?: {
    condition?: ConditionalEdgeCondition;
    possibleTargets?: string[];
    conditionalGroupId?: string;  // Group identifier for conditional edges
    isConditional?: boolean;       // Flag to identify conditional edges
    onDoubleClick?: (groupId: string) => void;  // Double-click handler for conditional edges
  };
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Server types (Phase 10A)
export enum ServerState {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface ServerEndpoints {
  agentCard: string;      // http://localhost:3000/.well-known/agent.json
  messageSend: string;    // http://localhost:3000/message/send
  tasks: string;          // http://localhost:3000/tasks
}

export interface ServerStatus {
  state: ServerState;
  port?: number;
  pid?: number;
  endpoints?: ServerEndpoints;
  error?: string;
  startTime?: Date;
}
