import React, { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';
import { validateParameterName, validateOutputKey } from './utils/validation';
import { NodeBadges } from './settings/NodeBadges';

export const WorkflowNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData & { isExecuting?: boolean; hasExecuted?: boolean };
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(nodeData.implementation || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(nodeData.label);
  const [nameError, setNameError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Determine badges to display
  const showToolNodeBadge = nodeData.nodeType === 'ToolNode';
  const showA2ABadge = nodeData.useA2AClients === true;

  // Check if any parameter uses a model with A2A or MCP binding
  let hasModelWithA2A = false;
  let hasModelWithMCP = false;

  if (nodeData.parameters && nodeData.models) {
    const modelRefs = nodeData.parameters
      .map(p => p.modelRef)
      .filter(ref => ref !== undefined && ref !== '');

    modelRefs.forEach(modelRef => {
      const model = nodeData.models?.find(m => m.id === modelRef);
      if (model) {
        if (model.bindA2AClients) hasModelWithA2A = true;
        if (model.bindMcpServers) hasModelWithMCP = true;
      }
    });
  }

  const finalShowA2ABadge = showA2ABadge || hasModelWithA2A;
  const finalShowMCPBadge = hasModelWithMCP;

  // Parameters editing state
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [paramsValue, setParamsValue] = useState<Array<{ name: string; type: string; modelRef?: string }>>(
    nodeData.parameters || []
  );
  const [paramsError, setParamsError] = useState<string | null>(null);

  // Output editing state
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [outputValue, setOutputValue] = useState<Array<{ key: string; type: string }>>(
    Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v }))
  );
  const [outputError, setOutputError] = useState<string | null>(null);

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

  // Handle node name double-click
  const handleNameDoubleClick = useCallback(() => {
    setIsEditingName(true);
    setNameValue(nodeData.label);
    setNameError(null);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [nodeData.label]);

  // Handle name change
  const handleNameSave = useCallback(() => {
    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      setNameError('ノード名を入力してください');
      return;
    }

    if (nodeData.onNodeNameChange && trimmedName !== id) {
      nodeData.onNodeNameChange(id, trimmedName);
    }

    setIsEditingName(false);
    setNameError(null);
  }, [nameValue, id, nodeData]);

  const handleNameCancel = useCallback(() => {
    setIsEditingName(false);
    setNameValue(nodeData.label);
    setNameError(null);
  }, [nodeData.label]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  }, [handleNameSave, handleNameCancel]);

  // Parameters editing handlers
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
      // Remove modelRef if empty string selected
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
    const updatedParams = paramsValue.filter((_, i) => i !== index);
    setParamsValue(updatedParams);
  }, [paramsValue]);

  const handleParamsSave = useCallback(() => {
    // Validate all parameters
    for (let i = 0; i < paramsValue.length; i++) {
      const param = paramsValue[i];
      const validation = validateParameterName(param.name, paramsValue, i);
      if (!validation.valid) {
        setParamsError(`パラメータ ${i + 1}: ${validation.error}`);
        return;
      }
      if (!param.type.trim()) {
        setParamsError(`パラメータ ${i + 1}: 型を入力してください`);
        return;
      }
    }

    // Update node data
    nodeData.parameters = paramsValue;
    setIsEditingParams(false);
    setParamsError(null);
  }, [paramsValue, nodeData]);

  const handleParamsCancel = useCallback(() => {
    setIsEditingParams(false);
    setParamsValue(nodeData.parameters || []);
    setParamsError(null);
  }, [nodeData.parameters]);

  // Output editing handlers
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
    const updatedOutput = outputValue.filter((_, i) => i !== index);
    setOutputValue(updatedOutput);
  }, [outputValue]);

  const handleOutputSave = useCallback(() => {
    // Validate all output keys
    const tempOutput: Record<string, string> = {};
    for (let i = 0; i < outputValue.length; i++) {
      const output = outputValue[i];
      const validation = validateOutputKey(output.key, tempOutput);
      if (!validation.valid) {
        setOutputError(`出力 ${i + 1}: ${validation.error}`);
        return;
      }
      if (!output.type.trim()) {
        setOutputError(`出力 ${i + 1}: 型を入力してください`);
        return;
      }
      tempOutput[output.key] = output.type;
    }

    // Update node data
    nodeData.output = tempOutput;
    setIsEditingOutput(false);
    setOutputError(null);
  }, [outputValue, nodeData]);

  const handleOutputCancel = useCallback(() => {
    setIsEditingOutput(false);
    setOutputValue(Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v })));
    setOutputError(null);
  }, [nodeData.output]);

  // Get border color based on execution state
  const getBorderColor = () => {
    if (nodeData.isExecuting) return '#4caf50'; // Green - currently executing
    if (nodeData.hasExecuted) return '#2196f3'; // Blue - has executed
    return '#555'; // Default
  };

  const getBorderWidth = () => {
    if (nodeData.isExecuting) return 3;
    if (nodeData.hasExecuted) return 2;
    return 2;
  };

  return (
    <div
      style={{
        padding: '12px',
        border: `${getBorderWidth()}px solid ${getBorderColor()}`,
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        minWidth: isExpanded ? '600px' : '220px',
        minHeight: isExpanded ? '400px' : '80px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        color: '#fff',
        position: 'relative',
      }}
    >
      {/* Executing badge */}
      {nodeData.isExecuting && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '8px',
            backgroundColor: '#4caf50',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          Executing...
        </div>
      )}

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
          gap: '8px',
        }}
      >
        {isEditingName ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleNameKeyDown}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '13px',
                  fontFamily: 'var(--vscode-editor-font-family)',
                  background: '#1a1a1a',
                  color: '#4a9eff',
                  border: '1px solid #4a9eff',
                  borderRadius: '3px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleNameSave}
                style={{
                  padding: '4px 8px',
                  background: '#4a9eff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ✓
              </button>
              <button
                onClick={handleNameCancel}
                style={{
                  padding: '4px 8px',
                  background: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            </div>
            {nameError && (
              <div style={{ fontSize: '11px', color: '#ff6b6b' }}>
                {nameError}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <strong
              style={{
                fontSize: '14px',
                color: '#4a9eff',
                cursor: 'pointer',
              }}
              onDoubleClick={handleNameDoubleClick}
              title="ダブルクリックして名前を編集"
            >
              {nodeData.label}
            </strong>
            <NodeBadges
              showToolNodeBadge={showToolNodeBadge}
              showA2ABadge={finalShowA2ABadge}
              showMCPBadge={finalShowMCPBadge}
            />
          </div>
        )}
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
            flexShrink: 0,
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
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Parameters ({nodeData.parameters?.length || 0})
              </strong>
              <button
                onClick={() => {
                  if (isEditingParams) {
                    handleParamsSave();
                  } else {
                    setIsEditingParams(true);
                    setParamsValue(nodeData.parameters || []);
                  }
                }}
                style={{
                  padding: '2px 8px',
                  background: isEditingParams ? '#4a9eff' : '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
              >
                {isEditingParams ? '✓ 完了' : '✏️ 編集'}
              </button>
            </div>

            {isEditingParams ? (
              <div
                style={{
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #555',
                }}
              >
                {paramsValue.length === 0 ? (
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
                    パラメータなし
                  </div>
                ) : (
                  paramsValue.map((param, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '8px',
                        padding: '8px',
                        background: '#2d2d2d',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#88c0d0' }}>Parameter {index + 1}</span>
                        <button
                          onClick={() => handleRemoveParam(index)}
                          style={{
                            padding: '2px 6px',
                            background: '#ff6b6b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '2px' }}>Name:</label>
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleParamNameChange(index, e.target.value)}
                          placeholder="parameterName"
                          style={{
                            width: '100%',
                            padding: '4px',
                            fontSize: '10px',
                            fontFamily: 'var(--vscode-editor-font-family)',
                            background: '#1a1a1a',
                            color: '#d8dee9',
                            border: '1px solid #555',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '2px' }}>Type:</label>
                        <input
                          type="text"
                          value={param.type}
                          onChange={(e) => handleParamTypeChange(index, e.target.value)}
                          placeholder="string | number | ..."
                          style={{
                            width: '100%',
                            padding: '4px',
                            fontSize: '10px',
                            fontFamily: 'var(--vscode-editor-font-family)',
                            background: '#1a1a1a',
                            color: '#d8dee9',
                            border: '1px solid #555',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      {nodeData.models && nodeData.models.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '2px' }}>
                            Model Reference (Optional):
                          </label>
                          <select
                            value={param.modelRef || ''}
                            onChange={(e) => handleParamModelRefChange(index, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px',
                              fontSize: '10px',
                              fontFamily: 'var(--vscode-editor-font-family)',
                              background: '#1a1a1a',
                              color: '#d8dee9',
                              border: '1px solid #555',
                              borderRadius: '3px',
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
                <button
                  onClick={handleAddParam}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#4a9eff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginTop: '4px',
                  }}
                >
                  + パラメータ追加
                </button>
                {paramsError && (
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#ff6b6b' }}>
                    {paramsError}
                  </div>
                )}
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleParamsCancel}
                    style={{
                      flex: 1,
                      padding: '4px',
                      background: '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '10px',
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #555',
                  color: '#d8dee9',
                }}
              >
                {!nodeData.parameters || nodeData.parameters.length === 0 ? (
                  <div style={{ color: '#999' }}>パラメータなし</div>
                ) : (
                  nodeData.parameters.map((param, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      {index + 1}. {param.name}: {param.type}
                      {param.modelRef && (
                        <span style={{ color: '#88c0d0', marginLeft: '8px', fontSize: '9px' }}>
                          [Model: {param.modelRef}]
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Output ({Object.keys(nodeData.output || {}).length})
              </strong>
              <button
                onClick={() => {
                  if (isEditingOutput) {
                    handleOutputSave();
                  } else {
                    setIsEditingOutput(true);
                    setOutputValue(Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v })));
                  }
                }}
                style={{
                  padding: '2px 8px',
                  background: isEditingOutput ? '#4a9eff' : '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
              >
                {isEditingOutput ? '✓ 完了' : '✏️ 編集'}
              </button>
            </div>

            {isEditingOutput ? (
              <div
                style={{
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #555',
                }}
              >
                {outputValue.length === 0 ? (
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px' }}>
                    出力なし
                  </div>
                ) : (
                  outputValue.map((output, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '8px',
                        padding: '8px',
                        background: '#2d2d2d',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#88c0d0' }}>Output {index + 1}</span>
                        <button
                          onClick={() => handleRemoveOutput(index)}
                          style={{
                            padding: '2px 6px',
                            background: '#ff6b6b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '2px' }}>Key:</label>
                        <input
                          type="text"
                          value={output.key}
                          onChange={(e) => handleOutputKeyChange(index, e.target.value)}
                          placeholder="outputKey"
                          style={{
                            width: '100%',
                            padding: '4px',
                            fontSize: '10px',
                            fontFamily: 'var(--vscode-editor-font-family)',
                            background: '#1a1a1a',
                            color: '#d8dee9',
                            border: '1px solid #555',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '2px' }}>Type:</label>
                        <input
                          type="text"
                          value={output.type}
                          onChange={(e) => handleOutputTypeChange(index, e.target.value)}
                          placeholder="string | number | ..."
                          style={{
                            width: '100%',
                            padding: '4px',
                            fontSize: '10px',
                            fontFamily: 'var(--vscode-editor-font-family)',
                            background: '#1a1a1a',
                            color: '#d8dee9',
                            border: '1px solid #555',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={handleAddOutput}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#4a9eff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginTop: '4px',
                  }}
                >
                  + 出力追加
                </button>
                {outputError && (
                  <div style={{ marginTop: '8px', fontSize: '10px', color: '#ff6b6b' }}>
                    {outputError}
                  </div>
                )}
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleOutputCancel}
                    style={{
                      flex: 1,
                      padding: '4px',
                      background: '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '10px',
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #555',
                  color: '#d8dee9',
                }}
              >
                {!nodeData.output || Object.keys(nodeData.output).length === 0 ? (
                  <div style={{ color: '#999' }}>(出力なし)</div>
                ) : (
                  Object.entries(nodeData.output).map(([key, type], index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      {key}: {type}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

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
