# Phase 14A: Template and Command Registration

**Status**: ✅ Completed
**Created**: 2025-12-22
**Completed**: 2025-12-22
**Estimated Time**: 2-3 hours

## Overview

Create the workflow template system and register the basic command for creating new workflows. This phase establishes the foundation for new workflow creation without modifying the core WorkflowEditorPanel logic yet.

## Objectives

1. Create template provider for minimal workflow structure
2. Register `kudosflow.createNewWorkflow` command
3. Add folder context menu entry
4. Create basic `renderNew()` method (without save logic)

## Deliverables

### 1. New File: `src/templates/WorkflowTemplate.ts`

**Time**: 1 hour

Create a new template provider that returns minimal valid WorkflowConfig:

```typescript
import { WorkflowConfig } from '../types/workflow.types';

/**
 * Get the default template for a new workflow.
 * Contains only start and end nodes with a single edge connecting them.
 *
 * This template provides the minimal structure required for a valid workflow:
 * - Basic config with recursionLimit
 * - State annotation structure
 * - Default message annotation
 * - Empty models and nodes arrays
 * - Single edge from __start__ to __end__
 * - State graph configuration
 *
 * @returns {WorkflowConfig} A minimal valid workflow configuration
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

/**
 * Validate that a workflow config has the minimum required structure.
 *
 * @param config The workflow config to validate
 * @returns true if valid, false otherwise
 */
export function isValidWorkflowTemplate(config: any): boolean {
  return (
    config &&
    typeof config === 'object' &&
    config.config &&
    config.stateAnnotation &&
    config.annotation &&
    Array.isArray(config.models) &&
    Array.isArray(config.nodes) &&
    Array.isArray(config.edges) &&
    config.stateGraph
  );
}
```

**Location**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/src/templates/WorkflowTemplate.ts`

**Testing**:
```typescript
// Manual test in TypeScript playground or test file
const template = getDefaultWorkflowTemplate();
console.log(JSON.stringify(template, null, 2));
console.log('Valid:', isValidWorkflowTemplate(template));
```

---

### 2. Modify: `src/extension.ts`

**Time**: 0.5 hour

Add command registration in the `activate()` function.

**Location**: After the existing `kudosflow.openWorkflowEditor` command (around line 41)

**Change**:
```typescript
// Existing code:
context.subscriptions.push(
  vscode.commands.registerCommand('kudosflow.openWorkflowEditor', (uri: vscode.Uri) => {
    const filePath = uri.fsPath;
    WorkflowEditorPanel.render(context.extensionUri, filePath);
  })
);

// ADD AFTER:
// Register Create New Workflow command
context.subscriptions.push(
  vscode.commands.registerCommand('kudosflow.createNewWorkflow', (uri: vscode.Uri) => {
    // uri will be the folder that was right-clicked
    const folderUri = uri;
    WorkflowEditorPanel.renderNew(context.extensionUri, folderUri);
  })
);
```

**Notes**:
- The `uri` parameter will be a folder URI since we're filtering on `explorerResourceIsFolder`
- We pass the folder URI to `renderNew()` for use as default save location
- The method `renderNew()` will be implemented in Phase 14B

---

### 3. Modify: `package.json`

**Time**: 0.5 hour

Add command definition and context menu contribution.

#### a) Command Definition

**Location**: In the `contributes.commands` array (after line 34)

**Add**:
```json
{
  "command": "kudosflow.createNewWorkflow",
  "title": "Create New Workflow Here",
  "category": "Kudosflow"
}
```

**Result**:
```json
"commands": [
  {
    "command": "kudosflow.openWorkflowEditor",
    "title": "Open in Workflow Editor",
    "category": "Kudosflow"
  },
  {
    "command": "kudosflow.createNewWorkflow",
    "title": "Create New Workflow Here",
    "category": "Kudosflow"
  }
]
```

#### b) Context Menu Entry

**Location**: In the `contributes.menus.explorer/context` array (after line 44)

**Add**:
```json
{
  "command": "kudosflow.createNewWorkflow",
  "when": "explorerResourceIsFolder",
  "group": "navigation"
}
```

**Result**:
```json
"explorer/context": [
  {
    "command": "kudosflow.openWorkflowEditor",
    "when": "resourceExtname == .json",
    "group": "navigation"
  },
  {
    "command": "kudosflow.createNewWorkflow",
    "when": "explorerResourceIsFolder",
    "group": "navigation"
  }
]
```

**Context Conditions Explained**:
- `explorerResourceIsFolder`: True when right-clicking on a folder in Explorer
- `resourceExtname == .json`: True when right-clicking on a `.json` file

---

### 4. Modify: `src/panels/WorkflowEditorPanel.ts` (Minimal Changes)

**Time**: 1 hour

Add a basic `renderNew()` static method. This phase only creates the panel structure without implementing the full save logic (that's Phase 14B).

**Location**: After the existing `render()` method (around line 85)

**Add**:
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
    'Workflow: Untitled',  // Title for new workflows
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
  // NOTE: Constructor will need to accept string | undefined in Phase 14B
  const editorPanel = new WorkflowEditorPanel(
    panelId,
    panel,
    extensionUri,
    undefined as any  // Temporary: will be properly typed in Phase 14B
  );

  // Store default folder for save dialog (Phase 14B)
  (editorPanel as any)._defaultFolder = defaultFolder;

  // Register in global registry
  panelRegistry.register(editorPanel);

  console.log(`[Phase 14A] Created new workflow panel ${panelId.slice(-6)} with default folder: ${defaultFolder?.fsPath || 'none'}`);

  return editorPanel;
}
```

