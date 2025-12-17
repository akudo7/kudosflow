/**
 * MessageList Component
 * Phase 10B: Chat UI Foundation
 *
 * Scrollable list of chat messages with auto-scroll to bottom
 */

import React, { useEffect, useRef } from 'react';
import { MessageListProps } from './types/chat.types';
import { ChatMessage } from './ChatMessage';

/**
 * MessageList Component
 * Displays all messages in a scrollable container with auto-scroll
 */
export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const listEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      style={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'var(--vscode-editor-background)',
        minHeight: 0,
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--vscode-descriptionForeground)',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: 'var(--vscode-foreground)',
              }}
            >
              Start a Conversation
            </div>
            <div style={{ fontSize: '12px' }}>
              Type a message below to execute the workflow
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
          <div ref={listEndRef} />
        </>
      )}
    </div>
  );
};
