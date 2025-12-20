# Phase 13A: Core Multi-Instance Architecture

**Status**: ⬜ Not Started
**Estimated Time**: 8-10 hours
**Dependencies**: None

## Overview

Remove singleton pattern from WorkflowEditorPanel and implement a panel registry system with automatic port management. This is the foundational phase that enables all subsequent multi-instance features.

## Objective

Transform the singleton-based WorkflowEditorPanel into a multi-instance architecture where multiple workflow editors can be opened simultaneously, each with its own unique panel ID and pre-allocated port.

## Architecture Changes

### Before (Singleton)

```typescript
// WorkflowEditorPanel.ts
export class WorkflowEditorPanel {
  public static currentPanel: WorkflowEditorPanel | undefined;  // ❌ Singleton

  public static render(extensionUri: Uri, filePath: string) {
    if (WorkflowEditorPanel.currentPanel) {
      // Reuse existing panel
      WorkflowEditorPanel.currentPanel._panel.reveal(ViewColumn.One);
      return;
    }
    // Create new panel
    WorkflowEditorPanel.currentPanel = new WorkflowEditorPanel(...);
  }
}
```

### After (Multi-Instance)

```typescript
// WorkflowEditorPanel.ts
export class WorkflowEditorPanel {
  private readonly panelId: string;  // ✅ Unique per instance
  private assignedPort: number;       // ✅ Pre-allocated port

  public static render(extensionUri: Uri, filePath: string): WorkflowEditorPanel {
    const panelRegistry = getPanelRegistry();
    const panelId = panelRegistry.generateId();  // Generate unique ID

    const panel = window.createWebviewPanel(
      `workflowEditor-${panelId}`,  // ✅ Unique viewType
      `Workflow: ${path.basename(filePath)}`,
      ViewColumn.One,
      // ...
    );

    const editorPanel = new WorkflowEditorPanel(panelId, panel, extensionUri, filePath);
    panelRegistry.register(editorPanel);  // ✅ Register in global registry
    return editorPanel;
  }
}
```

---

## New Files

### 1. `src/managers/PanelRegistry.ts`

Central registry to track and manage all active WorkflowEditorPanel instances.

#### Features

- **Panel Tracking**: Maintain a Map of all active panels (`Map<panelId, WorkflowEditorPanel>`)
- **ID Generation**: Generate unique panel IDs in format `wf-{timestamp}-{random}`
- **Lookup Operations**: Find panels by ID, file path, or webview reference
- **Lifecycle Management**: Register/unregister panels automatically
- **Event Emissions**: Notify when panels are added or removed (future use)

#### Interface

