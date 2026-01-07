# Refactoring Plan: Parameters Type Selection

## Overview

Refactor the Parameters section in the Node Editor to use a dropdown for selecting between "state" or "model" parameter types, showing only the relevant input field based on the selection.

## Current Issues

1. Both "Type" and "Model Reference" fields are shown simultaneously for every parameter
2. "Type" is a text input showing values like "typeof AgentState.State" which is confusing
3. The distinction between state-based and model-based parameters is unclear
4. Users must manually type "typeof AgentState.State" instead of selecting from clear options

## Proposed Solution

Replace the separate "Type" and "Model Reference" fields with:

1. A **Type dropdown** with options: "state" or "model"
2. Conditionally show either:
   - **State Type input** (when Type = "state") - for entering "typeof AgentState.State", "string", "number", etc.
   - **Model Reference dropdown** (when Type = "model") - for selecting from available models

## Files to Modify

### 1. Type Definitions

**File:** [webview-ui/src/workflow-editor/types/workflow.types.ts](webview-ui/src/workflow-editor/types/workflow.types.ts)

Current structure (lines 57, 67, 106):

```typescript
parameters: Array<{ name: string; type: string; modelRef?: string }>
```

**Changes:**

Update parameter structure to:

```typescript
parameters: Array<{
  name: string;
  parameterType: "state" | "model";  // New: mutually exclusive selector
  stateType?: string;                 // When parameterType === "state"
  modelRef?: string;                  // When parameterType === "model"
}>
```

### 2. Node Editor Dialog Component

**File:** [webview-ui/src/workflow-editor/NodeEditorDialog.tsx](webview-ui/src/workflow-editor/NodeEditorDialog.tsx)

**Current implementation (lines 240-386):**

- Parameters section with Name, Type (text input), and Model Reference (dropdown)
- Handlers at lines 71-100

**Required changes:**

#### A. Update State (line 47 area)

```typescript
const [parameters, setParameters] = useState<Array<{
  name: string;
  parameterType: "state" | "model";
  stateType?: string;
  modelRef?: string;
}>>(nodeData?.handler?.parameters || []);
```

#### B. Add New Handler

```typescript
const handleParamTypeToggle = (index: number, newType: "state" | "model") => {
  const updated = [...parameters];
  updated[index] = {
    ...updated[index],
    parameterType: newType,
    // Clear the other field
    ...(newType === "state" ? { modelRef: undefined } : { stateType: undefined })
  };
  setParameters(updated);
};
```

#### C. Update Existing Handlers

- `handleParamTypeChange` → rename to `handleParamStateTypeChange`
- `handleParamModelRefChange` → keep as is
- `handleAddParam` → set default parameterType to "state"

#### D. Update UI (lines 305-377)

Replace the current three-field layout with:

1. **Name field** (keep as is, lines 305-326)

2. **Type dropdown** (new, replaces lines 327-348):

```typescript
<div className="form-group">
  <label htmlFor={`param-type-${index}`}>Type:</label>
  <select
    id={`param-type-${index}`}
    value={param.parameterType}
    onChange={(e) => handleParamTypeToggle(index, e.target.value as "state" | "model")}
    className="text-input"
  >
    <option value="state">State</option>
    <option value="model">Model</option>
  </select>
</div>
```

3. **Conditional field** (replaces lines 349-377):

```typescript
{param.parameterType === "state" ? (
  <div className="form-group">
    <label htmlFor={`param-state-type-${index}`}>State Type:</label>
    <input
      type="text"
      id={`param-state-type-${index}`}
      value={param.stateType || ""}
      onChange={(e) => handleParamStateTypeChange(index, e.target.value)}
      placeholder="e.g., typeof AgentState.State, string, number"
      className="text-input"
    />
  </div>
) : (
  <div className="form-group">
    <label htmlFor={`param-model-ref-${index}`}>Model Reference:</label>
    <select
      id={`param-model-ref-${index}`}
      value={param.modelRef || ""}
      onChange={(e) => handleParamModelRefChange(index, e.target.value)}
      className="text-input"
    >
      <option value="">None</option>
      {nodeData?.models?.map((model: any) => (
        <option key={model.name} value={model.name}>
          {model.label || model.name}
        </option>
      ))}
    </select>
  </div>
)}
```

### 3. Conditional Edge Form Modal

**File:** [webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx](webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx)

**Current implementation (lines 18-22, 319-373):**

- Similar parameter structure with inline edit/delete buttons

**Required changes:**

Apply the same pattern as NodeEditorDialog.tsx:

- Update parameter type definition
- Add parameterType dropdown
- Conditionally render stateType input or modelRef dropdown
- Update handlers accordingly

