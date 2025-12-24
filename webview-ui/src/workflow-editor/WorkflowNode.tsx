import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';
import { NodeBadges } from './settings/NodeBadges';

export const WorkflowNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData & {
    isExecuting?: boolean;
    hasExecuted?: boolean;
    onNodeDoubleClick?: (nodeId: string, nodeData: CustomNodeData) => void;
  };

  // Determine badges to display
  const showToolNodeBadge = nodeData.nodeType === 'ToolNode';
  const showA2ABadge = nodeData.useA2AClients === true;

  // Check if any parameter uses a model with A2A or MCP binding
  let hasModelWithA2A = false;
  let hasModelWithMCP = false;

  if (nodeData.parameters && nodeData.models) {
    const modelRefs = nodeData.parameters
      .map(p => p.modelRef)
      .filter(ref => ref !== undefined && ref !== '');

    modelRefs.forEach(modelRef => {
      const model = nodeData.models?.find(m => m.id === modelRef);
      if (model) {
        if (model.bindA2AClients) hasModelWithA2A = true;
        if (model.bindMcpServers) hasModelWithMCP = true;
      }
    });
  }

  const finalShowA2ABadge = showA2ABadge || hasModelWithA2A;
  const finalShowMCPBadge = hasModelWithMCP;

  // Handle node double-click to open dialog
  const handleNodeDoubleClick = useCallback((e: React.MouseEvent) => {
    // Prevent double-click from propagating to canvas
    e.stopPropagation();
    if (nodeData.onNodeDoubleClick) {
      nodeData.onNodeDoubleClick(id, nodeData);
    }
  }, [id, nodeData]);

  // Get border color based on execution state
  const getBorderColor = () => {
    if (nodeData.isExecuting) return '#4caf50'; // Green - currently executing
    if (nodeData.hasExecuted) return '#2196f3'; // Blue - has executed
    return '#555'; // Default
  };

  const getBorderWidth = () => {
    if (nodeData.isExecuting) return 3;
    if (nodeData.hasExecuted) return 2;
    return 2;
  };

  return (
    <div
      onDoubleClick={handleNodeDoubleClick}
      style={{
        padding: '12px',
        border: `${getBorderWidth()}px solid ${getBorderColor()}`,
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        minWidth: '220px',
        minHeight: '80px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        color: '#fff',
        position: 'relative',
        cursor: 'pointer',
      }}
      title="Double-click to edit node"
    >
      {/* Executing badge */}
      {nodeData.isExecuting && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '8px',
            backgroundColor: '#4caf50',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          Executing...
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          background: '#4a9eff',
          border: '2px solid #fff',
        }}
      />

      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <strong
            style={{
              fontSize: '14px',
              color: '#4a9eff',
            }}
          >
            {nodeData.label}
          </strong>
          <NodeBadges
            showToolNodeBadge={showToolNodeBadge}
            showA2ABadge={finalShowA2ABadge}
            showMCPBadge={finalShowMCPBadge}
          />
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          background: '#4a9eff',
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
