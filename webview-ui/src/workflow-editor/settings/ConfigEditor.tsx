import React from 'react';

interface Props {
  config: {
    recursionLimit?: number;
    eventEmitter?: {
      defaultMaxListeners?: number;
    };
  };
  onConfigChange: (config: any) => void;
}

export const ConfigEditor: React.FC<Props> = ({ config, onConfigChange }) => {
  const recursionLimit = config?.recursionLimit ?? 25;
  const defaultMaxListeners = config?.eventEmitter?.defaultMaxListeners ?? 25;

  const handleRecursionLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) return;

    onConfigChange({
      ...config,
      recursionLimit: numValue,
    });
  };

  const handleMaxListenersChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) return;

    onConfigChange({
      ...config,
      eventEmitter: {
        ...(config?.eventEmitter || {}),
        defaultMaxListeners: numValue,
      },
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
    width: '120px',
  };

  return (
    <div style={containerStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Recursion Limit</label>
        <div style={descriptionStyle}>
          ワークフローの最大再帰回数 (デフォルト: 25)
        </div>
        <input
          type="number"
          min="1"
          value={recursionLimit}
          onChange={(e) => handleRecursionLimitChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Default Max Listeners</label>
        <div style={descriptionStyle}>
          イベントエミッターの最大リスナー数 (デフォルト: 25)
        </div>
        <input
          type="number"
          min="1"
          value={defaultMaxListeners}
          onChange={(e) => handleMaxListenersChange(e.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  );
};
