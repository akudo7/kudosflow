import React, { useState, useEffect } from 'react';
import { MCPServerConfig } from '../types/workflow.types';
import { validateMCPServer, isValidJSIdentifier } from '../utils/validation';

interface Props {
  show: boolean;
  serverId?: string;
  serverConfig?: MCPServerConfig;
  existingServerIds: string[];
  onSave: (serverId: string, serverConfig: MCPServerConfig) => void;
  onCancel: () => void;
}

export const MCPServerFormModal: React.FC<Props> = ({
  show,
  serverId,
  serverConfig,
  existingServerIds,
  onSave,
  onCancel,
}) => {
  const isEditing = !!serverId;

  const [formServerId, setFormServerId] = useState(serverId || '');
  const [transport, setTransport] = useState<'stdio' | 'sse'>(
    serverConfig?.transport || 'stdio'
  );
  const [command, setCommand] = useState(serverConfig?.command || '');
  const [args, setArgs] = useState<string[]>(serverConfig?.args || []);
  const [url, setUrl] = useState(serverConfig?.url || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setFormServerId(serverId || '');
      setTransport(serverConfig?.transport || 'stdio');
      setCommand(serverConfig?.command || '');
      setArgs(serverConfig?.args || []);
      setUrl(serverConfig?.url || '');
      setError('');
    }
  }, [show, serverId, serverConfig]);

  const handleSave = () => {
    // Validate server ID
    if (!formServerId.trim()) {
      setError('Please enter a server ID');
      return;
    }

    if (!isValidJSIdentifier(formServerId)) {
      setError('Server ID must be a valid JavaScript identifier');
      return;
    }

    // Check if server ID already exists (only when creating new or changing ID)
    if ((!isEditing || formServerId !== serverId) && existingServerIds.includes(formServerId)) {
      setError('This server ID already exists');
      return;
    }

    // Build server config
    const newServerConfig: MCPServerConfig = {
      transport,
    };

    if (transport === 'stdio') {
      if (!command.trim()) {
        setError('Please enter a command');
        return;
      }
      newServerConfig.command = command;
      if (args.length > 0) {
        newServerConfig.args = args;
      }
    } else {
      // sse
      if (!url.trim()) {
        setError('Please enter a URL');
        return;
      }
      try {
        new URL(url);
      } catch {
        setError('Please enter a valid URL');
        return;
      }
      newServerConfig.url = url;
    }

    // Validate server config
    const validationResult = validateMCPServer(newServerConfig);
    if (!validationResult.valid) {
      setError(validationResult.error || 'Validation error');
      return;
    }

    onSave(formServerId, newServerConfig);
  };

  const handleAddArg = () => {
    setArgs([...args, '']);
  };

  const handleArgChange = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const handleRemoveArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  if (!show) {
    return null;
  }

  const overlayStyle: React.CSSProperties = {
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
  };

  const modalStyle: React.CSSProperties = {
    background: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const formStyle: React.CSSProperties = {
    padding: '20px',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '13px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontFamily: 'var(--vscode-font-family)',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const errorStyle: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--vscode-errorForeground)',
  };

  const argListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const argRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const argInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 8px',
    fontSize: '13px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontFamily: 'var(--vscode-font-family)',
  };

  const removeArgButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '11px',
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  };

  const addArgButtonStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: '12px',
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    marginTop: '8px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderTop: '1px solid var(--vscode-panel-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: 'var(--vscode-font-family)',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
  };

  const saveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          {isEditing ? `Edit MCP Server: ${serverId}` : 'Add MCP Server'}
        </div>

        <div style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Server ID</label>
            <input
              type="text"
              value={formServerId}
              onChange={(e) => setFormServerId(e.target.value)}
              placeholder="web-search"
              style={inputStyle}
              disabled={isEditing}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Transport</label>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value as 'stdio' | 'sse')}
              style={selectStyle}
            >
              <option value="stdio">stdio</option>
              <option value="sse">sse</option>
            </select>
          </div>

          {transport === 'stdio' ? (
            <>
              <div style={fieldStyle}>
                <label style={labelStyle}>Command</label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="node"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Arguments</label>
                <div style={argListStyle}>
                  {args.map((arg, index) => (
                    <div key={index} style={argRowStyle}>
                      <input
                        type="text"
                        value={arg}
                        onChange={(e) => handleArgChange(index, e.target.value)}
                        placeholder="/path/to/script.js"
                        style={argInputStyle}
                      />
                      <button
                        onClick={() => handleRemoveArg(index)}
                        style={removeArgButtonStyle}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddArg} style={addArgButtonStyle}>
                  + Add Argument
                </button>
              </div>
            </>
          ) : (
            <div style={fieldStyle}>
              <label style={labelStyle}>URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/mcp"
                style={inputStyle}
              />
            </div>
          )}

          {error && <div style={errorStyle}>{error}</div>}
        </div>

        <div style={footerStyle}>
          <button onClick={onCancel} style={cancelButtonStyle}>
            Cancel
          </button>
          <button onClick={handleSave} style={saveButtonStyle}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
