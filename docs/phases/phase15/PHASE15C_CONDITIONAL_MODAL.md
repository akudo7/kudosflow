### Status
- **Created**: 2025-12-23
- **Status**: ⬜ Not Started
- **Estimated Time**: 4-5 hours
- **Prerequisites**: Phase 15A, 15B completed

### Objective

Create a modal dialog for editing conditional edge conditions, following the pattern established by `ModelFormModal.tsx`. The modal should allow editing:
- Condition name
- Function parameters
- Function implementation code
- Output type
- Possible targets (multi-select)

### Reference Implementation

**Pattern**: `webview-ui/src/workflow-editor/settings/ModelFormModal.tsx` (358 lines)
- Uses custom modal (not Material-UI Dialog)
- VSCode theme variables for styling
- Form sections with add/edit/delete
- Inline validation
- Save/Cancel buttons

### Target UI

```
╔════════════════════════════════════════════════╗
║  Edit Conditional Edge                    [X]  ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Condition Name*                               ║
║  [shouldContinue________________]              ║
║                                                ║
║  Parameters                        [+ Add]     ║
║  ┌──────────────────────────────────────────┐ ║
║  │ Name: state                              │ ║
║  │ Type: typeof AgentState.State            │ ║
║  │ Model Ref: (optional)                    │ ║
║  │                          [Edit] [Delete] │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  Output Type*                                  ║
║  [string________________________]              ║
║                                                ║
║  Implementation*                               ║
║  ┌──────────────────────────────────────────┐ ║
║  │ try {                                    │ ║
║  │   return "tools";                        │ ║
║  │ } catch (error) {                        │ ║
║  │   return "__end__";                      │ ║
║  │ }                                        │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  Possible Targets* (Select at least 1)         ║
║  ☑ tools                                       ║
║  ☑ orchestrator                                ║
║  ☑ __end__                                     ║
║  ☐ approval_handler                            ║
║                                                ║
║  [Cancel]                            [Save]    ║
╚════════════════════════════════════════════════╝
```

### Implementation Steps

#### Step 1: Create ConditionalEdgeFormModal Component

**File**: `webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx` (NEW)

**Full Implementation** (approximately 450 lines):

```typescript
import React, { useState, useEffect } from 'react';
import {
  ReactFlowEdge,
  ReactFlowNode,
  ConditionalEdgeCondition,
} from '../types/workflow.types';
import { validateConditionalEdge } from '../utils/validation';

interface ConditionalEdgeFormModalProps {
  show: boolean;
  edgeGroup?: ReactFlowEdge[]; // All edges in the conditional group
  allNodes: ReactFlowNode[];    // For possibleTargets selection
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
  // Extract condition from first edge in group (all share same condition)
  const currentCondition = edgeGroup?.[0]?.data?.condition;
  const currentTargets = edgeGroup?.[0]?.data?.possibleTargets || [];
  const sourceId = edgeGroup?.[0]?.source || '';

  // Form state
  const [conditionName, setConditionName] = useState('');
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [outputType, setOutputType] = useState('string');
  const [implementation, setImplementation] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Parameter editing state
  const [editingParam, setEditingParam] = useState<number | null>(null);
  const [paramForm, setParamForm] = useState<Parameter>({
    name: '',
    type: '',
    modelRef: '',
  });

  // Initialize form when modal opens or edgeGroup changes
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

  // Reset form
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
    // Validation
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

    // Build condition object
    const newCondition: ConditionalEdgeCondition = {
      name: conditionName.trim(),
      function: {
        parameters: parameters,
        output: outputType,
        implementation: implementation.trim(),
      },
      possibleTargets: selectedTargets,
    };

    // Validate using existing validation function
    const allNodeIds = allNodes.map((n) => n.id);
    const validation = validateConditionalEdge(newCondition, allNodeIds);

    if (!validation.valid) {
      setError(validation.error || 'Invalid configuration');
      return;
    }

    // Generate updated edges (one per selected target)
    const groupId = edgeGroup?.[0]?.data?.conditionalGroupId ||
                    `conditional-${sourceId}-${Date.now()}`;

    const updatedEdges: ReactFlowEdge[] = selectedTargets.map((target, index) => ({
      id: `${groupId}-${target}`,
      source: sourceId,
      target: target,
      type: 'smoothstep',
      animated: true,
      // Only show label on first edge
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

  // Parameter management
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
      // Edit existing
      newParameters[editingParam] = {
        name: paramForm.name.trim(),
        type: paramForm.type.trim(),
        modelRef: paramForm.modelRef?.trim() || undefined,
      };
    } else {
      // Add new
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

  // Target selection
  const handleToggleTarget = (nodeId: string) => {
    setSelectedTargets((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Available nodes for targets (all nodes + __end__)
  const availableTargets = [
    ...allNodes.map((n) => ({ id: n.id, name: n.data?.name || n.id })),
    { id: '__end__', name: '__end__' },
  ].filter((target) => target.id !== sourceId); // Exclude source node

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

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Error Message */}
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

          {/* Condition Name */}
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

          {/* Parameters Section */}
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

            {/* Parameter List */}
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

            {/* Parameter Edit Form */}
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

          {/* Output Type */}
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

          {/* Implementation */}
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

          {/* Possible Targets */}
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
```

