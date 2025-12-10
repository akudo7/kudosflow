import React, { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';

export const WorkflowNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(nodeData.implementation || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    // リアルタイムでノードデータを更新
    nodeData.implementation = newCode;
  }, [nodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tabキーでインデント挿入
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      nodeData.implementation = newValue;
      // カーソル位置を調整
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  }, [code, nodeData]);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Implementation:
              </strong>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '2px 8px',
                  background: isEditing ? '#4a9eff' : '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isEditing ? '#3a7fd5' : '#666')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isEditing ? '#4a9eff' : '#555')}
              >
                {isEditing ? '✓ 完了' : '✏️ 編集'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  fontSize: '11px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  background: '#1a1a1a',
                  color: '#d8dee9',
                  border: '1px solid #4a9eff',
                  borderRadius: '4px',
                  padding: '8px',
                  margin: '4px 0',
                  resize: 'vertical',
                  lineHeight: '1.5',
                  whiteSpace: 'pre',
                  overflowWrap: 'normal',
                  overflowX: 'auto',
                  boxSizing: 'border-box',
                }}
                spellCheck={false}
                autoComplete="off"
              />
            ) : (
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
                  cursor: 'pointer',
                  border: '1px solid #555',
                }}
                onClick={() => setIsEditing(true)}
                title="クリックして編集"
              >
                {code || '// No implementation'}
              </pre>
            )}
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
