import React, { useState, useCallback, useEffect } from 'react';
import { CustomNodeData } from './types/workflow.types';

interface ToolNodeEditorDialogProps {
  show: boolean;
  onClose: () => void;
  nodeId: string;
  nodeData: CustomNodeData;
  onSave: (nodeId: string, updatedData: Partial<CustomNodeData>) => void;
}

export const ToolNodeEditorDialog: React.FC<ToolNodeEditorDialogProps> = ({
  show,
  onClose,
  nodeId,
  nodeData,
  onSave,
}) => {
  // Node name editing
  const [nameValue, setNameValue] = useState(nodeData.label);
  const [nameError, setNameError] = useState<string | null>(null);

  // Skills toggle
  const [useSystemSkills, setUseSystemSkills] = useState(nodeData.useSystemSkills || false);

  // MCP Servers toggle
  const [useMcpServers, setUseMcpServers] = useState(nodeData.useMcpServers || false);

  // A2A Servers toggle
  const [useA2AServers, setUseA2AServers] = useState(nodeData.useA2AServers || false);

  // Reset state when dialog opens/closes or nodeData changes
  useEffect(() => {
    if (show) {
      setNameValue(nodeData.label);
      setUseSystemSkills(nodeData.useSystemSkills || false);
      setUseMcpServers(nodeData.useMcpServers || false);
      setUseA2AServers(nodeData.useA2AServers || false);
      setNameError(null);
    }
  }, [show, nodeData]);

  if (!show) {
    return null;
  }

  // Save handler
  const handleSave = useCallback(() => {
    // Validate name
    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      setNameError('Please enter a node name');
      return;
    }

    // Build updated data
    const updatedData: Partial<CustomNodeData> = {
      label: trimmedName,
      useSystemSkills,
      useMcpServers,
      useA2AServers,
    };

    onSave(nodeId, updatedData);
    onClose();
  }, [nameValue, useSystemSkills, useMcpServers, useA2AServers, nodeId, onSave, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          border: '1px solid var(--vscode-panel-border)',
          borderRadius: '6px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--vscode-panel-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #2c1810 0%, #3d2414 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛠️</span>
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#e67e22',
              }}
            >
              Edit Tool Node: {nodeData.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#e67e22',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Node Name */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--vscode-editor-foreground)',
              }}
            >
              Node Name
            </label>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '13px',
                fontFamily: 'var(--vscode-editor-font-family)',
                backgroundColor: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
            {nameError && (
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#ff6b6b' }}>
                {nameError}
              </div>
            )}
          </div>

          {/* System Skills Toggle */}
          <div
            style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: 'var(--vscode-textCodeBlock-background)',
              borderRadius: '4px',
              border: useSystemSkills ? '2px solid #9b59b6' : '1px solid var(--vscode-panel-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <strong style={{ fontSize: '13px', color: 'var(--vscode-editor-foreground)' }}>
                    System Skills
                  </strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', marginLeft: '24px' }}>
                  Enable system skills binding for this node
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useSystemSkills}
                  onChange={(e) => setUseSystemSkills(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>
            </div>
          </div>

          {/* MCP Servers Toggle */}
          <div
            style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: 'var(--vscode-textCodeBlock-background)',
              borderRadius: '4px',
              border: useMcpServers ? '2px solid #3498db' : '1px solid var(--vscode-panel-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>🔌</span>
                  <strong style={{ fontSize: '13px', color: 'var(--vscode-editor-foreground)' }}>
                    MCP Servers
                  </strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', marginLeft: '24px' }}>
                  Enable MCP servers binding for this node
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useMcpServers}
                  onChange={(e) => setUseMcpServers(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>
            </div>
          </div>

          {/* A2A Servers Toggle */}
          <div
            style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: 'var(--vscode-textCodeBlock-background)',
              borderRadius: '4px',
              border: useA2AServers ? '2px solid #27ae60' : '1px solid var(--vscode-panel-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>🤝</span>
                  <strong style={{ fontSize: '13px', color: 'var(--vscode-editor-foreground)' }}>
                    A2A Servers
                  </strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', marginLeft: '24px' }}>
                  Enable A2A servers binding for this node
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useA2AServers}
                  onChange={(e) => setUseA2AServers(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </label>
            </div>
          </div>

          {/* Info Section */}
          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: 'rgba(230, 126, 34, 0.1)',
              border: '1px solid #e67e22',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--vscode-descriptionForeground)',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#e67e22' }}>
              ℹ️ About Tool Nodes
            </div>
            Tool Nodes orchestrate tool calls and can bind to:
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              <li><strong>System Skills</strong> - Custom skills defined in workflow configuration</li>
              <li><strong>MCP Servers</strong> - Model Context Protocol servers for extended functionality</li>
              <li><strong>A2A Servers</strong> - Agent-to-Agent communication servers</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--vscode-panel-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              backgroundColor: '#e67e22',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
