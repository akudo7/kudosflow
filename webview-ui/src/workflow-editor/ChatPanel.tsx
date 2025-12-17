/**
 * ChatPanel Component
 * Phase 10B: Chat UI Foundation
 *
 * Main chat interface for workflow execution
 * Sliding panel from right side with message history and input
 */

import React from 'react';
import { ChatPanelProps } from './types/chat.types';
import { MessageList } from './MessageList';
import { InterruptPrompt } from './InterruptPrompt';
import { ChatInput } from './ChatInput';

/**
 * ChatPanel Component
 * Provides a sliding drawer interface for chat-based workflow execution
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  open,
  onClose,
  workflowPath,
  messages,
  onSendMessage,
  isExecuting,
  isWaitingForInterrupt,
  interruptMessage,
  onClearChat
}) => {
  // Extract workflow name from path
  const workflowName = workflowPath.split('/').pop()?.replace('.json', '') || 'Workflow';

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        background: 'var(--vscode-sideBar-background)',
        borderLeft: '1px solid var(--vscode-panel-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--vscode-panel-border)',
          background: 'var(--vscode-editor-background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flexGrow: 1, overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--vscode-foreground)',
              marginBottom: '4px',
            }}
          >
            💬 Chat
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--vscode-descriptionForeground)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {workflowName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onClearChat}
            disabled={messages.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: messages.length === 0
                ? 'var(--vscode-disabledForeground)'
                : 'var(--vscode-foreground)',
              cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '18px',
            }}
            title="Clear chat"
            onMouseEnter={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.background = 'var(--vscode-toolbar-hoverBackground)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--vscode-foreground)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '18px',
            }}
            title="Close chat"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--vscode-toolbar-hoverBackground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Execution Status Badge */}
      {isExecuting && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--vscode-inputValidation-infoBorder)',
            borderBottom: '1px solid var(--vscode-panel-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--vscode-foreground)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2196f3',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <span>Workflow executing...</span>
        </div>
      )}

      {/* Message List */}
      <MessageList messages={messages} />

      {/* Interrupt Prompt */}
      <InterruptPrompt
        show={isWaitingForInterrupt}
        message={interruptMessage}
      />

      {/* Input Area */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isExecuting && !isWaitingForInterrupt}
        placeholder={
          isWaitingForInterrupt
            ? 'Provide input to continue...'
            : 'Type your message...'
        }
      />

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
};
