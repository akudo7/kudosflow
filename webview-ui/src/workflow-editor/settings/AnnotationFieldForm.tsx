import React, { useState, useEffect } from 'react';
import { AnnotationField } from '../types/workflow.types';
import { validateFieldName } from '../utils/validation';

interface Props {
  show: boolean;
  fieldName?: string;
  fieldData?: AnnotationField;
  existingFields: Record<string, AnnotationField>;
  onSave: (fieldName: string, fieldData: AnnotationField) => void;
  onCancel: () => void;
}

export const AnnotationFieldForm: React.FC<Props> = ({
  show,
  fieldName: initialFieldName,
  fieldData: initialFieldData,
  existingFields,
  onSave,
  onCancel,
}) => {
  const [fieldName, setFieldName] = useState(initialFieldName || '');
  const [type, setType] = useState(initialFieldData?.type || '');
  const [reducer, setReducer] = useState(initialFieldData?.reducer || '');
  const [defaultValue, setDefaultValue] = useState(
    initialFieldData?.default !== undefined ? JSON.stringify(initialFieldData.default) : ''
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setFieldName(initialFieldName || '');
      setType(initialFieldData?.type || '');
      setReducer(initialFieldData?.reducer || '');
      setDefaultValue(
        initialFieldData?.default !== undefined ? JSON.stringify(initialFieldData.default) : ''
      );
      setError(null);
    }
  }, [show, initialFieldName, initialFieldData]);

  const handleSave = () => {
    // Validate field name
    const validation = validateFieldName(fieldName, existingFields, initialFieldName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid field name');
      return;
    }

    // Validate type
    if (!type.trim()) {
      setError('型を入力してください');
      return;
    }

    // Parse default value
    let parsedDefault: any = undefined;
    if (defaultValue.trim()) {
      try {
        parsedDefault = JSON.parse(defaultValue);
      } catch (e) {
        setError('デフォルト値は有効なJSONである必要があります');
        return;
      }
    }

    // Build field data
    const fieldData: AnnotationField = {
      type: type.trim(),
      ...(reducer.trim() && { reducer: reducer.trim() }),
      ...(parsedDefault !== undefined && { default: parsedDefault }),
    };

    onSave(fieldName.trim(), fieldData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!show) return null;

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
    minWidth: '500px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px',
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
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '80px',
    fontFamily: 'var(--vscode-editor-font-family)',
    resize: 'vertical',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--vscode-descriptionForeground)',
    marginTop: '4px',
    fontStyle: 'italic',
  };

  const errorStyle: React.CSSProperties = {
    padding: '10px',
    marginBottom: '16px',
    background: 'var(--vscode-inputValidation-errorBackground)',
    color: 'var(--vscode-inputValidation-errorForeground)',
    border: '1px solid var(--vscode-inputValidation-errorBorder)',
    borderRadius: '3px',
    fontSize: '12px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 20px',
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

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
  };

  return (
    <div style={overlayStyle} onClick={onCancel} onKeyDown={handleKeyDown}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          {initialFieldName ? 'Annotationフィールド編集' : 'Annotationフィールド追加'}
        </div>

        <div style={bodyStyle}>
          {error && <div style={errorStyle}>{error}</div>}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Field Name *</label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="例: messages"
              style={inputStyle}
              autoFocus
            />
            <div style={hintStyle}>有効なJavaScript識別子が必要</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Type *</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="例: string, number, boolean, string[], object"
              style={inputStyle}
            />
            <div style={hintStyle}>フィールドのTypeScript型</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Reducer (任意)</label>
            <textarea
              value={reducer}
              onChange={(e) => setReducer(e.target.value)}
              placeholder="例: (x, y) => x.concat(y)"
              style={textareaStyle}
            />
            <div style={hintStyle}>状態の更新方法を定義する関数</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Default (任意)</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder='例: [], null, "", 0'
              style={inputStyle}
            />
            <div style={hintStyle}>JSON形式でデフォルト値を入力</div>
          </div>
        </div>

        <div style={footerStyle}>
          <button onClick={onCancel} style={secondaryButtonStyle}>
            キャンセル
          </button>
          <button onClick={handleSave} style={primaryButtonStyle}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
