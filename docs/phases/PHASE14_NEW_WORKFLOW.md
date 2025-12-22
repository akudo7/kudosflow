# Phase 14: New Workflow Creation

**Status**: ⬜ Not Started
**Created**: 2025-12-22
**Estimated Time**: 7-10 hours (分割: 3 sub-phases)

## Overview

Add the ability to create new workflows from scratch using a folder context menu. New workflows start with a minimal template containing only start and end nodes (no edges) and use "Save As" behavior on first save.

### Sub-Phases

Phase 14 is divided into 3 logical sub-phases for better organization and incremental implementation:

- **[Phase 14A: Template and Command Registration](phase14/PHASE14A_TEMPLATE_AND_COMMAND.md)** ⬜ (2-3h)
  - Create template provider
  - Register command and context menu
  - Basic `renderNew()` method

- **[Phase 14B: Panel State Management and Template Loading](phase14/PHASE14B_PANEL_STATE.md)** ⬜ (3-4h)
  - Update panel to handle `undefined` filePath
  - Load templates into editor
  - Defer port allocation
  - Disable server controls for unsaved workflows

- **[Phase 14C: Save Dialog and File Creation](phase14/PHASE14C_SAVE_DIALOG.md)** ⬜ (2-3h)
  - Implement save dialog logic
  - Update panel state after save
  - Handle user cancellation
  - Enable server controls after save

### User Requirements

Enable the following workflow:

1. Right-click on a **folder** in Explorer → "Create New Workflow Here"
2. New workflow editor opens with minimal template (start + end nodes only)
3. First save shows file creation dialog
4. User specifies filename (default: `untitled-workflow.json`) and location
5. Subsequent saves go to chosen location without dialog

### Current Limitations

- Only existing JSON files can be opened in workflow editor
- No way to create new workflows from scratch
- Save always overwrites original file (no "Save As")

## Architecture Changes

### Before (Phase 13)

```
User Action: Right-click on .json file
    ↓
Command: kudosflow.openWorkflowEditor
    ↓
WorkflowEditorPanel.render(filePath)
    ↓
Load JSON from filePath
    ↓
Display in editor
    ↓
Save → Overwrite original file
```

### After (Phase 14)

```
User Action: Right-click on folder
    ↓
Command: kudosflow.createNewWorkflow
    ↓
WorkflowEditorPanel.renderNew(folderUri)
    ↓
Load template (no file path)
    ↓
Display in editor (title: "Untitled")
    ↓
First Save → Show save dialog → Create file → Update title
    ↓
Subsequent Saves → Overwrite saved file
```

### Key Design Decisions

1. **"New" vs "Existing" Detection**:
   - `_filePath: string | undefined`
   - `undefined` = new workflow (not yet saved)
   - `string` = existing workflow (has file path)

2. **Template Structure**:
   - Minimal valid WorkflowConfig
   - Only start and end nodes
   - No edges (user requirement)

3. **Save Dialog Behavior**:
   - First save when `_filePath === undefined`
   - After successful save → Update `_filePath` and panel title
   - User cancels → Workflow stays in editor

4. **Port Management**:
   - Skip port allocation until first save
   - No file path = no A2A server capability yet
   - After save, initialize port from JSON config

---

## Implementation Plan

### New Files

#### 1. `src/templates/WorkflowTemplate.ts`

Provides the minimal template for new workflows.

**Time**: 1 hour

**Interface**:
```typescript
import { WorkflowConfig } from '../types/workflow.types';

/**
 * Get the default template for a new workflow.
 * Contains only start and end nodes with no edges or custom nodes.
 */
export function getDefaultWorkflowTemplate(): WorkflowConfig {
  return {
    config: {
      recursionLimit: 25
    },
    stateAnnotation: {
      name: "State",
      type: "Annotation.Root"
    },
    annotation: {
      messages: {
        type: "string[]",
        reducer: "(x, y) => x.concat(y)",
        default: []
      }
    },
    models: [],
    nodes: [],
    edges: [
      {
        from: "__start__",
        to: "__end__"
      }
    ],
    stateGraph: {
      annotationRef: "State"
    }
  };
}
```

**Location**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/src/templates/WorkflowTemplate.ts`

**Features**:
- Returns minimal valid WorkflowConfig
- Matches existing schema requirements
- No custom nodes (only __start__ and __end__)
- Single edge connecting start to end
- Default recursionLimit: 25
- Default State annotation structure

---

### Modified Files

#### 1. `src/panels/WorkflowEditorPanel.ts`

**Time**: 3 hours

**Changes**:

**a) Update `_filePath` type** (Line ~35):
```typescript
// Before
private _filePath: string;

