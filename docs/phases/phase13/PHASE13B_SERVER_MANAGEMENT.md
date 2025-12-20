# Phase 13B: Server Instance Management

**Status**: ⬜ Not Started
**Estimated Time**: 6-8 hours
**Dependencies**: [Phase 13A](PHASE13A_CORE_ARCHITECTURE.md) (requires PanelRegistry and PortManager)

## Overview

Enable multiple independent A2A server instances with automatic port allocation. This phase removes the singleton enforcement from A2AServerLauncher and introduces a server instance manager to track all running servers.

## Objective

Transform A2AServerLauncher from single-instance enforcement to multi-instance support, allowing each WorkflowEditorPanel to run its own independent A2A server on a unique port.

## Architecture Changes

### Before (Single Server Enforcement)

```typescript
// A2AServerLauncher.ts
export class A2AServerLauncher {
  private currentPort: number | undefined;
  private currentFilePath: string | undefined;

  public async launchServer(configPath: string, port?: number): Promise<void> {
    // ❌ BLOCKS MULTIPLE SERVERS
    if (this.isServerRunning()) {
      throw new Error('Server is already running. Stop it first.');
    }
    // ...
  }
}
```

### After (Multi-Instance Support)

```typescript
// A2AServerLauncher.ts
export class A2AServerLauncher {
  private readonly panelId: string;
  private readonly instanceId: string;
  private currentPort: number | undefined;

  constructor(panelId: string, ...) {
    this.panelId = panelId;
    this.instanceId = `server-${panelId}`;
  }

  public async launchServer(configPath: string, port?: number): Promise<void> {
    // ✅ ONLY CHECKS THIS INSTANCE
    if (this.currentPort) {
      throw new Error(`Server already running on port ${this.currentPort} for this panel.`);
    }
    // ...
  }
}
```

---

## New Files

### 1. `src/execution/ServerInstanceManager.ts`

Central manager to track all running A2A server instances across panels.

#### Features

- **Instance Tracking**: Map panelId → A2AServerLauncher
- **Global Queries**: Get count of running servers, list all instances
- **Lifecycle Coordination**: Ensure servers stop when panels dispose
- **Status Aggregation**: Provide aggregate server status for UI

#### Interface

```typescript
import { A2AServerLauncher } from './A2AServerLauncher';

/**
 * Manages all A2A server instances across workflow editor panels.
 *
 * This singleton tracks server launchers associated with each panel,
 * enabling multi-server support and coordinated lifecycle management.
 *
 * @example
 * ```typescript
 * const manager = new ServerInstanceManager();
 * manager.register('wf-abc123', serverLauncher);
 * const runningCount = manager.getRunningCount();  // 1
 * ```
 */
export class ServerInstanceManager {
  private instances: Map<string, A2AServerLauncher>;

  constructor() {
    this.instances = new Map();
  }

  /**
   * Register a server launcher instance for a panel.
   *
   * @param panelId - The panel ID
   * @param launcher - The A2AServerLauncher instance
   * @throws Error if a launcher for this panel already exists
   */
  register(panelId: string, launcher: A2AServerLauncher): void {
    if (this.instances.has(panelId)) {
      throw new Error(`Server launcher already registered for panel ${panelId}`);
    }
    this.instances.set(panelId, launcher);
    console.log(`[ServerInstanceManager] Registered server for panel ${panelId}`);
  }

  /**
   * Unregister a server launcher when panel closes.
   *
   * @param panelId - The panel ID
   */
  unregister(panelId: string): void {
    if (this.instances.delete(panelId)) {
      console.log(`[ServerInstanceManager] Unregistered server for panel ${panelId}`);
    }
  }

  /**
   * Get the server launcher for a specific panel.
   *
   * @param panelId - The panel ID
   * @returns The launcher instance, or undefined if not found
   */
  getInstance(panelId: string): A2AServerLauncher | undefined {
    return this.instances.get(panelId);
  }

  /**
   * Get all registered server instances.
   *
   * @returns Map of panelId to launcher instances
   */
  getAllInstances(): Map<string, A2AServerLauncher> {
    return new Map(this.instances);
  }

  /**
   * Get the count of currently running servers.
   *
   * @returns Number of servers in RUNNING state
   */
  getRunningCount(): number {
    let count = 0;
    for (const launcher of this.instances.values()) {
      if (launcher.isServerRunning()) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get the count of registered server instances (running or not).
   *
   * @returns Total number of registered instances
   */
  getInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Stop all running servers.
   * Useful during extension deactivation.
   *
   * @returns Promise that resolves when all servers stopped
   */
  async stopAll(): Promise<void> {
    console.log(`[ServerInstanceManager] Stopping all ${this.instances.size} servers`);
    const stopPromises: Promise<void>[] = [];

    for (const launcher of this.instances.values()) {
      if (launcher.isServerRunning()) {
        stopPromises.push(launcher.stopServer());
      }
    }

    await Promise.all(stopPromises);
    console.log('[ServerInstanceManager] All servers stopped');
  }

  /**
   * Get server status for all instances.
   *
   * @returns Array of server status objects
   */
  getAllServerStatus(): Array<{
    panelId: string;
    isRunning: boolean;
    port?: number;
    filePath?: string;
  }> {
    const statuses: Array<any> = [];

    for (const [panelId, launcher] of this.instances.entries()) {
      statuses.push({
        panelId,
        isRunning: launcher.isServerRunning(),
        port: launcher.getCurrentPort(),
        filePath: launcher.getCurrentFilePath()
      });
    }

    return statuses;
  }

  /**
   * Check if any server is running.
   *
   * @returns True if at least one server is running
   */
  hasRunningServers(): boolean {
    return this.getRunningCount() > 0;
  }
}
```

