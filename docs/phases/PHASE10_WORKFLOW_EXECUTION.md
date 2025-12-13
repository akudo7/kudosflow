# Phase 10: Workflow Execution - A2A Server & Chat-Style Execution

## Overview

Phase 10 adds **execution capabilities** to the workflow editor, enabling two modes of workflow execution:

1. **A2A Server Mode**: Launch workflow as an Agent-to-Agent protocol server (external HTTP endpoints)
2. **Chat Mode**: Execute workflow interactively via chat interface (internal execution)

**Status**: ⬜ 未開始
**Total Estimated Time**: 11-15 days (2.5-3 weeks)

---

## Architecture Strategy

### Two Execution Modes

**Mode 1: A2A Server** (Standalone Process)
- Launches A2A server in VSCode terminal
- Runs as separate Node.js process
- Exposes HTTP endpoints for external agent communication
- Reference: `/Users/akirakudo/Desktop/MyWork/CLI/server/src/server.ts`

**Mode 2: Chat Execution** (In-Process)
- Executes workflow directly in extension process
- Chat UI embedded in webview
- Internal execution without HTTP server
- Reference: `/Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/kudos.tsx`

### Dependencies Required

**Extension Side** (package.json):
```json
{
  "dependencies": {
    "@kudos/scene-graph-manager": "file:...", // ✓ Already installed
    "@a2a-js/sdk": "^0.3.0",                  // ✗ Need to add
    "express": "^4.18.0",                     // ✗ Need to add
    "dotenv": "^16.0.0"                       // ✗ Optional
  },
  "devDependencies": {
    "@types/express": "^4.17.0"               // ✗ Need to add
  }
}
```

**Webview Side** (webview-ui/package.json):
```json
{
  "dependencies": {
    "uuid": "^9.0.0",                         // ✗ Need to add
    "date-fns": "^2.30.0"                     // ✗ Need to add
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"                   // ✗ Need to add
  }
}
```

---

## Sub-Phases Overview

### [Phase 10A: Terminal Integration & A2A Server Launch](phase10/PHASE10A_A2A_SERVER_LAUNCH.md)

**Status**: ⬜ 未開始
**Time**: 3-4 days
**Complexity**: High
**Priority**: ⭐ Foundation Phase

Launch workflow as A2A server in VSCode terminal with full lifecycle management.

**Key Tasks:**
- Create TerminalManager for terminal lifecycle
- Implement A2AServerLauncher for server orchestration
- Add server control message handlers
- Build server status UI in toolbar
- Create inline server runner script

**Deliverables:**
- `src/execution/TerminalManager.ts`
- `src/execution/A2AServerLauncher.ts`
- `src/execution/serverRunner.ts`
- `src/execution/types.ts`
- Server UI controls in toolbar

---

### [Phase 10B: Chat UI Foundation](phase10/PHASE10B_CHAT_UI_FOUNDATION.md)

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium
**Priority**: High

Create chat interface UI for interactive workflow execution.

**Key Tasks:**
- Build ChatPanel component (sliding drawer)
- Create message display components
- Implement chat input with Enter/Shift+Enter support
- Add interrupt prompt visualization
- Create chat toggle button with unread badge

**Deliverables:**
- `webview-ui/src/workflow-editor/ChatPanel.tsx`
- `webview-ui/src/workflow-editor/ChatMessage.tsx`
- `webview-ui/src/workflow-editor/ChatInput.tsx`
- `webview-ui/src/workflow-editor/InterruptPrompt.tsx`
- `webview-ui/src/workflow-editor/MessageList.tsx`
- Chat types in `types/chat.types.ts`

---

### [Phase 10C: Workflow Execution Engine Integration](phase10/PHASE10C_EXECUTION_ENGINE.md)

**Status**: ⬜ 未開始
**Time**: 4-5 days
**Complexity**: Very High
**Priority**: ⭐ Critical

Execute workflows using WorkflowEngine with full interrupt handling.

**Key Tasks:**
- Implement WorkflowExecutor for execution management
- Handle GraphInterrupt detection and processing
- Create resume functionality for interrupts
- Stream execution messages to webview
- Manage execution sessions and thread IDs

