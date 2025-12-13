# Phase 9A: Editable Node Parameters and Output

**Status**: ⬜ 未開始
**Estimated Time**: 2-3 days
**Complexity**: Medium

## Overview

This phase makes node Parameters and Output editable in the WorkflowEditor, preparing the foundation for advanced features in subsequent Phase 9 sub-phases (A2A clients, ToolNode, Model binding).

## Implementation Goals

1. Make node Parameters editable (add, remove, modify)
2. Make node Output editable (add, remove key-value pairs)
3. Handle empty output case gracefully
4. Add validation for parameter names and output keys
5. Prepare infrastructure for Phase 9B-9E extensions

## Current Situation

### WorkflowNode.tsx Current State

**File**: `webview-ui/src/workflow-editor/WorkflowNode.tsx`

Currently displays three sections when expanded:
1. **Parameters** (lines 214-234): **Read-only** JSON display in `<pre>` tag
2. **Output** (lines 236-256): **Read-only** JSON display in `<pre>` tag
3. **Implementation** (lines 258-334): **Editable** via textarea with edit button ✓

### Data Structure

```typescript
interface WorkflowNode {
  id: string;
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    output: Record<string, string>;
    implementation: string;
  };
  ends?: string[];
}
```

**Important Note**: Empty output `{}` is valid - not all nodes return values.

## Architecture Decision

### Inline Editing Pattern

Follow the existing Implementation section pattern (lines 258-334):
- All editing happens directly in WorkflowNode.tsx
- Toggle between display/edit modes with edit button
- Direct mutation of nodeData for real-time updates
- No new modal components or separate editor files needed

## Implementation Tasks

### Task 1: Add Validation Functions ⬜

**File**: `webview-ui/src/workflow-editor/utils/validation.ts`

Add two new validation functions:

```typescript
export function validateParameterName(
  name: string,
  existingParameters: Array<{name: string}>,
  excludeIndex?: number
): ValidationResult {
  // Empty check
  if (!name || name.trim() === '') {
    return { valid: false, error: 'パラメータ名を入力してください' };
  }

  // Valid JS identifier check
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(name.trim())) {
    return { valid: false, error: '有効なJavaScript識別子である必要があります' };
  }

  // Reserved keywords check
  if (isReservedKeyword(name.trim())) {
    return { valid: false, error: `予約語 "${name.trim()}" は使用できません` };
  }

  // Uniqueness check
  const duplicates = existingParameters.filter((p, i) =>
    i !== excludeIndex && p.name === name.trim()
  ).length;
  if (duplicates > 0) {
    return { valid: false, error: 'パラメータ名が重複しています' };
  }

  return { valid: true };
}

export function validateOutputKey(
  key: string,
  existingOutput: Record<string, string>,
  excludeKey?: string
): ValidationResult {
  // Same pattern as validateParameterName
}
```

**Subtasks**:
- [ ] Implement `validateParameterName()` function
- [ ] Implement `validateOutputKey()` function
- [ ] Add unit tests for validation functions

### Task 2: Add State Variables to WorkflowNode.tsx ⬜

**File**: `webview-ui/src/workflow-editor/WorkflowNode.tsx`

Add new state variables after line 14:

```typescript
// Parameters editing state
const [isEditingParams, setIsEditingParams] = useState(false);
const [paramsValue, setParamsValue] = useState<Array<{name: string; type: string; modelRef?: string}>>(
  nodeData.parameters || []
);
const [paramsError, setParamsError] = useState<string | null>(null);

// Output editing state
const [isEditingOutput, setIsEditingOutput] = useState(false);
const [outputValue, setOutputValue] = useState<Array<{key: string; type: string}>>(
  Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v }))
);
const [outputError, setOutputError] = useState<string | null>(null);
```

**Subtasks**:
- [ ] Add parameters editing state variables
- [ ] Add output editing state variables
- [ ] Initialize state from nodeData

### Task 3: Implement Parameter Editor Section ⬜

**Replace lines 214-234** with inline parameter editor.

**Display Mode**:
```
Parameters (2)                    [✏️ 編集]
┌─────────────────────────────────────────┐
│ 1. state: typeof InterruptWorkflowState │
│ 2. config: ConfigType                    │
└─────────────────────────────────────────┘
```

**Edit Mode**:
```
Parameters (2)                    [✓ 完了]
┌─────────────────────────────────────────┐
│ Parameter 1                      [🗑️]   │
│ Name:  [state                        ]  │
│ Type:  [typeof InterruptWorkflowState]  │
│                                          │
│ Parameter 2                      [🗑️]   │
│ Name:  [config                       ]  │
│ Type:  [ConfigType                   ]  │
│                                          │
│                  [+ パラメータ追加]       │
└─────────────────────────────────────────┘
[Error message if validation fails]
```

**Subtasks**:
- [ ] Create display mode UI (numbered list)
- [ ] Create edit mode UI (input fields for each param)
- [ ] Add edit/done toggle button
- [ ] Add delete button for each parameter
- [ ] Add "Add Parameter" button
- [ ] Handle empty parameters case
- [ ] Implement parameter change handlers
- [ ] Add validation on save

### Task 4: Implement Output Editor Section ⬜

**Replace lines 236-256** with inline output editor.

**Display Mode** (with data):
```
Output (3)                        [✏️ 編集]
┌─────────────────────────────────────────┐
│ messages: string[]                       │
│ lastUserInput: string                    │
│ userApproval: null                       │
└─────────────────────────────────────────┘
```

**Display Mode** (empty):
```
Output (0)                        [✏️ 編集]
(出力なし)
```

