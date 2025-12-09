import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';

export const WorkflowNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div
      style={{
        padding: '12px',
        border: '2px solid #555',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        minWidth: isExpanded ? '600px' : '220px',
        minHeight: isExpanded ? '400px' : '80px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
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
          marginBottom: isExpanded ? '12px' : '0',
        }}
      >
        <strong style={{ fontSize: '14px', color: '#4a9eff' }}>
          {nodeData.label}
        </strong>
        <button
          onClick={toggleExpand}
          style={{
            padding: '4px 12px',
            background: '#4a9eff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#3a7fd5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4a9eff')}
        >
          {isExpanded ? '折りたたむ' : '展開'}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ marginTop: '10px' }}>
          {/* Parameters Section */}
          {nodeData.parameters && nodeData.parameters.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Parameters:
              </strong>
              <pre
                style={{
                  fontSize: '10px',
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  margin: '4px 0',
                  color: '#d8dee9',
                }}
              >
                {JSON.stringify(nodeData.parameters, null, 2)}
              </pre>
            </div>
          )}

          {/* Output Section */}
          {nodeData.output && Object.keys(nodeData.output).length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Output:
              </strong>
              <pre
                style={{
                  fontSize: '10px',
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  margin: '4px 0',
                  color: '#d8dee9',
                }}
              >
                {JSON.stringify(nodeData.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Implementation Section */}
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
              Implementation:
            </strong>
            <pre
              style={{
                fontSize: '10px',
                background: '#1a1a1a',
                padding: '8px',
                borderRadius: '4px',
                overflowX: 'auto',
                overflowY: 'auto',
                margin: '4px 0',
                color: '#d8dee9',
                maxHeight: '300px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {nodeData.implementation || '// No implementation'}
            </pre>
          </div>

          {/* Ends Section (if applicable) */}
          {nodeData.ends && nodeData.ends.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Ends:
              </strong>
              <div style={{ fontSize: '10px', color: '#d8dee9', marginTop: '4px' }}>
                {nodeData.ends.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

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