---

## Modified Files

### 1. `src/execution/A2AServerLauncher.ts`

**Changes Required**:

#### Step 1: Remove Singleton Enforcement

**Line 63-65**: Remove the global server running check

```typescript
// ❌ REMOVE THIS ENTIRE BLOCK
if (this.isServerRunning()) {
  throw new Error('Server is already running. Stop it first.');
}
```

#### Step 2: Add Instance Properties

**After line 10**: Add panelId and instanceId

```typescript
// ✅ ADD THESE
private readonly panelId: string;
private readonly instanceId: string;
```

#### Step 3: Update Constructor

**Line 13-17**: Add panelId parameter

```typescript
// BEFORE
constructor(
  onStatusChange: (status: ServerStatus) => void,
  outputChannel?: vscode.OutputChannel
) {
  this.onStatusChange = onStatusChange;
  this.outputChannel = outputChannel;
  this.terminalManager = new TerminalManager(outputChannel);
}

// AFTER
constructor(
  panelId: string,  // ✅ ADD THIS
  onStatusChange: (status: ServerStatus) => void,
  outputChannel?: vscode.OutputChannel
) {
  this.panelId = panelId;
  this.instanceId = `server-${panelId}`;
  this.onStatusChange = onStatusChange;
  this.outputChannel = outputChannel;
  this.terminalManager = new TerminalManager(outputChannel);

  console.log(`[A2AServerLauncher] Created instance ${this.instanceId}`);
}
```

#### Step 4: Update launchServer() Method

**Line 48-94**: Change to instance-scoped check

```typescript
public async launchServer(configPath: string, port: number = 3000): Promise<void> {
  try {
    // ✅ CHANGED: Check only this instance, not global
    if (this.currentPort !== undefined) {
      throw new Error(
        `Server already running on port ${this.currentPort} for panel ${this.panelId.slice(-6)}`
      );
    }

    // Validate config file
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    // Validate JSON
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Invalid JSON in config file: ${error}`);
    }

    // Create terminal with instance identifier
    const filename = path.basename(configPath);
    const terminalName = `A2A Server [${this.panelId.slice(-6)}] - ${filename} (Port ${port})`;  // ✅ CHANGED

    const terminal = await this.terminalManager.createTerminal(
      terminalName,
      this.panelId  // ✅ ADD panelId
    );

    // ... rest of implementation (unchanged)
  } catch (error) {
    this.updateStatus(ServerState.ERROR);
    throw error;
  }
}
```

#### Step 5: Update Status Callbacks

**Throughout file**: Include panelId in status updates

```typescript
private updateStatus(state: ServerState) {
  this.onStatusChange({
    state,
    panelId: this.panelId,  // ✅ ADD THIS
    port: this.currentPort,
    filePath: this.currentFilePath,
    startTime: this.startTime
  });
}
```

#### Step 6: Add Getter Methods

**End of class**: Add public getters

```typescript
// ✅ ADD THESE METHODS

