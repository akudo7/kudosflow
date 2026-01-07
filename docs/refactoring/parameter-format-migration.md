# Parameter Format Migration Plan

## Overview

This document outlines the refactoring plan to migrate from the legacy parameter format to the new parameter format across both KudosFlow (VSCode Extension) and SceneGraphManager (TypeScript Runtime).

**Migration Date**: TBD
**Impact**: Breaking change - requires coordinated updates to both projects
**Backward Compatibility**: No - New format only

---

## Format Comparison

### Legacy Format (Deprecated)

**State-type Parameter:**
```json
{
  "name": "state",
  "type": "typeof AgentState.State"
}
```

**Model-reference Parameter:**
```json
{
  "name": "model",
  "type": "string",
  "modelRef": "gpt4"
}
```

**Issues:**
- `type` field serves dual purposes (type annotation + ambiguous model reference indicator)
- No explicit distinction between state parameters and model parameters
- Confusing semantics when both `type` and `modelRef` are present

### New Format (Current)

**State-type Parameter:**
```json
{
  "name": "state",
  "parameterType": "state",
  "stateType": "typeof AgentState.State"
}
```

**Model-reference Parameter:**
```json
{
  "name": "model",
  "parameterType": "model",
  "modelRef": "gpt4"
}
```

**Benefits:**
- Explicit `parameterType` field distinguishes parameter categories ("state" | "model")
- Dedicated fields: `stateType` for state parameters, `modelRef` for model parameters
- Clear semantics with no ambiguity
- Better extensibility for future parameter types

---

## Affected Components

### 1. KudosFlow (VSCode Extension)

**Status**: ⏳ **PARTIALLY COMPLETED** - Legacy format support needs removal

**Completed Files (commits c00d536, 24f1fb1):**
- `webview-ui/src/workflow-editor/types/workflow.types.ts` - Type definitions updated to new format
- `webview-ui/src/workflow-editor/NodeEditorDialog.tsx` - UI updated with dropdown selector
- `webview-ui/src/workflow-editor/WorkflowEditor.tsx` - Pass stateAnnotationName prop
- `webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx` - UI updated with new parameter form
- `webview-ui/src/workflow-editor/converters/flowToJson.ts` - Export new format only
- `webview-ui/src/workflow-editor/utils/validation.ts` - Validation for new format

**Files Requiring Updates:**
- `webview-ui/src/workflow-editor/converters/jsonToFlow.ts` - **Remove legacy format support**

**Current State:**
- ✅ UI uses dropdown to select "State" or "Model" parameter type
- ✅ JSON output uses new format exclusively (parameterType, stateType, modelRef)
- ⚠️ JSON input still supports legacy format (lines 61-86, 141-165 in jsonToFlow.ts)
- ⚠️ Legacy conversion code needs to be removed

**Required Changes:**
Remove legacy format conversion logic and expect only new format on input.

### 2. SceneGraphManager (TypeScript Runtime)

**Status**: ⏳ **PENDING**

**Location**: `/Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager`

**Critical Files to Update:**

#### Type Definitions
- **File**: `src/types/index.ts`
- **Lines**: 82-86 (NodeFunctionParameter), 89-93 (NodeFunction), 198-203 (ConditionalEdgeFunction)
- **Action**: Update `NodeFunctionParameter` interface to new format only

#### Workflow Engine
- **File**: `src/lib/workflow.ts`
- **Line 501**: Model parameter detection logic (`funcDef.parameters.find((p: any) => p.modelRef)`)
- **Line 621**: Conditional edge parameter processing
- **Methods**: `buildNodeFunction` (lines 311-570), `buildConditionalFunction` (lines 616-659)
- **Action**: Update to use `parameterType` field for model detection

#### Documentation
- **File**: `CLAUDE.md`
- **Sections**: Configuration Reference (line 100+), Complete Configuration Schema (lines 246-298), Node Configuration Examples (lines 443-489), API Type Definitions (line 1064+)
- **Action**: Update all parameter examples and type documentation

