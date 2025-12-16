import React, { useState, useEffect } from 'react';
import { ModelConfig } from '../types/workflow.types';
import { validateModelConfig } from '../utils/validation';

interface Props {
  show: boolean;
  modelConfig?: ModelConfig;
  existingModels: ModelConfig[];
  onSave: (modelConfig: ModelConfig) => void;
  onCancel: () => void;
  a2aClientsExist?: boolean;
  mcpServersExist?: boolean;
}

export const ModelFormModal: React.FC<Props> = ({
  show,
  modelConfig: initialModelConfig,
  existingModels,
  onSave,
  onCancel,
  a2aClientsExist = false,
  mcpServersExist = false,
}) => {
  const [modelId, setModelId] = useState(initialModelConfig?.id || '');
  const [modelType, setModelType] = useState(initialModelConfig?.type || 'OpenAI');
  const [modelName, setModelName] = useState(initialModelConfig?.config.model || '');
  const [temperature, setTemperature] = useState(
    initialModelConfig?.config.temperature?.toString() || '0.7'
  );
  const [bindA2AClients, setBindA2AClients] = useState(
    initialModelConfig?.bindA2AClients || false
  );
  const [bindMcpServers, setBindMcpServers] = useState(
    initialModelConfig?.bindMcpServers || false
  );
  const [systemPrompt, setSystemPrompt] = useState(initialModelConfig?.systemPrompt || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setModelId(initialModelConfig?.id || '');
      setModelType(initialModelConfig?.type || 'OpenAI');
      setModelName(initialModelConfig?.config.model || '');
      setTemperature(initialModelConfig?.config.temperature?.toString() || '0.7');
      setBindA2AClients(initialModelConfig?.bindA2AClients || false);
      setBindMcpServers(initialModelConfig?.bindMcpServers || false);
      setSystemPrompt(initialModelConfig?.systemPrompt || '');
      setError(null);
    }
  }, [show, initialModelConfig]);

  const handleSave = () => {
    // Validate model ID
    if (!modelId.trim()) {
      setError('モデルIDを入力してください');
      return;
    }

    // Check if ID already exists (for new models or renamed models)
    const isDuplicate = existingModels.some(
      (m) => m.id === modelId.trim() && m.id !== initialModelConfig?.id
    );
    if (isDuplicate) {
      setError(`モデルID "${modelId}" は既に存在します`);
      return;
    }

    // Validate model name
    if (!modelName.trim()) {
      setError('モデル名を入力してください');
      return;
    }

    // Validate temperature
    const tempValue = parseFloat(temperature);
    if (isNaN(tempValue) || tempValue < 0 || tempValue > 2) {
      setError('Temperature は 0 から 2 の間の数値である必要があります');
      return;
    }

    // Build model config
    const modelConfig: ModelConfig = {
      id: modelId.trim(),
      type: modelType,
      config: {
        model: modelName.trim(),
        temperature: tempValue,
      },
      ...(bindA2AClients && { bindA2AClients: true }),
      ...(bindMcpServers && { bindMcpServers: true }),
      ...(systemPrompt.trim() && { systemPrompt: systemPrompt.trim() }),
    };

    // Validate using validation utility
    const validation = validateModelConfig(modelConfig, a2aClientsExist, mcpServersExist);
    if (!validation.valid) {
      setError(validation.error || 'Invalid model configuration');
      return;
    }

    onSave(modelConfig);
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
    minWidth: '550px',
    maxWidth: '700px',
    maxHeight: '85vh',
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '100px',
    fontFamily: 'var(--vscode-editor-font-family)',
    resize: 'vertical',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--vscode-descriptionForeground)',
    marginTop: '4px',
    fontStyle: 'italic',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--vscode-foreground)',
    cursor: 'pointer',
  };

  const checkboxStyle: React.CSSProperties = {
    cursor: 'pointer',
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
          {initialModelConfig ? 'モデル編集' : 'モデル追加'}
        </div>

        <div style={bodyStyle}>
          {error && <div style={errorStyle}>{error}</div>}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Model ID *</label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="例: mainModel"
              style={inputStyle}
              autoFocus
            />
            <div style={hintStyle}>一意の識別子</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Type *</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              style={selectStyle}
            >
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Ollama">Ollama</option>
              <option value="Custom">Custom</option>
            </select>
            <div style={hintStyle}>モデルプロバイダー</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Model Name *</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="例: gpt-4o-mini, claude-3-opus-20240229"
              style={inputStyle}
            />
            <div style={hintStyle}>使用するモデル名</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Temperature</label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              style={inputStyle}
            />
            <div style={hintStyle}>0.0 (決定的) から 2.0 (創造的)</div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={bindA2AClients}
                onChange={(e) => setBindA2AClients(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Bind A2A Clients</span>
            </label>
            <div style={hintStyle}>
              A2Aクライアントをこのモデルにバインドする
              {!a2aClientsExist && ' (現在A2Aクライアントは設定されていません)'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={bindMcpServers}
                onChange={(e) => setBindMcpServers(e.target.checked)}
                style={checkboxStyle}
              />
              <span>Bind MCP Servers</span>
            </label>
            <div style={hintStyle}>
              MCPサーバーをこのモデルにバインドする
              {!mcpServersExist && ' (現在MCPサーバーは設定されていません)'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>System Prompt (任意)</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              style={textareaStyle}
            />
            <div style={hintStyle}>モデルのシステムプロンプト</div>
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