// After
private _filePath: string | undefined;
```

**b) Update constructor signature** (Line ~39):
```typescript
// Before
constructor(panelId: string, panel: WebviewPanel, extensionUri: Uri, filePath: string)

// After
constructor(panelId: string, panel: WebviewPanel, extensionUri: Uri, filePath: string | undefined)
```

**c) Add new static method `renderNew()`**:
```typescript
/**
 * Creates and renders a new webview panel for creating a new workflow.
 * The workflow starts with a template and has no file path until first save.
 *
 * @param extensionUri The URI of the directory containing the extension
 * @param defaultFolder The folder where the workflow will be saved (used as default in save dialog)
 * @returns The newly created WorkflowEditorPanel instance
 */
public static renderNew(extensionUri: Uri, defaultFolder?: Uri): WorkflowEditorPanel {
  const panelRegistry = getPanelRegistry();
  const panelId = panelRegistry.generateId();

  const panel = window.createWebviewPanel(
    `workflowEditor-${panelId}`,
    'Workflow: Untitled',  // Initial title for new workflows
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

  // Create panel instance with undefined filePath
  const editorPanel = new WorkflowEditorPanel(
    panelId,
    panel,
    extensionUri,
    undefined  // No file path for new workflows
  );

  // Store default folder for save dialog
  (editorPanel as any)._defaultFolder = defaultFolder;

  // Register in global registry
  panelRegistry.register(editorPanel);

  return editorPanel;
}
```

**d) Modify `_initializePortConfiguration()`** (Line ~167):
```typescript
private _initializePortConfiguration(): void {
  // Skip port initialization for new workflows (no file yet)
  if (!this._filePath) {
    console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} is new workflow, skipping port initialization`);
    return;
  }

  // ... existing port configuration logic
}
```

**e) Modify `_loadWorkflow()`** (Line ~190):
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
    }

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

**f) Replace `_saveWorkflow()` method** (Line ~281):
```typescript
private async _saveWorkflow(data: any) {
  try {
    let targetPath = this._filePath;

    // If no file path (new workflow), show save dialog
    if (!targetPath) {
      const defaultFolder = (this as any)._defaultFolder as Uri | undefined;
      const saveUri = await window.showSaveDialog({
        defaultUri: defaultFolder
          ? Uri.joinPath(defaultFolder, 'untitled-workflow.json')
          : undefined,
        filters: {
          'JSON Files': ['json']
        },
        saveLabel: 'Save Workflow'
      });

      if (!saveUri) {
        // User cancelled save dialog
        console.log(`[Panel ${this.panelId}] Save cancelled by user`);
        return;
      }

      targetPath = saveUri.fsPath;

      // Update panel state after first save
      this._filePath = targetPath;
      this._panel.title = `Workflow: ${path.basename(targetPath)}`;

      // Initialize port configuration from saved workflow
      this._initializePortConfiguration();

      // Allocate port if needed
      if (!this.configuredPort && !this.assignedPort) {
        const portManager = getPortManager();
        this.assignedPort = await portManager.allocatePort(this.panelId);
        console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} assigned port ${this.assignedPort} after first save`);
      }

      console.log(`[Panel ${this.panelId}] First save to: ${targetPath}`);
    } else {
      // Existing file - show confirmation
      const answer = await window.showWarningMessage(
        "Save workflow?",
        "Yes",
        "No"
      );

      if (answer !== "Yes") {
        return;
      }
    }

    // Write file
    const content = JSON.stringify(data, null, 2);
    await workspace.fs.writeFile(
      Uri.file(targetPath),
      Buffer.from(content, "utf8")
    );

    this._panel.webview.postMessage({
      command: "saveSuccess",
      panelId: this.panelId,
      filePath: targetPath  // Send updated file path to webview
    });

    window.showInformationMessage("Workflow saved successfully");
  } catch (error) {
    this._panel.webview.postMessage({
      command: "saveError",
      panelId: this.panelId,
      error: String(error),
    });
    window.showErrorMessage(`Failed to save: ${error}`);
  }
}
```

**g) Add helper method**:
```typescript
/**
 * Check if this is a new workflow (not yet saved)
 */