- **File**: `README.md`
- **Lines**: 120-150 (Basic Workflow Example)
- **Action**: Update workflow examples

#### Auto-generated Files
- **File**: `dist/types/index.d.ts`
- **Action**: Will be auto-generated after TypeScript compilation (`yarn build`)

---

## Implementation Plan

### Step 0: Remove Legacy Format Support from KudosFlow

**File**: `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`

**Current Code (Lines 61-86) - Node Handler Parameters:**
```typescript
parameters: (node.handler?.parameters || []).map((param: any) => {
  // Handle legacy format (both type and modelRef fields)
  if (param.type && param.modelRef) {
    return {
      name: param.name,
      parameterType: "model" as const,
      modelRef: param.modelRef
    };
  }
  if (param.type && !param.parameterType) {
    return {
      name: param.name,
      parameterType: "state" as const,
      stateType: param.type
    };
  }
  if (param.modelRef && !param.parameterType) {
    return {
      name: param.name,
      parameterType: "model" as const,
      modelRef: param.modelRef
    };
  }
  // New format or handle existing new format
  return param;
}),
```

**New Code (Simplified):**
```typescript
parameters: node.handler?.parameters || [],
```

**Current Code (Lines 141-165) - Conditional Edge Parameters:**
```typescript
parameters: (edge.condition.handler?.parameters || []).map((param: any) => {
  // Handle legacy format for conditional edge parameters
  if (param.type && param.modelRef) {
    return {
      name: param.name,
      parameterType: "model" as const,
      modelRef: param.modelRef
    };
  }
  if (param.type && !param.parameterType) {
    return {
      name: param.name,
      parameterType: "state" as const,
      stateType: param.type
    };
  }
  if (param.modelRef && !param.parameterType) {
    return {
      name: param.name,
      parameterType: "model" as const,
      modelRef: param.modelRef
    };
  }
  return param;
})
```

**New Code (Simplified):**
```typescript
parameters: edge.condition.handler?.parameters || []
```

**Rationale:**
- Remove all legacy format conversion logic
- Expect only new format in JSON files
- Simplifies codebase and removes technical debt
- Files with legacy format will fail to load (intentional breaking change)

### Step 1: Update Type Definitions

**File**: `src/types/index.ts`

**Change from:**
```typescript
export interface NodeFunctionParameter {
  name: string;
  type: string;
  modelRef?: string;
}
```

**Change to:**
```typescript
export type NodeFunctionParameter =
  | {
      name: string;
      parameterType: "state";
      stateType: string;
    }
  | {
      name: string;
      parameterType: "model";
      modelRef: string;
    };
```

This uses a discriminated union to ensure type safety:
- When `parameterType` is "state", `stateType` is required
- When `parameterType` is "model", `modelRef` is required

### Step 2: Update Workflow Engine

**File**: `src/lib/workflow.ts`

**Line 501 - Model Detection (Change from):**
```typescript
const modelParam = funcDef.parameters.find((p: any) => p.modelRef);
```

**Change to:**
```typescript
const modelParam = funcDef.parameters.find((p) => p.parameterType === "model");
```

**Additional Changes:**
- Update any code that accesses `param.type` to use `param.stateType` for state parameters
- Update any code that checks for model parameters to use `param.parameterType === "model"`
- Ensure proper TypeScript type narrowing when accessing `stateType` or `modelRef`

### Step 3: Update Tests

**Action**: Update existing tests to use new parameter format

**Files to check:**
- Any test files that create mock parameters
- Any test files that validate parameter structures

**Example update:**
```typescript
// Old
const param = { name: "state", type: "typeof AgentState.State" };

// New
const param = { name: "state", parameterType: "state", stateType: "typeof AgentState.State" };
```

### Step 4: Update Documentation

**File**: `CLAUDE.md`

