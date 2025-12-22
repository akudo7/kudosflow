# Phase 14B: Panel State Management and Template Loading

**Status**: ✅ Completed
**Created**: 2025-12-22
**Completed**: 2025-12-22
**Estimated Time**: 3-4 hours
**Dependencies**: Phase 14A must be completed

## Overview

Update WorkflowEditorPanel to properly handle workflows without file paths, load templates into the editor, and manage port allocation for unsaved workflows. This phase makes new workflows fully functional in the editor.

## Objectives

1. Update WorkflowEditorPanel to accept `undefined` filePath
2. Load template into editor for new workflows
3. Defer port allocation until workflow is saved
4. Update webview to handle empty filePath
5. Disable server controls for unsaved workflows

## Deliverables

### 1. Modify: `src/panels/WorkflowEditorPanel.ts`

**Time**: 2-3 hours

**Core State Management Changes**

#### a) Update `_filePath` Type (Line ~35)

```typescript
// Before
private _filePath: string;

// After
private _filePath: string | undefined;
```

**Impact**: Allows panel to exist without a file path (new workflows)

---

#### b) Update Constructor Signature (Line ~39)

```typescript
// Before
constructor(
  panelId: string,
  panel: WebviewPanel,
  extensionUri: Uri,
  filePath: string
)

// After
constructor(
  panelId: string,
  panel: WebviewPanel,
  extensionUri: Uri,
  filePath: string | undefined
) {
  this.panelId = panelId;
  this._panel = panel;
  this._extensionUri = extensionUri;
  this._filePath = filePath;
  this._disposables = [];

  // Initialize HTML
  this._panel.webview.html = this._getWebviewContent(
    this._panel.webview,
    extensionUri
  );

  // Set up message listener
  this._setWebviewMessageListener(this._panel.webview);

  // Initialize port configuration (will skip if no filePath)
  this._initializePortConfiguration();

  // Load workflow (will use template if no filePath)
  this._loadWorkflow();

  // Set up panel lifecycle handlers
  this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
}
```

---

#### c) Modify `_initializePortConfiguration()` (Line ~167)

Skip port initialization for new workflows (no file path):

