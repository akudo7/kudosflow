# Phase 14C: Save Dialog and File Creation

**Status**: ⬜ Not Started
**Created**: 2025-12-22
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 14B must be completed

## Overview

Implement the save dialog functionality for new workflows, enabling first-time file creation with user-specified filename and location. Update panel state after successful save to transition from "new" to "existing" workflow mode.

## Objectives

1. Replace `_saveWorkflow()` with save dialog logic
2. Show `showSaveDialog` for new workflows (first save)
3. Update panel state after successful save (filePath, title, port)
4. Handle user cancellation gracefully
5. Update webview filePath on save success
6. Maintain existing confirmation dialog for saved workflows

## Deliverables

### 1. Modify: `src/panels/WorkflowEditorPanel.ts`

**Time**: 2 hours

#### Replace `_saveWorkflow()` Method Entirely (Line ~281)

Replace the entire method with new implementation that handles both new and existing workflows:

```typescript
/**
 * Saves the workflow data to a file.
 * For new workflows (no filePath), shows a save dialog.
 * For existing workflows, shows confirmation and overwrites the file.
 *
 * @param data The workflow data to save
 */
private async _saveWorkflow(data: any) {
  try {
    let targetPath = this._filePath;

    // === NEW WORKFLOW: Show Save Dialog ===
    if (!targetPath) {
      const defaultFolder = (this as any)._defaultFolder as Uri | undefined;

      const saveUri = await window.showSaveDialog({
        defaultUri: defaultFolder
          ? Uri.joinPath(defaultFolder, 'untitled-workflow.json')
          : undefined,
        filters: {
          'JSON Files': ['json']
        },
        saveLabel: 'Save Workflow',
        title: 'Save New Workflow'
      });

      // User cancelled save dialog
      if (!saveUri) {
        console.log(`[Panel ${this.panelId}] Save cancelled by user`);
        return; // Exit without error notification
      }

      targetPath = saveUri.fsPath;

      console.log(`[Panel ${this.panelId}] First save to: ${targetPath}`);

      // === UPDATE PANEL STATE AFTER FIRST SAVE ===

      // 1. Update file path
      this._filePath = targetPath;

      // 2. Update panel title to show filename
      this._panel.title = `Workflow: ${path.basename(targetPath)}`;
      console.log(`[Panel ${this.panelId}] Updated title to: ${this._panel.title}`);

      // 3. Initialize port configuration from saved workflow data
      // Check if the workflow being saved has a configured port
      const configuredPort = data?.config?.a2aEndpoint?.port;
      if (configuredPort && typeof configuredPort === 'number') {
        this.configuredPort = configuredPort;
        console.log(`[Panel ${this.panelId}] Found configured port in workflow: ${configuredPort}`);
      }

      // 4. Allocate port for A2A server (now that we have a file)
      const portManager = getPortManager();

      if (this.configuredPort) {
        try {
          portManager.reservePort(this.panelId, this.configuredPort);
          console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} reserved configured port ${this.configuredPort} after first save`);
        } catch (error) {
          console.warn(`[WorkflowEditorPanel] Failed to reserve configured port ${this.configuredPort}: ${error}`);
          // Fall back to auto-allocation
          this.assignedPort = await portManager.allocatePort(this.panelId);
          console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} assigned fallback port ${this.assignedPort}`);
        }
      } else {
        this.assignedPort = await portManager.allocatePort(this.panelId);
        console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} assigned port ${this.assignedPort} after first save`);
      }
    }
    // === EXISTING WORKFLOW: Show Confirmation ===
    else {
      const answer = await window.showWarningMessage(
        "Save workflow?",
        "Yes",
        "No"
      );

      if (answer !== "Yes") {
        console.log(`[Panel ${this.panelId}] Save declined by user`);
        return;
      }
    }

    // === WRITE FILE TO DISK ===
    const content = JSON.stringify(data, null, 2);
    await workspace.fs.writeFile(
      Uri.file(targetPath),
      Buffer.from(content, "utf8")
    );

    console.log(`[Panel ${this.panelId}] Workflow saved to: ${targetPath}`);

    // === NOTIFY WEBVIEW OF SUCCESS ===
    this._panel.webview.postMessage({
      command: "saveSuccess",
      panelId: this.panelId,
      filePath: targetPath,  // Send updated file path to webview
    });

    window.showInformationMessage("Workflow saved successfully");

  } catch (error) {
    console.error(`[Panel ${this.panelId}] Save error:`, error);

    // Notify webview of error
    this._panel.webview.postMessage({
      command: "saveError",
      panelId: this.panelId,
      error: String(error),
    });

    window.showErrorMessage(`Failed to save workflow: ${error}`);
  }
}
```

**Key Features**:

1. **Save Dialog**:
   - Uses `window.showSaveDialog()` for new workflows
   - Default filename: `untitled-workflow.json`
   - Default location: folder that was right-clicked
   - Filters to only `.json` files

2. **User Cancellation**:
   - Silent return (no error notification)
   - Workflow stays in editor
   - isDirty remains true
   - Next save attempt shows dialog again

3. **State Updates After First Save**:
   - Update `_filePath` property
   - Update panel title (removes "Untitled")
   - Read port config from saved data
   - Allocate port (configured or auto)

4. **Existing Workflow Handling**:
   - Shows confirmation dialog (unchanged behavior)
   - Overwrites file on "Yes"

5. **Error Handling**:
   - Try-catch around entire operation
   - Notifies webview on error
   - Shows user-friendly error message

---

### 2. Modify: `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Time**: 1 hour

