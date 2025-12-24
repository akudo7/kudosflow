import React, { useState } from 'react';

interface TestDialogProps {
  show: boolean;
  onClose: () => void;
}

export const TestDialog: React.FC<TestDialogProps> = ({ show, onClose }) => {
  const [inputValue, setInputValue] = useState('');

  if (!show) {
    return null;
  }

  const handleSubmit = () => {
    console.log('Test input:', inputValue);
    setInputValue('');
    onClose();
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
          backgroundColor: 'var(--vscode-editor-background)',
          border: '1px solid var(--vscode-panel-border)',
          borderRadius: '6px',
          width: '600px',
          height: '80vh',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--vscode-panel-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--vscode-editor-foreground)',
            }}
          >
            Test Dialog
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--vscode-editor-foreground)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--vscode-editor-foreground)',
              }}
            >
              Test Input
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter test value..."
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '13px',
                backgroundColor: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--vscode-textCodeBlock-background)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--vscode-descriptionForeground)',
            }}
          >
            <p style={{ margin: '0 0 8px 0' }}>
              This is a test dialog demonstrating modal functionality.
            </p>
            <p style={{ margin: 0 }}>
              Click outside the dialog or the × button to close.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--vscode-panel-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              backgroundColor: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
