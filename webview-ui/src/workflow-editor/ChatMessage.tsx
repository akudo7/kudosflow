/**
 * ChatMessage Component
 * Phase 10B: Chat UI Foundation
 *
 * Displays individual chat message with color coding based on role
 */

import React from 'react';
import { format } from 'date-fns';
import { ChatMessageProps, MessageRole } from './types/chat.types';

interface MessageStyle {
  bg: string;
  color: string;
  align: 'flex-start' | 'flex-end';
}

/**
 * Get message styling based on role
 */
const getMessageStyle = (role: MessageRole): MessageStyle => {
  switch (role) {
    case 'user':
      return {
        bg: '#1976d2',
        color: 'white',
        align: 'flex-end'
      };
    case 'assistant':
      return {
        bg: '#4caf50',
        color: 'white',
        align: 'flex-start'
      };
    case 'system':
      return {
        bg: '#757575',
        color: 'white',
        align: 'flex-start'
      };
    case 'interrupt':
      return {
        bg: '#ff9800',
        color: 'white',
        align: 'flex-start'
      };
  }
};

/**
 * ChatMessage Component
 * Displays a single message bubble with timestamp
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp
}) => {
  const style = getMessageStyle(role);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: style.align,
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          background: style.bg,
          color: style.color,
          padding: '12px',
          maxWidth: '80%',
          borderRadius: '8px',
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}
        >
          {content}
        </div>
        <div
          style={{
            opacity: 0.7,
            display: 'block',
            marginTop: '4px',
            textAlign: role === 'user' ? 'right' : 'left',
            fontSize: '11px',
          }}
        >
          {format(timestamp, 'HH:mm:ss')}
        </div>
      </div>
    </div>
  );
};