Update all parameter examples throughout the document:
- Configuration Schema section
- Node Configuration Examples
- API Type Definitions
- Any code snippets showing parameter usage

**File**: `README.md`

Update workflow examples to show new parameter format.

### Step 5: Build and Test

```bash
cd /Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager
yarn build
# Run tests if available
# Manual testing with sample workflows
```

### Step 6: Update Existing JSON Files

**Manual Migration Required:**

Existing workflow JSON files must be updated. Users have two options:

**Option A: Use KudosFlow (Recommended)**
1. Open each workflow JSON file in KudosFlow VSCode extension
2. The file will be automatically converted to new format on load
3. Save the file - it will now use the new format

**Option B: Manual JSON Editing**

Find all parameters in workflow JSON files and update:

```json
// Old format
"parameters": [
  { "name": "state", "type": "typeof AgentState.State" }
]

// New format
"parameters": [
  { "name": "state", "parameterType": "state", "stateType": "typeof AgentState.State" }
]
```

```json
// Old format
"parameters": [
  { "name": "model", "type": "string", "modelRef": "gpt4" }
]

// New format
"parameters": [
  { "name": "model", "parameterType": "model", "modelRef": "gpt4" }
]
```

---

## Testing Strategy

### Unit Tests
- Test parameter type validation
- Test model parameter detection
- Test state parameter handling
- Test TypeScript type narrowing

### Integration Tests
- **File**: `src/__tests__/workflow.integration.test.ts` (if exists)
- Test workflow execution with new format parameters
- Test node function building with state parameters
- Test node function building with model parameters
- Test conditional edge functions with parameters

### End-to-End Tests
1. Create workflow in KudosFlow with new format
2. Load workflow in SceneGraphManager
3. Execute workflow successfully
4. Verify parameter injection works correctly for both state and model parameters

### Manual Testing Checklist
- [ ] Load and execute workflow with state-only parameters
- [ ] Load and execute workflow with model-only parameters
- [ ] Load and execute workflow with mixed parameters
- [ ] Verify model injection works correctly
- [ ] Verify conditional edges with parameters work correctly
- [ ] Test error messages for invalid parameter formats

---

## Risk Assessment

### High Risk
- **Breaking existing workflows**: All workflows with legacy format will fail
- **Model injection failure**: Critical for workflows using model parameters

**Mitigation:**
- Clear documentation on migration process
- KudosFlow provides automatic conversion on load
- Thorough testing before release

### Medium Risk
- **Documentation inconsistency**: Docs must be completely updated
- **User confusion**: Breaking change requires clear communication

**Mitigation:**
- Comprehensive documentation update
- Clear migration guide
- Version bump with breaking change indicator

### Low Risk
- **Type compilation errors**: TypeScript will catch most issues
- **Performance impact**: No performance change expected

---

## Success Criteria

- ✅ All type definitions updated
- ✅ Workflow engine handles new format correctly
- ✅ Model detection and injection works
- ✅ All tests pass
- ✅ Documentation completely updated
- ✅ No TypeScript compilation errors
- ✅ Manual testing successful for all parameter types

---

## Code Locations Reference

### KudosFlow (Already Updated)
```
webview-ui/src/workflow-editor/
├── types/workflow.types.ts (lines 54-69, 69-76, 113-120)
├── NodeEditorDialog.tsx (parameter editing UI)
├── WorkflowEditor.tsx (node creation with new defaults)
├── settings/ConditionalEdgeFormModal.tsx (conditional edge parameters)
├── converters/
│   ├── flowToJson.ts (exports new format only)
│   └── jsonToFlow.ts (imports both formats, auto-converts legacy)
└── utils/validation.ts (validates new format)
```

### SceneGraphManager (To Be Updated)
```
SceneGraphManager/
├── src/
│   ├── types/index.ts (lines 82-86, 89-93, 198-203)
│   └── lib/
│       └── workflow.ts (lines 501, 621, 311-570, 616-659)
├── CLAUDE.md (multiple sections)
├── README.md (lines 120-150)
└── dist/types/index.d.ts (auto-generated)
```

