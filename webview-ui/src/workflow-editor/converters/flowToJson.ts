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

    // Add useA2AClients flag if present
    if (node.data.useA2AClients !== undefined) {
      workflowNode.useA2AClients = node.data.useA2AClients;
    }

    // Only add function property if node is not a ToolNode
    if (node.data.nodeType !== 'ToolNode') {
      if (node.data.implementation !== undefined || node.data.parameters || node.data.output) {
        workflowNode.function = {
          parameters: node.data.parameters || [],
          output: node.data.output || {},
          implementation: node.data.implementation || '',
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

        // Extract possibleTargets from all edges in group
        const possibleTargets = groupEdges.map((e) => e.target);

        // Create single conditional edge with possibleTargets at condition level
        const workflowEdge: WorkflowEdge = {
          from: edge.source,
          type: 'conditional',
          condition: edge.data.condition
            ? {
                ...edge.data.condition,
                function: edge.data.condition.function
                  ? {
                      ...edge.data.condition.function,
                      // Remove possibleTargets from function to avoid duplication
                      possibleTargets: undefined,
                    }
                  : {
                      parameters: [],
                      output: '',
                      implementation: '',
                    },
                // Add possibleTargets at condition level
                possibleTargets: possibleTargets,
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