#### Update `saveSuccess` Message Handler (Line ~149)

Update the webview to receive and store the new filePath after first save:

```typescript
case 'saveSuccess':
  setIsDirty(false);

  // Update filePath if it was a new workflow (first save)
  if (message.filePath && message.filePath !== filePath) {
    console.log('[Phase 14C] Updated filePath after first save:', message.filePath);
    setFilePath(message.filePath);
  }

  setNotification({
    message: 'Workflow saved successfully',
    type: 'success',
  });
  break;
```

**Changes**:
- Check if `message.filePath` differs from current `filePath`
- Update `filePath` state if changed
- Log the update for debugging

**Impact**:
- After first save, webview knows the file path
- Server controls become enabled automatically
- Future saves go to same location

---

#### Update Server Controls (Already Done in Phase 14B)

Verify server controls check for empty filePath:

```typescript
// Should already be implemented from Phase 14B
const handleStartServer = useCallback(() => {
  if (!filePath || filePath === '') {
    setNotification({
      message: 'Please save the workflow before starting the server',
      type: 'error',
    });
    return;
  }
  // ... start server
}, [filePath]);
```

**Status**: No changes needed (implemented in Phase 14B)

---

## Testing Phase 14C

### Manual Testing Steps

#### Test 1: Basic Save Flow

1. **Create New Workflow**:
   - Right-click on folder → "Create New Workflow Here"
   - Panel opens with title "Workflow: Untitled"

2. **Make Changes**:
   - Add a function node
   - Create edges
   - Verify dirty indicator (red dot on Save button)

3. **First Save**:
   - Press Ctrl+S (or click Save button)
   - Verify save dialog appears
   - Check default filename: `untitled-workflow.json`
   - Check default location: folder that was right-clicked

4. **Complete Save**:
   - Enter filename: `my-workflow.json`
   - Click "Save"
   - Verify success notification: "Workflow saved successfully"
   - Verify panel title updates: "Workflow: my-workflow.json"
   - Verify file exists in folder
   - Verify dirty indicator disappears

5. **Subsequent Saves**:
   - Make more changes to workflow
   - Press Ctrl+S
   - Verify confirmation dialog appears (not save dialog)
   - Click "Yes"
   - Verify saves to same location

---

#### Test 2: Cancel Save Dialog

1. **Create New Workflow**:
   - Right-click folder → "Create New Workflow Here"

2. **Make Changes**:
   - Add nodes

3. **Cancel Save**:
   - Press Ctrl+S
   - Save dialog appears
   - Click "Cancel" (or press Escape)
   - Verify no error notification
   - Verify workflow stays in editor
   - Verify dirty indicator still visible

4. **Try Save Again**:
   - Press Ctrl+S again
   - Verify save dialog reappears
   - This time, complete the save successfully

---

#### Test 3: Server Controls After Save

1. **Create New Workflow**:
   - Right-click folder → "Create New Workflow Here"

2. **Try Server Before Save**:
   - Click "Start Server" button
   - Verify error: "Please save the workflow before starting the server"

3. **Save Workflow**:
   - Press Ctrl+S
   - Complete save dialog with filename `test-server.json`
   - Verify success

4. **Try Server After Save**:
   - Click "Start Server" button
   - Verify server starts successfully
   - Check terminal shows A2A server running
   - Verify assigned port number

---

#### Test 4: Multi-Instance Independence

1. **Create Multiple New Workflows**:
   - Right-click folder → "Create New Workflow Here" (3 times)
   - 3 panels open, all titled "Untitled"

2. **Edit Each Differently**:
   - Add different nodes to each
   - Verify each has independent state

3. **Save To Different Locations**:
   - Save panel 1 as `workflow-1.json` in folder A
   - Save panel 2 as `workflow-2.json` in folder B
   - Save panel 3 as `workflow-3.json` in folder C

4. **Verify Independence**:
   - Each panel has correct title
   - Each panel saves to correct location
   - Modifications in one don't affect others

---

#### Test 5: Port Configuration from JSON

1. **Create New Workflow**:
   - Right-click folder → "Create New Workflow Here"

2. **Add Port Configuration**:
   - Open Settings panel → Config tab
   - Add A2A Endpoint configuration: `{ "port": 5000 }`
   - Save changes

3. **Save Workflow**:
   - Press Ctrl+S
   - Save as `workflow-port-5000.json`

4. **Verify Port Allocation**:
   - Check Debug Console logs
   - Should show: "reserved configured port 5000"
   - Start A2A server
   - Verify server runs on port 5000