```typescript
private _initializePortConfiguration(): void {
  // Skip port initialization for new workflows (no file yet)
  if (!this._filePath) {
    console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} is new workflow, skipping port initialization`);
    return;
  }

  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(this._filePath, 'utf-8');
    const workflow = JSON.parse(fileContent);

    const port = workflow.config?.a2aEndpoint?.port;
    if (port && typeof port === 'number') {
      this.configuredPort = port;
      console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} using configured port ${this.configuredPort} from JSON`);
    } else {
      console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} will use auto-allocated port`);
    }
  } catch (error) {
    console.error(`[WorkflowEditorPanel] Failed to read port configuration:`, error);
  }
}
```

**Change**: Added early return if `!this._filePath`

---

#### d) Modify `_loadWorkflow()` (Line ~190)

Load template for new workflows, existing file for saved workflows:

```typescript
private async _loadWorkflow() {
  try {
    let workflow: any;

    if (!this._filePath) {
      // New workflow - use template
      const { getDefaultWorkflowTemplate } = require('../templates/WorkflowTemplate');
      workflow = getDefaultWorkflowTemplate();
      console.log(`[Panel ${this.panelId}] Loaded new workflow template`);
    } else {
      // Existing workflow - load from file
      const fileContent = await workspace.fs.readFile(Uri.file(this._filePath));
      workflow = JSON.parse(fileContent.toString());
      console.log(`[Panel ${this.panelId}] Loaded workflow from: ${this._filePath}`);
    }

    const portManager = getPortManager();

    // Only allocate port for existing workflows with file path
    if (this._filePath) {
      if (this.configuredPort) {
        try {
          portManager.reservePort(this.panelId, this.configuredPort);
          console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} reserved configured port ${this.configuredPort}`);
        } catch (error) {
          window.showErrorMessage(`Failed to reserve configured port ${this.configuredPort}: ${error}`);
          throw error;
        }
      } else {
        this.assignedPort = await portManager.allocatePort(this.panelId);
        console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} assigned auto-allocated port ${this.assignedPort}`);
      }
    } else {
      console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} skipping port allocation (new workflow)`);
    }

    // Send workflow data to webview
    this._panel.webview.postMessage({
      command: "loadWorkflow",
      panelId: this.panelId,
      data: workflow,
      filePath: this._filePath || '',  // Empty string for new workflows
    });
  } catch (error) {
    window.showErrorMessage(`Failed to load workflow: ${error}`);
    console.error("Error loading workflow:", error);
  }
}
```

**Changes**:
- Added template loading branch when `!this._filePath`
- Port allocation only for existing workflows
- Send empty string for filePath if undefined

---

#### e) Update `renderNew()` to Remove Temporary Cast (from Phase 14A)

```typescript
public static renderNew(extensionUri: Uri, defaultFolder?: Uri): WorkflowEditorPanel {
  const panelRegistry = getPanelRegistry();
  const panelId = panelRegistry.generateId();

  const panel = window.createWebviewPanel(
    `workflowEditor-${panelId}`,
    'Workflow: Untitled',
    ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        Uri.joinPath(extensionUri, "out"),
        Uri.joinPath(extensionUri, "webview-ui/build"),
      ],
    }
  );

  // Create panel instance with undefined filePath (now properly typed)
  const editorPanel = new WorkflowEditorPanel(
    panelId,
    panel,
    extensionUri,
    undefined  // Now accepts string | undefined
  );

  // Store default folder for save dialog (used in Phase 14C)
  (editorPanel as any)._defaultFolder = defaultFolder;

  panelRegistry.register(editorPanel);

  console.log(`[Phase 14B] Created new workflow panel ${panelId.slice(-6)}`);

  return editorPanel;
}
```

**Change**: Removed `as any` cast from `undefined` parameter

---

#### f) Add Helper Method

```typescript
/**
 * Check if this is a new workflow (not yet saved).
 *
 * @returns true if the workflow has no file path (unsaved)
 */
public isNewWorkflow(): boolean {
  return this._filePath === undefined;
}
```

**Location**: Add at end of class (before closing brace)

**Purpose**: Clean API for checking workflow state

---

### 2. Modify: `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Time**: 1 hour

#### a) Update `loadWorkflow` Callback (Line ~92)

Handle empty filePath for new workflows:

```typescript
const loadWorkflow = useCallback((config: WorkflowConfig, path: string) => {
  setWorkflowConfig(config);
  setFilePath(path);  // May be empty string for new workflows
  setIsDirty(false);

  // Log A2A clients for Phase 9B verification
  if (config.a2aClients) {
    console.log('[Phase 9B] A2A Clients loaded:', config.a2aClients);
    console.log('[Phase 9B] A2A Client count:', Object.keys(config.a2aClients).length);
  } else {
    console.log('[Phase 9B] No A2A Clients in workflow');
  }

  // Log workflow type
  if (!path || path === '') {
    console.log('[Phase 14B] Loaded new workflow (no file path)');
  } else {
    console.log('[Phase 14B] Loaded existing workflow:', path);
  }

  try {
    const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);
    const nodesWithCallback = flowNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        models: config.models || [],
        onNodeNameChange: handleNodeNameChangeFromNode,
      }
    }));
    setNodes(nodesWithCallback);
    setEdges(flowEdges);
  } catch (error) {
    console.error('Error converting workflow to flow:', error);
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'error',
        message: `Failed to load workflow: ${error}`
      });
    }
  }
}, [handleNodeNameChangeFromNode, setNodes, setEdges]);
```

**Changes**:
- Added logging for new vs existing workflows
- Handles empty string filePath gracefully

---

#### b) Disable Server Controls for Unsaved Workflows (Line ~535)

```typescript
const handleStartServer = useCallback(() => {
  // Check if workflow is saved
  if (!filePath || filePath === '') {
    setNotification({
      message: 'Please save the workflow before starting the server',
      type: 'error',
    });
    return;
  }

  if (typeof vscode !== 'undefined') {
    vscode.postMessage({
      command: 'startA2AServer',
      filePath,
    });
  }
}, [filePath]);

const handleStopServer = useCallback(() => {
  if (!filePath || filePath === '') {
    return; // Silently ignore if no file path
  }

  if (typeof vscode !== 'undefined') {
    vscode.postMessage({
      command: 'stopA2AServer',
      filePath,
    });
  }
}, [filePath]);

const handleRestartServer = useCallback(() => {
  if (!filePath || filePath === '') {
    setNotification({
      message: 'Please save the workflow before restarting the server',
      type: 'error',
    });
    return;
  }

  if (typeof vscode !== 'undefined') {
    vscode.postMessage({
      command: 'restartServer',
      filePath,
    });
  }
}, [filePath]);
```

**Changes**:
- Added filePath checks before server operations
- Shows user-friendly error messages
- Prevents server operations on unsaved workflows

---

#### c) Update Server Status UI (Optional Enhancement)

In the server status panel, show "Unsaved workflow" message:

```typescript
// In ServerStatusPanel or similar component
{!filePath || filePath === '' ? (
  <div style={{ padding: '10px', color: 'var(--vscode-descriptionForeground)' }}>
    Save the workflow to enable server controls
  </div>
) : (
  // Normal server status UI
)}
```

---

## Testing Phase 14B

### Manual Testing Steps

1. **Compile and Launch**:
   ```bash
   yarn compile
   # Press F5 to launch Extension Development Host
   ```

2. **Test New Workflow Creation**:
   - Right-click on a folder → "Create New Workflow Here"
   - Verify panel opens with title "Workflow: Untitled"
   - Verify canvas shows start and end nodes only
   - Check Debug Console for log: "Loaded new workflow template"

3. **Test Template Structure**:
   - In new workflow editor, verify:
     - Start node visible
     - End node visible
     - No custom nodes
     - No edges visible (start and end not connected)
   - Open Settings panel → Config tab
   - Verify recursionLimit = 25
   - Verify State annotation exists

4. **Test Server Controls**:
   - In new workflow editor, try to click "Start Server"
   - Verify error notification: "Please save the workflow before starting the server"
   - Server status panel should show disabled state

5. **Test Editing**:
   - Add a new function node to canvas
   - Verify node appears and can be edited
   - Create edge from start → function → end
   - Verify edges connect properly
   - Check dirty indicator (red dot on Save button)

6. **Test Multi-Instance**:
   - Create 2 new workflows
   - Open 1 existing workflow
   - Verify all 3 panels independent
   - Each has correct title (2 "Untitled", 1 with filename)

7. **Test Port Allocation**:
   - Check Debug Console logs
   - New workflows should show: "skipping port allocation"
   - Existing workflows should show: "assigned auto-allocated port"

### Expected Results

- ✅ New workflow panel opens successfully
- ✅ Template loads into editor
- ✅ Canvas shows only start and end nodes
- ✅ Panel title is "Workflow: Untitled"
- ✅ No port allocated for new workflows
- ✅ Server controls disabled with helpful message
- ✅ Can edit workflow (add nodes, edges)
- ✅ Dirty state tracking works
- ✅ Multi-instance support works
- ✅ Existing workflows still work normally

### Known Limitations (To be addressed in Phase 14C)

- ⚠️ Cannot save workflow yet (save dialog not implemented)
- ⚠️ Closing unsaved workflow doesn't prompt (built-in VSCode handling)
- ⚠️ Panel title doesn't update after save

---

## Success Criteria

- [x] WorkflowEditorPanel accepts `undefined` filePath
- [x] Constructor properly typed for optional filePath
- [x] Template loads successfully for new workflows
- [x] Port allocation skipped for unsaved workflows
- [x] Webview handles empty filePath gracefully
- [x] Server controls disabled for unsaved workflows
- [x] Error messages are user-friendly
- [x] Can edit new workflows (add/remove nodes)
- [x] Dirty state tracking works
- [x] No breaking changes to existing functionality
- [x] Multi-instance works with new workflows

---

## Edge Cases Handled

1. **Multiple New Workflows**: Each gets unique panelId, no conflicts
2. **Port Manager**: Doesn't attempt allocation without file path
3. **Server Launcher**: Cannot start server without file path
4. **Workflow Executor**: Cannot execute without file path (expected)
5. **Template Validation**: Template structure matches existing schema

---

## Files Modified

1. **Modified**: [src/panels/WorkflowEditorPanel.ts](../../src/panels/WorkflowEditorPanel.ts)
   - Type changes for `_filePath`
   - Constructor update
   - Port initialization update
   - Template loading logic
   - Helper method

2. **Modified**: [webview-ui/src/workflow-editor/WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx)
   - loadWorkflow callback update
   - Server control guards
   - Status UI updates

---

## Dependency Chain

```
Phase 14A (Template + Command)
    ↓
Phase 14B (Panel State) ← YOU ARE HERE
    ↓
Phase 14C (Save Dialog)
```

---

## Next Phase

[Phase 14C: Save Dialog and File Creation](PHASE14C_SAVE_DIALOG.md)

- Implement save dialog for first save
- Update panel state after save (filePath, title, port)
- Handle user cancellation gracefully
- Update webview filePath on save success