---

## Implementation Checklist

### KudosFlow Updates (Step 0)

- [ ] **Remove Legacy Format Support**
  - [ ] Update `webview-ui/src/workflow-editor/converters/jsonToFlow.ts` line 61-86
    - Remove legacy conversion logic for node handler parameters
    - Change to: `parameters: node.handler?.parameters || [],`
  - [ ] Update `webview-ui/src/workflow-editor/converters/jsonToFlow.ts` line 141-165
    - Remove legacy conversion logic for conditional edge parameters
    - Change to: `parameters: edge.condition.handler?.parameters || []`
  - [ ] Test loading workflow with new format
  - [ ] Verify legacy format files now fail with clear error
  - [ ] Commit changes
  - [ ] Push to repository

### SceneGraphManager Updates

- [ ] **Phase 1: Code Changes**
  - [ ] Update `src/types/index.ts` - Change `NodeFunctionParameter` to discriminated union
  - [ ] Update `src/lib/workflow.ts` line 501 - Model detection logic
  - [ ] Update `src/lib/workflow.ts` - Any other parameter type references
  - [ ] Search codebase for `param.type` usage and update to `param.stateType`

- [ ] **Phase 2: Testing**
  - [ ] Update existing test files to use new parameter format
  - [ ] Add new tests for parameter type validation
  - [ ] Run `yarn build` and verify no TypeScript errors
  - [ ] Manual testing with sample workflows

- [ ] **Phase 3: Documentation**
  - [ ] Update `CLAUDE.md` - All parameter examples
  - [ ] Update `README.md` - Workflow examples
  - [ ] Create migration guide section in docs
  - [ ] Update inline code comments if needed

- [ ] **Phase 4: JSON File Migration**
  - [ ] Identify all workflow JSON files in use
  - [ ] Manually convert each JSON file to new format (Step 6 instructions)
  - [ ] Verify conversions are correct
  - [ ] Test workflows in SceneGraphManager

- [ ] **Phase 5: Release**
  - [ ] Version bump (major version - breaking change) for both projects
  - [ ] Update CHANGELOG.md for both projects
  - [ ] Create release notes with migration instructions
  - [ ] Tag releases in git

---

## Related Commits

### KudosFlow
- `c00d536` - Improve parameter type system with state and model distinction
- `24f1fb1` - Update JSON format to use new parameter structure
- TBD - Remove legacy format support from jsonToFlow converter (pending after /clear)

### SceneGraphManager
- TBD (pending implementation)

---

## Next Actions

1. **Review this plan** and confirm approach
2. **Remove legacy support from KudosFlow** (Step 0 - after /clear)
   - Update jsonToFlow.ts to remove conversion logic
   - Test and commit changes
3. **Begin implementation in SceneGraphManager** (Step 1-5)
   - Update type definitions
   - Update workflow engine
   - Update documentation
4. **Migrate all JSON files** to new format manually
5. **Test thoroughly** with real workflows
6. **Release both projects** with major version bump and coordinated release notes

---

## Complete Type Definition

```typescript
// src/types/index.ts - Final version
export type NodeFunctionParameter =
  | {
      name: string;
      parameterType: "state";
      stateType: string;
    }
  | {
      name: string;
      parameterType: "model";
      modelRef: string;
    };

export interface NodeFunction {
  parameters: NodeFunctionParameter[];
  output: Record<string, string> | CommandOutput;
  function: string;
}

export interface ConditionalEdgeFunction {
  parameters: NodeFunctionParameter[];
  output: string;
  function: string;
  schema?: string;
}
```

---

**Document Version**: 2.0
**Last Updated**: 2026-01-07
**Author**: Claude Sonnet 4.5 (via KudosFlow)
