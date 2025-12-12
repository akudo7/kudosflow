import React, { useState } from 'react';
import { AnnotationField } from '../types/workflow.types';
import { AnnotationFieldForm } from './AnnotationFieldForm';

interface Props {
  annotation: Record<string, AnnotationField>;
  onAnnotationChange: (annotation: Record<string, AnnotationField>) => void;
}

export const AnnotationFieldsEditor: React.FC<Props> = ({ annotation, onAnnotationChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [deletingField, setDeletingField] = useState<string | null>(null);

  const handleAddField = () => {
    setEditingField(null);
    setShowForm(true);
  };

  const handleEditField = (fieldName: string) => {
    setEditingField(fieldName);
    setShowForm(true);
  };

  const handleDeleteField = (fieldName: string) => {
    setDeletingField(fieldName);
  };

  const confirmDelete = () => {
    if (deletingField) {
      const newAnnotation = { ...annotation };
      delete newAnnotation[deletingField];
      onAnnotationChange(newAnnotation);
      setDeletingField(null);
    }
  };

  const cancelDelete = () => {
    setDeletingField(null);
  };

  const handleSaveField = (fieldName: string, fieldData: AnnotationField) => {
    const newAnnotation = { ...annotation };

    // If editing and name changed, delete old field
    if (editingField && editingField !== fieldName) {
      delete newAnnotation[editingField];
    }

    newAnnotation[fieldName] = fieldData;
    onAnnotationChange(newAnnotation);
    setShowForm(false);
    setEditingField(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingField(null);
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

  const fieldEntries = Object.entries(annotation);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Annotation Fields</div>
        <button onClick={handleAddField} style={addButtonStyle}>
          + フィールド追加
        </button>
      </div>

      {fieldEntries.length === 0 ? (
        <div style={emptyStyle}>フィールドがありません</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Field Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Default</th>
              <th style={{ ...thStyle, width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fieldEntries.map(([fieldName, fieldData]) => (
              <tr key={fieldName}>
                <td style={tdStyle}>
                  <code>{fieldName}</code>
                </td>
                <td style={tdStyle}>
                  <code>{fieldData.type}</code>
                </td>
                <td style={tdStyle}>
                  <code>
                    {fieldData.default !== undefined
                      ? JSON.stringify(fieldData.default)
                      : '-'}
                  </code>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleEditField(fieldName)}
                    style={actionButtonStyle}
                    title="編集"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteField(fieldName)}
                    style={deleteButtonStyle}
                    title="削除"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AnnotationFieldForm
        show={showForm}
        fieldName={editingField || undefined}
        fieldData={editingField ? annotation[editingField] : undefined}
        existingFields={annotation}
        onSave={handleSaveField}
        onCancel={handleCancelForm}
      />

      {deletingField && (
        <div style={confirmOverlayStyle} onClick={cancelDelete}>
          <div style={confirmDialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={confirmTextStyle}>
              フィールド "<strong>{deletingField}</strong>" を削除しますか?
            </div>
            <div style={confirmButtonsStyle}>
              <button onClick={cancelDelete} style={cancelButtonStyle}>
                キャンセル
              </button>
              <button onClick={confirmDelete} style={deleteConfirmButtonStyle}>
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
