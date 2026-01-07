# Phase 2: Update SceneGraphManager Workflow Engine

## Overview

Update the workflow engine to use the new parameter format for model detection and parameter processing.

## File to Update

**File**: `src/lib/workflow.ts` (SceneGraphManager project)
**Location**: `/Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager`

---

## Change 1: Model Detection (Line 501)

### Current Code

```typescript
const modelParam = funcDef.parameters.find((p: any) => p.modelRef);
```

### New Code

```typescript
const modelParam = funcDef.parameters.find((p) => p.parameterType === "model");
```

### Context

This is in the `buildNodeFunction` method (lines 311-570) which processes node handlers and injects models based on parameter definitions.

---

## Change 2: Accessing Model Reference

### After finding modelParam

```typescript
// TypeScript now knows modelParam has parameterType === "model"
if (modelParam) {
  const modelId = modelParam.modelRef;  // Type-safe access
  // ... inject model
}
```

---

## Change 3: Conditional Edge Parameter Processing (Line 621)

Located in the `buildConditionalFunction` method (lines 616-659).

### Review Required

Check if this line accesses parameter properties that need updating:

```typescript
const paramDefs = funcDef.parameters.map((p) => p.name).join(", ");
```

This should continue to work as-is since we're only accessing the `name` field.

---

## Additional Changes

### Search for param.type Usage

Search the codebase for any code that accesses `param.type`:

```bash
cd /Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager
grep -n "param\.type" src/lib/workflow.ts
```

Update any found instances to use proper type narrowing:

```typescript
// Before
const paramType = param.type;

// After
if (param.parameterType === "state") {
  const paramType = param.stateType;
} else {
  // param.parameterType === "model"
  // No direct type field for model params
}
```

---

## Type Narrowing Pattern

When working with the discriminated union:

```typescript
funcDef.parameters.forEach((param) => {
  if (param.parameterType === "state") {
    // TypeScript knows param.stateType is available
    console.log(param.stateType);
  } else {
    // TypeScript knows param.modelRef is available
    console.log(param.modelRef);
  }
});
```

---

## Checklist

- [ ] Update line 501: Change model detection to use `parameterType === "model"`
- [ ] Search for all `param.type` references and update
- [ ] Search for all `param.modelRef` checks and update
- [ ] Ensure proper TypeScript type narrowing is used
- [ ] Run `yarn build` and fix any TypeScript errors
- [ ] Review `buildNodeFunction` method (lines 311-570)
- [ ] Review `buildConditionalFunction` method (lines 616-659)
- [ ] Commit changes

---

**Previous Phase**: [phase1-scenegraphmanager-types.md](./phase1-scenegraphmanager-types.md)
**Next Phase**: [phase3-scenegraphmanager-tests.md](./phase3-scenegraphmanager-tests.md)
**Related Main Plan**: [parameter-format-migration.md](./parameter-format-migration.md)
