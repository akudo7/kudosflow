import React, { useState, useRef, useEffect } from 'react';
import { ServerStatus, ServerState } from './types/workflow.types';

interface Props {
  onSave: () => void;
  onAddNode: (nodeType: 'function' | 'tool') => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onToggleSettings: () => void;
  onToggleChat: () => void;
  isDirty: boolean;
  hasSelection: boolean;
  serverStatus: ServerStatus;
  onStartServer: () => void;
  onStopServer: () => void;
  onRestartServer: () => void;
  showChat: boolean;
  unreadCount: number;
}

export const WorkflowToolbar: React.FC<Props> = ({
  onSave,
  onAddNode,
  onDeleteSelected,
  onDuplicateSelected,
  onToggleSettings,
  onToggleChat,
  isDirty,
  hasSelection,
  serverStatus,
  onStartServer,
  onStopServer,
  onRestartServer,
  showChat,
  unreadCount
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const serverMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (serverMenuRef.current && !serverMenuRef.current.contains(event.target as Node)) {
        setShowServerMenu(false);
      }
    };

    if (showAddMenu || showServerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu, showServerMenu]);

  const buttonStyle = (enabled: boolean) => ({
    background: enabled ? 'var(--vscode-button-background)' : 'var(--vscode-button-secondaryBackground)',
    color: enabled ? 'var(--vscode-button-foreground)' : 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '3px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: '13px',
    fontFamily: 'var(--vscode-font-family)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    opacity: enabled ? 1 : 0.6,
  });

  const handleAddNodeClick = (nodeType: 'function' | 'tool') => {
    onAddNode(nodeType);
    setShowAddMenu(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        background: 'var(--vscode-editor-background)',
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--vscode-widget-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative' }} ref={addMenuRef}>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={buttonStyle(true)}
          title="Add new node"
        >
          ➕ Add Node
        </button>
        {showAddMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: 'var(--vscode-dropdown-background)',
              border: '1px solid var(--vscode-widget-border)',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              minWidth: '180px',
              zIndex: 100,
            }}
          >
            <button
              onClick={() => handleAddNodeClick('function')}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--vscode-dropdown-foreground)',
                fontSize: '13px',
                fontFamily: 'var(--vscode-font-family)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>⚙️</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>Function Node</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Standard function node</div>
              </div>
            </button>
            <button
              onClick={() => handleAddNodeClick('tool')}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--vscode-dropdown-foreground)',
                fontSize: '13px',
                fontFamily: 'var(--vscode-font-family)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>🛠️</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>ToolNode</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Execute tool calls</div>
              </div>
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onDuplicateSelected}
        disabled={!hasSelection}
        style={buttonStyle(hasSelection)}
        title="Duplicate selected node"
      >
        📋 Duplicate
      </button>
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        style={buttonStyle(hasSelection)}
        title="Delete selected items (Delete)"
      >
        🗑️ Delete
      </button>
      <div style={{ width: '1px', height: '24px', background: 'var(--vscode-widget-border)' }} />
      <button
        onClick={onToggleSettings}
        style={buttonStyle(true)}
        title="Open workflow settings"
      >
        ⚙️ Settings
      </button>

      {/* Chat Toggle (Phase 10B) */}
      <button
        onClick={onToggleChat}
        style={{
          ...buttonStyle(true),
          background: showChat ? 'var(--vscode-button-background)' : 'transparent',
          border: '1px solid var(--vscode-widget-border)',
          position: 'relative',
        }}
        title="Open/close chat"
      >
        💬 Chat
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--vscode-notificationsErrorIcon-foreground)',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '18px',
              textAlign: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Server Control Section (Phase 10A) */}
      <div style={{ width: '1px', height: '24px', background: 'var(--vscode-widget-border)' }} />
      {serverStatus.state === ServerState.IDLE && (
        <button
          onClick={onStartServer}
          style={buttonStyle(true)}
          title="Start A2A server"
        >
          ▶️ Start Server
        </button>
      )}
      {serverStatus.state === ServerState.STARTING && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            color: 'var(--vscode-foreground)',
          }}
        >
          <span>⏳</span>
          <span>Starting...</span>
        </div>
      )}
      {serverStatus.state === ServerState.RUNNING && (
        <>
          <div style={{ position: 'relative' }} ref={serverMenuRef}>
            <button
              onClick={() => setShowServerMenu(!showServerMenu)}
              style={{
                ...buttonStyle(true),
                background: 'transparent',
                border: '1px solid var(--vscode-widget-border)',
                position: 'relative',
              }}
              title={`Show server info (Port ${serverStatus.port || 3000})`}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4ec9b0',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              Running
            </button>
            {showServerMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--vscode-dropdown-background)',
                  border: '1px solid var(--vscode-widget-border)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden',
                  minWidth: '280px',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: 'var(--vscode-descriptionForeground)',
                  }}
                >
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: 'var(--vscode-foreground)' }}>
                    Server Info
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    Port: {serverStatus.port || 3000}
                  </div>
                  {serverStatus.endpoints && (
                    <div style={{ marginTop: '8px', fontSize: '11px' }}>
                      <div>Endpoints:</div>
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '6px',
                          background: 'var(--vscode-textCodeBlock-background)',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        <div>Agent Card:</div>
                        <div style={{ color: 'var(--vscode-textLink-foreground)' }}>
                          {serverStatus.endpoints.agentCard}
                        </div>
                        <div style={{ marginTop: '4px' }}>Message Send:</div>
                        <div style={{ color: 'var(--vscode-textLink-foreground)' }}>
                          {serverStatus.endpoints.messageSend}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onRestartServer}
            style={buttonStyle(true)}
            title="Restart server"
          >
            🔄 Restart
          </button>
          <button
            onClick={onStopServer}
            style={{
              ...buttonStyle(true),
              background: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
            }}
            title="Stop server"
          >
            ⏹️ Stop
          </button>
        </>
      )}
      {serverStatus.state === ServerState.ERROR && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              color: 'var(--vscode-errorForeground)',
            }}
          >
            <span>❌</span>
            <span>Server Error</span>
          </div>
          <button
            onClick={onStartServer}
            style={buttonStyle(true)}
            title="Restart server"
          >
            🔄 Restart
          </button>
        </>
      )}

      <button
        onClick={onSave}
        disabled={!isDirty}
        style={buttonStyle(isDirty)}
        title="Save workflow (Ctrl+S)"
      >
        💾 Save
        {isDirty && (
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--vscode-notificationsErrorIcon-foreground)',
            }}
          />
        )}
      </button>
    </div>
  );
};