**Edit Mode**:
```
Output (3)                        [✓ 完了]
┌─────────────────────────────────────────┐
│ Key        Type                  [🗑️]   │
│ [messages] [string[]                ]   │
│ [lastInput][string                  ]   │
│ [approval ][null                    ]   │
│                                          │
│                  [+ 出力追加]            │
└─────────────────────────────────────────┘
[Error message if validation fails]
```

**Subtasks**:
- [ ] Create display mode UI (key: type list)
- [ ] Create edit mode UI (input fields for key and type)
- [ ] Add edit/done toggle button
- [ ] Add delete button for each output entry
- [ ] Add "Add Output" button
- [ ] Handle empty output case gracefully
- [ ] Implement output change handlers
- [ ] Add validation on save

### Task 5: Add Event Handlers ⬜

**Parameter handlers**:
```typescript
const handleParamNameChange = (index: number, newName: string) => { ... };
const handleParamTypeChange = (index: number, newType: string) => { ... };
const handleAddParam = () => { ... };
const handleRemoveParam = (index: number) => { ... };
const handleParamsSave = () => { ... };
const handleParamsCancel = () => { ... };
```

**Output handlers**:
```typescript
const handleOutputKeyChange = (index: number, newKey: string) => { ... };
const handleOutputTypeChange = (index: number, newType: string) => { ... };
const handleAddOutput = () => { ... };
const handleRemoveOutput = (index: number) => { ... };
const handleOutputSave = () => { ... };
const handleOutputCancel = () => { ... };
```

**Subtasks**:
- [ ] Implement parameter change handlers
- [ ] Implement parameter add/remove handlers
- [ ] Implement parameter save/cancel handlers
- [ ] Implement output change handlers
- [ ] Implement output add/remove handlers
- [ ] Implement output save/cancel handlers
- [ ] Add Escape key support for cancel

### Task 6: Test Edge Cases ⬜

Test with existing JSON files:

**Basic functionality**:
- [ ] Load `json/test.json` and edit parameters
- [ ] Load `json/test.json` and edit output
- [ ] Save changes and verify JSON structure

**Edge cases**:
- [ ] Empty parameters array `[]` - shows "パラメータなし"
- [ ] Empty output object `{}` - shows "(出力なし)"
- [ ] Duplicate parameter names - shows validation error
- [ ] Invalid identifiers (spaces, special chars) - shows error
- [ ] Reserved keywords (const, let, function) - shows error
- [ ] Complex TypeScript types - preserves exactly as typed
- [ ] Multiple simultaneous edits (params + output + implementation)
- [ ] Escape key cancels edit mode
- [ ] Changes trigger dirty state for save detection

## UI Styling

Match Implementation section styling:

```typescript
// Colors from existing code
const colors = {
  background: '#1a1a1a',
  text: '#d8dee9',
  primary: '#4a9eff',
  border: '#555',
  error: '#ff6b6b',
  success: '#88c0d0',
};

// Edit button style
const editButtonStyle = {
  padding: '2px 8px',
  background: isEditing ? '#4a9eff' : '#555',
  color: '#fff',
  border: 'none',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 'bold',
};
```

## Files to Modify

1. **`webview-ui/src/workflow-editor/WorkflowNode.tsx`**
   - Add state variables
   - Replace Parameters section (lines 214-234)
   - Replace Output section (lines 236-256)
   - Add event handlers

2. **`webview-ui/src/workflow-editor/utils/validation.ts`**
   - Add `validateParameterName()` function
   - Add `validateOutputKey()` function

## Benefits for Phase 9B-9E

This phase provides foundation for:

- **Phase 9B (ToolNode)**: Can handle ToolNode-specific parameters
- **Phase 9C (Model Config)**: Parameter editor supports `modelRef` field
- **Phase 9D (MCP)**: Can extend to MCP-specific parameters
- **Phase 9E (UI Management)**: Consistent editing pattern across all features

## Success Criteria

- [x] Parameters are editable (add, remove, modify)
- [x] Output is editable (add, remove key-value pairs)
- [x] Empty output case handled gracefully
- [x] Validation prevents invalid identifiers
- [x] UI matches existing Implementation editor pattern
- [x] Changes are saved correctly to JSON
- [x] No impact on existing Phase 1-8 functionality
- [x] Prepares infrastructure for Phase 9B-9E

## Testing Checklist

- [ ] Load workflow with parameters - display correctly
- [ ] Edit parameter name - updates in real-time
- [ ] Edit parameter type - updates in real-time
- [ ] Add new parameter - appears in list
- [ ] Delete parameter - removes from list
- [ ] Duplicate parameter name - shows error
- [ ] Invalid identifier - shows error
- [ ] Load workflow with output - display correctly
- [ ] Edit output key - updates in real-time
- [ ] Edit output type - updates in real-time
- [ ] Add new output - appears in list
- [ ] Delete output - removes from list
- [ ] Empty output - shows "(出力なし)"
- [ ] Save workflow - parameters preserved
- [ ] Save workflow - output preserved
- [ ] Escape cancels edit mode
- [ ] Multiple edits work simultaneously

## Reference Files

- [EDITABLE_PARAMS_OUTPUT_PLAN.md](../../EDITABLE_PARAMS_OUTPUT_PLAN.md) - Original detailed plan
- [WorkflowNode.tsx](../../webview-ui/src/workflow-editor/WorkflowNode.tsx) - Main implementation file
- [validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts) - Validation functions
- [json/test.json](../../json/test.json) - Test data
