# Phase 13: Multi-Instance Workflow Editor Architecture

**Status**: ☑ Completed (Phase 13A & 13B only)
**Created**: 2025-12-20
**Completed**: 2025-12-20
**Updated**: 2025-12-22 (JSON-based port configuration support)
**Actual Time**: 14-16 hours (Phase 13A: 8-10h, Phase 13B: 6-8h)

## Overview

Transform the Workflow Editor from a singleton architecture (single panel only) to a multi-instance architecture that supports opening and running multiple workflow editors and A2A servers simultaneously.

### User Requirements

Enable the following workflow:

- Edit and run `json/research/subagents/quality-evaluation.json` as an A2A Server
- Edit and run `json/research/subagents/research-execution.json` as an A2A Server
- Edit and run `json/research/subagents/task-creation.json` as an A2A Server
- Edit and chat with `json/research/main.json`

Each editor operates independently with its own dedicated A2A server instance.

### Current Limitations

1. **WorkflowEditorPanel**: Singleton pattern (`static currentPanel`) allows only one instance
2. **A2AServerLauncher**: Rejects new server launch if one is already running
3. **Port Management**: Default port 3000, no automatic allocation
4. **Message Routing**: No mechanism to route messages to specific panels
5. **Webview Panel ID**: All panels use same `viewType: "workflowEditor"`

## Architecture Transformation

### Before (Singleton)

```
Extension Host
├── WorkflowEditorPanel.currentPanel (singleton)
│   ├── A2AServerLauncher (single instance)
│   ├── WorkflowExecutor
│   └── Webview (viewType: "workflowEditor")
└── StatusBarManager (global)

Opening new file → Reuses existing panel
```

### After (Multi-Instance)

```
Extension Host
├── PanelRegistry (global)
│   ├── Panel Instance 1 (panelId: wf-abc123)
│   │   ├── A2AServerLauncher (port 3000)
│   │   ├── WorkflowExecutor
│   │   └── Webview (viewType: "workflowEditor-abc123")
│   ├── Panel Instance 2 (panelId: wf-def456)
│   │   ├── A2AServerLauncher (port 3001)
│   │   └── Webview (viewType: "workflowEditor-def456")
│   └── Panel Instance N
├── PortManager (global)
├── MessageRouter (global)
├── ServerInstanceManager (global)
└── StatusBarManager (global)

Opening new file → Creates new panel instance
```

---

## Sub-Phases

### [Phase 13A: Core Multi-Instance Architecture](#phase-13a) ☑

**Status**: ✅ Completed
**Time**: 8-10 hours

Remove singleton pattern and implement panel registry system.

**Key Deliverables**:
- ✅ PanelRegistry.ts - Track all active panels
- ✅ PortManager.ts - Automatic port allocation (3000, 3001, 3002...)
- ✅ PortManager.ts - JSON-based port configuration support (config.a2aEndpoint.port)
- ✅ WorkflowEditorPanel refactoring - Remove singleton
- ✅ WorkflowEditorPanel - JSON port configuration reading
- ✅ Message format updates - Add panelId

### [Phase 13B: Server Instance Management](#phase-13b) ☑

**Status**: ✅ Completed
**Time**: 6-8 hours

Enable multiple independent A2A server instances with automatic port allocation.

**Key Deliverables**:
- ✅ ServerInstanceManager.ts - Track server instances
- ✅ A2AServerLauncher refactoring - Support multi-instance
- ✅ Automatic port allocation integration
- ✅ Terminal naming with panelId

### [Phase 13C: Message Routing and Command Updates](#phase-13c) ❌

**Status**: ❌ Not Implemented (Not Required)
**Time**: N/A

**Reason**: Phase 13A & 13B provide sufficient functionality for multi-instance operation. Strict message routing proved unnecessary as panels already operate independently. Implementation was attempted but rolled back due to complexity without added value.

**Originally Planned**:
- MessageRouter.ts - Route messages by panelId
- Panel message handling - Filter by panelId
- Webview message handling - Include panelId
- Panel management commands

### [Phase 13D: StatusBar and UI Enhancements](#phase-13d) ❌

**Status**: ❌ Not Implemented (Optional Feature)
**Time**: N/A

**Reason**: Core multi-instance functionality is complete. StatusBar enhancements are cosmetic improvements that don't affect core functionality.

**Originally Planned**:
- StatusBar multi-panel support
- Panel ID display in toolbar
- Port number display in UI
- Panel list navigation