```typescript
import { Webview } from 'vscode';
import { WorkflowEditorPanel } from '../panels/WorkflowEditorPanel';

/**
 * Central registry for tracking all active WorkflowEditorPanel instances.
 *
 * This singleton class maintains a registry of all open workflow editor panels,
 * enabling multi-instance support and proper resource management.
 *
 * @example
 * ```typescript
 * const registry = new PanelRegistry();
 * const panelId = registry.generateId();
 * const panel = new WorkflowEditorPanel(panelId, ...);
 * registry.register(panel);
 * ```
 */
export class PanelRegistry {
  private panels: Map<string, WorkflowEditorPanel>;

  constructor() {
    this.panels = new Map();
  }

  /**
   * Generate a unique panel ID.
   * Format: wf-{timestamp}-{random}
   *
   * @returns A unique panel identifier
   *
   * @example
   * ```typescript
   * const id = registry.generateId();  // "wf-1703012345678-a1b2c3"
   * ```
   */
  generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `wf-${timestamp}-${random}`;
  }

  /**
   * Register a new panel instance in the registry.
   *
   * @param panel - The WorkflowEditorPanel instance to register
   * @throws Error if a panel with the same ID already exists
   */
  register(panel: WorkflowEditorPanel): void {
    const panelId = panel.getPanelId();
    if (this.panels.has(panelId)) {
      throw new Error(`Panel with ID ${panelId} already registered`);
    }
    this.panels.set(panelId, panel);
    console.log(`[PanelRegistry] Registered panel: ${panelId}`);
  }

  /**
   * Unregister a panel instance from the registry.
   *
   * @param panelId - The ID of the panel to unregister
   */
  unregister(panelId: string): void {
    if (this.panels.delete(panelId)) {
      console.log(`[PanelRegistry] Unregistered panel: ${panelId}`);
    }
  }

  /**
   * Get a panel by its panel ID.
   *
   * @param panelId - The panel ID to look up
   * @returns The panel instance, or undefined if not found
   */
  getPanel(panelId: string): WorkflowEditorPanel | undefined {
    return this.panels.get(panelId);
  }

  /**
   * Get a panel by its file path.
   * Returns the first panel editing the specified file.
   *
   * @param filePath - The absolute file path
   * @returns The panel instance, or undefined if not found
   */
  getPanelByFilePath(filePath: string): WorkflowEditorPanel | undefined {
    for (const panel of this.panels.values()) {
      if (panel.getFilePath() === filePath) {
        return panel;
      }
    }
    return undefined;
  }

  /**
   * Get a panel by its webview reference.
   *
   * @param webview - The webview instance
   * @returns The panel instance, or undefined if not found
   */
  getPanelByWebview(webview: Webview): WorkflowEditorPanel | undefined {
    for (const panel of this.panels.values()) {
      if (panel.getWebview() === webview) {
        return panel;
      }
    }
    return undefined;
  }

  /**
   * Get all active panel instances.
   *
   * @returns Array of all registered panels
   */
  getAllPanels(): WorkflowEditorPanel[] {
    return Array.from(this.panels.values());
  }

  /**
   * Get the number of active panels.
   *
   * @returns Count of registered panels
   */
  getPanelCount(): number {
    return this.panels.size;
  }

  /**
   * Dispose all panels and clear the registry.
   * Useful during extension deactivation.
   */
  disposeAll(): void {
    console.log(`[PanelRegistry] Disposing all ${this.panels.size} panels`);
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();
  }

  /**
   * Check if a panel with the given ID exists.
   *
   * @param panelId - The panel ID to check
   * @returns True if panel exists, false otherwise
   */
  hasPanel(panelId: string): boolean {
    return this.panels.has(panelId);
  }
}
```

#### Implementation Notes

- **Thread Safety**: Since VSCode extensions run in single-threaded Node.js, no additional locking needed
- **Memory Management**: Panels automatically unregister on disposal
- **Lookup Performance**: O(1) for ID lookup, O(n) for file path/webview lookup
- **ID Collision**: Virtually impossible with timestamp + random combination

---

### 2. `src/managers/PortManager.ts`

Automatic port allocation and management for A2A servers.

#### Features

- **Automatic Allocation**: Assign ports starting from 3000, incrementing for each new panel
- **Port Availability**: Check system-level port availability before allocation
- **Port Recycling**: Reuse released ports (lowest available first)
- **Conflict Detection**: Prevent allocation of already-used ports
- **Mapping**: Maintain panelId → port associations

#### Interface