/**
 * Get the panel ID this server is associated with.
 */
public getPanelId(): string {
  return this.panelId;
}

/**
 * Get the unique instance ID.
 */
public getInstanceId(): string {
  return this.instanceId;
}

/**
 * Get the currently allocated port.
 */
public getCurrentPort(): number | undefined {
  return this.currentPort;
}

/**
 * Get the current config file path.
 */
public getCurrentFilePath(): string | undefined {
  return this.currentFilePath;
}
```

---

### 2. `src/execution/TerminalManager.ts`

**Changes Required**:

#### Update Terminal Naming

**Line 15-20**: Include panelId in terminal name

```typescript
// BEFORE
public async createTerminal(
  name: string,
  cwd?: string
): Promise<vscode.Terminal> {
  const terminal = vscode.window.createTerminal({ name, cwd });
  // ...
}

// AFTER
public async createTerminal(
  name: string,
  panelId?: string,  // ✅ ADD THIS
  cwd?: string
): Promise<vscode.Terminal> {
  // Terminal name already includes panelId from caller
  const terminal = vscode.window.createTerminal({ name, cwd });

  // Track terminal for this panel
  if (panelId) {
    console.log(`[TerminalManager] Created terminal for panel ${panelId}: ${name}`);
  }

  // ... rest of implementation
}
```

---

### 3. `src/panels/WorkflowEditorPanel.ts`

**Changes Required**:

#### Step 1: Update Constructor

**In constructor**: Pass panelId to A2AServerLauncher

```typescript
constructor(
  panelId: string,
  panel: WebviewPanel,
  extensionUri: Uri,
  filePath: string
) {
  this.panelId = panelId;
  this._panel = panel;
  this._extensionUri = extensionUri;
  this._filePath = filePath;

  // Pre-allocate port
  const portManager = getPortManager();
  portManager.allocatePort(this.panelId).then(port => {
    this.assignedPort = port;
    console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} assigned port ${port}`);
  });

  // ✅ CHANGED: Pass panelId to A2AServerLauncher
  this._serverLauncher = new A2AServerLauncher(
    this.panelId,  // ✅ ADD THIS
    (status) => this._handleServerStatusChange(status),
    this._outputChannel
  );

  // ✅ ADD: Register with ServerInstanceManager
  const serverManager = getServerInstanceManager();
  serverManager.register(this.panelId, this._serverLauncher);

  // ... rest of constructor
}
```

#### Step 2: Update _startA2AServer()

**Line 234-249**: Use pre-allocated port

```typescript
// BEFORE
private async _startA2AServer(filePath: string, port?: number): Promise<void> {
  const serverPort = port || 3000;
  await this._serverLauncher.launchServer(filePath, serverPort);
}

// AFTER
private async _startA2AServer(filePath: string, port?: number): Promise<void> {
  // ✅ CHANGED: Use pre-allocated port if no user override
  const serverPort = port || this.assignedPort;

  if (!serverPort) {
    vscode.window.showErrorMessage('No port allocated for this panel.');
    return;
  }

  try {
    await this._serverLauncher.launchServer(filePath, serverPort);
    console.log(`[WorkflowEditorPanel] Server started on port ${serverPort}`);
  } catch (error) {
    console.error(`[WorkflowEditorPanel] Failed to start server:`, error);
    vscode.window.showErrorMessage(`Failed to start A2A server: ${error}`);
  }
}
```

#### Step 3: Update dispose()

**In dispose()**: Unregister from ServerInstanceManager

```typescript
public dispose() {
  console.log(`[WorkflowEditorPanel] Disposing panel ${this.panelId.slice(-6)}`);

  // Stop server if running
  if (this._serverLauncher.isServerRunning()) {
    console.log(`[WorkflowEditorPanel] Stopping server for panel ${this.panelId.slice(-6)}`);
    this._serverLauncher.stopServer();
  }

  // ✅ ADD: Unregister from ServerInstanceManager
  const serverManager = getServerInstanceManager();
  serverManager.unregister(this.panelId);

  // Release port
  const portManager = getPortManager();
  if (this.assignedPort !== undefined) {
    portManager.releasePort(this.panelId);
  }

  // Unregister from PanelRegistry
  const panelRegistry = getPanelRegistry();
  panelRegistry.unregister(this.panelId);

  // ... existing cleanup
}
```

---

### 4. `src/execution/types.ts`

**Changes Required**:

#### Update ServerStatus Interface

**Add panelId field**:

```typescript
export interface ServerStatus {
  state: ServerState;
  panelId?: string;  // ✅ ADD THIS
  port?: number;
  filePath?: string;
  startTime?: number;
  error?: string;
}
```

---

### 5. `src/extension.ts`

**Changes Required**:

#### Step 1: Add Import

```typescript
import { ServerInstanceManager } from './execution/ServerInstanceManager';
```

#### Step 2: Add Global Instance

```typescript
let serverInstanceManager: ServerInstanceManager;

export function getServerInstanceManager(): ServerInstanceManager {
  if (!serverInstanceManager) {
    throw new Error('ServerInstanceManager not initialized');
  }
  return serverInstanceManager;
}
```

#### Step 3: Initialize in activate()

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Initialize managers
  panelRegistry = new PanelRegistry();
  portManager = new PortManager();
  serverInstanceManager = new ServerInstanceManager();  // ✅ ADD THIS

  console.log('[Extension] Initialized all managers');

  // ... rest of activation
}
```

#### Step 4: Update deactivate()

```typescript
export async function deactivate() {
  // Stop all servers
  if (serverInstanceManager) {
    await serverInstanceManager.stopAll();  // ✅ ADD THIS
  }

  // Dispose all panels
  if (panelRegistry) {
    panelRegistry.disposeAll();
  }

  console.log('[Extension] Deactivated');
}
```

---

## Port Allocation Flow

### Scenario: Opening 3 Panels

```
1. User opens workflow1.json
   → Panel wf-abc123 created
   → PortManager allocates port 3000
   → Panel.assignedPort = 3000
   → ServerInstanceManager registers launcher

2. User opens workflow2.json
   → Panel wf-def456 created
   → PortManager allocates port 3001
   → Panel.assignedPort = 3001
   → ServerInstanceManager registers launcher

3. User opens workflow3.json
   → Panel wf-ghi789 created
   → PortManager allocates port 3002
   → Panel.assignedPort = 3002
   → ServerInstanceManager registers launcher

4. User starts server in Panel 1
   → A2AServerLauncher.launchServer(filePath, 3000)
   → Server starts on port 3000
   → Terminal: "A2A Server [abc123] - workflow1.json (Port 3000)"

5. User starts server in Panel 2
   → A2AServerLauncher.launchServer(filePath, 3001)
   → Server starts on port 3001
   → No conflict with Panel 1's server

6. User closes Panel 2
   → Panel.dispose() called
   → Server stops (port 3001)
   → ServerInstanceManager.unregister('wf-def456')
   → PortManager.releasePort('wf-def456')
   → Port 3001 now available for reuse

7. User opens workflow4.json
   → Panel wf-jkl012 created
   → PortManager allocates port 3001 (lowest available)
   → Panel.assignedPort = 3001
```

---

## Testing

### Test Scenario 1: Multiple Servers

1. Open 3 workflow files
2. Start A2A server in each panel (toolbar button)
3. Check terminal windows

**Expected**:
- ✅ Three separate terminals created
- ✅ Terminal names: "A2A Server [abc123] - ...", "[def456] - ...", "[ghi789] - ..."
- ✅ Ports: 3000, 3001, 3002
- ✅ All servers running independently

### Test Scenario 2: Server Independence

1. Start servers on panels 1, 2, 3
2. Stop server in panel 2 only
3. Send API requests to all servers

**Expected**:
- ✅ Panel 1 server still responding
- ✅ Panel 2 server stopped
- ✅ Panel 3 server still responding
- ✅ No interference between servers

### Test Scenario 3: Port Allocation

1. Open 3 panels (ports 3000, 3001, 3002)
2. Close panel 2 (port 3001 released)
3. Open new panel

**Expected**:
- ✅ New panel gets port 3001 (not 3003)
- ✅ Port recycling works correctly

### Test Scenario 4: Concurrent API Requests

1. Start servers on 3 panels
2. Use curl/Postman to send requests to all servers simultaneously:
   ```bash
   curl http://localhost:3000/.well-known/agent.json &
   curl http://localhost:3001/.well-known/agent.json &
   curl http://localhost:3002/.well-known/agent.json &
   ```

**Expected**:
- ✅ All requests succeed
- ✅ Each returns correct workflow config
- ✅ No cross-contamination

### Test Scenario 5: Server Status Tracking

1. Open 4 panels
2. Start servers on panels 1, 3, 4 (skip panel 2)
3. Call `serverInstanceManager.getRunningCount()`

**Expected**:
- ✅ Returns 3
- ✅ getAllServerStatus() shows correct status for each

### Test Scenario 6: Panel Disposal with Running Server

1. Open panel and start server
2. Close panel while server is running

**Expected**:
- ✅ Server stops automatically
- ✅ Port released
- ✅ No zombie processes
- ✅ Terminal closes

### Test Scenario 7: Extension Deactivation

1. Open 3 panels with running servers
2. Reload VSCode window (Ctrl+R in dev host)

**Expected**:
- ✅ All servers stop via deactivate()
- ✅ All ports released
- ✅ Clean shutdown

---

## Success Criteria

- ✅ Multiple A2A servers run simultaneously on different ports
- ✅ No port conflicts between instances
- ✅ Servers are fully independent (no shared state)
- ✅ Terminal names include panel identifier
- ✅ Port cleanup works correctly on panel close
- ✅ ServerInstanceManager tracks all instances
- ✅ Port recycling prioritizes lowest available
- ✅ Server status updates include panelId

---

## Debugging

### Check Running Servers

```typescript
// Add to extension.ts
vscode.commands.registerCommand('kudosflow.debugServers', () => {
  const manager = getServerInstanceManager();
  const statuses = manager.getAllServerStatus();

  console.log(`[Debug] Active server instances: ${statuses.length}`);
  statuses.forEach(status => {
    console.log(`  - Panel ${status.panelId.slice(-6)}: ${status.isRunning ? 'RUNNING' : 'STOPPED'} on port ${status.port}`);
  });

  vscode.window.showInformationMessage(
    `${manager.getRunningCount()} of ${manager.getInstanceCount()} servers running`
  );
});
```

### Check System Ports

```bash
# macOS/Linux: Check if ports are actually in use
lsof -i :3000-3010

# Windows: Check port usage
netstat -ano | findstr ":300"
```

### Monitor Terminal Output

Enable verbose logging in A2AServerLauncher:

```typescript
private log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${this.instanceId}] ${message}`);
  if (this.outputChannel) {
    this.outputChannel.appendLine(`[${this.instanceId}] ${message}`);
  }
}
```

