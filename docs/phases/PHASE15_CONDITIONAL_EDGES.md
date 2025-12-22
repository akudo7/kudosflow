# Phase 15: Conditional Edge Support

**Status**: ⬜ Not Started
**Created**: 2025-12-23
**Estimated Time**: 12-16 hours (4 sub-phases)

## Overview

Implement comprehensive support for conditional edges with `possibleTargets` array, enabling visual representation of multiple routing paths and editing capabilities for conditional logic.

### Current State

- ✅ Type definitions exist: `ConditionalEdgeCondition`, `WorkflowEdge` with possibleTargets
- ✅ Validation function exists: `validateConditionalEdge()`
- ✅ JSON structure supports conditional edges (see `json/a2a/client.json`)
- ❌ Visual representation: Only single edge rendered, possibleTargets not visualized
- ❌ Editing UI: No way to edit condition or possibleTargets

### User Requirements

1. **Visual Representation**: Draw multiple edges on canvas for each possibleTarget
2. **Condition Editing**: Modal dialog to edit condition logic (reference node editing patterns)
3. **Edge Management**: Add "Edges" tab to settings panel for edge management
4. **JSON Compatibility**: Maintain compatibility with existing conditional edge structure

## Architecture Overview

### Before Phase 15

```
JSON: { from: "A", type: "conditional", condition: { possibleTargets: ["B", "C", "D"] } }
        ↓
jsonToFlow: Creates 1 edge (A → undefined, shows "conditional" label)
        ↓
Canvas: Single animated edge from A (no visible targets)
```

### After Phase 15

```
JSON: { from: "A", type: "conditional", condition: { possibleTargets: ["B", "C", "D"] } }
        ↓
jsonToFlow: Creates 3 edges (A→B, A→C, A→D), all with conditionalGroupId
        ↓
Canvas: 3 visible edges from A, all animated, grouped visually
        ↓
EdgeListEditor: Groups edges, shows as single conditional entity
        ↓
ConditionalEdgeFormModal: Edit condition, modify possibleTargets
        ↓
flowToJson: Consolidates 3 edges back to single conditional with possibleTargets array
        ↓
JSON: Saved with original structure
```

## Sub-Phase Breakdown

### [Phase 15A: Visual Representation](phase15/PHASE15A_VISUAL_REPRESENTATION.md) ⬜

**Time**: 3-4 hours

Render conditional edges as multiple visual edges (one per possibleTarget).

**Key Changes**:
- Modify `jsonToFlow.ts` to create multiple edges from possibleTargets array
- Modify `flowToJson.ts` to consolidate grouped edges back to single conditional edge
- Add `conditionalGroupId` to edge data for grouping

**Critical Files**:
- `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`
- `webview-ui/src/workflow-editor/converters/flowToJson.ts`
- `webview-ui/src/workflow-editor/types/workflow.types.ts`

### [Phase 15B: Edge Editor Tab](phase15/PHASE15B_EDGE_EDITOR.md) ⬜

**Time**: 3-4 hours

Add "Edges" tab to settings panel for listing and managing edges.

**Key Changes**:
- Add 'edges' to `TabType` union in `WorkflowSettingsPanel.tsx`
- Create `EdgeListEditor.tsx` component
- Group conditional edges visually in list
- Add edit/delete functionality

**Critical Files**:
- `webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx`
- `webview-ui/src/workflow-editor/settings/EdgeListEditor.tsx` (NEW)

### [Phase 15C: Conditional Edge Modal](phase15/PHASE15C_CONDITIONAL_MODAL.md) ⬜

**Time**: 4-5 hours

Create modal for editing conditional edge conditions and possibleTargets.

**Key Changes**:
- Create `ConditionalEdgeFormModal.tsx` following `ModelFormModal` pattern
- Form sections: name, parameters, output, implementation, possibleTargets
- Integrate validation using existing `validateConditionalEdge()`
- Multi-select interface for possibleTargets

**Critical Files**:
- `webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx` (NEW)
- `webview-ui/src/workflow-editor/settings/EdgeListEditor.tsx`

### [Phase 15D: Integration and Testing](phase15/PHASE15D_INTEGRATION.md) ⬜

**Time**: 2-3 hours

Integration testing, edge creation flow, context menu, and documentation.

**Key Changes**:
- Enhance edge creation flow (regular vs conditional dialog)
- Add edge context menu (convert, edit, delete)
- Comprehensive testing with `client.json`
- Create phase documentation

**Critical Files**:
- `webview-ui/src/workflow-editor/WorkflowEditor.tsx`
- All documentation files

## Key Technical Decisions