```typescript
import * as net from 'net';

/**
 * Manages automatic port allocation for A2A server instances.
 *
 * Ensures each panel gets a unique, available port starting from basePort (3000).
 * Automatically checks system availability and recycles released ports.
 *
 * @example
 * ```typescript
 * const portManager = new PortManager();
 * const port = await portManager.allocatePort('wf-abc123');  // Returns 3000
 * // ... use port ...
 * portManager.releasePort('wf-abc123');  // Release for reuse
 * ```
 */
export class PortManager {
  private basePort: number = 3000;
  private allocatedPorts: Map<string, number>;  // panelId → port
  private usedPorts: Set<number>;  // Track all allocated ports

  constructor(basePort: number = 3000) {
    this.basePort = basePort;
    this.allocatedPorts = new Map();
    this.usedPorts = new Set();
  }

  /**
   * Allocate an available port for a panel.
   *
   * Searches for the lowest available port starting from basePort,
   * checking both internal allocations and system availability.
   *
   * @param panelId - The panel ID requesting a port
   * @returns The allocated port number
   * @throws Error if unable to allocate a port after MAX_ATTEMPTS
   */
  async allocatePort(panelId: string): Promise<number> {
    // Check if already allocated
    const existingPort = this.allocatedPorts.get(panelId);
    if (existingPort !== undefined) {
      console.log(`[PortManager] Panel ${panelId} already has port ${existingPort}`);
      return existingPort;
    }

    // Find next available port
    const MAX_ATTEMPTS = 100;
    let port = this.basePort;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        // Port is available
        this.allocatedPorts.set(panelId, port);
        this.usedPorts.add(port);
        console.log(`[PortManager] Allocated port ${port} to panel ${panelId}`);
        return port;
      }
      port++;
      attempts++;
    }

    throw new Error(`Unable to allocate port after ${MAX_ATTEMPTS} attempts`);
  }

  /**
   * Release a port when panel closes.
   * Makes the port available for reuse.
   *
   * @param panelId - The panel ID releasing its port
   */
  releasePort(panelId: string): void {
    const port = this.allocatedPorts.get(panelId);
    if (port !== undefined) {
      this.allocatedPorts.delete(panelId);
      this.usedPorts.delete(port);
      console.log(`[PortManager] Released port ${port} from panel ${panelId}`);
    }
  }

  /**
   * Get the allocated port for a panel.
   *
   * @param panelId - The panel ID
   * @returns The allocated port, or undefined if not allocated
   */
  getPort(panelId: string): number | undefined {
    return this.allocatedPorts.get(panelId);
  }

  /**
   * Check if a specific port is currently allocated.
   *
   * @param port - The port number to check
   * @returns True if port is allocated, false otherwise
   */
  isPortAllocated(port: number): boolean {
    return this.usedPorts.has(port);
  }

  /**
   * Get all currently allocated ports.
   *
   * @returns Array of allocated port numbers
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.usedPorts);
  }

  /**
   * Get port allocation map.
   *
   * @returns Map of panelId to port assignments
   */
  getPortMap(): Map<string, number> {
    return new Map(this.allocatedPorts);
  }

  /**
   * Check if a port is available on the system.
   *
   * Attempts to bind to the port to verify availability.
   *
   * @param port - The port number to check
   * @returns Promise resolving to true if available, false if in use
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          // Other error, consider unavailable
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Reset all port allocations.
   * Useful for testing or cleanup.
   */
  reset(): void {
    this.allocatedPorts.clear();
    this.usedPorts.clear();
    console.log('[PortManager] Reset all port allocations');
  }
}
```

#### Port Allocation Strategy

```
Panel 1 opens → Port 3000 allocated
Panel 2 opens → Port 3001 allocated
Panel 3 opens → Port 3002 allocated
Panel 2 closes → Port 3001 released
Panel 4 opens → Port 3001 allocated (lowest available)
Panel 5 opens → Port 3003 allocated
```

#### Implementation Notes

- **System Check**: Uses Node.js `net` module to verify port availability
- **Timeout**: Port check includes implicit timeout via server.listen()
- **Localhost Only**: Binds to 127.0.0.1 to avoid network exposure
- **Error Handling**: Gracefully handles EADDRINUSE and other errors
- **Performance**: O(n) where n is number of ports to try (typically 1-2)

---

## Modified Files

### 1. `src/panels/WorkflowEditorPanel.ts`

**Changes Required**:

#### Step 1: Remove Singleton Pattern

**Line 25-26**: Remove static currentPanel property

```typescript
// ❌ REMOVE THIS
public static currentPanel: WorkflowEditorPanel | undefined;
```

#### Step 2: Add Instance Properties

**After line 24**: Add panelId and assignedPort

```typescript
// ✅ ADD THIS
private readonly panelId: string;
private assignedPort: number | undefined;
```

