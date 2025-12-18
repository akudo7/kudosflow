import React from 'react';

export interface ExecutionConfig {
  autoSaveSessions: boolean;
  defaultPort: number;
  showExecutionTrace: boolean;
  autoScrollChat: boolean;
  maxHistorySize: number;
}

interface ExecutionSettingsProps {
  config: ExecutionConfig;
  onChange: (config: ExecutionConfig) => void;
}

export const ExecutionSettings: React.FC<ExecutionSettingsProps> = ({
  config,
  onChange
}) => {
  const handleChange = (key: keyof ExecutionConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div style={{ padding: '16px', color: '#fff' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
        Execution Settings
      </h3>

      <div style={{ borderTop: '1px solid #444', paddingTop: '16px', marginBottom: '16px' }} />

      {/* Chat Settings */}
      <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#aaa' }}>
        Chat Preferences
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.autoScrollChat}
            onChange={(e) => handleChange('autoScrollChat', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Auto-scroll chat to bottom</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.autoSaveSessions}
            onChange={(e) => handleChange('autoSaveSessions', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Auto-save execution sessions</span>
        </label>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
            Maximum history size
          </label>
          <input
            type="number"
            value={config.maxHistorySize}
            onChange={(e) => handleChange('maxHistorySize', parseInt(e.target.value) || 100)}
            min={10}
            max={1000}
            style={{
              width: '100%',
              backgroundColor: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              padding: '6px 8px',
            }}
          />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #444', paddingTop: '16px', marginBottom: '16px' }} />

      {/* Server Settings */}
      <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#aaa' }}>
        Server Preferences
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
            Default A2A server port
          </label>
          <input
            type="number"
            value={config.defaultPort}
            onChange={(e) => handleChange('defaultPort', parseInt(e.target.value) || 3000)}
            min={1000}
            max={65535}
            style={{
              width: '100%',
              backgroundColor: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              padding: '6px 8px',
            }}
          />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #444', paddingTop: '16px', marginBottom: '16px' }} />

      {/* Debug Settings */}
      <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#aaa' }}>
        Debug Options
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.showExecutionTrace}
            onChange={(e) => handleChange('showExecutionTrace', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Show execution trace on canvas</span>
        </label>
      </div>
    </div>
  );
};
