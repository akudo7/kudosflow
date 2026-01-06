import React, { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';
import { NodeBadges } from './settings/NodeBadges';

export const ToolNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(nodeData.label);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Determine badges to display
  const showToolNodeBadge = true; // Always show for ToolNode
  const showA2ABadge = nodeData.useA2AClients === true;

  // Check MCP binding: either useMcpServers flag OR any parameter uses a model with MCP binding
  let hasModelWithMCP = false;

  // Direct ToolNode MCP flag
  if (nodeData.useMcpServers === true) {
    hasModelWithMCP = true;
  }

  // Or check if any parameter uses a model with MCP binding
  if (!hasModelWithMCP && nodeData.parameters && nodeData.models) {
    const modelRefs = nodeData.parameters
      .map(p => p.modelRef)
      .filter(ref => ref !== undefined && ref !== '');

    modelRefs.forEach(modelRef => {
      const model = nodeData.models?.find(m => m.id === modelRef);
      if (model?.bindMcpServers) {
        hasModelWithMCP = true;
      }
    });
  }

  // Handle node name double-click
  const handleNameDoubleClick = useCallback(() => {
    setIsEditingName(true);
    setNameValue(nodeData.label);
    setNameError(null);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [nodeData.label]);

  // Handle name change
  const handleNameSave = useCallback(() => {
    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      setNameError('Please enter a node name');
      return;
    }

    if (nodeData.onNodeNameChange && trimmedName !== id) {
      nodeData.onNodeNameChange(id, trimmedName);
    }

    setIsEditingName(false);
    setNameError(null);
  }, [nameValue, id, nodeData]);

  const handleNameCancel = useCallback(() => {
    setIsEditingName(false);
    setNameValue(nodeData.label);
    setNameError(null);
  }, [nodeData.label]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  }, [handleNameSave, handleNameCancel]);

  return (
    <div
      style={{
        padding: '16px',
        border: '2px solid #e67e22',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #2c1810 0%, #3d2414 100%)',
        minWidth: '240px',
        boxShadow: '0 4px 6px rgba(230, 126, 34, 0.3)',
        color: '#fff',
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          background: '#e67e22',
          border: '2px solid #fff',
        }}
      />

      {/* Node Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Tool Icon and Type Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px' }}>🛠️</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#e67e22',
              background: 'rgba(230, 126, 34, 0.2)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #e67e22',
            }}
          >
            ToolNode
          </span>
          <NodeBadges
            showToolNodeBadge={false}
            showA2ABadge={showA2ABadge}
            showMCPBadge={hasModelWithMCP}
          />
        </div>

        {/* Node Name */}
        {isEditingName ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleNameKeyDown}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '13px',
                  fontFamily: 'var(--vscode-editor-font-family)',
                  background: '#1a1a1a',
                  border: '1px solid #e67e22',
                  borderRadius: '4px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleNameSave}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ✓
              </button>
              <button
                onClick={handleNameCancel}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            {nameError && (
              <div style={{ fontSize: '11px', color: '#e74c3c' }}>
                {nameError}
              </div>
            )}
          </div>
        ) : (
          <div
            onDoubleClick={handleNameDoubleClick}
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
            title="Double-click to edit"
          >
            {nodeData.label}
          </div>
        )}

        {/* A2A Servers Status */}
        {nodeData.useA2AClients !== undefined && (
          <div
            style={{
              fontSize: '12px',
              color: nodeData.useA2AClients ? '#27ae60' : '#95a5a6',
              background: nodeData.useA2AClients
                ? 'rgba(39, 174, 96, 0.15)'
                : 'rgba(149, 165, 166, 0.15)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: `1px solid ${nodeData.useA2AClients ? '#27ae60' : '#95a5a6'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{nodeData.useA2AClients ? '✓' : '✕'}</span>
            <span>A2A Binding: {nodeData.useA2AClients ? 'Enabled' : 'Disabled'}</span>
          </div>
        )}

        {/* MCP Binding Status */}
        {hasModelWithMCP && (
          <div
            style={{
              fontSize: '12px',
              color: '#3498db',
              background: 'rgba(52, 152, 219, 0.15)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #3498db',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>✓</span>
            <span>MCP Binding: Enabled</span>
          </div>
        )}

        {/* Description */}
        <div
          style={{
            fontSize: '11px',
            color: '#95a5a6',
            fontStyle: 'italic',
            marginTop: '4px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            border: '1px solid rgba(230, 126, 34, 0.3)',
          }}
        >
          This node orchestrates tool calls
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          background: '#e67e22',
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

ToolNode.displayName = 'ToolNode';