### [Phase 13E: Testing and Documentation](#phase-13e) ⬜

**Status**: ⬜ Partial (Basic testing completed)
**Time**: N/A

**Completed**:
- ✅ Basic multi-instance testing
- ✅ Server instance isolation testing
- ✅ Port allocation testing

**Not Required**:
- Formal test suite creation
- Comprehensive documentation (basic usage documented in CLAUDE.md)

---

## Phase 13A: Core Multi-Instance Architecture

**Status**: ⬜ Not Started
**Time**: 8-10 hours

### Objective

Remove singleton pattern and implement panel registry system.

### New Files

#### 1. `src/managers/PanelRegistry.ts`

Registry to track and manage all active WorkflowEditorPanel instances.

**Features**:
- Manage all panel instances in a Map (`Map<panelId, WorkflowEditorPanel>`)
- Generate unique panel IDs (`wf-{timestamp}-{random}` format)
- Lookup by panel ID, file path, or webview
- Panel lifecycle management (register/unregister)
- Event emitter for panel add/remove notifications

**Interface**:
```typescript
export class PanelRegistry {
  private panels: Map<string, WorkflowEditorPanel>;

  /**
   * Generate a unique panel ID
   * Format: wf-{timestamp}-{random}
   */
  generateId(): string;

  /**
   * Register a new panel instance
   */
  register(panel: WorkflowEditorPanel): void;

  /**
   * Unregister a panel instance
   */
  unregister(panelId: string): void;

  /**
   * Get panel by panel ID
   */
  getPanel(panelId: string): WorkflowEditorPanel | undefined;

  /**
   * Get panel by file path (optional)
   */
  getPanelByFilePath(filePath: string): WorkflowEditorPanel | undefined;

  /**
   * Get panel by webview reference
   */
  getPanelByWebview(webview: Webview): WorkflowEditorPanel | undefined;

  /**
   * Get all active panels
   */
  getAllPanels(): WorkflowEditorPanel[];

  /**
   * Dispose all panels
   */
  disposeAll(): void;
}
```

#### 2. `src/managers/PortManager.ts`

Automatic port allocation and management for A2A servers.

**Features**:
- Automatic port allocation (starting from 3000)
- JSON-based port configuration support (config.a2aEndpoint.port)
- Port reservation and release
- System-level port availability checking
- panelId → port mapping
- Port conflict detection and resolution

**Interface**:
```typescript
export class PortManager {
  private basePort: number = 3000;
  private allocatedPorts: Map<string, number>;

  /**
   * Allocate a port for a panel
   * Automatically finds next available port starting from basePort
   */
  async allocatePort(panelId: string): Promise<number>;

  /**
   * Reserve a specific port for a panel (from workflow JSON config)
   * Used when port is explicitly configured at config.a2aEndpoint.port
   */
  reservePort(panelId: string, port: number): number;

  /**
   * Release a port when panel closes
   */
  releasePort(panelId: string): void;

  /**
   * Get allocated port for a panel
   */
  getPort(panelId: string): number | undefined;

  /**
   * Check if a port is currently allocated
   */
  isPortAllocated(port: number): boolean;

  /**
   * Check if a port is available on the system
   */
  private async isPortAvailable(port: number): Promise<boolean>;
}
```

**Port Availability Check**:
```typescript
import * as net from 'net';

private async isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}
```

### Modified Files

#### 1. `src/panels/WorkflowEditorPanel.ts`

**Changes**:

- ❌ **Remove**: `public static currentPanel: WorkflowEditorPanel | undefined;` (L25-26)
- ✅ **Add**: Instance properties
  ```typescript
  private readonly panelId: string;
  private assignedPort: number | undefined;  // Auto-allocated port
  private configuredPort: number | undefined; // Port from workflow JSON
  ```
- ✅ **Add**: JSON port configuration reading
  ```typescript
  private _initializePortConfiguration(): void {
    // Read config.a2aEndpoint.port from workflow JSON
    const port = workflow.config?.a2aEndpoint?.port;
    if (port) this.configuredPort = port;
  }
  ```
- ✅ **Modify**: Constructor
  ```typescript
  // Before
  private constructor(panel: WebviewPanel, extensionUri: Uri, filePath: string)

  // After
  constructor(panelId: string, panel: WebviewPanel, extensionUri: Uri, filePath: string)
  ```
