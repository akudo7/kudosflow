# Phase 9B: ToolNode Support and Conditional Edge Enhancements

**Status**: ⬜ 未開始
**Estimated Time**: 3-4 days
**Complexity**: High

## Implementation Goals

1. Add support for `ToolNode` node type
2. Enhance conditional edge type definitions
3. Create UI components for ToolNode
4. Improve conditional edge visualization

## Key Features

### 1. ToolNode Type Support

From `json/research/main.json` line 92-96:

```json
{
  "id": "tools",
  "type": "ToolNode",
  "useA2AClients": true
}
```

**Characteristics:**
- No `function` property (unlike regular nodes)
- Has `type: "ToolNode"` field
- Has `useA2AClients: boolean` flag
- Represents tool execution orchestration node

### 2. Conditional Edge Enhancement

From `json/research/main.json` line 132-148:

```json
{
  "type": "conditional",
  "from": "orchestrator",
  "condition": {
    "name": "shouldContinue",
    "function": {
      "parameters": [...],
      "output": "string",
      "implementation": "..."
    },
    "possibleTargets": ["tools", "orchestrator", "__end__"]
  }
}
```

## Type Extensions

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

```typescript
// Enhanced WorkflowNode to support ToolNode
export interface WorkflowNode {
  id: string;
  type?: string;  // NEW: "ToolNode" or undefined (function node)
  useA2AClients?: boolean;  // NEW: For ToolNode
  function?: {
    parameters: Array<{
      name: string;
      type: string;
      modelRef?: string;
    }>;
    output: Record<string, string> | string;  // Can be string for conditional
    implementation: string;
  };
  ends?: string[];
}

// Enhanced ConditionalEdge support
export interface ConditionalEdgeCondition {
  name: string;
  function: {
    parameters: Array<{ name: string; type: string }>;
    output: string;  // Target node ID
    implementation: string;
  };
  possibleTargets?: string[];
}

export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: ConditionalEdgeCondition;  // Enhanced type
}
```

## File Structure

### New Files

```
webview-ui/src/workflow-editor/
├── components/
│   └── ToolNode.tsx                   # NEW: ToolNode visualization component
```

### Modified Files

```
webview-ui/src/workflow-editor/
├── types/
│   └── workflow.types.ts              # MODIFY: Add ToolNode types, ConditionalEdgeCondition
├── WorkflowEditor.tsx                 # MODIFY: Register ToolNode component
├── utils/
│   ├── jsonToFlow.ts                  # MODIFY: Handle ToolNode conversion
│   ├── flowToJson.ts                  # MODIFY: Handle ToolNode serialization
│   └── validation.ts                  # MODIFY: Add validateToolNode(), validateConditionalEdge()
```

## UI Design for ToolNode

```
┌─────────────────────────────────┐
│ 🛠️ tools (ToolNode)              │
├─────────────────────────────────┤
│ Type: ToolNode                  │
│ A2A Clients: ✓ Enabled          │
│                                 │
│ [このノードはツールコールを      │
│  オーケストレートします]         │
└─────────────────────────────────┘
```

## Implementation Tasks

- [ ] Add `type?: string` and `useA2AClients?: boolean` to `WorkflowNode`
- [ ] Define `ConditionalEdgeCondition` interface
- [ ] Update `WorkflowEdge.condition` to use `ConditionalEdgeCondition`
- [ ] Create `ToolNode.tsx` component
  - Display ToolNode badge
  - Show useA2AClients status
  - Different styling from function nodes
- [ ] Update `WorkflowEditor.tsx` to register ToolNode component
- [ ] Update `jsonToFlow.ts`:
  - Detect `type: "ToolNode"` and create ToolNode
  - Preserve `useA2AClients` in node data
  - Handle conditional edge with possibleTargets
- [ ] Update `flowToJson.ts`:
  - Serialize ToolNode with type and useA2AClients
  - Include possibleTargets in conditional edges
- [ ] Add `validateToolNode()` in validation.ts
- [ ] Add `validateConditionalEdge()` in validation.ts
- [ ] Test: Load research/main.json and verify ToolNode displays correctly

## Validation Strategy

### ToolNode Validation

```typescript
validateToolNode(node: WorkflowNode): ValidationResult {
  // Check type === "ToolNode"
  // Check useA2AClients is boolean
  // Check no function property exists
  // Warn if useA2AClients is true but no a2aClients defined
}
```

## Testing

### Phase 9B Tests

- [ ] Load workflow with ToolNode - verify displays correctly
- [ ] Save workflow with ToolNode - verify type preserved
- [ ] Load conditional edge - verify possibleTargets preserved
- [ ] Create workflow with ToolNode in UI

## Success Criteria

- ✓ ToolNode displays in canvas
- ✓ ToolNode saves with correct structure
- ✓ Conditional edges with possibleTargets work
- ✓ useA2AClients flag preserved

## Key Files Reference

### Type Definitions
- [workflow.types.ts](../../webview-ui/src/workflow-editor/types/workflow.types.ts)

### Components
- [WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx)

### Converters
- [jsonToFlow.ts](../../webview-ui/src/workflow-editor/utils/jsonToFlow.ts)
- [flowToJson.ts](../../webview-ui/src/workflow-editor/utils/flowToJson.ts)

### Validation
- [validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts)

### Example Data
- [research/main.json](../../json/research/main.json) - ToolNode example