1. **Visual Approach**: Render multiple React Flow edges (one per possibleTarget) grouped by `conditionalGroupId`
2. **Editing Interface**: Add "Edges" tab to `WorkflowSettingsPanel` with `EdgeListEditor` component
3. **Modal Pattern**: Create `ConditionalEdgeFormModal` following `ModelFormModal` pattern
4. **Data Flow**: Convert possibleTargets array ↔ multiple visual edges in converters

## Data Flow

```
1. Load JSON
   └─> jsonToFlow.ts
       └─> For each conditional edge with possibleTargets:
           - Create conditionalGroupId: "conditional-{from}-{index}"
           - Create one edge per target
           - All edges share: condition, possibleTargets, groupId

2. Display on Canvas
   └─> Multiple animated smoothstep edges visible
   └─> All edges in group selectable independently

3. Edit via Settings Panel
   └─> EdgeListEditor groups edges by conditionalGroupId
   └─> Click "Edit" opens ConditionalEdgeFormModal
   └─> Modal pre-fills with condition data
   └─> User modifies: name, parameters, implementation, possibleTargets
   └─> Save creates new edge set with updated data

4. Save to JSON
   └─> flowToJson.ts
       └─> Group edges by conditionalGroupId
       └─> Extract possibleTargets from group
       └─> Create single conditional edge with possibleTargets array
```

## Testing Strategy

### Phase 15A Tests
1. Load `json/a2a/client.json`
2. Verify orchestrator has 3 outgoing edges (to tools, orchestrator, __end__)
3. All edges animated and styled as smoothstep
4. Save and verify JSON structure unchanged

### Phase 15B Tests
1. Open settings panel → Edges tab
2. Verify conditional edges grouped correctly
3. Verify regular edges listed separately
4. Test delete functionality
5. Changes reflected on canvas

### Phase 15C Tests
1. Click Edit on conditional edge group
2. Modal loads with current condition data
3. Modify condition name, implementation
4. Add/remove possibleTargets
5. Save and verify changes reflected
6. Reload workflow and verify persistence

### Phase 15D Tests
1. Create new conditional edge via connection
2. Convert regular edge to conditional
3. Convert conditional edge to regular
4. Context menu operations
5. Edge deletion (entire group)
6. Complex workflow with multiple conditional edges

## Success Criteria

✅ Load `client.json` and see 3 separate edges from orchestrator node
✅ Edit conditional edge condition via Edges tab modal
✅ Create new conditional edge with multiple targets
✅ Save workflow and verify JSON structure matches original format
✅ Reload workflow and verify edges persist correctly
✅ Delete conditional edge group removes all edges in group
✅ Edge validation prevents invalid configurations
✅ Convert between regular and conditional edges

## Known Limitations

1. **Visual Clutter**: Many possibleTargets creates visual clutter (future: custom edge component with branching visualization)
2. **Edge Deletion**: Deleting single edge in group should prompt to delete entire group
3. **Edge Ordering**: possibleTargets array order may not match visual order on canvas

## Future Enhancements (Out of Scope)

- Custom edge component with branching visualization (single edge that splits)
- Inline edge editing (click edge label to edit)
- Edge validation warnings in UI (invalid targets highlighted in red)
- Edge templates (save commonly used conditional patterns)
- Visual debugging (highlight which edge was taken during workflow execution)
- Edge animation direction (show flow direction during execution)

## Critical Files Summary

### Files to Modify

1. `webview-ui/src/workflow-editor/converters/jsonToFlow.ts` - Create multiple edges from possibleTargets
2. `webview-ui/src/workflow-editor/converters/flowToJson.ts` - Consolidate edges back to single conditional
3. `webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx` - Add Edges tab
4. `webview-ui/src/workflow-editor/WorkflowEditor.tsx` - Edge creation flow
5. `webview-ui/src/workflow-editor/types/workflow.types.ts` - Add conditionalGroupId type

### Files to Create

1. `webview-ui/src/workflow-editor/settings/EdgeListEditor.tsx` - Edge list management UI
2. `webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx` - Condition editing modal

## References

- **Example JSON**: `json/a2a/client.json` (lines 140-162)
- **Type Definitions**: `webview-ui/src/workflow-editor/types/workflow.types.ts` (lines 85-95)
- **Validation**: `webview-ui/src/workflow-editor/utils/validation.ts` (validateConditionalEdge function)
- **Modal Pattern**: `webview-ui/src/workflow-editor/settings/ModelFormModal.tsx`
- **Node Editing Pattern**: `webview-ui/src/workflow-editor/WorkflowNode.tsx`

## Next Steps After Phase 15

Once Phase 15 is complete, the workflow editor will have comprehensive edge management capabilities. Suggested next phases:

- **Phase 16**: ToolNode support and UI (Phase 9C from original plan)
- **Phase 17**: MCP Server integration (Phase 9E)
- **Phase 18**: Workflow execution and chat UI (Phase 10)