### 4. Data Conversion Utilities

#### A. JSON to Flow Converter

**File:** [webview-ui/src/workflow-editor/utils/jsonToFlow.ts](webview-ui/src/workflow-editor/utils/jsonToFlow.ts)

**Current implementation (lines 56-64):**

```typescript
parameters: handler.parameters || []
```

**Required changes (migration logic):**

```typescript
parameters: (handler.parameters || []).map((param: any) => {
  // Handle legacy format (both type and modelRef fields)
  if (param.type && param.modelRef) {
    return {
      name: param.name,
      parameterType: "model" as const,
      modelRef: param.modelRef
    };
  }
  if (param.type) {
    return {
      name: param.name,
      parameterType: "state" as const,
      stateType: param.type
    };
  }
  if (param.modelRef) {
    return {
      name: param.name,
      parameterType: "model" as const,
      modelRef: param.modelRef
    };
  }
  // New format or handle existing new format
  return param;
})
```

#### B. Flow to JSON Converter

**File:** [webview-ui/src/workflow-editor/utils/flowToJson.ts](webview-ui/src/workflow-editor/utils/flowToJson.ts)

**Current implementation (lines 38-43):**

```typescript
parameters: nodeData.handler.parameters
```

**Required changes:**

```typescript
parameters: (nodeData.handler.parameters || []).map((param: any) => ({
  name: param.name,
  ...(param.parameterType === "state"
    ? { type: param.stateType }
    : { modelRef: param.modelRef })
}))
```

This ensures backward compatibility by saving in a format that works with the existing JSON schema.

### 5. Validation

**File:** [webview-ui/src/workflow-editor/utils/validation.ts](webview-ui/src/workflow-editor/utils/validation.ts)

**Current implementation (lines 165-209):**

- validateParameterName only

**Required changes:**

Add parameter type validation:

```typescript
export function validateParameter(
  param: { name: string; parameterType: "state" | "model"; stateType?: string; modelRef?: string },
  allParams: any[],
  index: number
): string | null {
  // Validate name
  const nameError = validateParameterName(param.name, allParams, index);
  if (nameError) return nameError;

  // Validate parameterType
  if (!param.parameterType || (param.parameterType !== "state" && param.parameterType !== "model")) {
    return "Parameter type must be either 'state' or 'model'";
  }

  // Validate state type is provided when parameterType is "state"
  if (param.parameterType === "state" && (!param.stateType || param.stateType.trim() === "")) {
    return "State type is required when parameter type is 'state'";
  }

  // Validate model reference is provided when parameterType is "model"
  if (param.parameterType === "model" && (!param.modelRef || param.modelRef.trim() === "")) {
    return "Model reference is required when parameter type is 'model'";
  }

  return null;
}
```

Call this function in NodeEditorDialog and ConditionalEdgeFormModal when saving.

## Implementation Steps

1. **Update type definitions** (workflow.types.ts)
   - Change parameter structure to include parameterType, stateType, modelRef

2. **Update NodeEditorDialog.tsx**
   - Update state type
   - Add handleParamTypeToggle handler
   - Rename handleParamTypeChange to handleParamStateTypeChange
   - Replace UI with Type dropdown and conditional fields
   - Update handleAddParam to set default parameterType

3. **Update ConditionalEdgeFormModal.tsx**
   - Apply same changes as NodeEditorDialog

4. **Update data converters**
   - Add migration logic in jsonToFlow.ts
   - Update flowToJson.ts to save in compatible format

5. **Add validation**
   - Implement validateParameter function
   - Integrate validation in save handlers

6. **Test the changes**
   - Create new parameters with both types
   - Load existing workflows with old parameter format
   - Verify migration works correctly
   - Test switching between state and model types
   - Verify validation errors display correctly

## Migration Strategy

The refactoring maintains backward compatibility:

- Old format: `{ name, type, modelRef? }`
- New format: `{ name, parameterType, stateType?, modelRef? }`

Migration happens automatically when loading workflows:

- If only `type` exists → convert to `parameterType: "state"` with `stateType: type`
- If only `modelRef` exists → convert to `parameterType: "model"` with `modelRef: modelRef`
- If both exist → prefer model (convert to `parameterType: "model"`)

When saving, convert back to old format to maintain compatibility with existing JSON schemas.

## Expected Outcome

After this refactoring:

1. Users see a clear "Type" dropdown with "state" and "model" options
2. Only one input field is shown at a time based on the Type selection
3. No confusion between Type and Model Reference fields
4. Existing workflows continue to work through automatic migration
5. The UI is cleaner and more intuitive