- ✅ **Modify**: `render()` method - Always create new instance
  ```typescript
  // Before: Reuse existing panel
  if (WorkflowEditorPanel.currentPanel) {
    WorkflowEditorPanel.currentPanel._panel.reveal(ViewColumn.One);
    WorkflowEditorPanel.currentPanel._filePath = filePath;
    WorkflowEditorPanel.currentPanel._loadWorkflow();
    return;
  }

  // After: Always create new
  public static render(extensionUri: Uri, filePath: string): WorkflowEditorPanel {
    const panelRegistry = getPanelRegistry();
    const panelId = panelRegistry.generateId();

    const panel = window.createWebviewPanel(
      `workflowEditor-${panelId}`,  // Unique viewType
      `Workflow: ${path.basename(filePath)}`,
      ViewColumn.One,
      // ... configuration
    );

    const editorPanel = new WorkflowEditorPanel(panelId, panel, extensionUri, filePath);
    panelRegistry.register(editorPanel);
    return editorPanel;
  }
  ```
- ✅ **Modify**: `dispose()` method
  ```typescript
  public dispose() {
    const panelRegistry = getPanelRegistry();
    panelRegistry.unregister(this.panelId);

    // Stop server and release port
    if (this._serverLauncher.isServerRunning()) {
      this._serverLauncher.stopServer();
    }
    const portManager = getPortManager();
    portManager.releasePort(this.panelId);

    // ... existing cleanup
  }
  ```
- ✅ **Modify**: Message handling - Include panelId
  ```typescript
  this._panel.webview.postMessage({
    command: 'loadWorkflow',
    panelId: this.panelId,
    data: workflow,
    filePath: this._filePath
  });
  ```

#### 2. `src/extension.ts`

**Changes**:

- ✅ **Add**: Global instances
  ```typescript
  let panelRegistry: PanelRegistry;
  let portManager: PortManager;

  export function getPanelRegistry(): PanelRegistry {
    return panelRegistry;
  }

  export function getPortManager(): PortManager {
    return portManager;
  }
  ```
- ✅ **Modify**: `activate()` function
  ```typescript
  export function activate(context: vscode.ExtensionContext) {
    // Initialize registries
    panelRegistry = new PanelRegistry();
    portManager = new PortManager();

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('kudosflow.openWorkflowEditor', (uri: vscode.Uri) => {
        const filePath = uri.fsPath;
        WorkflowEditorPanel.render(context.extensionUri, filePath);
      })
    );

    // ... other commands
  }
  ```
- ✅ **Modify**: `deactivate()` function
  ```typescript
  export function deactivate() {
    if (panelRegistry) {
      panelRegistry.disposeAll();
    }
  }
  ```

### Message Format Changes

**Extension → Webview**:
```typescript
// Before
{ command: 'loadWorkflow', data: workflow, filePath: path }

// After
{ command: 'loadWorkflow', panelId: 'wf-abc123', data: workflow, filePath: path }
```

**Webview → Extension**:
```typescript
// Before
{ command: 'save', data: workflowData }

// After
{ command: 'save', panelId: 'wf-abc123', data: workflowData }
```

### Testing

1. Open 3 different workflow files simultaneously
2. Verify each panel has unique panelId
3. Verify PanelRegistry correctly tracks all panels
4. Close one panel, verify others remain functional
5. Verify panel unregisters on close

### Success Criteria

- ✅ Multiple workflow editors can be opened simultaneously
- ✅ Each panel has unique ID and viewType
- ✅ PanelRegistry correctly tracks all active panels
- ✅ Panels clean up properly on disposal
- ✅ No interference between panels

---

## Phase 13B: Server Instance Management

**Status**: ⬜ Not Started
**Time**: 6-8 hours

### Objective

Enable multiple independent A2A server instances with automatic port allocation.

### New Files

#### 1. `src/execution/ServerInstanceManager.ts`

Track and manage all running server instances.

**Interface**:
```typescript
export class ServerInstanceManager {
  private instances: Map<string, A2AServerLauncher>;

  register(panelId: string, launcher: A2AServerLauncher): void;
  unregister(panelId: string): void;
  getInstance(panelId: string): A2AServerLauncher | undefined;
  getAllInstances(): Map<string, A2AServerLauncher>;
  getRunningCount(): number;
  stopAll(): Promise<void>;
}
```

### Modified Files

#### 1. `src/execution/A2AServerLauncher.ts`

**Changes**:

- ❌ **Remove**: Singleton enforcement check (L63-65)
- ✅ **Add**: Instance properties (`panelId`, `instanceId`)
- ✅ **Modify**: Constructor to accept panelId
- ✅ **Modify**: `launchServer()` - Instance-scoped checks
- ✅ **Modify**: Status callbacks - Include panelId

#### 2. `src/panels/WorkflowEditorPanel.ts`

**Changes**:

- ✅ **Modify**: Constructor - Initialize port configuration
- ✅ **Modify**: `_loadWorkflow()` - Reserve configured port or allocate automatic port
- ✅ **Modify**: `_startA2AServer()` - Use configured or pre-allocated port (priority: explicit > configured > auto-allocated)
- ✅ **Modify**: `dispose()` - Clean up server and release port

#### 3. `src/execution/TerminalManager.ts`

**Changes**:

- ✅ **Modify**: Terminal naming to include panelId
  ```typescript
  const terminalName = `A2A Server [${panelId.slice(-6)}] - ${filename} (Port ${port})`;
  ```

### Port Allocation Strategy

```
Panel 1 → Gets Port 3000
Panel 2 → Gets Port 3001
Panel 3 → Gets Port 3002
Panel 2 closes → Port 3001 released
Panel 4 → Gets Port 3001 (reuses lowest available)
```

### Testing

1. Open 3 workflow files
2. Start A2A server on each (ports 3000, 3001, 3002)
3. Verify each server runs independently
4. Make requests to each server endpoint
5. Stop one server, verify others continue
6. Close panel with running server, verify port released
7. Open new panel, verify it reuses released port

### Success Criteria

- ✅ Multiple A2A servers run simultaneously on different ports
- ✅ No port conflicts
- ✅ Servers are fully independent
- ✅ Port cleanup works correctly
- ✅ Terminal names distinguish between instances

---

## Phase 13C: Message Routing and Command Updates

**Status**: ⬜ Not Started
**Time**: 10-12 hours

### Objective

Implement proper message routing between extension and specific webview panels.

### New Files

#### 1. `src/managers/MessageRouter.ts`

Route messages by panelId.

**Interface**:
```typescript
export class MessageRouter {
  private panelRegistry: PanelRegistry;
  private messageQueue: Map<string, any[]>;

  constructor(panelRegistry: PanelRegistry);
  sendToPanel(panelId: string, message: any): void;
  broadcast(message: any): void;
  routeFromWebview(message: any): void;
  queueMessage(panelId: string, message: any): void;
  flushQueue(panelId: string): void;
}
```

### Modified Files

#### 1. `src/panels/WorkflowEditorPanel.ts`

**Changes**:

- ✅ **Modify**: All `postMessage()` calls to include panelId
- ✅ **Modify**: Message listener to filter by panelId

#### 2. `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Changes**:

- ✅ **Add**: panelId state management
- ✅ **Modify**: Message handler - Ignore messages for other panels
- ✅ **Modify**: All outgoing messages to include panelId

#### 3. `src/extension.ts`

**Changes**:

- ✅ **Add**: MessageRouter instance
- ✅ **Add**: Panel management commands
  - `kudosflow.closeAllPanels`
  - `kudosflow.showPanelList`

### Message Flow

```
Webview Panel 1 (panelId: abc123)
    ↓ postMessage({ command: 'save', panelId: 'abc123', ... })
Extension MessageRouter
    ↓ routeFromWebview(message)
    ↓ PanelRegistry.getPanel('abc123')
WorkflowEditorPanel Instance (abc123)
    ↓ handleMessage(message)
    ↓ _saveWorkflow(data)
File System
    ↓ write complete
WorkflowEditorPanel Instance (abc123)
    ↓ postMessage({ command: 'saveSuccess', panelId: 'abc123' })
Webview Panel 1 (abc123)
    ✅ receives saveSuccess
Webview Panel 2 (def456)
    ❌ ignores (panelId doesn't match)
```

### Testing

1. Open 3 different workflow files
2. Save changes in panel 1 → only panel 1 receives saveSuccess
3. Start server in panel 2 → only panel 2 receives serverStatus
4. Send chat message in panel 3 → only panel 3 receives response
5. Modify workflows in all 3 panels simultaneously
6. Verify no message cross-contamination

### Success Criteria

- ✅ Messages route to correct panels only
- ✅ No message leakage between panels
- ✅ Panel-specific operations work correctly
- ✅ Commands can target specific panels
- ✅ Message acknowledgment works