**Notes**:
- Uses `undefined as any` temporarily for filePath parameter
- Phase 14B will properly update the constructor signature
- Stores `_defaultFolder` for use in save dialog
- Follows same pattern as existing `render()` method

---

## Testing Phase 14A

### Manual Testing Steps

1. **Compile Extension**:
   ```bash
   yarn compile
   ```

2. **Launch Extension Development Host**:
   - Press F5 in VSCode
   - Opens new VSCode window with extension loaded

3. **Test Command Registration**:
   - Open Command Palette (Ctrl+Shift+P)
   - Search for "Create New Workflow Here"
   - Command should appear in list

4. **Test Context Menu**:
   - In Explorer, right-click on a folder
   - Verify "Create New Workflow Here" appears in context menu
   - Right-click on a `.json` file
   - Verify "Create New Workflow Here" does NOT appear

5. **Test Command Execution** (will error - expected):
   - Right-click on folder → "Create New Workflow Here"
   - Extension will attempt to create panel
   - May show errors (expected - full implementation in Phase 14B)
   - Check Debug Console for Phase 14A log message

6. **Verify Template**:
   - Create a test file to import and log the template:
   ```typescript
   import { getDefaultWorkflowTemplate, isValidWorkflowTemplate } from './templates/WorkflowTemplate';
   const template = getDefaultWorkflowTemplate();
   console.log('Template:', JSON.stringify(template, null, 2));
   console.log('Valid:', isValidWorkflowTemplate(template));
   ```

### Expected Results

- ✅ Command appears in Command Palette
- ✅ Context menu entry visible on folders only
- ✅ Command execution creates log message
- ✅ Template structure is valid JSON
- ✅ Template validates with `isValidWorkflowTemplate()`

### Known Limitations (To be addressed in Phase 14B)

- ⚠️ Panel creation will fail or show empty editor (constructor not updated yet)
- ⚠️ Save functionality not implemented
- ⚠️ Template not loaded into editor yet

---

## Success Criteria

- [x] `WorkflowTemplate.ts` created with valid template function
- [x] Template returns valid WorkflowConfig structure
- [x] Template includes only start and end nodes (no custom nodes)
- [x] Command registered in `extension.ts`
- [x] Command appears in Command Palette
- [x] Context menu entry added to `package.json`
- [x] Context menu appears only on folders
- [x] `renderNew()` method created in WorkflowEditorPanel
- [x] Panel creation logs success message
- [x] No breaking changes to existing workflow editor functionality

---

## Files Modified

1. **New**: [src/templates/WorkflowTemplate.ts](../../src/templates/WorkflowTemplate.ts)
2. **Modified**: [src/extension.ts](../../src/extension.ts)
3. **Modified**: [package.json](../../package.json)
4. **Modified**: [src/panels/WorkflowEditorPanel.ts](../../src/panels/WorkflowEditorPanel.ts)

---

## Next Phase

[Phase 14B: Panel State Management and Template Loading](PHASE14B_PANEL_STATE.md)

- Update WorkflowEditorPanel to handle `undefined` filePath
- Load template into editor
- Handle port allocation deferral
- Update webview to display untitled workflows
