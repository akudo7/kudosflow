import React, { useState } from 'react';
import { A2AClientConfig } from '../types/workflow.types';
import { A2AClientFormModal } from './A2AClientFormModal';

interface Props {
  a2aClients: Record<string, A2AClientConfig>;
  onA2AClientsChange: (a2aClients: Record<string, A2AClientConfig>) => void;
}

export const A2AClientEditor: React.FC<Props> = ({
  a2aClients,
  onA2AClientsChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const handleAddClient = () => {
    setEditingClientId(null);
    setShowForm(true);
  };

  const handleEditClient = (clientId: string) => {
    setEditingClientId(clientId);
    setShowForm(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setDeletingClientId(clientId);
  };

  const confirmDelete = () => {
    if (deletingClientId) {
      const newClients = { ...a2aClients };
      delete newClients[deletingClientId];
      onA2AClientsChange(newClients);
      setDeletingClientId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingClientId(null);
  };

  const handleSaveClient = (clientId: string, clientConfig: A2AClientConfig) => {
    const newClients = { ...a2aClients };

    // If editing and ID changed, delete old key
    if (editingClientId && editingClientId !== clientId) {
      delete newClients[editingClientId];
    }

    newClients[clientId] = clientConfig;
    onA2AClientsChange(newClients);
    setShowForm(false);
    setEditingClientId(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClientId(null);
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

  const clientIds = Object.keys(a2aClients);
  const editingClient = editingClientId ? a2aClients[editingClientId] : undefined;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>A2A Clients</div>
        <button onClick={handleAddClient} style={addButtonStyle}>
          + Add A2A Client
        </button>
      </div>

      {clientIds.length === 0 ? (
        <div style={emptyStyle}>No A2A clients</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '35%' }}>Client ID</th>
              <th style={{ ...thStyle, width: '40%' }}>Card URL</th>
              <th style={{ ...thStyle, width: '10%' }}>Timeout</th>
              <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clientIds.map((clientId) => {
              const client = a2aClients[clientId];
              return (
                <tr key={clientId}>
                  <td style={tdStyle}>
                    <code style={{ fontSize: '11px' }}>{clientId}</code>
                  </td>
                  <td style={tdStyle}>
                    <code style={{ fontSize: '10px' }}>{client.cardUrl}</code>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '11px' }}>{client.timeout}ms</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => handleEditClient(clientId)}
                      style={actionButtonStyle}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteClient(clientId)}
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

      <A2AClientFormModal
        show={showForm}
        clientId={editingClientId || undefined}
        clientConfig={editingClient}
        existingClientIds={clientIds}
        onSave={handleSaveClient}
        onCancel={handleCancelForm}
      />

      {deletingClientId && (
        <div style={confirmOverlayStyle} onClick={cancelDelete}>
          <div style={confirmDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={confirmTextStyle}>
              Delete A2A client "<strong>{deletingClientId}</strong>"?
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
