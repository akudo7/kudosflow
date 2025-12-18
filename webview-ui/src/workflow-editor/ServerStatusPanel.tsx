import React from 'react';
import { ServerStatus } from './types/workflow.types';

declare const vscode: {
  postMessage(message: any): void;
};

interface ServerStatusPanelProps {
  open: boolean;
  onClose: () => void;
  serverStatus: ServerStatus;
}

export const ServerStatusPanel: React.FC<ServerStatusPanelProps> = ({
  open,
  onClose,
  serverStatus
}) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    vscode.postMessage({
      command: 'showInfo',
      message: 'Copied to clipboard'
    });
  };

  const handleOpen = (url: string) => {
    vscode.postMessage({
      command: 'openExternal',
      url
    });
  };

  if (!open) return null;

  const getStatusColor = () => {
    switch (serverStatus.state) {
      case 'running': return '#4caf50';
      case 'starting': return '#ff9800';
      case 'stopping': return '#ff9800';
      case 'stopped': return '#666';
      case 'error': return '#f44336';
      default: return '#666';
    }
  };

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
          backgroundColor: '#1e1e1e',
          border: '1px solid #444',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>A2A Server Status</h2>
            <span
              style={{
                backgroundColor: getStatusColor(),
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {serverStatus.state.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '16px',
            overflow: 'auto',
            flex: 1,
          }}
        >
          {/* Server Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#aaa' }}>
              Server Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Port:</span>
                <span>{serverStatus.port || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Process ID:</span>
                <span>{serverStatus.pid || 'N/A'}</span>
              </div>
              {serverStatus.startTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Start Time:</span>
                  <span>{new Date(serverStatus.startTime).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Endpoints */}
          {serverStatus.endpoints && Object.keys(serverStatus.endpoints).length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#aaa' }}>
                API Endpoints
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(serverStatus.endpoints).map(([name, url]) => (
                  <div key={name}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                      {name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={url}
                        readOnly
                        style={{
                          flex: 1,
                          backgroundColor: '#2d2d2d',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#fff',
                          padding: '6px 8px',
                          fontSize: '12px',
                        }}
                      />
                      <button
                        onClick={() => handleCopy(url)}
                        style={{
                          backgroundColor: '#2d2d2d',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          fontSize: '12px',
                        }}
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleOpen(url)}
                        style={{
                          backgroundColor: '#2d2d2d',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          fontSize: '12px',
                        }}
                        title="Open in browser"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {serverStatus.error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#3d1f1f',
                border: '1px solid #f44336',
                borderRadius: '6px',
              }}
            >
              <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#f44336' }}>
                Error
              </h3>
              <div style={{ fontSize: '12px', color: '#ffcccb' }}>
                {serverStatus.error}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #444',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#007acc',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