---

## Common Issues

### Issue: Server won't start on allocated port

**Cause**: Port was allocated but became unavailable before server start
**Solution**: Add retry logic in _startA2AServer():

```typescript
private async _startA2AServer(filePath: string, port?: number): Promise<void> {
  let serverPort = port || this.assignedPort;

  // Verify port still available
  const portManager = getPortManager();
  const isAvailable = await portManager.isPortAvailable(serverPort);

  if (!isAvailable) {
    // Re-allocate
    serverPort = await portManager.allocatePort(this.panelId);
    this.assignedPort = serverPort;
  }

  await this._serverLauncher.launchServer(filePath, serverPort);
}
```

### Issue: Terminal doesn't close when panel closes

**Cause**: Terminal reference not properly disposed
**Solution**: Ensure TerminalManager.dispose() is called

### Issue: Multiple servers show in terminals but only one responds

**Cause**: All servers bound to same port (config error)
**Solution**: Verify each panel's assignedPort is unique

---

## Next Steps

After completing Phase 13B:

1. **Verify** all success criteria met
2. **Test** all scenarios pass
3. **Check** no zombie processes remain after tests
4. **Commit** with message: "Phase 13B: Server Instance Management"
5. **Proceed** to [Phase 13C: Message Routing](PHASE13C_MESSAGE_ROUTING.md)

---

## Time Breakdown

- **ServerInstanceManager implementation**: 2 hours
- **A2AServerLauncher refactoring**: 2 hours
- **Port allocation integration**: 2 hours
- **Testing and debugging**: 2 hours
- **Total**: 6-8 hours
