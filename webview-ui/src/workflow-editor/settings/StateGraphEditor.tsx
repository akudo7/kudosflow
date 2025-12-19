import React from 'react';

interface StateGraphConfig {
  annotationRef: string;
  config: {
    checkpointer: {
      type: string;
    };
  };
}

interface Props {
  stateGraph: StateGraphConfig;
  stateAnnotationName: string;
  onStateGraphChange: (stateGraph: StateGraphConfig) => void;
}

const CHECKPOINTER_TYPES = ['MemorySaver', 'SqliteSaver', 'RedisSaver'] as const;
type CheckpointerType = typeof CHECKPOINTER_TYPES[number];

export const StateGraphEditor: React.FC<Props> = ({
  stateGraph,
  stateAnnotationName,
  onStateGraphChange,
}) => {
  const handleAnnotationRefChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStateGraphChange({
      ...stateGraph,
      annotationRef: e.target.value,
    });
  };

  const handleCheckpointerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStateGraphChange({
      ...stateGraph,
      config: {
        ...stateGraph.config,
        checkpointer: {
          type: e.target.value,
        },
      },
    });
  };

  const isAnnotationRefMismatch = stateGraph.annotationRef !== stateAnnotationName;

  const containerStyle: React.CSSProperties = {
    padding: '12px',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontSize: '13px',
    fontFamily: 'var(--vscode-font-family)',
    cursor: 'pointer',
  };

  const warningStyle: React.CSSProperties = {
    marginTop: '6px',
    padding: '8px',
    background: 'var(--vscode-inputValidation-warningBackground)',
    border: '1px solid var(--vscode-inputValidation-warningBorder)',
    borderRadius: '2px',
    fontSize: '12px',
    color: 'var(--vscode-inputValidation-warningForeground)',
    display: 'flex',
    alignItems: 'flex-start',
  };

  const warningIconStyle: React.CSSProperties = {
    marginRight: '6px',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Annotation Reference</label>
        <select
          value={stateGraph.annotationRef}
          onChange={handleAnnotationRefChange}
          style={selectStyle}
        >
          <option value={stateAnnotationName}>{stateAnnotationName}</option>
        </select>
        {isAnnotationRefMismatch && (
          <div style={warningStyle}>
            <span style={warningIconStyle}>⚠️</span>
            <span>
              Annotation Reference does not match State Annotation name "{stateAnnotationName}".
              If mismatched, the workflow may not function correctly.
            </span>
          </div>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Checkpointer Type</label>
        <select
          value={stateGraph.config.checkpointer.type}
          onChange={handleCheckpointerTypeChange}
          style={selectStyle}
        >
          {CHECKPOINTER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
