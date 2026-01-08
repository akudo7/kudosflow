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

    // Add node type if it's a ToolNode
    if (node.data.nodeType) {
      workflowNode.type = node.data.nodeType;
    }

    // Add useA2AServers flag if present
    if (node.data.useA2AServers !== undefined) {
      workflowNode.useA2AServers = node.data.useA2AServers;
    }

    // Only add handler property if node is not a ToolNode
    if (node.data.nodeType !== 'ToolNode') {
      if (node.data.function !== undefined || node.data.parameters) {
        workflowNode.handler = {
          parameters: (node.data.parameters || []).map((param: any) => ({
            name: param.name,
            parameterType: param.parameterType,
            ...(param.parameterType === "state"
              ? { stateType: param.stateType }
              : { modelRef: param.modelRef })
          })),
          function: node.data.function || '',
        };
      }
    }

    if (node.data.ends) {
      workflowNode.ends = node.data.ends;
    }

    workflowNodes.push(workflowNode);
  });

  // Convert React Flow edges back to workflow edges
  const processedGroups = new Set<string>();

  edges.forEach((edge) => {
    // Check if this edge is part of a conditional group
    if (edge.data?.conditionalGroupId && edge.data?.isConditional) {
      const groupId = edge.data.conditionalGroupId;

      // Only process each group once
      if (!processedGroups.has(groupId)) {
        processedGroups.add(groupId);

        // Find all edges in this conditional group
        const groupEdges = edges.filter(
          (e) => e.data?.conditionalGroupId === groupId
        );

        // Create single conditional edge (possibleTargets will be auto-extracted)
        const workflowEdge: WorkflowEdge = {
          from: edge.source,
          type: 'conditional',
          condition: edge.data.condition
            ? {
                ...edge.data.condition,
                handler: {
                  parameters: (edge.data.condition.handler?.parameters || []).map((param: any) => ({
                    name: param.name,
                    parameterType: param.parameterType,
                    ...(param.parameterType === "state"
                      ? { stateType: param.stateType }
                      : { modelRef: param.modelRef })
                  })),
                  function: edge.data.condition.handler?.function || '',
                },
              }
            : undefined,
        };

        workflowEdges.push(workflowEdge);
      }
      // Skip this edge if already processed as part of a group
    } else {
      // Regular edge or old-style conditional edge
      const workflowEdge: WorkflowEdge = {
        from: edge.source,
        to: edge.target,
      };

      // Check for old-style conditional edge (backwards compatibility)
      if (
        (edge.animated || edge.type === 'smoothstep') &&
        edge.data?.condition &&
        !edge.data?.isConditional
      ) {
        workflowEdge.type = 'conditional';
        workflowEdge.condition = edge.data.condition as any;
      }

      workflowEdges.push(workflowEdge);
    }
  });

  // Preserve original workflow structure
  return {
    ...originalWorkflow,
    nodes: workflowNodes,
    edges: workflowEdges,
  };
}
