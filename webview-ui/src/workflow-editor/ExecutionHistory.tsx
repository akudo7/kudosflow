import React, { useState, useEffect } from 'react';
import { ChatMessage } from './types/chat.types';

declare const vscode: {
  postMessage(message: any): void;
};

export interface SavedSession {
  id: string;
  workflowPath: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
}

interface ExecutionHistoryProps {
  open: boolean;
  onClose: () => void;
  onLoadSession: (session: SavedSession) => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  open,
  onClose,
  onLoadSession
}) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  // Load sessions from extension
  useEffect(() => {
    if (open) {
      vscode.postMessage({ command: 'getSavedSessions' });
    }
  }, [open]);

  // Listen for saved sessions
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'savedSessions') {
        setSessions(message.sessions || []);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDelete = (sessionId: string) => {
    vscode.postMessage({
      command: 'deleteSession',
      sessionId
    });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleLoad = (session: SavedSession) => {
    onLoadSession(session);
    onClose();
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  if (!open) return null;

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
          maxWidth: '800px',
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
          <h2 style={{ margin: 0, fontSize: '18px' }}>Execution History</h2>
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
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '32px' }}>
              No saved sessions
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    border: '1px solid #444',
                    borderRadius: '6px',
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: '#2d2d2d',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d2d2d')}
                  onClick={() => handleLoad(session)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {session.workflowPath.split('/').pop()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {formatDate(session.startTime)} - {session.messages.length} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #666',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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