#### Step 3: Update Constructor Signature

**Line 45-50**: Change constructor from private to public, add panelId parameter

```typescript
// BEFORE
private constructor(panel: WebviewPanel, extensionUri: Uri, filePath: string) {
  this._panel = panel;
  this._extensionUri = extensionUri;
  this._filePath = filePath;
  // ...
}

// AFTER
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

  // Pre-allocate port for this panel
  const portManager = getPortManager();
  portManager.allocatePort(this.panelId).then(port => {
    this.assignedPort = port;
    console.log(`[WorkflowEditorPanel] Panel ${this.panelId} assigned port ${port}`);
  });

  // ... rest of constructor
}
```

#### Step 4: Refactor render() Method

**Line 68-97**: Complete rewrite to always create new instances

```typescript
// BEFORE
public static render(extensionUri: Uri, filePath: string) {
  if (WorkflowEditorPanel.currentPanel) {
    WorkflowEditorPanel.currentPanel._panel.reveal(ViewColumn.One);
    WorkflowEditorPanel.currentPanel._filePath = filePath;
    WorkflowEditorPanel.currentPanel._loadWorkflow();
    return;
  }

  const panel = window.createWebviewPanel(
    "workflowEditor",  // Fixed viewType
    "Workflow Editor",
    ViewColumn.One,
    // ...
  );

  WorkflowEditorPanel.currentPanel = new WorkflowEditorPanel(
    panel,
    extensionUri,
    filePath
  );
}

// AFTER
public static render(extensionUri: Uri, filePath: string): WorkflowEditorPanel {
  const panelRegistry = getPanelRegistry();
  const panelId = panelRegistry.generateId();

  const panel = window.createWebviewPanel(
    `workflowEditor-${panelId}`,  // ✅ Unique viewType per panel
    `Workflow: ${path.basename(filePath)}`,  // ✅ Show filename in title
    ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        Uri.joinPath(extensionUri, "out"),
        Uri.joinPath(extensionUri, "webview-ui/build")
      ]
    }
  );

  // Create panel instance
  const editorPanel = new WorkflowEditorPanel(
    panelId,
    panel,
    extensionUri,
    filePath
  );

  // Register in global registry
  panelRegistry.register(editorPanel);

  return editorPanel;
}
```

#### Step 5: Update dispose() Method

**Line 102-126**: Add registry and port cleanup

```typescript
// BEFORE
public dispose() {
  WorkflowEditorPanel.currentPanel = undefined;

  // Stop server if running
  if (this._serverLauncher.isServerRunning()) {
    this._serverLauncher.stopServer();
  }

  // ... cleanup
}

// AFTER
public dispose() {
  // Unregister from panel registry
  const panelRegistry = getPanelRegistry();
  panelRegistry.unregister(this.panelId);

  // Stop server if running
  if (this._serverLauncher.isServerRunning()) {
    this._serverLauncher.stopServer();
  }

  // Release allocated port
  const portManager = getPortManager();
  if (this.assignedPort !== undefined) {
    portManager.releasePort(this.panelId);
  }

  // ... existing cleanup
  this._panel.dispose();

  while (this._disposables.length) {
    const disposable = this._disposables.pop();
    if (disposable) {
      disposable.dispose();
    }
  }
}
```

#### Step 6: Add Getter Methods

**After line 126**: Add public getters for registry access

```typescript
// ✅ ADD THESE METHODS

/**
 * Get the panel ID for this instance.
 */
public getPanelId(): string {
  return this.panelId;
}

/**
 * Get the file path being edited.
 */
public getFilePath(): string {
  return this._filePath;
}

/**
 * Get the webview instance.
 */
public getWebview(): Webview {
  return this._panel.webview;
}

/**
 * Get the assigned port for this panel's A2A server.
 */
public getAssignedPort(): number | undefined {
  return this.assignedPort;
}

/**
 * Reveal this panel in the editor.
 */
public reveal(): void {
  this._panel.reveal(ViewColumn.One);
}
```