public isNewWorkflow(): boolean {
  return this._filePath === undefined;
}
```

**Location**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/src/panels/WorkflowEditorPanel.ts`

---

#### 2. `src/extension.ts`

**Time**: 0.5 hour

**Changes**:

Add new command registration in `activate()` function (after line 41):

```typescript
// Register Create New Workflow command
context.subscriptions.push(
  vscode.commands.registerCommand("kudosflow.createNewWorkflow", (uri: vscode.Uri) => {
    // Get the folder path from the URI
    const folderUri = uri;
    WorkflowEditorPanel.renderNew(context.extensionUri, folderUri);
  })
);
```

**Location**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/src/extension.ts`

---

#### 3. `package.json`

**Time**: 0.5 hour

**Changes**:

**a) Add new command definition** (in `contributes.commands` array):
```json
{
  "command": "kudosflow.createNewWorkflow",
  "title": "Create New Workflow Here",
  "category": "Kudosflow"
}
```

**b) Add context menu entry for folders** (in `contributes.menus.explorer/context` array):
```json
{
  "command": "kudosflow.createNewWorkflow",
  "when": "explorerResourceIsFolder",
  "group": "navigation"
}
```

**Location**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/package.json`

---

#### 4. `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Time**: 1 hour

**Changes**:

**a) Update `loadWorkflow` callback** (Line ~92):
```typescript
const loadWorkflow = useCallback((config: WorkflowConfig, path: string) => {
  setWorkflowConfig(config);
  setFilePath(path);  // May be empty string for new workflows
  setIsDirty(false);

  // ... existing logging logic

  try {
    const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);
    // ... existing node processing
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

**b) Update message handler for `saveSuccess`** (Line ~149):
```typescript
case 'saveSuccess':
  setIsDirty(false);
  // Update filePath if it was a new workflow (first save)
  if (message.filePath && message.filePath !== filePath) {
    setFilePath(message.filePath);
  }
  setNotification({
    message: 'Workflow saved successfully',
    type: 'success',
  });
  break;
