# Phase 1: SceneGraphManager Updates

**Target Repository**: `/Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager`

---

## Overview

SceneGraphManager は基盤レイヤーであり、最初に更新する必要があります。型定義と実行ロジックがここで定義されます。

---

## 1.1 Type Definition Changes

### File: `src/types/a2a.ts`

**Change at line 78**:

```typescript
// BEFORE
export interface A2AWorkflowConfig extends BaseWorkflowConfig {
  a2aClients?: A2AClientsConfig;
}

// AFTER
export interface A2AWorkflowConfig extends BaseWorkflowConfig {
  a2aServers?: A2AServersConfig;
}
```

**Related type rename**:

```typescript
// BEFORE
type A2AClientsConfig = Record<string, A2AClientConfig>;

// AFTER
type A2AServersConfig = Record<string, A2AServerConfig>;
```

**Interface rename**:

```typescript
// BEFORE
export interface A2AClientConfig {
  cardUrl: string;
  timeout?: number;
}

// AFTER
export interface A2AServerConfig {
  cardUrl: string;
  timeout?: number;
}
```

---

### File: `src/types/index.ts`

**Change at line 92** (NodeFunction interface):

```typescript
// BEFORE
export interface NodeFunction {
  parameters: NodeFunctionParameter[];
  output: Record<string, string> | CommandOutput;
  implementation: string;
}

// AFTER
export interface NodeFunction {
  parameters: NodeFunctionParameter[];
  output: Record<string, string> | CommandOutput;
  function: string;  // Renamed from 'implementation'
}
```

**Change at line 201** (ConditionalEdgeFunction interface):

```typescript
// BEFORE
export interface ConditionalEdgeFunction {
  parameters: ConditionalEdgeFunctionParameter[];
  implementation: string;
}

// AFTER
export interface ConditionalEdgeFunction {
  parameters: ConditionalEdgeFunctionParameter[];
  function: string;  // Renamed from 'implementation'
}
```

**NOTE**: The interface names remain `NodeFunction` and `ConditionalEdgeFunction`, but in the actual JSON/workflow config, the property name changes from `function` to `handler`.

---

## 1.2 Implementation Changes

### File: `src/lib/workflow.ts`

#### Changes for a2aClients → a2aServers (5 locations)

**1. Line 94 (Constructor)**:

```typescript
// BEFORE
if (this.config.a2aClients) {
  this.initializeA2AClients();
}

// AFTER
if (this.config.a2aServers) {
  this.initializeA2AServers();
}
```

**2. Line 176 (Method rename)**:

```typescript
// BEFORE
private async initializeA2AClients(): Promise<void> {
  if (this.config.a2aClients) {
    const result = await this.modelFactory.configureA2A(this.config.a2aClients);
    // ...
  }
}

// AFTER
private async initializeA2AServers(): Promise<void> {
  if (this.config.a2aServers) {
    const result = await this.modelFactory.configureA2A(this.config.a2aServers);
    // ...
  }
}
```

**3. Line 215 (initializeModels)**:

```typescript
// BEFORE
if (modelConfig.bindA2AClients && this.config.a2aClients) {
  // ...
}

// AFTER
if (modelConfig.bindA2AClients && this.config.a2aServers) {
  // ...
}
```

**4. Lines 600-603 (build method)**:

```typescript
// BEFORE
if (this.config.a2aClients) {
  console.log('A2A Clients:', Object.keys(this.config.a2aClients));
  await this.initializeA2AClients();
}

// AFTER
if (this.config.a2aServers) {
  console.log('A2A Servers:', Object.keys(this.config.a2aServers));
  await this.initializeA2AServers();
}
```

---

#### Changes for function → handler and implementation → function (4+ locations)

**5. Workflow node processing** - Change property name when reading config:

```typescript
// BEFORE
const nodeFunc = node.function;
if (nodeFunc && nodeFunc.implementation) {
  // process implementation
}

// AFTER
const nodeFunc = node.handler;  // Changed: function → handler
if (nodeFunc && nodeFunc.function) {  // Changed: implementation → function
  // process function
}
```

**6. Line 485 (buildNodeFunction)** - Update property access:

```typescript
// BEFORE
const asyncFunction = new Function(
  ...Object.keys(globalScope),
  `
  return (async () => {
    ${funcDef.implementation}
  })();
  `
);

// AFTER
const asyncFunction = new Function(
  ...Object.keys(globalScope),
  `
  return (async () => {
    ${funcDef.function}  // Changed: implementation → function
  })();
  `
);
```

**7. Conditional edge processing** - Change property name when reading config:

```typescript
// BEFORE
const conditionFunc = edge.condition?.function;
if (conditionFunc && conditionFunc.implementation) {
  // process implementation
}

// AFTER
const conditionFunc = edge.condition?.handler;  // Changed: function → handler
if (conditionFunc && conditionFunc.function) {  // Changed: implementation → function
  // process function
}
```

**8. Line 551 (buildConditionalFunction)** - Update property access:

```typescript
// BEFORE
const functionBody = `
const Send = __Send;
return (() => {
  ${funcDef.implementation}
})();
`;

// AFTER
const functionBody = `
const Send = __Send;
return (() => {
  ${funcDef.function}  // Changed: implementation → function
})();
`;
```

**Additional changes needed**:
- Search for all references to `.function` property in WorkflowNode and ConditionalEdge types
- Update to `.handler` throughout the workflow.ts file
- Update any validation or error messages that reference these property names

---

## Testing Checklist

- [ ] All TypeScript compilation errors resolved
- [ ] Unit tests updated for new property names
- [ ] Integration tests pass with new schema
- [ ] Backward compatibility warnings added (if applicable)
- [ ] Documentation strings updated

---

## Build Commands

```bash
# Navigate to SceneGraphManager
cd /Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

---

## Notes

- This is the foundation layer - must be completed before Phase 2
- Ensure all tests pass before proceeding
- Consider publishing a new major version after this change