---

#### Test 6: Close Unsaved Workflow

1. **Create New Workflow**:
   - Right-click folder → "Create New Workflow Here"

2. **Make Changes**:
   - Add nodes (isDirty = true)

3. **Close Panel**:
   - Click X to close panel
   - Verify VSCode prompts: "Do you want to save?"

4. **Test Each Option**:
   - **Save**: Shows save dialog, saves file, closes panel
   - **Don't Save**: Closes panel without saving
   - **Cancel**: Panel stays open

---

#### Test 7: Invalid Save Location

1. **Create New Workflow**:
   - Add nodes

2. **Try Save to Read-Only Location**:
   - Press Ctrl+S
   - Try to save to `/System/` or other protected location
   - Verify error notification appears
   - Verify workflow stays in editor
   - Verify can retry save to different location

---

### Expected Results

**All Tests**:
- ✅ Save dialog shows correct defaults
- ✅ Panel title updates after save
- ✅ File written to correct location
- ✅ Port allocated after save
- ✅ Server controls enabled after save
- ✅ User cancellation handled gracefully
- ✅ Multi-instance independence maintained
- ✅ Configured ports respected
- ✅ Error handling works correctly

---

## Success Criteria

- [x] Save dialog appears on first save (new workflows only)
- [x] Default filename is `untitled-workflow.json`
- [x] Default location is right-clicked folder
- [x] User can cancel save without errors
- [x] Panel title updates after successful save
- [x] `_filePath` updates after successful save
- [x] Port allocated after successful save
- [x] Webview receives updated filePath
- [x] Server controls enabled after save
- [x] Subsequent saves use confirmation dialog
- [x] Existing workflows maintain confirmation dialog behavior
- [x] Multi-instance works correctly
- [x] Configured ports honored from saved JSON
- [x] Error handling is robust

---

## Edge Cases Handled

1. **User Cancels Save**:
   - No error notification
   - Workflow stays in editor
   - Can retry save

2. **Invalid Filename**:
   - VSCode's save dialog handles validation
   - Cannot save with invalid characters

3. **File Already Exists**:
   - VSCode shows overwrite confirmation
   - User chooses to overwrite or cancel

4. **Permission Denied**:
   - Caught by try-catch
   - Error notification shown
   - Workflow stays in editor

5. **Port Conflict**:
   - Configured port already in use
   - Falls back to auto-allocated port
   - Logs warning

6. **Save During Server Running**:
   - Allowed (saves file data)
   - Server continues running
   - Port allocation already done

---

## Files Modified

1. **Modified**: [src/panels/WorkflowEditorPanel.ts](../../src/panels/WorkflowEditorPanel.ts)
   - Complete replacement of `_saveWorkflow()` method
   - Added save dialog logic
   - Added state update after first save
   - Added port allocation after save

2. **Modified**: [webview-ui/src/workflow-editor/WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx)
   - Updated `saveSuccess` message handler
   - Added filePath update logic

---

## Dependency Chain

```
Phase 14A (Template + Command)
    ↓
Phase 14B (Panel State)
    ↓
Phase 14C (Save Dialog) ← YOU ARE HERE
```

---

## Phase 14 Completion

After Phase 14C is complete, all Phase 14 functionality will be implemented:

✅ **Phase 14A**: Template and command registration
✅ **Phase 14B**: Panel state management
✅ **Phase 14C**: Save dialog and file creation

**Total Time**: 7-10 hours (2-3h + 3-4h + 2-3h)

---

## Final Integration Testing

After completing all sub-phases, perform comprehensive testing:

### End-to-End Test Scenarios

1. **Complete Workflow Lifecycle**:
   - Create new workflow
   - Add nodes and edges
   - Configure settings (recursionLimit, models, etc.)
   - Save with custom filename
   - Start A2A server
   - Execute workflow
   - Make modifications
   - Save again (confirmation dialog)
   - Verify all functionality works

2. **Multi-Instance Stress Test**:
   - Open 5 existing workflows
   - Create 5 new workflows
   - Save 3 of the new workflows
   - Start servers on all saved workflows
   - Verify no port conflicts
   - Verify all panels independent

3. **Edge Case Gauntlet**:
   - Cancel save multiple times
   - Close without saving (test all options)
   - Save to various locations
   - Try invalid locations
   - Test with very long filenames
   - Test with special characters in path

---

## Documentation Updates

After Phase 14C completion, update:

1. **CLAUDE.md**: Add Phase 14 usage instructions
2. **IMPLEMENTATION_PLAN.md**: Mark Phase 14 as complete
3. **CHANGELOG.md**: Add Phase 14 feature entry

---

## Summary

Phase 14C completes the new workflow creation feature by implementing the save dialog functionality. Users can now:

- Create new workflows from folder context menu
- Edit workflows with minimal template (start + end nodes)
- Save workflows with custom filenames and locations
- Continue editing as normal workflows after save
- Start A2A servers after save
- Use all existing workflow features

The implementation maintains full compatibility with existing workflows and Phase 13 multi-instance architecture.