```

**c) Update server controls to check for filePath** (Line ~535):
```typescript
const handleStartServer = useCallback(() => {
  if (!filePath) {
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

// Apply same check to handleStopServer, handleRestartServer, etc.
```

**Location**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/webview-ui/src/workflow-editor/WorkflowEditor.tsx`

---

## Edge Cases and Error Handling

### 1. User Cancels Save Dialog
- **Behavior**: Workflow remains in editor (unsaved)
- **State**: isDirty stays true, _filePath remains undefined
- **Next Save**: Shows dialog again
- **User Feedback**: Silent (no error notification)

### 2. Multiple New Workflows
- **Support**: Each gets unique panelId (Phase 13)
- **Independence**: All operate independently until saved
- **Saving**: Can save to different locations

### 3. Closing Unsaved New Workflow
- **Handling**: VSCode's built-in dirty state tracking
- **Prompt**: "You have unsaved changes" dialog
- **Options**: Save / Don't Save / Cancel

### 4. Starting Server on Unsaved Workflow
- **Detection**: Check if `filePath` is empty
- **Behavior**: Show error notification
- **Message**: "Please save the workflow before starting the server"
- **UI**: Disable server controls until saved

### 5. Chat/Execution on Unsaved Workflow
- **Current Code**: Initializes from filePath
- **Behavior**: Naturally fails for new workflows
- **Error**: "No workflow file loaded"

### 6. Invalid Save Location
- **Handling**: File system errors caught by try-catch
- **User Feedback**: Error notification with details

### 7. Port Allocation After Save
- **Timing**: During/after first successful save
- **Method**: `_initializePortConfiguration()` called after save
- **Future Operations**: Use allocated port

---

## Testing Checklist

### Basic New Workflow Creation
- [ ] Right-click on folder → "Create New Workflow Here"
- [ ] Panel opens with title "Workflow: Untitled"
- [ ] Canvas shows only start and end nodes
- [ ] No edges visible
- [ ] Add a function node
- [ ] Press Ctrl+S → Save dialog appears
- [ ] Default filename is "untitled-workflow.json"
- [ ] Default location is right-clicked folder
- [ ] Enter filename "test-new.json" → Save
- [ ] Panel title updates to "Workflow: test-new.json"
- [ ] File exists in folder with correct content
- [ ] Modify workflow again
- [ ] Press Ctrl+S → Confirmation dialog (not save dialog)
- [ ] Verify saves to same location

### Cancel Save Dialog
- [ ] Create new workflow
- [ ] Add nodes
- [ ] Press Ctrl+S → Save dialog
- [ ] Click Cancel
- [ ] Workflow stays in editor
- [ ] Can continue editing
- [ ] Press Ctrl+S again → Save dialog reappears

### Multiple New Workflows
- [ ] Create 3 new workflows
- [ ] Verify all open independently
- [ ] Modify each differently
- [ ] Save each to different locations
- [ ] Verify no interference between workflows

### Server Controls on New Workflow
- [ ] Create new workflow
- [ ] Click "Start Server" → Error notification
- [ ] Error message: "Please save the workflow before starting the server"
- [ ] Save workflow to file
- [ ] Click "Start Server" → Should start successfully
- [ ] Verify server runs on allocated port

### Close Without Saving
- [ ] Create new workflow
- [ ] Add nodes (isDirty = true)
- [ ] Close panel → VSCode prompts to save
- [ ] Test "Save" option → Save dialog appears
- [ ] Test "Don't Save" option → Panel closes without saving
- [ ] Test "Cancel" option → Panel stays open

### Template Structure
- [ ] Create new workflow
- [ ] Verify JSON structure matches template
- [ ] Check config.recursionLimit = 25
- [ ] Check stateAnnotation exists
- [ ] Check annotation.messages exists
- [ ] Verify can add nodes without errors
- [ ] Save and start A2A server → Works correctly
- [ ] Execute workflow → Runs successfully

### Multi-Instance Compatibility
- [ ] Open existing workflow (file1.json)
- [ ] Create new workflow (unsaved)
- [ ] Open another existing workflow (file2.json)
- [ ] Verify all 3 panels independent
- [ ] Modify all 3 differently
- [ ] Save new workflow
- [ ] Verify all still independent
- [ ] Verify correct panel IDs in logs

---

## Success Criteria

- ✅ User can right-click on folder and select "Create New Workflow Here"
- ✅ New workflow panel opens with only start and end nodes (no edges)
- ✅ First save shows save dialog with default filename "untitled-workflow.json"
- ✅ Default save location is the folder that was right-clicked
- ✅ Panel title updates after first save
- ✅ Subsequent saves go to chosen location with confirmation dialog
- ✅ User can cancel save dialog without errors
- ✅ Multiple new workflows can be created simultaneously
- ✅ Server controls disabled until workflow is saved
- ✅ Template workflow is valid and executable
- ✅ Multi-instance support works with new workflows
- ✅ No port allocation until first save
- ✅ No breaking changes to existing workflows

---

## Time Breakdown

| Task | Time |
|------|------|
| WorkflowTemplate.ts creation | 1 hour |
| WorkflowEditorPanel.ts modifications | 3 hours |
| extension.ts and package.json updates | 1 hour |
| WorkflowEditor.tsx modifications | 1 hour |
| Testing and verification | 2 hours |
| **Total** | **8 hours** |

---

## Dependencies

- **External**: None (uses VSCode native APIs)
- **Internal**: Phase 13 multi-instance architecture
- **Breaking Changes**: None

---

## Risk Assessment

**Low Risk**:
- Straightforward feature addition
- Minimal changes to core logic
- Well-isolated changes
- VSCode handles save dialog UX
- Template is simple and tested structure

**Potential Issues**:
- User saves to existing file → VSCode handles overwrite confirmation
- Invalid file path → Handled by existing error handling
- Port allocation timing → Solved by deferring until first save

---

## Critical Files

1. [src/templates/WorkflowTemplate.ts](../../src/templates/WorkflowTemplate.ts) - New template provider
2. [src/panels/WorkflowEditorPanel.ts](../../src/panels/WorkflowEditorPanel.ts) - Core changes for undefined filePath and save dialog
3. [src/extension.ts](../../src/extension.ts) - Command registration
4. [package.json](../../package.json) - Command and menu contributions
5. [webview-ui/src/workflow-editor/WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx) - Handle empty filePath and disable server controls

---

## Summary

Phase 14 adds new workflow creation capability to the KudosFlow extension, allowing users to start from scratch with a minimal template. The implementation uses "Save As" behavior on first save and integrates seamlessly with the existing multi-instance architecture from Phase 13.

**Key Benefits**:
- ✅ Users can create workflows without copying existing files
- ✅ Clean starting point with minimal template
- ✅ Intuitive save dialog experience
- ✅ Full compatibility with multi-instance support
- ✅ No impact on existing workflow editing
