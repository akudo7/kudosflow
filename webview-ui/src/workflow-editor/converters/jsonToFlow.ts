import { WorkflowConfig, ReactFlowNode, ReactFlowEdge } from '../types/workflow.types';

/**
 * Converts SceneGraphManager workflow JSON to React Flow nodes and edges
 */
export function jsonToFlow(workflow: WorkflowConfig): {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
} {
  const nodes: ReactFlowNode[] = [];
  const edges: ReactFlowEdge[] = [];

  // Track special nodes referenced in edges
  const specialNodes = new Set<string>();
  workflow.edges.forEach(edge => {
    if (edge.from === '__start__' || edge.to === '__start__') specialNodes.add('__start__');
    if (edge.from === '__end__' || edge.to === '__end__') specialNodes.add('__end__');

    // Check possibleTargets in conditional edges
    if (edge.type === 'conditional' && edge.condition) {
      const possibleTargets = edge.condition.function?.possibleTargets || edge.condition.possibleTargets || [];
      possibleTargets.forEach(target => {
        if (target === '__start__') specialNodes.add('__start__');
        if (target === '__end__') specialNodes.add('__end__');
      });
    }
  });

  // Add special start node if needed
  if (specialNodes.has('__start__')) {
    nodes.push({
      id: '__start__',
      type: 'input',
      position: { x: 100, y: 50 },
      data: { label: 'Start' },
    });
  }

  // Convert workflow nodes to React Flow nodes
  workflow.nodes.forEach((node, index) => {
    // Determine node type: ToolNode or regular workflowNode
    const nodeType = node.type === 'ToolNode' ? 'toolNode' : 'workflowNode';

    nodes.push({
      id: node.id,
      type: nodeType,
      position: {
        x: 100 + (index % 3) * 300, // Basic grid layout
        y: 150 + Math.floor(index / 3) * 200,
      },
      data: {
        label: node.id,
        nodeType: node.type,
        useA2AClients: node.useA2AClients,
        implementation: node.function?.implementation,
        parameters: node.function?.parameters,
        output: node.function?.output,
        ends: node.ends,
      },
    });
  });

  // Add special end node if needed
  if (specialNodes.has('__end__')) {
    nodes.push({
      id: '__end__',
      type: 'output',
      position: { x: 100, y: 150 + Math.ceil(workflow.nodes.length / 3) * 200 },
      data: { label: 'End' },
    });
  }

  // Convert workflow edges to React Flow edges
  workflow.edges.forEach((edge, index) => {
    if (edge.type === 'conditional' && edge.condition) {
      // Check possibleTargets in both function and top-level (support both formats)
      const possibleTargets = edge.condition.function?.possibleTargets || edge.condition.possibleTargets || [];

      if (possibleTargets.length > 0) {
        // Create one edge per possibleTarget
        const groupId = `conditional-${edge.from}-${index}`;

        possibleTargets.forEach((target, targetIndex) => {
          edges.push({
            id: `${groupId}-${target}`,
            source: edge.from,
            target: target,
            type: 'smoothstep',
            animated: true,
            // Only show label on first edge to avoid clutter
            label: targetIndex === 0 ? (edge.condition!.name || 'conditional') : undefined,
            markerEnd: {
              type: 'arrowclosed',
            },
            data: {
              conditionalGroupId: groupId,
              condition: edge.condition,
              possibleTargets: possibleTargets,
              isConditional: true,
            },
          });
        });
      } else {
        // Fallback: conditional edge without possibleTargets
        // (backwards compatibility or malformed data)
        edges.push({
          id: `e${edge.from}-${edge.to || 'undefined'}-${index}`,
          source: edge.from,
          target: edge.to || '',
          type: 'smoothstep',
          animated: true,
          label: edge.condition.name || 'conditional',
          markerEnd: {
            type: 'arrowclosed',
          },
          data: {
            condition: edge.condition,
            isConditional: true,
          },
        });
      }
    } else if (edge.to) {
      // Regular edge
      edges.push({
        id: `e${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        type: 'default',
        markerEnd: {
          type: 'arrowclosed',
        },
      });
    }
  });

  return { nodes, edges };
}
