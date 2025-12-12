import React from 'react';

interface Props {
  stateAnnotation: {
    name: string;
    type: string;
  };
  onStateAnnotationChange: (stateAnnotation: { name: string; type: string }) => void;
}

export const StateAnnotationEditor: React.FC<Props> = ({
  stateAnnotation,
  onStateAnnotationChange,
}) => {
  const handleNameChange = (value: string) => {
    onStateAnnotationChange({
      ...stateAnnotation,
      name: value,
    });
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '12px',
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--vscode-descriptionForeground)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '3px',
    padding: '6px 8px',
    fontSize: '13px',
    fontFamily: 'var(--vscode-editor-font-family)',
  };

  const readOnlyStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'var(--vscode-input-background)',
    opacity: 0.6,
    cursor: 'not-allowed',
  };

  return (
    <div style={containerStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>State Annotation Name</label>
        <div style={descriptionStyle}>
          ワークフローの状態アノテーション名
        </div>
        <input
          type="text"
          value={stateAnnotation.name}
          onChange={(e) => handleNameChange(e.target.value)}
          style={inputStyle}
          placeholder="例: InterruptWorkflowState"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>State Annotation Type</label>
        <div style={descriptionStyle}>
          タイプは常に固定です (編集不可)
        </div>
        <input
          type="text"
          value={stateAnnotation.type}
          disabled
          readOnly
          style={readOnlyStyle}
        />
      </div>
    </div>
  );
};