**Deliverables:**
- `src/execution/WorkflowExecutor.ts`
- `src/execution/InterruptHandler.ts`
- `webview-ui/src/workflow-editor/hooks/useWorkflowExecution.ts`
- Message handlers in WorkflowEditorPanel
- Execution state management in WorkflowEditor

**Dependencies**: Phase 10B (Chat UI must exist)

---

### [Phase 10D: Advanced Features & Polish](phase10/PHASE10D_ADVANCED_FEATURES.md)

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium
**Priority**: Enhancement

Add polish and advanced features for professional UX.

**Key Tasks:**
- Visual execution feedback (highlight executing nodes)
- Execution history (save/load sessions)
- Server status panel (detailed info dialog)
- Execution settings tab
- Keyboard shortcuts (Ctrl+Shift+C, etc.)
- Status bar integration

**Deliverables:**
- `webview-ui/src/workflow-editor/ExecutionHistory.tsx`
- `webview-ui/src/workflow-editor/ServerStatusPanel.tsx`
- `webview-ui/src/workflow-editor/settings/ExecutionSettings.tsx`
- `webview-ui/src/workflow-editor/ExecutionTracker.tsx`
- `src/execution/StatusBarManager.ts`
- Various hooks for auto-save, shortcuts, tracking

**Dependencies**: Phases 10A, 10B, 10C (builds on all previous phases)

---

## Estimated Total Time

- **Phase 10A**: 3-4 days (A2A Server Launch)
- **Phase 10B**: 2-3 days (Chat UI Foundation)
- **Phase 10C**: 4-5 days (Execution Engine)
- **Phase 10D**: 2-3 days (Advanced Features)

**Total**: 11-15 days (approximately 2.5-3 weeks)

---

## Implementation Order

**Recommended sequence:**

1. **Phase 10A** (Foundation) - Terminal and A2A server infrastructure
2. **Phase 10B** (UI) - Chat interface components
3. **Phase 10C** (Core) - Execution engine integration
4. **Phase 10D** (Polish) - Advanced features and enhancements

**Why this order:**
- Phase 10A establishes server infrastructure (can be tested independently)
- Phase 10B creates UI components (can be tested with mock data)
- Phase 10C connects everything together (requires both 10A and 10B)
- Phase 10D adds polish once core functionality works

**Alternative: Parallel Development**
- Phase 10A and 10B can be developed in parallel (independent)
- Phase 10C must wait for Phase 10B
- Phase 10D must wait for all previous phases

---

## Message Passing Protocol

### Extension → Webview Messages

```typescript
// Server lifecycle
{ command: 'serverStatus', status: ServerStatus }

// Execution lifecycle
{ command: 'executionReady', sessionId: string, threadId: string }
{ command: 'executionStarted' }
{ command: 'executionMessage', role: string, content: string }
{ command: 'interruptRequired', message: string }
{ command: 'executionComplete', result: any }
{ command: 'executionError', error: string }

// Node execution (Phase 10D)
{ command: 'nodeExecutionStarted', nodeId: string }
{ command: 'nodeExecutionCompleted', nodeId: string }

// History (Phase 10D)
{ command: 'sessionSaved', sessionId: string }
{ command: 'savedSessions', sessions: SavedSession[] }
```

### Webview → Extension Messages

```typescript
// Server control (Phase 10A)
{ command: 'startA2AServer', filePath: string, port: number }
{ command: 'stopA2AServer' }
{ command: 'restartServer' }
{ command: 'getServerStatus' }

// Execution control (Phase 10C)
{ command: 'initializeWorkflow', sessionId: string, filePath: string }
{ command: 'executeWorkflow', sessionId: string, input: string }
{ command: 'resumeWorkflow', sessionId: string, input: string }
{ command: 'getExecutionState', sessionId: string }
{ command: 'clearSession', sessionId: string }

// History (Phase 10D)
{ command: 'saveSession', session: SavedSession }
{ command: 'getSavedSessions' }
{ command: 'deleteSession', sessionId: string }
```

---

## Critical Files Summary

### New Files (Total: ~24 files)

**Extension Side** (TypeScript):
1. `src/execution/TerminalManager.ts` (150-200 lines)
2. `src/execution/A2AServerLauncher.ts` (200-250 lines)
3. `src/execution/WorkflowExecutor.ts` (400-500 lines)
4. `src/execution/InterruptHandler.ts` (100-150 lines)
5. `src/execution/StatusBarManager.ts` (100-150 lines)
6. `src/execution/types.ts` (50-100 lines)
7. `src/execution/serverRunner.ts` (100-150 lines)

