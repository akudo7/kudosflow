# Phase 0: Remove Legacy Format Support from KudosFlow

## Overview

Remove all legacy parameter format conversion logic from KudosFlow to enforce the new format exclusively.

## File to Update

**File**: `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`

---

## Change 1: Node Handler Parameters (Lines 61-86)

### Current Code

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

### New Code

```typescript
parameters: node.handler?.parameters || [],
```

---

## Change 2: Conditional Edge Parameters (Lines 141-165)

### Current Code

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

### New Code

```typescript
parameters: edge.condition.handler?.parameters || []
```

---

## Rationale

- Remove all legacy format conversion logic
- Expect only new format in JSON files
- Simplifies codebase and removes technical debt
- Files with legacy format will fail to load (intentional breaking change)

---

## Testing

- [ ] Test loading workflow with new format - should work
- [ ] Test loading workflow with legacy format - should fail with clear error
- [ ] Verify no TypeScript compilation errors

---

## Checklist

- [ ] Update line 61-86: Remove legacy conversion logic for node handler parameters
- [ ] Update line 141-165: Remove legacy conversion logic for conditional edge parameters
- [ ] Run `yarn build:webview` and verify no errors
- [ ] Test with sample workflow files
- [ ] Commit changes
- [ ] Push to repository

---

**Related Main Plan**: [parameter-format-migration.md](../parameter-format-migration.md)
