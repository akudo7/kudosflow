/**
 * InterruptPrompt Component
 * Phase 10B: Chat UI Foundation
 *
 * Displays a highlighted prompt when workflow requires user input
 */

import React from 'react';
import { InterruptPromptProps } from './types/chat.types';

/**
 * InterruptPrompt Component
 * Shows a warning banner when workflow is waiting for user input
 */
export const InterruptPrompt: React.FC<InterruptPromptProps> = ({
  show,
  message
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        padding: '16px',
        margin: '0 16px 8px',
        background: '#fff3e0',
        borderLeft: '4px solid #ff9800',
        borderRadius: '4px',
        animation: 'pulse-interrupt 2s ease-in-out infinite',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            color: '#ff9800',
            marginRight: '8px',
            fontSize: '18px',
          }}
        >
          ⚠️
        </span>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#e65100',
          }}
        >
          User Input Required
        </div>
      </div>
      <div
        style={{
          fontSize: '12px',
          color: '#666',
        }}
      >
        {message || 'Please provide input to continue workflow execution'}
      </div>

      <style>
        {`
          @keyframes pulse-interrupt {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
        `}
      </style>
    </div>
  );
};
