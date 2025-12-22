### Status
- **Created**: 2025-12-23
- **Status**: ⬜ Not Started
- **Estimated Time**: 3-4 hours

### Objective

Modify the JSON-to-React-Flow converters to render conditional edges as multiple visual edges, one for each target in the `possibleTargets` array.

### Current Behavior

In `jsonToFlow.ts` (lines 64-86), conditional edges are converted to a single React Flow edge:

```typescript
if (edge.type === 'conditional' && edge.condition) {
  edges.push({
    id: `e${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to || '',  // May be undefined
    type: 'smoothstep',
    animated: true,
    label: 'conditional',
    // ...
  });
}
```

Problem: `possibleTargets` array is ignored, resulting in no visual representation of routing options.

### Target Behavior

For a conditional edge with `possibleTargets: ["tools", "orchestrator", "__end__"]`:
- Create 3 separate React Flow edges
- All edges share the same `conditionalGroupId`
- All edges share the same `condition` data
- First edge shows condition name as label
- All edges are animated smoothstep with arrow markers

### Implementation Steps

#### Step 1: Update Type Definitions

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

Add to `ReactFlowEdge` data interface (around line 130):

```typescript
export interface ReactFlowEdge extends Edge {
  data?: {
    condition?: ConditionalEdgeCondition;
    possibleTargets?: string[];
    conditionalGroupId?: string;  // NEW: Group identifier for conditional edges
    isConditional?: boolean;       // NEW: Flag to identify conditional edges
  };
}
```

#### Step 2: Modify jsonToFlow.ts

**File**: `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`

**Location**: Lines 64-86 (edge conversion logic)

**Before**:
```typescript
workflowConfig.edges.forEach((edge, index) => {
  if (edge.type === 'conditional' && edge.condition) {
    edges.push({
      id: `e${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to || '',
      type: 'smoothstep',
      animated: true,
      label: 'conditional',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: {
        condition: edge.condition,
        possibleTargets: edge.condition.possibleTargets,
      },
    });
  } else if (edge.to) {
    // Regular edge logic...
  }
});
```

**After**:
```typescript
workflowConfig.edges.forEach((edge, index) => {
  if (edge.type === 'conditional' && edge.condition) {
    const possibleTargets = edge.condition.possibleTargets || [];

    if (possibleTargets.length > 0) {
      // Create one edge per possibleTarget
      const groupId = `conditional-${edge.from}-${index}`;

      possibleTargets.forEach((target, targetIndex) => {
        edges.push({
          id: `${groupId}-${target}`,
          source: edge.from,
          target: target,
          type: 'smoothstep',
          animated: true,
          // Only show label on first edge to avoid clutter
          label: targetIndex === 0 ? edge.condition!.name : undefined,
          markerEnd: { type: MarkerType.ArrowClosed },
          data: {
            conditionalGroupId: groupId,
            condition: edge.condition,
            possibleTargets: possibleTargets,
            isConditional: true,
          },
        });
      });
    } else {
      // Fallback: conditional edge without possibleTargets
      // (backwards compatibility or malformed data)
      edges.push({
        id: `e${edge.from}-${edge.to || 'undefined'}-${index}`,
        source: edge.from,
        target: edge.to || '',
        type: 'smoothstep',
        animated: true,
        label: edge.condition.name || 'conditional',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {
          condition: edge.condition,
          isConditional: true,
        },
      });
    }
  } else if (edge.to) {
    // Regular edge logic (unchanged)
    edges.push({
      id: `e${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    });
  }
});
```

**Key Changes**:
1. Check if `possibleTargets` exists and has length > 0
2. Generate unique `groupId` based on source node and index
3. Loop through `possibleTargets` and create one edge per target
4. All edges in group share: `groupId`, `condition`, `possibleTargets`
5. Only first edge shows label (to reduce visual clutter)
6. Fallback for backwards compatibility

#### Step 3: Modify flowToJson.ts

**File**: `webview-ui/src/workflow-editor/converters/flowToJson.ts`

**Location**: Lines 54-71 (edge conversion logic)

**Before**:
```typescript
edges.forEach((edge) => {
  const workflowEdge: WorkflowEdge = {
    from: edge.source,
    to: edge.target,
  };

  if (edge.animated || edge.type === 'smoothstep') {
    workflowEdge.type = 'conditional';
    if (edge.data?.condition) {
      workflowEdge.condition = edge.data.condition;
    }
  }

  workflowEdges.push(workflowEdge);
});
```

**After**:
```typescript
const processedGroups = new Set<string>();

edges.forEach((edge) => {
  // Check if this edge is part of a conditional group
  if (edge.data?.conditionalGroupId && edge.data?.isConditional) {
    const groupId = edge.data.conditionalGroupId;

    // Only process each group once
    if (!processedGroups.has(groupId)) {
      processedGroups.add(groupId);

      // Find all edges in this conditional group
      const groupEdges = edges.filter(
        (e) => e.data?.conditionalGroupId === groupId
      );

      // Extract possibleTargets from all edges in group
      const possibleTargets = groupEdges.map((e) => e.target);

      // Create single conditional edge with possibleTargets
      const workflowEdge: WorkflowEdge = {
        from: edge.source,
        type: 'conditional',
        condition: {
          ...edge.data.condition,
          possibleTargets: possibleTargets,
        },
      };

      workflowEdges.push(workflowEdge);
    }
    // Skip this edge if already processed as part of a group
  } else {
    // Regular edge or old-style conditional edge
    const workflowEdge: WorkflowEdge = {
      from: edge.source,
      to: edge.target,
    };

    // Check for old-style conditional edge (backwards compatibility)
    if (
      (edge.animated || edge.type === 'smoothstep') &&
      edge.data?.condition &&
      !edge.data?.isConditional
    ) {
      workflowEdge.type = 'conditional';
      workflowEdge.condition = edge.data.condition;
    }

    workflowEdges.push(workflowEdge);
  }
});
```

**Key Changes**:
1. Track processed groups using `Set<string>`
2. For conditional edges, process entire group at once
3. Consolidate all edges in group into single `WorkflowEdge`
4. Extract `possibleTargets` from group edges' target IDs
5. Maintain backwards compatibility for old-style conditional edges

#### Step 4: Testing

**Test File**: `json/a2a/client.json`

**Expected Structure** (lines 140-162):
```json
{
  "from": "orchestrator",
  "type": "conditional",
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

**Test Procedure**:

1. **Load Test**:
   ```
   1. Open client.json in workflow editor
   2. Verify 3 edges render from "orchestrator" node:
      - orchestrator → tools (animated, smoothstep, labeled "shouldContinue")
      - orchestrator → orchestrator (animated, smoothstep, no label)
      - orchestrator → __end__ (animated, smoothstep, no label)
   3. All edges should have arrow markers
   ```

2. **Save Test**:
   ```
   1. Save workflow (Ctrl+S)
   2. Open saved JSON file
   3. Verify edges array contains single conditional edge with possibleTargets
   4. Verify possibleTargets: ["tools", "orchestrator", "__end__"]
   ```

3. **Round-trip Test**:
   ```
   1. Load client.json
   2. Save as new file
   3. Close editor
   4. Open saved file
   5. Verify 3 edges still render correctly
   6. Verify JSON structure identical to original
   ```

4. **Edge Case Tests**:
   ```
   Test A: Single possibleTarget
   - Create conditional edge with possibleTargets: ["end"]
   - Verify single edge renders

   Test B: Empty possibleTargets (should not happen, but handle gracefully)
   - Verify fallback to old behavior

   Test C: Mix of regular and conditional edges
   - Verify regular edges unaffected
   - Verify conditional edges render correctly
   ```

### Validation

Use existing `validateConditionalEdge()` function (in `validation.ts`):

```typescript
import { validateConditionalEdge } from '../utils/validation';

// During conversion, validate possibleTargets
const allNodeIds = nodes.map(n => n.id);
const validation = validateConditionalEdge(edge.condition, allNodeIds);

if (!validation.valid) {
  console.warn(`Invalid conditional edge: ${validation.error}`);
  // Handle error appropriately
}
```

### Visual Verification Checklist

After implementation, verify:

- [ ] Load `client.json` - see 3 edges from orchestrator
- [ ] First edge labeled "shouldContinue"
- [ ] All 3 edges animated with smoothstep style
- [ ] All 3 edges have arrow markers
- [ ] Save preserves JSON structure
- [ ] Reload shows same visual representation
- [ ] Regular edges unaffected
- [ ] Edge selection works for all edges
- [ ] Edge deletion works (currently deletes individually, will be fixed in 15B)

### Known Issues / Limitations

1. **Edge Deletion**: Deleting one edge in a group doesn't delete entire group (addressed in Phase 15B)
2. **Visual Clutter**: Many possibleTargets creates many edges (future enhancement: custom edge component)
3. **Label Placement**: Only first edge shows label, may not be clear which condition applies

### Success Criteria

✅ `client.json` loads with 3 visible edges from orchestrator
✅ Save produces JSON with single conditional edge and possibleTargets array
✅ Round-trip (load-save-load) maintains structure and visual representation
✅ Regular edges continue to work as before
✅ Edge validation prevents invalid configurations

### Estimated Time: 3-4 hours
