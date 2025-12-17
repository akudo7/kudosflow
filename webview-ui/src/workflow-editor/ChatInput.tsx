/**
 * ChatInput Component
 * Phase 10B: Chat UI Foundation
 *
 * Multi-line text input for chat messages with send button
 * Supports Enter to send, Shift+Enter for new line
 */

import React, { useState, KeyboardEvent } from 'react';
import { ChatInputProps } from './types/chat.types';

/**
 * ChatInput Component
 * Provides text input with send functionality
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...'
}) => {
  const [input, setInput] = useState('');

  /**
   * Handle send button click
   */
  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onSend(trimmed);
      setInput('');
    }
  };

  /**
   * Handle keyboard shortcuts
   * - Enter: Send message
   * - Shift+Enter: New line
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '1px solid var(--vscode-panel-border)',
        background: 'var(--vscode-editor-background)',
      }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'var(--vscode-font-family)',
          color: 'var(--vscode-input-foreground)',
          background: disabled
            ? 'var(--vscode-input-background)'
            : 'var(--vscode-input-background)',
          border: '1px solid var(--vscode-input-border)',
          borderRadius: '3px',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1px solid var(--vscode-focusBorder)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = '1px solid var(--vscode-input-border)';
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        style={{
          width: '100%',
          padding: '8px 16px',
          marginTop: '8px',
          background: disabled || !input.trim()
            ? 'var(--vscode-button-secondaryBackground)'
            : 'var(--vscode-button-background)',
          color: disabled || !input.trim()
            ? 'var(--vscode-button-secondaryForeground)'
            : 'var(--vscode-button-foreground)',
          border: 'none',
          borderRadius: '3px',
          fontSize: '13px',
          fontFamily: 'var(--vscode-font-family)',
          fontWeight: 600,
          cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>Send</span>
        <span>▶</span>
      </button>
      <div
        style={{
          display: 'block',
          marginTop: '4px',
          fontSize: '11px',
          color: 'var(--vscode-descriptionForeground)',
        }}
      >
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};
