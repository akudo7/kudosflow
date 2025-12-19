import React, { useState } from 'react';
import { MCPServerConfig } from '../types/workflow.types';
import { MCPServerFormModal } from './MCPServerFormModal';

interface Props {
  mcpServers: Record<string, MCPServerConfig>;
  onMcpServersChange: (mcpServers: Record<string, MCPServerConfig>) => void;
}

export const MCPServerEditor: React.FC<Props> = ({
  mcpServers,
  onMcpServersChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);

  const handleAddServer = () => {
    setEditingServerId(null);
    setShowForm(true);
  };

  const handleEditServer = (serverId: string) => {
    setEditingServerId(serverId);
    setShowForm(true);
  };

  const handleDeleteServer = (serverId: string) => {
    setDeletingServerId(serverId);
  };

  const confirmDelete = () => {
    if (deletingServerId) {
      const newServers = { ...mcpServers };
      delete newServers[deletingServerId];
      onMcpServersChange(newServers);
      setDeletingServerId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingServerId(null);
  };

  const handleSaveServer = (serverId: string, serverConfig: MCPServerConfig) => {
    const newServers = { ...mcpServers };

    // If editing and ID changed, delete old key
    if (editingServerId && editingServerId !== serverId) {
      delete newServers[editingServerId];
    }

    newServers[serverId] = serverConfig;
    onMcpServersChange(newServers);
    setShowForm(false);
    setEditingServerId(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingServerId(null);
  };

  const containerStyle: React.CSSProperties = {
    padding: '12px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const addButtonStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '12px',
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: 'var(--vscode-font-family)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    tableLayout: 'fixed',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 6px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 6px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    color: 'var(--vscode-foreground)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '2px 6px',
    fontSize: '11px',
    border: 'none',
    background: 'transparent',
    color: 'var(--vscode-textLink-foreground)',
    cursor: 'pointer',
    marginRight: '4px',
  };

  const deleteButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    color: 'var(--vscode-errorForeground)',
  };

  const emptyStyle: React.CSSProperties = {
    padding: '20px',
    textAlign: 'center',
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    fontStyle: 'italic',
  };

  const confirmOverlayStyle: React.CSSProperties = {
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

  const confirmDialogStyle: React.CSSProperties = {
    background: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    minWidth: '350px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  };

  const confirmTextStyle: React.CSSProperties = {
    marginBottom: '20px',
    fontSize: '13px',
    color: 'var(--vscode-foreground)',
  };

  const confirmButtonsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  };

  const confirmButtonStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: 'var(--vscode-font-family)',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...confirmButtonStyle,
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
  };

  const deleteConfirmButtonStyle: React.CSSProperties = {
    ...confirmButtonStyle,
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
  };

  const serverIds = Object.keys(mcpServers);
  const editingServer = editingServerId ? mcpServers[editingServerId] : undefined;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>MCP Servers</div>
        <button onClick={handleAddServer} style={addButtonStyle}>
          + Add MCP Server
        </button>
      </div>

      {serverIds.length === 0 ? (
        <div style={emptyStyle}>No MCP servers</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '35%' }}>Server ID</th>
              <th style={{ ...thStyle, width: '20%' }}>Transport</th>
              <th style={{ ...thStyle, width: '30%' }}>Command/URL</th>
              <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {serverIds.map((serverId) => {
              const server = mcpServers[serverId];
              return (
                <tr key={serverId}>
                  <td style={tdStyle}>
                    <code style={{ fontSize: '11px' }}>{serverId}</code>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '11px' }}>{server.transport}</span>
                  </td>
                  <td style={tdStyle}>
                    <code style={{ fontSize: '10px' }}>
                      {server.transport === 'stdio'
                        ? server.command || ''
                        : server.url || ''}
                    </code>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => handleEditServer(serverId)}
                      style={actionButtonStyle}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteServer(serverId)}
                      style={deleteButtonStyle}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <MCPServerFormModal
        show={showForm}
        serverId={editingServerId || undefined}
        serverConfig={editingServer}
        existingServerIds={serverIds}
        onSave={handleSaveServer}
        onCancel={handleCancelForm}
      />

      {deletingServerId && (
        <div style={confirmOverlayStyle} onClick={cancelDelete}>
          <div style={confirmDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={confirmTextStyle}>
              Delete MCP server "<strong>{deletingServerId}</strong>"?
            </div>
            <div style={confirmButtonsStyle}>
              <button onClick={cancelDelete} style={cancelButtonStyle}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={deleteConfirmButtonStyle}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