#### Step 7: Update Message Handling

**Line 131-148 (_loadWorkflow)**: Add panelId to messages

```typescript
private _loadWorkflow() {
  try {
    const workflowData = fs.readFileSync(this._filePath, 'utf-8');
    const workflow = JSON.parse(workflowData);

    this._panel.webview.postMessage({
      command: 'loadWorkflow',
      panelId: this.panelId,  // ✅ ADD panelId
      data: workflow,
      filePath: this._filePath
    });
  } catch (error) {
    // ... error handling
  }
}
```

**Apply same pattern to all postMessage() calls**:
- `serverStatus` messages
- `chatMessage` messages
- `workflowExecutionUpdate` messages
- `saveSuccess` / `saveError` messages
- etc.

---

### 2. `src/extension.ts`

**Changes Required**:

#### Step 1: Add Import Statements

**Top of file**: Import new managers

```typescript
import { PanelRegistry } from './managers/PanelRegistry';
import { PortManager } from './managers/PortManager';
```

#### Step 2: Add Global Instances

**After imports, before activate()**: Declare global variables

```typescript
// ✅ ADD THESE
let panelRegistry: PanelRegistry;
let portManager: PortManager;

/**
 * Get the global PanelRegistry instance.
 * @returns The panel registry
 */
export function getPanelRegistry(): PanelRegistry {
  if (!panelRegistry) {
    throw new Error('PanelRegistry not initialized');
  }
  return panelRegistry;
}

/**
 * Get the global PortManager instance.
 * @returns The port manager
 */
export function getPortManager(): PortManager {
  if (!portManager) {
    throw new Error('PortManager not initialized');
  }
  return portManager;
}
```

#### Step 3: Initialize in activate()

**In activate() function**: Initialize managers

```typescript
export function activate(context: vscode.ExtensionContext) {
  // ✅ ADD THIS - Initialize managers
  panelRegistry = new PanelRegistry();
  portManager = new PortManager();

  console.log('[Extension] Initialized PanelRegistry and PortManager');

  // Register Workflow Editor command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kudosflow.openWorkflowEditor',
      (uri: vscode.Uri) => {
        const filePath = uri.fsPath;
        WorkflowEditorPanel.render(context.extensionUri, filePath);
      }
    )
  );

  // ... rest of activation
}
```

#### Step 4: Update deactivate()

**In deactivate() function**: Clean up all panels

```typescript
export function deactivate() {
  // ✅ ADD THIS - Dispose all panels
  if (panelRegistry) {
    panelRegistry.disposeAll();
  }

  console.log('[Extension] Deactivated, all panels disposed');
}
```

---

## Message Format Changes

### Extension → Webview

All messages from extension to webview must include `panelId`:

```typescript
// BEFORE
webview.postMessage({
  command: 'loadWorkflow',
  data: workflowData,
  filePath: '/path/to/file.json'
});

// AFTER
webview.postMessage({
  command: 'loadWorkflow',
  panelId: 'wf-1703012345678-a1b2c3',  // ✅ ADD THIS
  data: workflowData,
  filePath: '/path/to/file.json'
});
```

### Webview → Extension

Webview messages will add panelId in Phase 13C. For now, extension-side filtering is not required.

---

## Testing

### Test Scenario 1: Basic Multi-Instance

1. Open VSCode
2. Right-click `json/workflow1.json` → "Open in Workflow Editor"
3. Right-click `json/workflow2.json` → "Open in Workflow Editor"
4. Right-click `json/workflow3.json` → "Open in Workflow Editor"

**Expected**:
- ✅ Three separate editor tabs open
- ✅ Each has unique viewType (check VSCode tab titles)
- ✅ Each loads its own workflow correctly
- ✅ PanelRegistry contains 3 panels

### Test Scenario 2: Panel ID Generation

1. Open 5 workflow files
2. Check console logs for generated panel IDs

