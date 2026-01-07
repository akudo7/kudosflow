# Phase 3: Update SceneGraphManager Tests

## Overview

Update test files to use the new parameter format and add tests for parameter type validation.

## Test Files to Check

Location: `/Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager/src/__tests__/`

**Note**: If no test directory exists, this phase can be skipped or test files can be created.

---

## Update Existing Test Parameters

### Old Format

```typescript
const param = { name: "state", type: "typeof AgentState.State" };
```

### New Format

```typescript
const param = {
  name: "state",
  parameterType: "state" as const,
  stateType: "typeof AgentState.State"
};
```

### Model Parameter Example

```typescript
const modelParam = {
  name: "model",
  parameterType: "model" as const,
  modelRef: "gpt4"
};
```

---

## New Tests to Add

### Test 1: State Parameter Validation

```typescript
test('should accept valid state parameter', () => {
  const param = {
    name: "state",
    parameterType: "state" as const,
    stateType: "typeof AgentState.State"
  };
  // Test parameter is accepted
});
```

### Test 2: Model Parameter Validation

```typescript
test('should accept valid model parameter', () => {
  const param = {
    name: "model",
    parameterType: "model" as const,
    modelRef: "gpt4"
  };
  // Test parameter is accepted
});
```

### Test 3: Model Detection

```typescript
test('should detect model parameters correctly', () => {
  const parameters = [
    { name: "state", parameterType: "state" as const, stateType: "typeof AgentState.State" },
    { name: "model", parameterType: "model" as const, modelRef: "gpt4" }
  ];

  const modelParam = parameters.find(p => p.parameterType === "model");
  expect(modelParam).toBeDefined();
  expect(modelParam?.modelRef).toBe("gpt4");
});
```

### Test 4: Type Narrowing

```typescript
test('should narrow types correctly', () => {
  const param: NodeFunctionParameter = {
    name: "state",
    parameterType: "state" as const,
    stateType: "string"
  };

  if (param.parameterType === "state") {
    expect(param.stateType).toBe("string");
  }
});
```

---

## Integration Test Updates

### Workflow Execution Tests

If integration tests exist (e.g., `workflow.integration.test.ts`):

- Update workflow JSON fixtures to use new parameter format
- Test workflow execution with state parameters
- Test workflow execution with model parameters
- Test mixed parameter workflows

---

## Checklist

- [ ] Search for test files in `src/__tests__/` directory
- [ ] Update all mock parameter objects to new format
- [ ] Update all test workflow JSON files to new format
- [ ] Add new tests for parameter type validation
- [ ] Add tests for model parameter detection
- [ ] Add tests for TypeScript type narrowing
- [ ] Run test suite: `yarn test` (if available)
- [ ] Verify all tests pass
- [ ] Commit changes

---

**Previous Phase**: [phase2-scenegraphmanager-workflow.md](./phase2-scenegraphmanager-workflow.md)
**Next Phase**: [phase4-scenegraphmanager-docs.md](./phase4-scenegraphmanager-docs.md)
**Related Main Plan**: [parameter-format-migration.md](./parameter-format-migration.md)
