import React, { useState } from 'react';
import { ModelConfig, ReactFlowNode } from '../types/workflow.types';
import { ModelFormModal } from './ModelFormModal';

interface Props {
  models: ModelConfig[];
  onModelsChange: (models: ModelConfig[]) => void;
  a2aServersExist?: boolean;
  mcpServersExist?: boolean;
  nodes?: ReactFlowNode[];  // For checking modelRef usage
}

export const ModelEditor: React.FC<Props> = ({
  models,
  onModelsChange,
  a2aServersExist = false,
  mcpServersExist = false,
  nodes = [],
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  const handleAddModel = () => {
    setEditingModelId(null);
    setShowForm(true);
  };

  const handleEditModel = (modelId: string) => {
    setEditingModelId(modelId);
    setShowForm(true);
  };

  const handleDeleteModel = (modelId: string) => {
    // Check if model is referenced by any node parameters
    const referencingNodes = nodes.filter((node) =>
      node.data.parameters?.some((p) => p.modelRef === modelId)
    );

    if (referencingNodes.length > 0) {
      const nodeNames = referencingNodes.map((n) => n.data.label).join(', ');
      alert(
        `Model "${modelId}" is referenced by the following nodes:\n${nodeNames}\n\nPlease remove references from node parameters first.`
      );
      return;
    }

    setDeletingModelId(modelId);
  };

  const confirmDelete = () => {
    if (deletingModelId) {
      const newModels = models.filter((m) => m.id !== deletingModelId);
      onModelsChange(newModels);
      setDeletingModelId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingModelId(null);
  };

  const handleSaveModel = (modelConfig: ModelConfig) => {
    const newModels = [...models];

    if (editingModelId) {
      // Edit existing model
      const index = newModels.findIndex((m) => m.id === editingModelId);
      if (index !== -1) {
        newModels[index] = modelConfig;
      }
    } else {
      // Add new model
      newModels.push(modelConfig);
    }

    onModelsChange(newModels);
    setShowForm(false);
    setEditingModelId(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingModelId(null);
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
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 6px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 6px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    color: 'var(--vscode-foreground)',
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

  const checkmarkStyle: React.CSSProperties = {
    color: 'var(--vscode-testing-iconPassed)',
  };

  const editingModel = editingModelId ? models.find((m) => m.id === editingModelId) : undefined;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Models</div>
        <button onClick={handleAddModel} style={addButtonStyle}>
          + Add Model
        </button>
      </div>

      {models.length === 0 ? (
        <div style={emptyStyle}>No models</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Model ID</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Model</th>
              <th style={thStyle}>A2A</th>
              <th style={thStyle}>MCP</th>
              <th style={{ ...thStyle, width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id}>
                <td style={tdStyle}>
                  <code>{model.id}</code>
                </td>
                <td style={tdStyle}>{model.type}</td>
                <td style={tdStyle}>
                  <code>{model.config.model}</code>
                </td>
                <td style={tdStyle}>
                  {model.bindA2AServers && <span style={checkmarkStyle}>✓</span>}
                </td>
                <td style={tdStyle}>
                  {model.bindMcpServers && <span style={checkmarkStyle}>✓</span>}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleEditModel(model.id)}
                    style={actionButtonStyle}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteModel(model.id)}
                    style={deleteButtonStyle}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModelFormModal
        show={showForm}
        modelConfig={editingModel}
        existingModels={models}
        onSave={handleSaveModel}
        onCancel={handleCancelForm}
        a2aServersExist={a2aServersExist}
        mcpServersExist={mcpServersExist}
      />

      {deletingModelId && (
        <div style={confirmOverlayStyle} onClick={cancelDelete}>
          <div style={confirmDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={confirmTextStyle}>
              Delete model "<strong>{deletingModelId}</strong>"?
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