---

## Phase 13D: StatusBar and UI Enhancements

**Status**: ⬜ Not Started
**Time**: 4-6 hours

### Objective

Update status bar to support multiple panels and improve UX.

### Modified Files

#### 1. `src/execution/StatusBarManager.ts`

**Changes**:

- ✅ **Add**: Multi-server status display
- ✅ **Add**: Panel-specific status display
- ✅ **Modify**: Status update logic

#### 2. `webview-ui/src/workflow-editor/components/WorkflowToolbar.tsx`

**Changes**:

- ✅ **Add**: Panel identification display (ID and port)

#### 3. `webview-ui/src/workflow-editor/components/ServerStatusPanel.tsx`

**Changes**:

- ✅ **Add**: Panel ID and assigned port display

### Testing

1. Open 3 panels, start servers on 2
2. Verify status bar shows "2 A2A Servers"
3. Click status bar, verify panel list appears
4. Focus different panels, verify status bar updates
5. Close panel with server, verify count decreases
6. Verify toolbar shows panel ID and port

### Success Criteria

- ✅ Status bar reflects multi-panel state
- ✅ Panel identification visible in UI
- ✅ Easy navigation between panels
- ✅ Clear indication of active panel
- ✅ Port numbers visible and correct

---

## Phase 13E: Testing and Documentation

**Status**: ⬜ Not Started
**Time**: 6-8 hours

### Objective

Comprehensive testing and documentation for multi-instance architecture.

### Test Scenarios

#### 1. Basic Multi-Instance
- Open 4 workflow files simultaneously
- Verify all load correctly
- Edit different nodes in each
- Save all, verify no conflicts

#### 2. Server Management
- Start servers on all 4 panels
- Verify ports: 3000, 3001, 3002, 3003
- Make concurrent API requests to all servers
- Stop server 2, verify port 3001 released
- Start new panel, verify it gets port 3001

#### 3. Message Routing
- Send chat messages in all panels simultaneously
- Verify responses route correctly
- Start workflow execution in multiple panels
- Verify no message cross-talk

#### 4. Panel Lifecycle
- Open 5 panels
- Close panels in random order
- Verify no memory leaks
- Verify ports released
- Verify server cleanup

#### 5. Edge Cases
- Open same file in 2 panels (should work independently)
- Save from both panels (last save wins)
- Start server on same file in 2 panels (different ports)
- Close panel while server starting
- Close panel while workflow executing

### Documentation Files

#### 1. `docs/PHASE_13_ARCHITECTURE.md`

**Content**:
- Multi-instance architecture overview
- PanelRegistry design and API
- PortManager design and API
- MessageRouter design and API
- Message flow diagrams
- Port allocation strategy
- Panel lifecycle documentation

#### 2. `docs/PHASE_13_USAGE.md`

**Content**:
- How to open multiple workflow editors
- Running multiple A2A servers
- Panel identification and navigation
- Port management
- Troubleshooting guide

#### 3. Update `CLAUDE.md`

Add Phase 13 information:

```markdown
## Multi-Instance Support (Phase 13)

The extension supports opening multiple workflow editors simultaneously.

### Architecture

- **PanelRegistry**: Tracks all active workflow editor panels
- **PortManager**: Automatically allocates ports (3000+) for A2A servers
- **MessageRouter**: Routes messages to correct panel instances
- **ServerInstanceManager**: Manages multiple A2A server instances

### Usage

- Open multiple JSON files → each gets its own editor panel
- Start A2A server on each panel → automatic port allocation
- Each panel operates independently with its own server instance
- Panel IDs shown in toolbar for identification
```

### Code Documentation

Add comprehensive JSDoc comments to all new classes.

### Testing Approach

1. Run all test scenarios manually
2. Document any issues found
3. Add automated tests for core functionality
4. Performance testing with 10+ panels
5. Memory leak testing
6. Port exhaustion handling

### Success Criteria

- ✅ All test scenarios pass
- ✅ No memory leaks detected
- ✅ Documentation complete and clear
- ✅ Code fully commented
- ✅ Performance acceptable with 10+ panels

---

## Risk Assessment

### High Risk

**Message routing complexity**: Potential for messages to get lost or misrouted
- **Mitigation**: Extensive logging, message acknowledgment, routing tests

**Port exhaustion**: Running out of ports with many panels
- **Mitigation**: Port recycling, limit on concurrent servers, user warnings

