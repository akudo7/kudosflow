### Status
- **Created**: 2025-12-23
- **Status**: ⬜ Not Started
- **Estimated Time**: 3-4 hours
- **Prerequisites**: Phase 15A completed

### Objective

Add an "Edges" tab to the `WorkflowSettingsPanel` that lists all edges (regular and conditional), groups conditional edges by their `conditionalGroupId`, and provides edit/delete functionality.

### Current State

`WorkflowSettingsPanel.tsx` has tabs for:
- Nodes
- Settings
- State Graph
- Annotation
- A2A Clients
- Models
- MCP Servers

Missing: Edge management interface

### Target State

New "Edges" tab showing:
```
Edges (15 total)

Conditional Edges (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 orchestrator → shouldContinue
   ├─ tools
   ├─ orchestrator
   └─ __end__
   [Edit Condition] [Delete All]

📍 agent → routeMessage
   ├─ supervisor
   └─ __end__
   [Edit Condition] [Delete All]

Regular Edges (12)
━━━━━━━━━━━━━━━━━━━━━━━━━━
__start__ → orchestrator         [Delete]
tools → approval_handler         [Delete]
approval_handler → orchestrator  [Delete]
...
```

### Implementation Steps

#### Step 1: Update WorkflowSettingsPanel.tsx

**File**: `webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx`

**Location 1**: Line 23 (TabType union)

**Before**:
```typescript
type TabType = 'nodes' | 'settings' | 'stateGraph' | 'annotation' | 'a2aClients' | 'models' | 'mcpServers';
```

**After**:
```typescript
type TabType = 'nodes' | 'settings' | 'stateGraph' | 'annotation' | 'a2aClients' | 'models' | 'mcpServers' | 'edges';
```

**Location 2**: Line 89 (Add import)

```typescript
import { EdgeListEditor } from './settings/EdgeListEditor';
```

**Location 3**: After line 149 (Add tab button)

Insert between "MCP" tab and content area:

```typescript
<button
  style={getTabStyle(activeTab === 'edges')}
  onClick={() => setActiveTab('edges')}
  title="Manage workflow edges"
>
  Edges
</button>
```

**Location 4**: After line 367 (Add tab content)

Insert before closing div:

```typescript
{activeTab === 'edges' && (
  <EdgeListEditor
    edges={edges}
    nodes={nodes}
    onUpdateEdges={onUpdateEdges}
  />
)}
```

**Location 5**: Line 50 (Add onUpdateEdges prop)

Add to component props:

```typescript
interface WorkflowSettingsPanelProps {
  // ... existing props
  onUpdateEdges: (edges: ReactFlowEdge[]) => void;
}
```

#### Step 2: Create EdgeListEditor Component

**File**: `webview-ui/src/workflow-editor/settings/EdgeListEditor.tsx` (NEW)

**Full Implementation**:

```typescript
import React, { useMemo, useState } from 'react';
import { ReactFlowEdge, ReactFlowNode } from '../types/workflow.types';

interface EdgeListEditorProps {
  edges: ReactFlowEdge[];
  nodes: ReactFlowNode[];
  onUpdateEdges: (edges: ReactFlowEdge[]) => void;
}

interface ConditionalEdgeGroup {
  groupId: string;
  sourceId: string;
  sourceName: string;
  conditionName: string;
  targets: string[];
  edges: ReactFlowEdge[];
}

export const EdgeListEditor: React.FC<EdgeListEditorProps> = ({
  edges,
  nodes,
  onUpdateEdges,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group edges by conditionalGroupId
  const { conditionalGroups, regularEdges } = useMemo(() => {
    const groups = new Map<string, ReactFlowEdge[]>();
    const regular: ReactFlowEdge[] = [];

    edges.forEach((edge) => {
      if (edge.data?.conditionalGroupId && edge.data?.isConditional) {
        const groupId = edge.data.conditionalGroupId;
        if (!groups.has(groupId)) {
          groups.set(groupId, []);
        }
        groups.get(groupId)!.push(edge);
      } else {
        regular.push(edge);
      }
    });

    // Convert groups to structured data
    const structuredGroups: ConditionalEdgeGroup[] = Array.from(
      groups.entries()
    ).map(([groupId, groupEdges]) => {
      const firstEdge = groupEdges[0];
      const sourceNode = nodes.find((n) => n.id === firstEdge.source);
      const targets = groupEdges.map((e) => e.target);

      return {
        groupId,
        sourceId: firstEdge.source,
        sourceName: sourceNode?.data?.name || firstEdge.source,
        conditionName: firstEdge.data?.condition?.name || 'unnamed',
        targets,
        edges: groupEdges,
      };
    });

    return { conditionalGroups: structuredGroups, regularEdges: regular };
  }, [edges, nodes]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (
      !confirm(
        'Delete this conditional edge group? All targets will be removed.'
      )
    ) {
      return;
    }

    const updatedEdges = edges.filter(
      (e) => e.data?.conditionalGroupId !== groupId
    );
    onUpdateEdges(updatedEdges);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (!confirm('Delete this edge?')) {
      return;
    }

    const updatedEdges = edges.filter((e) => e.id !== edgeId);
    onUpdateEdges(updatedEdges);
  };

  const getNodeName = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    return node?.data?.name || nodeId;
  };

  return (
    <div style={{ padding: '12px', color: 'var(--vscode-editor-foreground)' }}>
      {/* Header */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'var(--vscode-descriptionForeground)',
        }}
      >
        Edges ({edges.length} total)
      </div>

      {/* Conditional Edges Section */}
      {conditionalGroups.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: 'var(--vscode-textLink-foreground)',
            }}
          >
            Conditional Edges ({conditionalGroups.length})
          </div>

          {conditionalGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);

            return (
              <div
                key={group.groupId}
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  border: '1px solid var(--vscode-panel-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--vscode-editor-background)',
                }}
              >
                {/* Group Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <button
                      onClick={() => toggleGroup(group.groupId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--vscode-editor-foreground)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '6px',
                        padding: '0',
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      📍 <strong>{group.sourceName}</strong> →{' '}
                      <em>{group.conditionName}</em> ({group.targets.length}{' '}
                      targets)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        // This will be implemented in Phase 15C
                        alert('Edit functionality coming in Phase 15C');
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.groupId)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor:
                          'var(--vscode-inputValidation-errorBackground)',
                        color: 'var(--vscode-inputValidation-errorForeground)',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Group Targets (Expanded) */}
                {isExpanded && (
                  <div
                    style={{
                      marginLeft: '20px',
                      fontSize: '11px',
                      color: 'var(--vscode-descriptionForeground)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {group.targets.map((target, index) => {
                      const isLast = index === group.targets.length - 1;
                      return (
                        <div key={target} style={{ marginBottom: '2px' }}>
                          {isLast ? '└─' : '├─'} {getNodeName(target)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Regular Edges Section */}
      {regularEdges.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: 'var(--vscode-textLink-foreground)',
            }}
          >
            Regular Edges ({regularEdges.length})
          </div>

          {regularEdges.map((edge) => (
            <div
              key={edge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                padding: '6px 10px',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--vscode-editor-background)',
              }}
            >
              <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                {getNodeName(edge.source)} → {getNodeName(edge.target)}
              </span>
              <button
                onClick={() => handleDeleteEdge(edge.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor:
                    'var(--vscode-inputValidation-errorBackground)',
                  color: 'var(--vscode-inputValidation-errorForeground)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {edges.length === 0 && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--vscode-descriptionForeground)',
            fontSize: '12px',
          }}
        >
          No edges in workflow. Create edges by connecting nodes on the canvas.
        </div>
      )}
    </div>
  );
};
```

