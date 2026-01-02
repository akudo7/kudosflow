# Phase 2: VSCode Extension Updates

**Target Directory**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest`

**Prerequisites**: Phase 1 (SceneGraphManager) must be completed and tested

---

## Overview

After SceneGraphManager is updated, update the VSCode extension to match the new schema. This includes type definitions, converters, and UI components.

---

## 2.1 Type Definition Changes

### File: `webview-ui/src/workflow-editor/types/workflow.types.ts`

**Change at line 4-8** (Rename interface):

```typescript
// BEFORE
export interface A2AClientConfig {
  cardUrl: string;
  timeout: number;
  [key: string]: any;
}

// AFTER
export interface A2AServerConfig {
  cardUrl: string;
  timeout: number;
  [key: string]: any;
}
```

**Change at line 38** (WorkflowConfig):

```typescript
// BEFORE
export interface WorkflowConfig {
  config?: WorkflowConfigSettings;
  a2aClients?: Record<string, A2AClientConfig>;
  mcpServers?: Record<string, MCPServerConfig>;
  // ...
}

// AFTER
export interface WorkflowConfig {
  config?: WorkflowConfigSettings;
  a2aServers?: Record<string, A2AServerConfig>;  // Changed: a2aClients → a2aServers
  mcpServers?: Record<string, MCPServerConfig>;
  // ...
}
```

**Change at line 57** (WorkflowNode):

```typescript
// BEFORE
export interface WorkflowNode {
  id: string;
  type?: string;
  useA2AClients?: boolean;
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    implementation: string;
  };
  ends?: string[];
}

// AFTER
export interface WorkflowNode {
  id: string;
  type?: string;
  useA2AClients?: boolean;
  handler?: {  // Changed: function → handler
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    function: string;  // Changed: implementation → function
  };
  ends?: string[];
}
```

**Change at line 67** (ConditionalEdgeCondition):

```typescript
// BEFORE
export interface ConditionalEdgeCondition {
  name: string;
  function: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    implementation: string;
  };
}

// AFTER
export interface ConditionalEdgeCondition {
  name: string;
  handler: {  // Changed: function → handler
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    function: string;  // Changed: implementation → function
  };
}
```

**Change at line 103** (CustomNodeData):

```typescript
// BEFORE
export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  nodeType?: string;
  useA2AClients?: boolean;
  implementation?: string;
  parameters?: Array<{ name: string; type: string; modelRef?: string }>;
  ends?: string[];
  models?: ModelConfig[];
  onNodeNameChange?: (oldId: string, newId: string) => void;
}

// AFTER
export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  nodeType?: string;
  useA2AClients?: boolean;
  function?: string;  // Changed: implementation → function (kept flat for UI convenience)
  parameters?: Array<{ name: string; type: string; modelRef?: string }>;
  ends?: string[];
  models?: ModelConfig[];
  onNodeNameChange?: (oldId: string, newId: string) => void;
}
```

**Note**: CustomNodeData keeps `function` as a flat property (not `handler`) for UI convenience. The converter handles the mapping between `handler.function` (JSON) and `function` (UI data).

---

## 2.2 Converter Changes

### File: `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`

**Change at line 56** (Convert node data):

```typescript
// BEFORE
data: {
  label: node.id,
  nodeType: node.type,
  useA2AClients: node.useA2AClients,
  implementation: node.function?.implementation,
  parameters: node.function?.parameters,
  ends: node.ends,
}

// AFTER
data: {
  label: node.id,
  nodeType: node.type,
  useA2AClients: node.useA2AClients,
  function: node.handler?.function,  // Changed: function → handler, implementation → function
  parameters: node.handler?.parameters,  // Changed: function → handler
  ends: node.ends,
}
```

**Change at line 79** (Extract possibleTargets from condition):

```typescript
// BEFORE
if (edge.condition?.function?.implementation) {
  const extracted = extractPossibleTargets(edge.condition.function.implementation);
  // ...
}

// AFTER
if (edge.condition?.handler?.function) {  // Changed: function → handler, implementation → function
  const extracted = extractPossibleTargets(edge.condition.handler.function);
  // ...
}
```

---

### File: `webview-ui/src/workflow-editor/converters/flowToJson.ts`

**Change at line 38-43** (Convert node back to workflow format):

```typescript
// BEFORE
if (node.data.implementation !== undefined || node.data.parameters) {
  workflowNode.function = {
    parameters: node.data.parameters || [],
    implementation: node.data.implementation || '',
  };
}

// AFTER
if (node.data.function !== undefined || node.data.parameters) {
  workflowNode.handler = {  // Changed: function → handler
    parameters: node.data.parameters || [],
    function: node.data.function || '',  // Changed: implementation → function
  };
}
```

**Change at line 74-83** (Convert edge condition):

```typescript
// BEFORE
condition: edge.data.condition
  ? {
      ...edge.data.condition,
      function: edge.data.condition.function || {
        parameters: [],
        output: '',
        implementation: '',
      },
    }
  : undefined,

// AFTER
condition: edge.data.condition
  ? {
      ...edge.data.condition,
      handler: edge.data.condition.handler || {  // Changed: function → handler
        parameters: [],
        output: '',
        function: '',  // Changed: implementation → function
      },
    }
  : undefined,
```

---

## 2.3 UI Component Changes

Need to search and update all UI components that reference `implementation` or `a2aClients`.

### Search Patterns

```bash
# From the project root
cd /Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest

# Search for implementation references
grep -r "\.implementation" webview-ui/src --include="*.ts" --include="*.tsx"

# Search for a2aClients references
grep -r "a2aClients" webview-ui/src --include="*.ts" --include="*.tsx"

# Search for A2AClient references (type names)
grep -r "A2AClient" webview-ui/src --include="*.ts" --include="*.tsx"

# Search for function property in workflow contexts
grep -r "\.function\." webview-ui/src --include="*.ts" --include="*.tsx" | grep -v "arrow function"
```

### Likely Files to Update

- Node editor dialogs (where implementation code is edited)
- Configuration panels (where a2aClients are configured)
- Any form fields or text editors bound to these properties
- Type guard functions
- Validation logic

---

## 2.4 Build and Test

### Build Commands

```bash
# From project root
cd /Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest

# Install dependencies
yarn install

# Compile TypeScript for extension
yarn compile

# Build webview
yarn build:webview

# Run all builds
yarn install:all && yarn compile && yarn build:webview
```

### Testing Checklist

- [ ] TypeScript compilation succeeds without errors
- [ ] Load a JSON workflow file with old schema (should fail gracefully)
- [ ] Load a JSON workflow file with new schema (should work)
- [ ] Edit node implementation in UI
- [ ] Save workflow and verify JSON output has correct schema
- [ ] Edit conditional edge condition in UI
- [ ] Test a2aServers configuration panel (if exists)
- [ ] Run extension in development mode (F5)
- [ ] Verify no console errors in webview

---

## Notes

- Keep UI layer changes minimal - focus on data layer changes
- Test thoroughly with both old and new JSON formats during migration
- Consider adding schema version detection for better error messages