**Memory leaks**: Each panel holds significant resources
- **Mitigation**: Proper disposal chains, memory profiling, cleanup tests

### Medium Risk

**Breaking changes**: Webview message format changes
- **Mitigation**: Version compatibility checks, graceful fallbacks

**StatusBar confusion**: Users may not understand multi-panel status
- **Mitigation**: Clear UI indicators, tooltips, documentation

**Port conflicts**: External processes using same ports
- **Mitigation**: Port availability checking, automatic retry with next port

### Low Risk

**Performance degradation**: Multiple panels may slow extension
- **Mitigation**: Lazy loading, resource limits, performance monitoring

---

## Implementation Order

### Phase 13A → Phase 13B → Phase 13C → Phase 13D → Phase 13E

Each sub-phase depends on previous phases:

- **13B** depends on **13A** (needs PanelRegistry and PortManager)
- **13C** depends on **13A** (needs panelId)
- **13D** depends on all previous phases
- **13E** depends on all previous phases

---

## Critical Files

### New Files (7)

1. `src/managers/PanelRegistry.ts` - Panel registry
2. `src/managers/PortManager.ts` - Port management
3. `src/managers/MessageRouter.ts` - Message routing
4. `src/execution/ServerInstanceManager.ts` - Server instance management
5. `docs/PHASE_13_ARCHITECTURE.md` - Architecture documentation
6. `docs/PHASE_13_USAGE.md` - Usage documentation
7. `docs/phases/PHASE13_MULTI_INSTANCE.md` - Phase documentation

### Modified Files (6)

1. [src/panels/WorkflowEditorPanel.ts](../../src/panels/WorkflowEditorPanel.ts) - Remove singleton, add panelId support
2. [src/extension.ts](../../src/extension.ts) - Initialize registries, update commands
3. [src/execution/A2AServerLauncher.ts](../../src/execution/A2AServerLauncher.ts) - Multi-instance support
4. [src/execution/TerminalManager.ts](../../src/execution/TerminalManager.ts) - Terminal naming update
5. [webview-ui/src/workflow-editor/WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx) - panelId messaging
6. [src/execution/StatusBarManager.ts](../../src/execution/StatusBarManager.ts) - Multi-server status display

### UI Updates (2)

1. [webview-ui/src/workflow-editor/components/WorkflowToolbar.tsx](../../webview-ui/src/workflow-editor/components/WorkflowToolbar.tsx)
2. [webview-ui/src/workflow-editor/components/ServerStatusPanel.tsx](../../webview-ui/src/workflow-editor/components/ServerStatusPanel.tsx)

---

## Time Estimates

- **Phase 13A**: 8-10 hours
  - PanelRegistry: 3h
  - PortManager: 2h
  - WorkflowEditorPanel refactoring: 3h
  - Testing: 2h

- **Phase 13B**: 6-8 hours
  - ServerInstanceManager: 2h
  - A2AServerLauncher refactoring: 2h
  - Port allocation integration: 2h
  - Testing: 2h

- **Phase 13C**: 10-12 hours
  - MessageRouter: 3h
  - Panel message handling: 3h
  - Webview message handling: 3h
  - Command updates: 1h
  - Testing: 2h

- **Phase 13D**: 4-6 hours
  - StatusBar updates: 2h
  - UI enhancements: 2h
  - Testing: 2h

- **Phase 13E**: 6-8 hours
  - Test scenarios: 3h
  - Documentation: 3h
  - Final verification: 2h

**Total Estimate**: 34-44 hours

---

## Dependencies

### External Dependencies
- No new npm packages required
- Uses existing VSCode API capabilities
- Requires Node.js net module for port checking

### Internal Dependencies
- Phase 13B depends on Phase 13A (needs PanelRegistry and PortManager)
- Phase 13C depends on Phase 13A (needs panel IDs)
- Phase 13D depends on all previous phases
- Phase 13E depends on all previous phases

### Version Compatibility
- VSCode API: 1.96.0+ (already required)
- Node.js: Compatible with current version
- TypeScript: 5.6.3+ (already required)

---

## Usage Example

### Scenario: Editing and Running Multiple Subagent Workflows

