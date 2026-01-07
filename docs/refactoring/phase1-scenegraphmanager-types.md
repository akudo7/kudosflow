# Phase 1: Update SceneGraphManager Type Definitions

## Overview

Update TypeScript type definitions in SceneGraphManager to use the new parameter format with discriminated unions.

## File to Update

**File**: `src/types/index.ts` (SceneGraphManager project)
**Location**: `/Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager`

---

## Change: NodeFunctionParameter Interface

### Current Code (Lines 82-86)

```typescript
export interface NodeFunctionParameter {
  name: string;
  type: string;
  modelRef?: string;
}
```

### New Code

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

---

## Benefits of Discriminated Union

- **Type Safety**: TypeScript can narrow the type based on `parameterType`
- **Required Fields**: `stateType` required for state params, `modelRef` required for model params
- **Clear Intent**: No ambiguity about which fields should be present

---

## Impact on Related Interfaces

### NodeFunction (Lines 89-93)

```typescript
export interface NodeFunction {
  parameters: NodeFunctionParameter[];  // Type automatically updated
  output: Record<string, string> | CommandOutput;
  function: string;
}
```

### ConditionalEdgeFunction (Lines 198-203)

```typescript
export interface ConditionalEdgeFunction {
  parameters: NodeFunctionParameter[];  // Type automatically updated
  output: string;
  function: string;
  schema?: string;
}
```

---

## Checklist

- [ ] Update `NodeFunctionParameter` from interface to discriminated union type
- [ ] Verify `NodeFunction` interface references the updated type
- [ ] Verify `ConditionalEdgeFunction` interface references the updated type
- [ ] Run `yarn build` and check for TypeScript errors
- [ ] Fix any compilation errors in dependent code
- [ ] Commit changes

---

**Next Phase**: [phase2-scenegraphmanager-workflow.md](./phase2-scenegraphmanager-workflow.md)
**Related Main Plan**: [parameter-format-migration.md](./parameter-format-migration.md)
