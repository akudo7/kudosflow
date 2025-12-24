import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CustomNodeData } from './types/workflow.types';
import { validateParameterName, validateOutputKey } from './utils/validation';

interface NodeEditorDialogProps {
  show: boolean;
  onClose: () => void;
  nodeId: string;
  nodeData: CustomNodeData;
  onSave: (nodeId: string, updatedData: Partial<CustomNodeData>) => void;
}

export const NodeEditorDialog: React.FC<NodeEditorDialogProps> = ({
  show,
  onClose,
  nodeId,
  nodeData,
  onSave,
}) => {
  // Node name editing
  const [nameValue, setNameValue] = useState(nodeData.label);
  const [nameError, setNameError] = useState<string | null>(null);

  // Implementation editing
  const [code, setCode] = useState(nodeData.implementation || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parameters editing
  const [paramsValue, setParamsValue] = useState<Array<{ name: string; type: string; modelRef?: string }>>(
    nodeData.parameters || []
  );
  const [paramsError, setParamsError] = useState<string | null>(null);

  // Output editing
  const [outputValue, setOutputValue] = useState<Array<{ key: string; type: string }>>(
    Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v }))
  );
  const [outputError, setOutputError] = useState<string | null>(null);

  // Reset state when dialog opens/closes or nodeData changes
  useEffect(() => {
    if (show) {
      setNameValue(nodeData.label);
      setCode(nodeData.implementation || '');
      setParamsValue(nodeData.parameters || []);
      setOutputValue(Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v })));
      setNameError(null);
      setParamsError(null);
      setOutputError(null);
    }
  }, [show, nodeData]);

  if (!show) {
    return null;
  }

  // Implementation handlers
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  }, [code]);

  // Parameters handlers
  const handleParamNameChange = useCallback((index: number, newName: string) => {
    const updatedParams = [...paramsValue];
    updatedParams[index] = { ...updatedParams[index], name: newName };
    setParamsValue(updatedParams);
  }, [paramsValue]);

  const handleParamTypeChange = useCallback((index: number, newType: string) => {
    const updatedParams = [...paramsValue];
    updatedParams[index] = { ...updatedParams[index], type: newType };
    setParamsValue(updatedParams);
  }, [paramsValue]);

  const handleParamModelRefChange = useCallback((index: number, newModelRef: string) => {
    const updatedParams = [...paramsValue];
    if (newModelRef === '') {
      const { modelRef, ...paramWithoutModelRef } = updatedParams[index];
      updatedParams[index] = paramWithoutModelRef as { name: string; type: string; modelRef?: string };
    } else {
      updatedParams[index] = { ...updatedParams[index], modelRef: newModelRef };
    }
    setParamsValue(updatedParams);
  }, [paramsValue]);

  const handleAddParam = useCallback(() => {
    setParamsValue([...paramsValue, { name: '', type: '' }]);
  }, [paramsValue]);

  const handleRemoveParam = useCallback((index: number) => {
    setParamsValue(paramsValue.filter((_, i) => i !== index));
  }, [paramsValue]);

  // Output handlers
  const handleOutputKeyChange = useCallback((index: number, newKey: string) => {
    const updatedOutput = [...outputValue];
    updatedOutput[index] = { ...updatedOutput[index], key: newKey };
    setOutputValue(updatedOutput);
  }, [outputValue]);

  const handleOutputTypeChange = useCallback((index: number, newType: string) => {
    const updatedOutput = [...outputValue];
    updatedOutput[index] = { ...updatedOutput[index], type: newType };
    setOutputValue(updatedOutput);
  }, [outputValue]);

  const handleAddOutput = useCallback(() => {
    setOutputValue([...outputValue, { key: '', type: '' }]);
  }, [outputValue]);

  const handleRemoveOutput = useCallback((index: number) => {
    setOutputValue(outputValue.filter((_, i) => i !== index));
  }, [outputValue]);

  // Save handler
  const handleSave = useCallback(() => {
    // Validate name
    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      setNameError('Please enter a node name');
      return;
    }

    // Validate parameters
    for (let i = 0; i < paramsValue.length; i++) {
      const param = paramsValue[i];
      const validation = validateParameterName(param.name, paramsValue, i);
      if (!validation.valid) {
        setParamsError(`Parameter ${i + 1}: ${validation.error}`);
        return;
      }
      if (!param.type.trim()) {
        setParamsError(`Parameter ${i + 1}: Please enter a type`);
        return;
      }
    }

    // Validate output
    const tempOutput: Record<string, string> = {};
    for (let i = 0; i < outputValue.length; i++) {
      const output = outputValue[i];
      const validation = validateOutputKey(output.key, tempOutput);
      if (!validation.valid) {
        setOutputError(`Output ${i + 1}: ${validation.error}`);
        return;
      }
      if (!output.type.trim()) {
        setOutputError(`Output ${i + 1}: Please enter a type`);
        return;
      }
      tempOutput[output.key] = output.type;
    }

    // Build updated data
    const updatedData: Partial<CustomNodeData> = {
      label: trimmedName,
      implementation: code,
      parameters: paramsValue,
      output: tempOutput,
    };

    onSave(nodeId, updatedData);
    onClose();
  }, [nameValue, code, paramsValue, outputValue, nodeId, onSave, onClose]);

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
          width: '800px',
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
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--vscode-editor-foreground)',
            }}
          >
            Edit Node: {nodeData.label}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--vscode-editor-foreground)',
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
          <div style={{ marginBottom: '20px' }}>
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

          {/* Parameters Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--vscode-editor-foreground)' }}>
                Parameters ({paramsValue.length})
              </strong>
              <button
                onClick={handleAddParam}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                + Add Parameter
              </button>
            </div>

            {paramsValue.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--vscode-textCodeBlock-background)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--vscode-descriptionForeground)',
                }}
              >
                No parameters
              </div>
            ) : (
              paramsValue.map((param, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--vscode-textCodeBlock-background)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)' }}>
                      Parameter {index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveParam(index)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        backgroundColor: '#ff6b6b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', display: 'block', marginBottom: '4px' }}>
                      Name:
                    </label>
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleParamNameChange(index, e.target.value)}
                      placeholder="parameterName"
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: 'var(--vscode-editor-font-family)',
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        border: '1px solid var(--vscode-input-border)',
                        borderRadius: '2px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', display: 'block', marginBottom: '4px' }}>
                      Type:
                    </label>
                    <input
                      type="text"
                      value={param.type}
                      onChange={(e) => handleParamTypeChange(index, e.target.value)}
                      placeholder="string | number | ..."
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: 'var(--vscode-editor-font-family)',
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        border: '1px solid var(--vscode-input-border)',
                        borderRadius: '2px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {nodeData.models && nodeData.models.length > 0 && (
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', display: 'block', marginBottom: '4px' }}>
                        Model Reference (Optional):
                      </label>
                      <select
                        value={param.modelRef || ''}
                        onChange={(e) => handleParamModelRefChange(index, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontFamily: 'var(--vscode-editor-font-family)',
                          backgroundColor: 'var(--vscode-input-background)',
                          color: 'var(--vscode-input-foreground)',
                          border: '1px solid var(--vscode-input-border)',
                          borderRadius: '2px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">None</option>
                        {nodeData.models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.id} ({model.config.model})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))
            )}
            {paramsError && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#ff6b6b' }}>
                {paramsError}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--vscode-editor-foreground)' }}>
                Output ({outputValue.length})
              </strong>
              <button
                onClick={handleAddOutput}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                + Add Output
              </button>
            </div>

            {outputValue.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--vscode-textCodeBlock-background)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--vscode-descriptionForeground)',
                }}
              >
                No output
              </div>
            ) : (
              outputValue.map((output, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--vscode-textCodeBlock-background)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)' }}>
                      Output {index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveOutput(index)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        backgroundColor: '#ff6b6b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', display: 'block', marginBottom: '4px' }}>
                      Key:
                    </label>
                    <input
                      type="text"
                      value={output.key}
                      onChange={(e) => handleOutputKeyChange(index, e.target.value)}
                      placeholder="outputKey"
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: 'var(--vscode-editor-font-family)',
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        border: '1px solid var(--vscode-input-border)',
                        borderRadius: '2px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', display: 'block', marginBottom: '4px' }}>
                      Type:
                    </label>
                    <input
                      type="text"
                      value={output.type}
                      onChange={(e) => handleOutputTypeChange(index, e.target.value)}
                      placeholder="string | number | ..."
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: 'var(--vscode-editor-font-family)',
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        border: '1px solid var(--vscode-input-border)',
                        borderRadius: '2px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            {outputError && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#ff6b6b' }}>
                {outputError}
              </div>
            )}
          </div>

          {/* Implementation Section */}
          <div style={{ marginBottom: '20px' }}>
            <strong style={{ fontSize: '13px', color: 'var(--vscode-editor-foreground)', display: 'block', marginBottom: '8px' }}>
              Implementation
            </strong>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                minHeight: '300px',
                fontSize: '12px',
                fontFamily: 'var(--vscode-editor-font-family)',
                backgroundColor: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '2px',
                padding: '8px',
                resize: 'vertical',
                lineHeight: '1.5',
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto',
                outline: 'none',
              }}
              spellCheck={false}
              autoComplete="off"
            />
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
              backgroundColor: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
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