#### Step 2: Integrate Modal into EdgeListEditor

**File**: `webview-ui/src/workflow-editor/settings/EdgeListEditor.tsx`

**Add import** (top of file):
```typescript
import { ConditionalEdgeFormModal } from './ConditionalEdgeFormModal';
```

**Add state** (inside component):
```typescript
const [showModal, setShowModal] = useState(false);
const [editingEdgeGroup, setEditingEdgeGroup] = useState<ReactFlowEdge[] | null>(null);
```

**Update Edit button** (replace alert with modal trigger):
```typescript
<button
  onClick={() => {
    setEditingEdgeGroup(group.edges);
    setShowModal(true);
  }}
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
```

**Add modal handler**:
```typescript
const handleSaveConditionalEdge = (updatedEdges: ReactFlowEdge[]) => {
  // Remove old edges in group
  const groupId = updatedEdges[0]?.data?.conditionalGroupId;
  const filteredEdges = edges.filter(
    (e) => e.data?.conditionalGroupId !== groupId
  );

  // Add updated edges
  onUpdateEdges([...filteredEdges, ...updatedEdges]);
  setShowModal(false);
  setEditingEdgeGroup(null);
};
```

**Add modal to render** (before closing div):
```typescript
<ConditionalEdgeFormModal
  show={showModal}
  edgeGroup={editingEdgeGroup || undefined}
  allNodes={nodes}
  onSave={handleSaveConditionalEdge}
  onCancel={() => {
    setShowModal(false);
    setEditingEdgeGroup(null);
  }}
/>
```

#### Step 3: Testing

**Test Procedure**:

1. **Open Modal**:
   ```
   1. Load client.json
   2. Open settings → Edges tab
   3. Click "Edit" on orchestrator conditional group
   4. Verify modal opens without errors
   ```

2. **Verify Form Pre-fill**:
   ```
   1. Check condition name shows "shouldContinue"
   2. Verify parameters listed (state: typeof AgentState.State)
   3. Verify output type shows "string"
   4. Verify implementation code populated
   5. Verify possibleTargets checked: tools, orchestrator, __end__
   ```

3. **Test Edit Condition Name**:
   ```
   1. Change name to "routingFunction"
   2. Click Save
   3. Verify edge label updates on canvas
   4. Verify name saved in JSON
   ```

4. **Test Edit Parameters**:
   ```
   1. Click "Edit" on existing parameter
   2. Change type to "any"
   3. Save parameter
   4. Click modal "Save"
   5. Reload workflow, verify parameter persisted
   ```

5. **Test Add/Remove Targets**:
   ```
   1. Uncheck "orchestrator" target
   2. Check "approval_handler" target
   3. Click Save
   4. Verify canvas now shows:
      - orchestrator → tools
      - orchestrator → __end__
      - orchestrator → approval_handler (new)
   5. Verify orchestrator → orchestrator edge removed
   ```

6. **Test Validation**:
   ```
   Test A: Empty condition name
   - Clear name field
   - Click Save
   - Verify error: "Condition name is required"

   Test B: No targets selected
   - Uncheck all targets
   - Click Save
   - Verify error: "At least one possible target must be selected"

   Test C: Invalid target (manually in JSON)
   - (Validation should catch in validateConditionalEdge)
   ```

7. **Test Cancel**:
   ```
   1. Make changes to form
   2. Click Cancel
   3. Verify modal closes
   4. Verify changes not saved
   5. Reopen modal
   6. Verify original values restored
   ```

### Visual Verification Checklist

After implementation, verify:

- [ ] Modal opens on Edit click
- [ ] All form sections render correctly
- [ ] Form pre-fills with current condition data
- [ ] Parameters can be added/edited/deleted
- [ ] Targets show as checkboxes with correct states
- [ ] Validation errors display clearly
- [ ] Save updates edges on canvas
- [ ] Save updates edge count in list
- [ ] Cancel discards changes
- [ ] ESC key closes modal (optional enhancement)
- [ ] Click outside modal closes it
- [ ] VSCode theme styling consistent

### Success Criteria

✅ Modal opens and displays current condition data
✅ All form fields editable
✅ Parameter add/edit/delete works
✅ Target multi-select works
✅ Validation prevents invalid configurations
✅ Save creates correct edge structure
✅ Changes immediately reflected on canvas
✅ Cancel discards changes
✅ Round-trip (edit-save-reload) preserves data

### Estimated Time: 4-5 hours