**Webview Side** (React):
8. `webview-ui/src/workflow-editor/types/chat.types.ts` (30-50 lines)
9. `webview-ui/src/workflow-editor/ChatPanel.tsx` (200-250 lines)
10. `webview-ui/src/workflow-editor/MessageList.tsx` (80-100 lines)
11. `webview-ui/src/workflow-editor/ChatMessage.tsx` (80-100 lines)
12. `webview-ui/src/workflow-editor/ChatInput.tsx` (80-100 lines)
13. `webview-ui/src/workflow-editor/InterruptPrompt.tsx` (50-70 lines)
14. `webview-ui/src/workflow-editor/ExecutionHistory.tsx` (150-200 lines)
15. `webview-ui/src/workflow-editor/ExecutionTracker.tsx` (100-120 lines)
16. `webview-ui/src/workflow-editor/ServerStatusPanel.tsx` (200-250 lines)
17. `webview-ui/src/workflow-editor/settings/ExecutionSettings.tsx` (150-200 lines)
18. `webview-ui/src/workflow-editor/hooks/useWorkflowExecution.ts` (150-200 lines)
19. `webview-ui/src/workflow-editor/hooks/useAutoSave.ts` (80-100 lines)
20. `webview-ui/src/workflow-editor/hooks/useKeyboardShortcuts.ts` (80-100 lines)
21. `webview-ui/src/workflow-editor/hooks/useExecutionTracker.ts` (100-120 lines)

### Modified Files (Total: ~8 files)

**Extension Side**:
1. `src/panels/WorkflowEditorPanel.ts` (+380 lines total)
   - +100 lines for server control (Phase 10A)
   - +200 lines for execution handlers (Phase 10C)
   - +80 lines for history/settings (Phase 10D)
2. `src/extension.ts` (+30 lines) - Status bar integration
3. `package.json` (+6 dependencies)

**Webview Side**:
4. `webview-ui/src/workflow-editor/WorkflowEditor.tsx` (+400 lines total)
   - +50 lines for server state (Phase 10A)
   - +150 lines for chat state (Phase 10B)
   - +150 lines for execution handlers (Phase 10C)
   - +50 lines for advanced features (Phase 10D)
5. `webview-ui/src/workflow-editor/WorkflowToolbar.tsx` (+160 lines total)
   - +80 lines for server controls (Phase 10A)
   - +40 lines for chat toggle (Phase 10B)
   - +40 lines for history button (Phase 10D)
6. `webview-ui/src/workflow-editor/WorkflowNode.tsx` (+50 lines) - Execution visualization
7. `webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx` (+50 lines) - Execution tab
8. `webview-ui/src/workflow-editor/types/workflow.types.ts` (+80 lines)
   - +30 lines for server types (Phase 10A)
   - +20 lines for chat types (Phase 10B)
   - +30 lines for execution types (Phase 10C)
9. `webview-ui/package.json` (+3 dependencies)

---

## Success Criteria

Phase 10 is complete when:

### Feature 1: A2A Server (Phase 10A)
- ✓ Server launches from workflow JSON file
- ✓ Terminal displays in VSCode
- ✓ Server status shows in toolbar
- ✓ Endpoints accessible externally
- ✓ Server stops gracefully
- ✓ Port conflicts detected and handled
- ✓ Error messages clear and actionable

### Feature 2: Chat Execution (Phases 10B + 10C)
- ✓ Chat panel opens/closes smoothly
- ✓ User can send messages
- ✓ Workflow executes correctly
- ✓ Messages display in chat with proper formatting
- ✓ Interrupts detected and displayed
- ✓ User input resumes execution
- ✓ Execution errors displayed clearly
- ✓ Multiple executions work sequentially

### Feature 3: Advanced Features (Phase 10D)
- ✓ Visual execution feedback on canvas
- ✓ Execution history saves and loads
- ✓ Server status panel shows details
- ✓ Settings tab functional
- ✓ Keyboard shortcuts work
- ✓ Status bar integration functional

