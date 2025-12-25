import React, { useState, useEffect } from 'react';
import {
  ReactFlowEdge,
  ReactFlowNode,
  ConditionalEdgeCondition,
} from '../types/workflow.types';
import { validateConditionalEdge } from '../utils/validation';

interface ConditionalEdgeFormModalProps {
  show: boolean;
  edgeGroup?: ReactFlowEdge[];
  allNodes: ReactFlowNode[];
  onSave: (updatedEdges: ReactFlowEdge[]) => void;
  onCancel: () => void;
}

interface Parameter {
  name: string;
  type: string;
  modelRef?: string;
}

export const ConditionalEdgeFormModal: React.FC<ConditionalEdgeFormModalProps> = ({
  show,
  edgeGroup,
  allNodes,
  onSave,
  onCancel,
}) => {
  const currentCondition = edgeGroup?.[0]?.data?.condition;
  const currentTargets = edgeGroup?.[0]?.data?.possibleTargets || [];
  const sourceId = edgeGroup?.[0]?.source || '';

  const [conditionName, setConditionName] = useState('');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [outputType, setOutputType] = useState('string');
  const [implementation, setImplementation] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editingParam, setEditingParam] = useState<number | null>(null);
  const [paramForm, setParamForm] = useState<Parameter>({
    name: '',
    type: '',
    modelRef: '',
  });

  useEffect(() => {
    if (show && currentCondition) {
      setConditionName(currentCondition.name || '');
      setParameters(currentCondition.function?.parameters || []);
      setOutputType(currentCondition.function?.output || 'string');
      setImplementation(currentCondition.function?.implementation || '');
      setSelectedTargets(currentTargets);
      setError(null);
    }
  }, [show, currentCondition, currentTargets]);

  const resetForm = () => {
    setConditionName('');
    setParameters([]);
    setOutputType('string');
    setImplementation('');
    setSelectedTargets([]);
    setError(null);
    setEditingParam(null);
    setParamForm({ name: '', type: '', modelRef: '' });
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleSave = () => {
    if (!conditionName.trim()) {
      setError('Condition name is required');
      return;
    }

    if (!implementation.trim()) {
      setError('Implementation is required');
      return;
    }

    if (selectedTargets.length === 0) {
      setError('At least one possible target must be selected');
      return;
    }

    const newCondition: ConditionalEdgeCondition = {
      name: conditionName.trim(),
      function: {
        parameters: parameters,
        output: outputType,
        implementation: implementation.trim(),
      },
    };

    const allNodeIds = allNodes.map((n) => n.id);
    const validation = validateConditionalEdge(newCondition, selectedTargets, allNodeIds);

    if (!validation.valid) {
      setError(validation.error || 'Invalid configuration');
      return;
    }

    const groupId = edgeGroup?.[0]?.data?.conditionalGroupId ||
                    `conditional-${sourceId}-${Date.now()}`;

    const updatedEdges: ReactFlowEdge[] = selectedTargets.map((target, index) => ({
      id: `${groupId}-${target}`,
      source: sourceId,
      target: target,
      type: 'smoothstep',
      animated: true,
      label: index === 0 ? conditionName.trim() : undefined,
      markerEnd: { type: 'arrowclosed' },
      data: {
        conditionalGroupId: groupId,
        condition: newCondition,
        possibleTargets: selectedTargets,
        isConditional: true,
      },
    }));

    onSave(updatedEdges);
    resetForm();
  };

  const handleAddParameter = () => {
    setEditingParam(parameters.length);
    setParamForm({ name: '', type: '', modelRef: '' });
  };

  const handleEditParameter = (index: number) => {
    setEditingParam(index);
    setParamForm({ ...parameters[index] });
  };

  const handleSaveParameter = () => {
    if (!paramForm.name.trim() || !paramForm.type.trim()) {
      return;
    }

    const newParameters = [...parameters];
    if (editingParam !== null && editingParam < parameters.length) {
      newParameters[editingParam] = {
        name: paramForm.name.trim(),
        type: paramForm.type.trim(),
        modelRef: paramForm.modelRef?.trim() || undefined,
      };
    } else {
      newParameters.push({
        name: paramForm.name.trim(),
        type: paramForm.type.trim(),
        modelRef: paramForm.modelRef?.trim() || undefined,
      });
    }

    setParameters(newParameters);
    setEditingParam(null);
    setParamForm({ name: '', type: '', modelRef: '' });
  };

  const handleCancelParameter = () => {
    setEditingParam(null);
    setParamForm({ name: '', type: '', modelRef: '' });
  };

  const handleDeleteParameter = (index: number) => {
    const newParameters = parameters.filter((_, i) => i !== index);
    setParameters(newParameters);
  };

  const handleToggleTarget = (nodeId: string) => {
    setSelectedTargets((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const nodeTargets = allNodes.map((n) => ({ id: n.id, name: (n.data?.label as string) || n.id }));

  // Add __end__ only if it's not already in the nodes list
  const hasEndNode = nodeTargets.some((t) => t.id === '__end__');
  const availableTargets = [
    ...nodeTargets,
    ...(hasEndNode ? [] : [{ id: '__end__', name: '__end__' }]),
  ].filter((target) => target.id !== sourceId);

  if (!show) {
    return null;
  }

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
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          border: '1px solid var(--vscode-panel-border)',
          borderRadius: '6px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
            Edit Conditional Edge
          </h3>
          <button
            onClick={handleCancel}
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

        <div style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                padding: '10px',
                marginBottom: '16px',
                backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
                color: 'var(--vscode-inputValidation-errorForeground)',
                border: '1px solid var(--vscode-inputValidation-errorBorder)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

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
              Condition Name*
            </label>
            <input
              type="text"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="e.g., shouldContinue, routeMessage"
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

          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: 'var(--vscode-editor-foreground)',
                }}
              >
                Parameters
              </label>
              <button
                onClick={handleAddParameter}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {parameters.map((param, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  border: '1px solid var(--vscode-panel-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--vscode-editor-background)',
                }}
              >
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  <strong>Name:</strong> {param.name}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  <strong>Type:</strong> {param.type}
                </div>
                {param.modelRef && (
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>Model Ref:</strong> {param.modelRef}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleEditParameter(index)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: 'var(--vscode-button-background)',
                      color: 'var(--vscode-button-foreground)',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteParameter(index)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor:
                        'var(--vscode-inputValidation-errorBackground)',
                      color: 'var(--vscode-inputValidation-errorForeground)',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {editingParam !== null && (
              <div
                style={{
                  padding: '12px',
                  marginTop: '8px',
                  border: '1px solid var(--vscode-focusBorder)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--vscode-editor-background)',
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    Name*
                  </label>
                  <input
                    type="text"
                    value={paramForm.name}
                    onChange={(e) =>
                      setParamForm({ ...paramForm, name: e.target.value })
                    }
                    placeholder="e.g., state, message"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '12px',
                      backgroundColor: 'var(--vscode-input-background)',
                      color: 'var(--vscode-input-foreground)',
                      border: '1px solid var(--vscode-input-border)',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    Type*
                  </label>
                  <input
                    type="text"
                    value={paramForm.type}
                    onChange={(e) =>
                      setParamForm({ ...paramForm, type: e.target.value })
                    }
                    placeholder="e.g., string, number, typeof AgentState"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '12px',
                      backgroundColor: 'var(--vscode-input-background)',
                      color: 'var(--vscode-input-foreground)',
                      border: '1px solid var(--vscode-input-border)',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    Model Ref (optional)
                  </label>
                  <input
                    type="text"
                    value={paramForm.modelRef || ''}
                    onChange={(e) =>
                      setParamForm({ ...paramForm, modelRef: e.target.value })
                    }
                    placeholder="e.g., gpt4"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      fontSize: '12px',
                      backgroundColor: 'var(--vscode-input-background)',
                      color: 'var(--vscode-input-foreground)',
                      border: '1px solid var(--vscode-input-border)',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleSaveParameter}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      backgroundColor: 'var(--vscode-button-background)',
                      color: 'var(--vscode-button-foreground)',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelParameter}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      backgroundColor:
                        'var(--vscode-button-secondaryBackground)',
                      color: 'var(--vscode-button-secondaryForeground)',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

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
              Output Type*
            </label>
            <input
              type="text"
              value={outputType}
              onChange={(e) => setOutputType(e.target.value)}
              placeholder="string"
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
            <div
              style={{
                marginTop: '4px',
                fontSize: '11px',
                color: 'var(--vscode-descriptionForeground)',
              }}
            >
              Conditional functions must return a string (target node ID)
            </div>
          </div>

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
              Implementation*
            </label>
            <textarea
              value={implementation}
              onChange={(e) => setImplementation(e.target.value)}
              placeholder={`try {\n  // Your condition logic here\n  if (state.shouldContinue) {\n    return "tools";\n  }\n  return "__end__";\n} catch (error) {\n  return "__end__";\n}`}
              rows={10}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                backgroundColor: 'var(--vscode-input-background)',
                color: 'var(--vscode-input-foreground)',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '2px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--vscode-editor-foreground)',
              }}
            >
              Possible Targets* (Select at least 1)
            </label>
            <div
              style={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: 'var(--vscode-editor-background)',
              }}
            >
              {availableTargets.map((target) => (
                <div
                  key={target.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 0',
                    fontSize: '12px',
                  }}
                >
                  <input
                    type="checkbox"
                    id={`target-${target.id}`}
                    checked={selectedTargets.includes(target.id)}
                    onChange={() => handleToggleTarget(target.id)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <label
                    htmlFor={`target-${target.id}`}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    {target.name}
                  </label>
                </div>
              ))}
            </div>
            {selectedTargets.length === 0 && (
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: 'var(--vscode-inputValidation-warningForeground)',
                }}
              >
                At least one target must be selected
              </div>
            )}
          </div>
        </div>

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
            onClick={handleCancel}
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
            onClick={handleSave}
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
