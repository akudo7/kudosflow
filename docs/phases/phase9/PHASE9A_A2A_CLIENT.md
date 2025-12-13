# Phase 9A: Type Definitions and A2A Client Configuration

**Status**: ⬜ 未開始
**Estimated Time**: 2-3 days
**Complexity**: Medium

## Implementation Goals

1. Extend TypeScript type definitions to support A2A clients
2. Update JSON converters to preserve A2A client data
3. Add basic validation for A2A configurations

## Key Features

### 1. A2A Client Type Definition

Add support for `a2aClients` in WorkflowConfig:

```json
"a2aClients": {
  "task_agent": {
    "cardUrl": "http://localhost:3001/.well-known/agent.json",
    "timeout": 30000
  },
  "research_agent": {
    "cardUrl": "http://localhost:3002/.well-known/agent.json",
    "timeout": 30000
  }
}
```

### 2. Type Extensions Needed

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

```typescript
// New interface
export interface A2AClientConfig {
  cardUrl: string;      // Agent card endpoint URL
  timeout: number;       // Request timeout in milliseconds
  [key: string]: any;   // Allow additional properties
}

// Extend WorkflowConfig
export interface WorkflowConfig {
  config?: WorkflowConfigSettings;  // Enhanced type (see below)
  a2aClients?: Record<string, A2AClientConfig>;  // NEW
  stateAnnotation: {
    name: string;
    type: "Annotation.Root";
  };
  annotation: Record<string, AnnotationField>;
  models?: ModelConfig[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stateGraph: any;
}

// Enhanced config type
export interface WorkflowConfigSettings {
  recursionLimit?: number;
  eventEmitter?: {
    defaultMaxListeners?: number;
  };
  [key: string]: any;
}
```

## File Structure

### New/Modified Files

```
webview-ui/src/workflow-editor/
├── types/
│   └── workflow.types.ts              # MODIFY: Add A2AClientConfig, enhance types
├── utils/
│   ├── jsonToFlow.ts                  # MODIFY: Preserve a2aClients in conversion
│   ├── flowToJson.ts                  # MODIFY: Include a2aClients in output
│   └── validation.ts                  # MODIFY: Add validateA2AClient()
```

## Implementation Tasks

- [ ] Define `A2AClientConfig` interface in `workflow.types.ts`
- [ ] Add `a2aClients?: Record<string, A2AClientConfig>` to `WorkflowConfig`
- [ ] Enhance `config` type to `WorkflowConfigSettings`
- [ ] Update `jsonToFlow.ts` to preserve a2aClients data
- [ ] Update `flowToJson.ts` to include a2aClients in output
- [ ] Add `validateA2AClient()` function in `validation.ts`
  - Check cardUrl format (valid URL)
  - Check timeout is positive number
- [ ] Test: Load research/main.json and verify a2aClients are preserved

## Validation Strategy

### A2A Client Validation

```typescript
validateA2AClient(client: A2AClientConfig): ValidationResult {
  // Check cardUrl is valid URL
  // Check timeout is positive number
  // Check URL format matches agent.json pattern
}
```

## Testing

### Phase 9A Tests

- [ ] Load research/main.json - verify a2aClients preserved
- [ ] Save workflow - verify a2aClients included
- [ ] Validate A2A client with invalid URL - verify error

## Success Criteria

- ✓ A2A clients load from JSON
- ✓ A2A clients save to JSON
- ✓ Type definitions complete
- ✓ Validation functions work

## Key Files Reference

### Type Definitions
- [workflow.types.ts](../../webview-ui/src/workflow-editor/types/workflow.types.ts)

### Converters
- [jsonToFlow.ts](../../webview-ui/src/workflow-editor/utils/jsonToFlow.ts)
- [flowToJson.ts](../../webview-ui/src/workflow-editor/utils/flowToJson.ts)

### Settings Components
- [validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts)

### Example Data
- [research/main.json](../../json/research/main.json) - A2A Client example