### Integration
- ✓ No regressions in Phases 1-9
- ✓ Editor remains fully functional
- ✓ Server and chat can run simultaneously
- ✓ Performance acceptable (no lag or freezing)
- ✓ Memory leaks addressed
- ✓ All tests passing

---

## Dependencies to Install

### Extension Side

Add to `package.json`:
```bash
yarn add @a2a-js/sdk express dotenv
yarn add -D @types/express
```

### Webview Side

Add to `webview-ui/package.json`:
```bash
cd webview-ui
yarn add uuid date-fns
yarn add -D @types/uuid
```

After adding dependencies:
```bash
yarn install:all
```

---

## Testing Strategy

### Unit Testing
- Test each component in isolation
- Mock message passing for webview components
- Test execution logic with sample workflows

### Integration Testing
- Test full execution flow end-to-end
- Test server launch/stop cycles
- Test interrupt handling with real workflows
- Test chat UI with various message types

### Manual Testing
- Test with simple workflow (1-2 nodes)
- Test with complex workflow (10+ nodes)
- Test with workflow that has interrupts
- Test server accessibility from external tools
- Test concurrent executions
- Test error scenarios (invalid JSON, port conflicts, etc.)

---

## Documentation Updates

After Phase 10 completion:
- Update [CLAUDE.md](../../CLAUDE.md) with execution features
- Add execution examples to `docs/examples/`
- Create Phase 10 completion document
- Update README with chat and server features
- Document keyboard shortcuts
- Add troubleshooting guide

---

## Migration Considerations

### Backward Compatibility

Existing workflows without execution features should continue to work:
- All execution features are optional
- Editor functionality unchanged
- No breaking changes to JSON format
- Settings have sensible defaults

### Forward Compatibility

New execution features gracefully degrade:
- If WorkflowEngine not available, show clear error
- If dependencies missing, provide installation instructions
- Execution failures don't crash the editor

---

## Risk Mitigation

### High-Risk Areas

1. **WorkflowEngine Integration** (Phase 10C)
   - Risk: Complex interrupt handling logic
   - Mitigation: Follow reference implementation closely, extensive testing

2. **Terminal Management** (Phase 10A)
   - Risk: Process cleanup, orphan processes
   - Mitigation: Thorough dispose logic, process monitoring

3. **Message Passing** (All phases)
   - Risk: Lost messages, race conditions
   - Mitigation: Proper error handling, state synchronization

### Contingency Plans

- If A2A server proves too complex, focus on chat execution only
- If interrupt handling is problematic, start with simple workflows
- If performance issues arise, implement throttling and optimization

---

## Next Steps After Phase 10

**Phase 11** (Future):
- WebSocket streaming for real-time updates
- Multi-workflow orchestration
- Workflow templates and marketplace
- Advanced debugging tools (breakpoints, step-through)
- Performance profiling and optimization
- Workflow testing framework

---

## Integration with Main Implementation Plan

This phase should be added to [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) after Phase 9:

```markdown
#### [Phase 10: Workflow Execution](phases/PHASE10_WORKFLOW_EXECUTION.md) ⬜

Execute workflows via A2A server or interactive chat

**Sub-phases:**
- Phase 10A: Terminal Integration & A2A Server Launch (3-4 days)
- Phase 10B: Chat UI Foundation (2-3 days)
- Phase 10C: Workflow Execution Engine Integration (4-5 days)
- Phase 10D: Advanced Features & Polish (2-3 days)

**Main Tasks:**
- Launch workflow as A2A server
- Interactive chat execution
- GraphInterrupt handling
- Execution history
- Visual feedback
- Server status panel
```

---

## Quick Start Guide (After Implementation)

### Launch A2A Server

1. Open workflow JSON in editor
2. Click "Run A2A Server" button in toolbar
3. Server launches in terminal
4. Endpoints displayed in server status panel

### Execute via Chat

1. Open workflow JSON in editor
2. Click chat icon in toolbar
3. Type message and press Enter
4. View responses in chat panel
5. Provide input when prompted (interrupts)

### Keyboard Shortcuts

- `Ctrl+Shift+C` - Toggle chat panel
- `Ctrl+Enter` - Send message
- `Ctrl+Shift+X` - Clear chat
- `Ctrl+Shift+R` - Start server
- `Ctrl+Shift+S` - Stop server
