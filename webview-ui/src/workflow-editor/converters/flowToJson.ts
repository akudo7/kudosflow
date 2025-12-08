import { WorkflowConfig, WorkflowNode, WorkflowEdge, ReactFlowNode, ReactFlowEdge } from '../types/workflow.types';

/**
 * Converts React Flow nodes and edges back to SceneGraphManager workflow JSON
 */
export function flowToJson(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  originalWorkflow: WorkflowConfig
): WorkflowConfig {
  const workflowNodes: WorkflowNode[] = [];
  const workflowEdges: WorkflowEdge[] = [];

  // Convert React Flow nodes back to workflow nodes
  // Skip special nodes (__start__ and __end__)
  nodes.forEach((node) => {
    // Skip special nodes
    if (node.id === '__start__' || node.id === '__end__') {
      return;
    }

    const workflowNode: WorkflowNode = {
      id: node.id,
    };

    if (node.data.implementation !== undefined || node.data.parameters || node.data.output) {
      workflowNode.function = {
        parameters: node.data.parameters || [],
        output: node.data.output || {},
        implementation: node.data.implementation || '',
      };
    }

    if (node.data.ends) {
      workflowNode.ends = node.data.ends;
    }

    workflowNodes.push(workflowNode);
  });

  // Convert React Flow edges back to workflow edges
  edges.forEach((edge) => {
    const workflowEdge: WorkflowEdge = {
      from: edge.source,
      to: edge.target,
    };

    if (edge.animated || edge.type === 'smoothstep') {
      workflowEdge.type = 'conditional';
    }

    workflowEdges.push(workflowEdge);
  });

  // Preserve original workflow structure
  return {
    ...originalWorkflow,
    nodes: workflowNodes,
    edges: workflowEdges,
  };
}
