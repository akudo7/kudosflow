import { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';

// A2A Client Configuration
export interface A2AClientConfig {
  cardUrl: string;      // Agent card endpoint URL
  timeout: number;       // Request timeout in milliseconds
  [key: string]: any;   // Allow additional properties
}

// Workflow Configuration Settings
export interface WorkflowConfigSettings {
  recursionLimit?: number;
  eventEmitter?: {
    defaultMaxListeners?: number;
  };
  [key: string]: any;
}

// SceneGraphManager types
export interface WorkflowConfig {
  config?: WorkflowConfigSettings;
  a2aClients?: Record<string, A2AClientConfig>;
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
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    output: Record<string, string> | string;  // Can be string for conditional
    implementation: string;
  };
  ends?: string[];
}

// Conditional Edge Condition
export interface ConditionalEdgeCondition {
  name: string;
  function: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    output: string;  // Target node ID
    implementation: string;
  };
  possibleTargets?: string[];  // Possible target node IDs
}

export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: ConditionalEdgeCondition;
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
  implementation?: string;
  parameters?: Array<{ name: string; type: string; modelRef?: string }>;
  output?: Record<string, string> | string;  // Can be string for conditional edges
  ends?: string[];
  models?: ModelConfig[];  // Available models for modelRef dropdown
  onNodeNameChange?: (oldId: string, newId: string) => void;
}

export type ReactFlowNode = FlowNode<CustomNodeData>;
export type ReactFlowEdge = FlowEdge;

// Validation types
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
