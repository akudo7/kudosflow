### Status
- **Created**: 2025-12-23
- **Status**: ⬜ Not Started
- **Estimated Time**: 2-3 hours
- **Prerequisites**: Phase 15A, 15B, 15C completed

### Objective

Complete Phase 15 by adding:
1. Edge creation flow (regular vs conditional selection)
2. Edge context menu enhancements
3. Comprehensive integration testing
4. Documentation

### Implementation Steps

#### Step 1: Enhanced Edge Creation Flow

**File**: `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Current Behavior** (line 242-253):
```typescript
const onConnect = useCallback(
  (connection: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        eds
      )
    );
    setIsDirty(true);
  },
  [setEdges]
);
```

**Enhanced Behavior**:

Add state for edge type dialog:
```typescript
const [showEdgeTypeDialog, setShowEdgeTypeDialog] = useState(false);
const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
```

Update onConnect:
```typescript
const onConnect = useCallback(
  (connection: Connection) => {
    // Store connection and show type selection dialog
    setPendingConnection(connection);
    setShowEdgeTypeDialog(true);
  },
  []
);

const handleCreateRegularEdge = () => {
  if (pendingConnection) {
    setEdges((eds) =>
      addEdge(
        {
          ...pendingConnection,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        eds
      )
    );
    setIsDirty(true);
  }
  setShowEdgeTypeDialog(false);
  setPendingConnection(null);
};

const handleCreateConditionalEdge = () => {
  if (pendingConnection) {
    // Create single edge as placeholder, user will edit via modal
    const tempGroupId = `conditional-${pendingConnection.source}-${Date.now()}`;
    const defaultEdge: ReactFlowEdge = {
      id: `${tempGroupId}-${pendingConnection.target}`,
      source: pendingConnection.source || '',
      target: pendingConnection.target || '',
      type: 'smoothstep',
      animated: true,
      label: 'new condition',
      markerEnd: { type: MarkerType.ArrowClosed },
      data: {
        conditionalGroupId: tempGroupId,
        condition: {
          name: 'new condition',
          function: {
            parameters: [],
            output: 'string',
            implementation: '// TODO: Implement condition logic\nreturn "' + (pendingConnection.target || '__end__') + '";',
          },
          possibleTargets: [pendingConnection.target || ''],
        },
        possibleTargets: [pendingConnection.target || ''],
        isConditional: true,
      },
    };

    setEdges((eds) => [...eds, defaultEdge]);
    setIsDirty(true);

    // Automatically open edit modal
    // (This requires lifting modal state to WorkflowEditor or using events)
    // For now, user can edit via Edges tab
  }
  setShowEdgeTypeDialog(false);
  setPendingConnection(null);
};
```

**Edge Type Selection Dialog Component**:

Create simple dialog:
```typescript
{showEdgeTypeDialog && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}
    onClick={() => setShowEdgeTypeDialog(false)}
  >
    <div
      style={{
        backgroundColor: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: '6px',
        padding: '20px',
        minWidth: '300px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px' }}>
        Create Edge
      </h3>
      <p style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
        Choose edge type:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleCreateRegularEdge}
          style={{
            padding: '10px',
            fontSize: '13px',
            backgroundColor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <strong>Regular Edge</strong>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
            Direct connection between nodes
          </div>
        </button>
        <button
          onClick={handleCreateConditionalEdge}
          style={{
            padding: '10px',
            fontSize: '13px',
            backgroundColor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <strong>Conditional Edge</strong>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
            Route based on condition logic
          </div>
        </button>
        <button
          onClick={() => setShowEdgeTypeDialog(false)}
          style={{
            padding: '8px',
            fontSize: '12px',
            backgroundColor: 'var(--vscode-button-secondaryBackground)',
            color: 'var(--vscode-button-secondaryForeground)',
            border: '1px solid var(--vscode-button-border)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

#### Step 2: Edge Context Menu (Optional Enhancement)

**File**: `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

Add edge click handler:
```typescript
const onEdgeClick = useCallback((event: React.MouseEvent, edge: ReactFlowEdge) => {
  // For now, just select the edge
  // Full context menu can be added later
  console.log('Edge clicked:', edge);
}, []);
```

Add to ReactFlow component:
```typescript
<ReactFlow
  // ... existing props
  onEdgeClick={onEdgeClick}
/>
```

**Future Enhancement**: Right-click context menu with:
- Edit Condition (for conditional edges)
- Convert to Conditional
- Convert to Regular
- Delete Edge

#### Step 3: Comprehensive Testing

**Test Suite**:

1. **Load Existing Workflow**:
   ```
   Test: Load client.json
   Expected:
   - ✅ 3 edges render from orchestrator node
   - ✅ All edges animated smoothstep
   - ✅ First edge labeled "shouldContinue"
   - ✅ Edges tab shows grouped conditional edge
   - ✅ Edge count accurate
   ```

2. **Edit Existing Conditional Edge**:
   ```
   Test: Edit orchestrator → shouldContinue condition
   Steps:
   1. Open Edges tab
   2. Click Edit on orchestrator group
   3. Change condition name to "routeAgent"
   4. Add new target: "approval_handler"
   5. Save
   Expected:
   - ✅ 4 edges now visible from orchestrator
   - ✅ First edge labeled "routeAgent"
   - ✅ New edge to approval_handler visible
   ```

3. **Create New Conditional Edge**:
   ```
   Test: Create conditional edge from scratch
   Steps:
   1. Drag from "tools" node to "__end__"
   2. Select "Conditional Edge" in dialog
   3. Verify placeholder edge created
   4. Open Edges tab → Edit new conditional group
   5. Set name: "shouldEnd"
   6. Add targets: __end__, orchestrator
   7. Write implementation:
      if (state.complete) return "__end__";
      return "orchestrator";
   8. Save
   Expected:
   - ✅ 2 edges from tools (to __end__ and orchestrator)
   - ✅ Both animated
   - ✅ Edge group in Edges tab
   ```

4. **Delete Conditional Edge Group**:
   ```
   Test: Delete orchestrator → shouldContinue group
   Steps:
   1. Open Edges tab
   2. Click Delete on orchestrator group
   3. Confirm
   Expected:
   - ✅ All 3 edges removed from canvas
   - ✅ Group removed from Edges tab
   - ✅ Edge count decreased by 3
   ```

5. **Round-trip Test**:
   ```
   Test: Save and reload workflow
   Steps:
   1. Load client.json
   2. Edit conditional edge (add target)
   3. Create new conditional edge
   4. Save workflow (Ctrl+S)
   5. Close editor
   6. Reopen workflow
   Expected:
   - ✅ All edges render correctly
   - ✅ Conditional groups intact
   - ✅ JSON structure preserved
   - ✅ possibleTargets arrays correct
   ```

6. **Validation Tests**:
   ```
   Test A: Invalid target
   - Edit condition, add non-existent target in JSON
   - Load workflow
   - Expected: Validation error logged

   Test B: Empty possibleTargets
   - Create conditional edge with no targets
   - Expected: Save blocked by validation

   Test C: Condition without implementation
   - Clear implementation field
   - Click Save
   - Expected: Error message displayed
   ```

7. **Edge Cases**:
   ```
   Test A: Single possibleTarget
   - Create conditional with only 1 target
   - Expected: Single animated edge (not grouped visually)

   Test B: Many possibleTargets
   - Create conditional with 10 targets
   - Expected: 10 edges render, canvas may be cluttered

   Test C: Mix of regular and conditional edges
   - Workflow with both edge types
   - Expected: Both types work independently
   ```

#### Step 4: Documentation

Create documentation files:

**Main Phase Doc**: `docs/phases/PHASE15_CONDITIONAL_EDGES.md`
```markdown
# Phase 15: Conditional Edge Support

[Include overview, architecture, sub-phases, etc. from main plan]
```

**Sub-phase Docs**:
- `docs/phases/phase15/PHASE15A_VISUAL_REPRESENTATION.md` (from Appendix A)
- `docs/phases/phase15/PHASE15B_EDGE_EDITOR.md` (from Appendix B)
- `docs/phases/phase15/PHASE15C_CONDITIONAL_MODAL.md` (from Appendix C)
- `docs/phases/phase15/PHASE15D_INTEGRATION.md` (from Appendix D)

**Update Main Plan**: `docs/IMPLEMENTATION_PLAN.md`

Add Phase 15 section:
```markdown
#### [Phase 15: Conditional Edge Support](phases/PHASE15_CONDITIONAL_EDGES.md) ⬜

Comprehensive support for conditional edges with possibleTargets array.

**Overview:**
- Visual representation: Multiple edges per possibleTarget
- Editing UI: Modal dialog with condition logic
- Edge management: Dedicated Edges tab in settings
- JSON compatibility: Maintains existing structure

**Sub-Phases:**

##### Phase 15A: Visual Representation ⬜
- Modify jsonToFlow/flowToJson converters
- Render multiple edges for possibleTargets
- Add conditionalGroupId for grouping

##### Phase 15B: Edge Editor Tab ⬜
- Add Edges tab to settings panel
- Create EdgeListEditor component
- Group conditional edges visually
- Edit/delete functionality

##### Phase 15C: Conditional Edge Modal ⬜
- Create ConditionalEdgeFormModal
- Edit condition name, parameters, implementation
- Multi-select possibleTargets interface
- Validation integration

##### Phase 15D: Integration and Testing ⬜
- Edge creation flow enhancements
- Context menu (optional)
- Comprehensive testing
- Documentation

**Phase 15完了日**: TBD
```

### Visual Verification Checklist

After full Phase 15 implementation, verify:

- [ ] client.json loads with correct visual representation
- [ ] Edges tab lists all edges correctly
- [ ] Conditional edges grouped in list
- [ ] Edit modal opens and functions
- [ ] All form fields work correctly
- [ ] Validation prevents invalid configs
- [ ] Save/cancel work as expected
- [ ] Changes reflected on canvas
- [ ] Edge creation dialog works
- [ ] Regular edges unaffected
- [ ] Round-trip preserves data
- [ ] Edge deletion works for both types
- [ ] Performance acceptable with many edges

### Success Criteria

✅ All Phase 15A tests pass
✅ All Phase 15B tests pass
✅ All Phase 15C tests pass
✅ Edge creation flow functional
✅ Documentation complete
✅ No regressions in existing features
✅ Code follows project patterns
✅ TypeScript types accurate
✅ VSCode theme styling consistent

### Known Limitations

1. **Visual Clutter**: Many possibleTargets creates many overlapping edges
   - **Mitigation**: Future custom edge component with branching visualization

2. **Edge Selection**: Selecting one edge in conditional group doesn't select all
   - **Mitigation**: Acceptable for Phase 15, can enhance later

3. **Context Menu**: Basic edge interaction, no right-click menu yet
   - **Mitigation**: Can be added in future enhancement

### Future Enhancements (Out of Scope)

- Custom edge component with single branching visualization
- Inline edge editing (click label to edit)
- Edge validation warnings (red highlight for invalid targets)
- Edge templates/presets
- Visual debugging (highlight active path during execution)
- Edge animation showing direction of flow
- Batch edge operations (delete multiple, convert multiple)

### Estimated Time: 2-3 hours