**Expected**:
- ✅ All IDs unique
- ✅ Format: `wf-{timestamp}-{random}`
- ✅ No collisions

### Test Scenario 3: Port Allocation

1. Open 3 workflow files
2. Check console logs for port assignments

**Expected**:
- ✅ Ports: 3000, 3001, 3002
- ✅ Each panel gets unique port
- ✅ Ports allocated even before server starts

### Test Scenario 4: Panel Cleanup

1. Open 3 workflow files
2. Close middle panel
3. Check PanelRegistry

**Expected**:
- ✅ Only 2 panels remain in registry
- ✅ Port from closed panel released
- ✅ Other panels unaffected

### Test Scenario 5: Port Recycling

1. Open panels on ports 3000, 3001, 3002
2. Close panel with port 3001
3. Open new panel

**Expected**:
- ✅ New panel gets port 3001 (lowest available)
- ✅ Not port 3003

### Test Scenario 6: Extension Deactivation

1. Open 3 workflow files
2. Reload VSCode window (Ctrl+R in dev host)

**Expected**:
- ✅ All panels dispose cleanly
- ✅ No memory leaks
- ✅ Ports released

---

## Success Criteria

- ✅ Multiple workflow editors can open simultaneously
- ✅ Each panel has unique panelId and viewType
- ✅ PanelRegistry correctly tracks all active panels
- ✅ PortManager correctly allocates and releases ports
- ✅ Panels dispose cleanly without affecting others
- ✅ No singleton pattern remains
- ✅ All messages include panelId
- ✅ Console logs show proper lifecycle events

---

## Debugging Tips

### Check Panel Registry

Add to extension.ts for debugging:

```typescript
vscode.commands.registerCommand('kudosflow.debugPanelRegistry', () => {
  const panels = panelRegistry.getAllPanels();
  console.log(`[Debug] Active panels: ${panels.length}`);
  panels.forEach(panel => {
    console.log(`  - ${panel.getPanelId()}: ${panel.getFilePath()}`);
  });
});
```

### Check Port Allocations

```typescript
vscode.commands.registerCommand('kudosflow.debugPortManager', () => {
  const ports = portManager.getAllocatedPorts();
  console.log(`[Debug] Allocated ports: ${ports.join(', ')}`);

  const map = portManager.getPortMap();
  map.forEach((port, panelId) => {
    console.log(`  - ${panelId.slice(-6)}: ${port}`);
  });
});
```

### Enable Verbose Logging

Add to each class:

```typescript
private readonly DEBUG = true;

private log(...args: any[]) {
  if (this.DEBUG) {
    console.log(`[${this.constructor.name}]`, ...args);
  }
}
```

---

## Common Issues

### Issue: "Panel with ID already registered"

**Cause**: Attempting to register same panel twice
**Solution**: Check dispose() is called before re-registering

### Issue: "Unable to allocate port after 100 attempts"

**Cause**: All ports 3000-3099 are in use
**Solution**:
- Close unused panels
- Check for zombie processes: `lsof -i :3000-3100`
- Increase MAX_ATTEMPTS or change basePort

### Issue: Panels don't dispose on window reload

**Cause**: deactivate() not called properly
**Solution**: Ensure deactivate() is exported and calls disposeAll()

### Issue: Port allocated but server won't start

**Cause**: Port became unavailable between allocation and server start
**Solution**: Will be handled in Phase 13B with retry logic

---

## Next Steps

After completing Phase 13A:

1. **Verify** all success criteria are met
2. **Test** all scenarios pass
3. **Commit** changes with message: "Phase 13A: Core Multi-Instance Architecture"
4. **Proceed** to [Phase 13B: Server Instance Management](PHASE13B_SERVER_MANAGEMENT.md)

---

## Time Breakdown

- **PanelRegistry implementation**: 3 hours
- **PortManager implementation**: 2 hours
- **WorkflowEditorPanel refactoring**: 3 hours
- **Testing and debugging**: 2 hours
- **Total**: 8-10 hours