#### Step 3: Wire Up onUpdateEdges

**File**: `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Location**: Around line 200 (add handler)

```typescript
const handleUpdateEdges = useCallback(
  (updatedEdges: ReactFlowEdge[]) => {
    setEdges(updatedEdges);
    setIsDirty(true);
  },
  [setEdges]
);
```

**Pass to WorkflowSettingsPanel** (around line 500):

```typescript
<WorkflowSettingsPanel
  // ... existing props
  onUpdateEdges={handleUpdateEdges}
/>
```

#### Step 4: Testing

**Test Procedure**:

1. **Open Edges Tab**:
   ```
   1. Load client.json
   2. Open settings panel
   3. Click "Edges" tab
   4. Verify tab opens without errors
   ```

2. **Verify Edge Listing**:
   ```
   1. Check "Edges (X total)" header shows correct count
   2. Verify "Conditional Edges" section appears
   3. Verify orchestrator → shouldContinue group listed
   4. Verify 3 targets shown: tools, orchestrator, __end__
   5. Verify "Regular Edges" section shows other edges
   ```

3. **Test Expand/Collapse**:
   ```
   1. Click arrow (▶) on conditional group
   2. Verify targets expand with tree structure
   3. Click arrow (▼) again
   4. Verify targets collapse
   ```

4. **Test Delete Regular Edge**:
   ```
   1. Click "Delete" on a regular edge
   2. Confirm deletion dialog
   3. Verify edge disappears from list
   4. Verify edge disappears from canvas
   5. Verify "isDirty" flag set (save button enabled)
   ```

5. **Test Delete Conditional Group**:
   ```
   1. Click "Delete" on conditional group
   2. Confirm deletion dialog
   3. Verify all edges in group disappear from canvas
   4. Verify group disappears from list
   5. Verify edge count updated
   ```

6. **Test Edit Button** (Phase 15B only):
   ```
   1. Click "Edit" on conditional group
   2. Verify alert: "Edit functionality coming in Phase 15C"
   3. (Real functionality added in Phase 15C)
   ```

### Visual Verification Checklist

After implementation, verify:

- [ ] "Edges" tab appears in settings panel
- [ ] Tab shows correct edge count
- [ ] Conditional edges grouped correctly
- [ ] Regular edges listed separately
- [ ] Expand/collapse works for conditional groups
- [ ] Delete buttons work for both edge types
- [ ] Deletions reflected on canvas immediately
- [ ] Empty state shows when no edges exist
- [ ] VSCode theme styling consistent

### Success Criteria

✅ "Edges" tab accessible in settings panel
✅ Conditional edges grouped by conditionalGroupId
✅ Regular edges listed individually
✅ Delete functionality works for both types
✅ Changes immediately reflected on canvas
✅ Edge count accurate
✅ Expand/collapse interaction smooth

### Estimated Time: 3-4 hours