```
1. Right-click json/research/subagents/quality-evaluation.json
   → Select "Open in Workflow Editor"
   → Panel wf-abc123 opens (Port 3000 allocated)

2. Right-click json/research/subagents/research-execution.json
   → Select "Open in Workflow Editor"
   → Panel wf-def456 opens (Port 3001 allocated)

3. Right-click json/research/subagents/task-creation.json
   → Select "Open in Workflow Editor"
   → Panel wf-ghi789 opens (Port 3002 allocated)

4. Right-click json/research/main.json
   → Select "Open in Workflow Editor"
   → Panel wf-jkl012 opens (Port 3003 allocated)

5. In each panel independently:
   - Edit workflow
   - Start A2A server (on its own port)
   - Chat with workflow
   - Execute workflow

6. Status bar shows "4 A2A Servers"
   - Click to view panel list
   - Easy switching between panels
```

---

## Completion Checklist

### Phase 13A
- [ ] Create PanelRegistry.ts
- [ ] Create PortManager.ts
- [ ] Remove singleton from WorkflowEditorPanel.ts
- [ ] Integrate registries in extension.ts
- [ ] Add panelId to message format
- [ ] Complete basic multi-instance tests

### Phase 13B
- [ ] Create ServerInstanceManager.ts
- [ ] Refactor A2AServerLauncher.ts for multi-instance
- [ ] Implement automatic port allocation
- [ ] Update terminal naming
- [ ] Complete server management tests

### Phase 13C
- [ ] Create MessageRouter.ts
- [ ] Update WorkflowEditorPanel message routing
- [ ] Update WorkflowEditor.tsx panelId messaging
- [ ] Add panel management commands
- [ ] Complete message routing tests

### Phase 13D
- [ ] Update StatusBarManager for multi-server
- [ ] Add panel ID display to WorkflowToolbar
- [ ] Add info to ServerStatusPanel
- [ ] Complete UI feature tests

### Phase 13E
- [ ] Run all test scenarios
- [ ] Create PHASE_13_ARCHITECTURE.md
- [ ] Create PHASE_13_USAGE.md
- [ ] Create PHASE13_MULTI_INSTANCE.md
- [ ] Update CLAUDE.md
- [ ] Add JSDoc comments
- [ ] Complete final verification

---

## Summary

Phase 13 transforms KudosFlow extension from single-instance to multi-instance architecture, enabling simultaneous workflow editors and A2A servers.

**Status**: ✅ **Core Functionality Complete** (Phase 13A & 13B)

**Implemented Deliverables**:
- ✅ Unlimited simultaneous workflow editors
- ✅ Independent A2A server instances with auto port management
- ✅ PanelRegistry for tracking all active panels
- ✅ PortManager for automatic port allocation (3000, 3001, 3002...)
- ✅ PortManager for JSON-based port configuration (config.a2aEndpoint.port)
- ✅ ServerInstanceManager for independent server instances
- ✅ Unique panel IDs and viewTypes

**User Benefits Achieved**:
- ✅ Edit and run multiple workflows in parallel
- ✅ Efficient subagent workflow development
- ✅ No port conflict worries
- ✅ Complete independence between workflows
- ✅ Automatic port management

**Not Implemented** (Optional/Unnecessary):
- ❌ MessageRouter (Phase 13C) - Panels already operate independently
- ❌ Enhanced StatusBar UI (Phase 13D) - Core functionality works without it
- ❌ Formal test suite (Phase 13E) - Manual testing confirms functionality

**Result**: All user requirements met with Phase 13A & 13B implementation.

---

## Update History

### 2025-12-22: JSON-Based Port Configuration Support

**Enhancement**: Added support for reading port configuration from workflow JSON files.

**Changes**:

1. **PortManager.ts**:
   - Added `reservePort(panelId: string, port: number)` method
   - Supports explicit port reservation from workflow configuration
   - Prevents port conflicts between configured and auto-allocated ports

2. **WorkflowEditorPanel.ts**:
   - Added `configuredPort` property to store JSON-configured port
   - Added `_initializePortConfiguration()` method to read `config.a2aEndpoint.port`
   - Modified `_loadWorkflow()` to use `reservePort()` for configured ports
   - Updated `dispose()` to release both configured and auto-allocated ports
   - Port priority: explicit parameter > configured JSON > auto-allocated

**Configuration Format**:

```json
{
  "config": {
    "a2aEndpoint": {
      "port": 3002
    }
  }
}
```

**Benefits**:

- Workflows can specify their preferred port in JSON
- Maintains compatibility with auto-allocation for workflows without port config
- Prevents accidental port conflicts in multi-instance scenarios
- Follows reference implementation pattern from CLI server
