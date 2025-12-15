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
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    output: Record<string, string>;
    implementation: string;
  };
  ends?: string[];
}

export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: any;
}

export interface AnnotationField {
  type: string;
  reducer?: string;
  default?: any;
}

export interface ModelConfig {
  id: string;
  provider: string;
  model: string;
  [key: string]: any;
}

// React Flow types
export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  implementation?: string;
  parameters?: Array<{ name: string; type: string; modelRef?: string }>;
  output?: Record<string, string>;
  ends?: string[];
  onNodeNameChange?: (oldId: string, newId: string) => void;
}

export type ReactFlowNode = FlowNode<CustomNodeData>;
export type ReactFlowEdge = FlowEdge;

// Validation types
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
