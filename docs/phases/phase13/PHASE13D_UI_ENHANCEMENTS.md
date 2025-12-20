# Phase 13D: StatusBar and UI Enhancements

**Status**: ⬜ Not Started
**Estimated Time**: 4-6 hours
**Dependencies**: All previous phases (13A, 13B, 13C)

## Overview

Update the status bar and UI components to support multiple panels, providing clear visual feedback about the multi-instance state. Add panel identification elements to help users distinguish between and navigate among multiple workflow editors.

## Objective

Enhance the user interface to:
- Display aggregate server status in the status bar
- Show panel identification in the toolbar
- Add port information to the UI
- Provide easy navigation between panels
- Improve overall multi-panel UX

## UI Components Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ VSCode Window                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Workflow Toolbar                                         │  │
│  │  Save  Run  Settings      🆔 Panel abc123  🔌 Port 3000 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Workflow Canvas                                          │  │
│  │  [Nodes and edges...]                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Server Status Panel                                      │  │
│  │  Panel ID: abc123                                        │  │
│  │  Assigned Port: 3000                                     │  │
│  │  Status: RUNNING                                         │  │
│  │  Config: /path/to/workflow.json                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Status Bar: $(server) 3 A2A Servers    [Click to view panels] │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modified Files

### 1. `src/execution/StatusBarManager.ts`

**Current State**: Shows single server status

**Changes Required**:

#### Step 1: Add Multi-Server Status Methods

**Add after existing methods**:

```typescript
/**
 * Display status for multiple running servers.
 *
 * Shows count of active servers with click-to-view-panels action.
 *
 * @param activeServers - Number of currently running servers
 */
showMultiServerStatus(activeServers: number): void {
  const plural = activeServers !== 1 ? 's' : '';
  this.statusBarItem.text = `$(server) ${activeServers} A2A Server${plural}`;
  this.statusBarItem.tooltip = `${activeServers} workflow server${plural} running. Click to view panels.`;
  this.statusBarItem.command = 'kudosflow.showPanelList';
  this.statusBarItem.backgroundColor = undefined;
  this.statusBarItem.show();
}

/**
 * Display status for a specific panel.
 *
 * Shows panel ID and port when only one server is running.
 *
 * @param panelId - The panel ID
 * @param port - The server port
 * @param status - The server status (e.g., 'Running', 'Starting')
 */
showPanelStatus(panelId: string, port: number, status: string): void {
  const shortId = panelId.slice(-6);
  this.statusBarItem.text = `$(server) Panel ${shortId}: ${port}`;
  this.statusBarItem.tooltip = `Workflow panel ${shortId} - ${status} on port ${port}`;
  this.statusBarItem.command = 'kudosflow.showPanelList';
  this.statusBarItem.backgroundColor = undefined;
  this.statusBarItem.show();
}

/**
 * Hide the status bar item when no servers are running.
 */
hideStatus(): void {
  this.statusBarItem.hide();
}
```

#### Step 2: Update Status Update Logic

**Replace or modify existing `updateStatus()` method**:

```typescript
import { getServerInstanceManager } from '../extension';

/**
 * Update the status bar based on current server state.
 *
 * Shows different formats based on number of running servers:
 * - 0 servers: Hidden
 * - 1 server: Panel details (ID + port)
 * - 2+ servers: Server count
 */
updateStatus(): void {
  try {
    const serverManager = getServerInstanceManager();
    const runningCount = serverManager.getRunningCount();

    if (runningCount === 0) {
      // No servers running - hide status bar
      this.hideStatus();
    } else if (runningCount === 1) {
      // Single server - show detailed info
      const instances = serverManager.getAllInstances();
      for (const [panelId, launcher] of instances.entries()) {
        if (launcher.isServerRunning()) {
          const port = launcher.getCurrentPort();
          if (port) {
            this.showPanelStatus(panelId, port, 'Running');
          }
          break;
        }
      }
    } else {
      // Multiple servers - show count
      this.showMultiServerStatus(runningCount);
    }
  } catch (error) {
    console.error('[StatusBarManager] Error updating status:', error);
  }
}
```

#### Step 3: Add Periodic Status Updates

**Add method to register status updates**:

```typescript
private statusUpdateInterval: NodeJS.Timeout | undefined;

/**
 * Start periodic status updates.
 *
 * Updates every 2 seconds to reflect current server state.
 */
startPeriodicUpdates(): void {
  if (this.statusUpdateInterval) {
    return; // Already started
  }

  this.statusUpdateInterval = setInterval(() => {
    this.updateStatus();
  }, 2000);
}

/**
 * Stop periodic status updates.
 */
stopPeriodicUpdates(): void {
  if (this.statusUpdateInterval) {
    clearInterval(this.statusUpdateInterval);
    this.statusUpdateInterval = undefined;
  }
}

/**
 * Dispose the status bar manager.
 */
dispose(): void {
  this.stopPeriodicUpdates();
  this.statusBarItem.dispose();
}
```

#### Step 4: Initialize in Extension

**In `src/extension.ts`**:

```typescript
// In activate()
const statusBarManager = new StatusBarManager();
statusBarManager.startPeriodicUpdates();
context.subscriptions.push({
  dispose: () => statusBarManager.dispose()
});
```

---

### 2. `webview-ui/src/workflow-editor/components/WorkflowToolbar.tsx`

**Changes Required**:

#### Add Panel Identification Display

**Add to toolbar (right side)**:

```tsx
import { useState, useEffect } from 'react';

interface WorkflowToolbarProps {
  // ... existing props
  panelId?: string;
  serverPort?: number;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  // ... existing props
  panelId,
  serverPort
}) => {
  return (
    <div className="workflow-toolbar">
      {/* Existing toolbar buttons */}
      <div className="toolbar-left">
        <button onClick={onSave} title="Save workflow">
          Save
        </button>
        <button onClick={onRun} title="Run workflow">
          Run
        </button>
        {/* ... other buttons */}
      </div>

      {/* ✅ ADD: Panel identification */}
      <div className="toolbar-right" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginLeft: 'auto',
        fontSize: '11px',
        color: 'var(--vscode-descriptionForeground)'
      }}>
        {panelId && (
          <div
            className="panel-id-badge"
            title={`Panel ID: ${panelId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              backgroundColor: 'var(--vscode-badge-background)',
              color: 'var(--vscode-badge-foreground)'
            }}
          >
            <span>🆔</span>
            <span>{panelId.slice(-6)}</span>
          </div>
        )}

        {serverPort && (
          <div
            className="port-badge"
            title={`A2A Server Port: ${serverPort}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)'
            }}
          >
            <span>🔌</span>
            <span>Port {serverPort}</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### Update WorkflowEditor to Pass Props

**In `WorkflowEditor.tsx`**:

```tsx
const [panelId, setPanelId] = useState<string | null>(null);
const [serverPort, setServerPort] = useState<number | undefined>(undefined);

// Update when server status changes
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    switch (message.command) {
      case 'loadWorkflow':
        if (!panelId) {
          setPanelId(message.panelId);
        }
        break;

      case 'serverStatus':
        if (message.status.port) {
          setServerPort(message.status.port);
        }
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [panelId]);

return (
  <div className="workflow-editor">
    <WorkflowToolbar
      // ... existing props
      panelId={panelId || undefined}
      serverPort={serverPort}
    />
    {/* ... rest of editor */}
  </div>
);
```

---

### 3. `webview-ui/src/workflow-editor/components/ServerStatusPanel.tsx`

**Changes Required**:

#### Add Panel Info Section

**Add to component**:

```tsx
interface ServerStatusPanelProps {
  // ... existing props
  panelId?: string;
  assignedPort?: number;
}

export const ServerStatusPanel: React.FC<ServerStatusPanelProps> = ({
  serverStatus,
  onStart,
  onStop,
  onRestart,
  panelId,
  assignedPort
}) => {
  return (
    <div className="server-status-panel">
      {/* ✅ ADD: Panel information section */}
      <div className="panel-info-section" style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: 'var(--vscode-editor-background)',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div className="info-header" style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          color: 'var(--vscode-foreground)'
        }}>
          Panel Information
        </div>

        <div className="info-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '8px 12px'
        }}>
          <span className="label" style={{
            color: 'var(--vscode-descriptionForeground)'
          }}>
            Panel ID:
          </span>
          <span className="value" style={{
            fontFamily: 'var(--vscode-editor-font-family)',
            color: 'var(--vscode-foreground)'
          }}>
            {panelId ? panelId.slice(-6) : 'N/A'}
          </span>

          <span className="label" style={{
            color: 'var(--vscode-descriptionForeground)'
          }}>
            Assigned Port:
          </span>
          <span className="value" style={{
            fontFamily: 'var(--vscode-editor-font-family)',
            color: 'var(--vscode-foreground)'
          }}>
            {assignedPort || 'Not allocated'}
          </span>

          <span className="label" style={{
            color: 'var(--vscode-descriptionForeground)'
          }}>
            Status:
          </span>
          <span className="value" style={{
            color: getStatusColor(serverStatus.state)
          }}>
            {serverStatus.state}
          </span>

          {serverStatus.filePath && (
            <>
              <span className="label" style={{
                color: 'var(--vscode-descriptionForeground)'
              }}>
                Config:
              </span>
              <span className="value" style={{
                fontSize: '10px',
                color: 'var(--vscode-descriptionForeground)',
                wordBreak: 'break-all'
              }}>
                {serverStatus.filePath}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Existing server controls */}
      <div className="server-controls">
        {/* ... existing buttons */}
      </div>

      {/* Existing server status display */}
      {/* ... */}
    </div>
  );
};

function getStatusColor(state: string): string {
  switch (state) {
    case 'RUNNING':
      return 'var(--vscode-terminal-ansiGreen)';
    case 'STARTING':
      return 'var(--vscode-terminal-ansiYellow)';
    case 'STOPPING':
      return 'var(--vscode-terminal-ansiYellow)';
    case 'ERROR':
      return 'var(--vscode-terminal-ansiRed)';
    case 'STOPPED':
    case 'IDLE':
    default:
      return 'var(--vscode-descriptionForeground)';
  }
}
```

#### Update WorkflowEditor to Pass Props

```tsx
// In WorkflowEditor.tsx
<ServerStatusPanel
  serverStatus={serverStatus}
  onStart={handleStartServer}
  onStop={handleStopServer}
  onRestart={handleRestartServer}
  panelId={panelId || undefined}  // ✅ ADD
  assignedPort={assignedPort}      // ✅ ADD
/>
```

---

### 4. `webview-ui/src/workflow-editor/components/styles.css`

**Add styles for new UI elements**:

```css
/* Panel identification badges */
.panel-id-badge,
.port-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-family: var(--vscode-font-family);
  transition: opacity 0.2s;
}

.panel-id-badge:hover,
.port-badge:hover {
  opacity: 0.8;
}

/* Panel information section */
.panel-info-section {
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
}

.panel-info-section .info-header {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--vscode-foreground);
  font-size: 13px;
}

.panel-info-section .info-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 12px;
  font-size: 12px;
}

.panel-info-section .label {
  color: var(--vscode-descriptionForeground);
  font-weight: 500;
}

.panel-info-section .value {
  color: var(--vscode-foreground);
  font-family: var(--vscode-editor-font-family);
}

/* Toolbar layout */
.workflow-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--vscode-editor-background);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-left: auto;
}

/* Status colors */
.status-running {
  color: var(--vscode-terminal-ansiGreen);
}

.status-starting {
  color: var(--vscode-terminal-ansiYellow);
}

.status-stopping {
  color: var(--vscode-terminal-ansiYellow);
}

.status-error {
  color: var(--vscode-terminal-ansiRed);
}

.status-stopped,
.status-idle {
  color: var(--vscode-descriptionForeground);
}
```

---

## Visual Examples

### Status Bar States

#### No Servers Running
```
Status Bar: [Hidden]
```

#### One Server Running
```
Status Bar: $(server) Panel abc123: 3000
Tooltip: Workflow panel abc123 - Running on port 3000
```

#### Multiple Servers Running
```
Status Bar: $(server) 3 A2A Servers
Tooltip: 3 workflow servers running. Click to view panels.
```

### Panel Quick Pick

When clicking status bar or running `Show Workflow Panel List`:

```
┌────────────────────────────────────────────────────┐
│ Select a workflow panel to focus                  │
├────────────────────────────────────────────────────┤
│ > workflow1.json                                   │
│   Panel abc123 - Port 3000                         │
│   /path/to/json/workflow1.json                     │
│                                                    │
│   workflow2.json                                   │
│   Panel def456 - Port 3001                         │
│   /path/to/json/workflow2.json                     │
│                                                    │
│   main.json                                        │
│   Panel ghi789 - Port 3002                         │
│   /path/to/json/research/main.json                 │
└────────────────────────────────────────────────────┘
```

---

## Testing

### Test Scenario 1: Status Bar - No Servers

1. Open 3 workflow files
2. Don't start any servers
3. Check status bar

**Expected**:
- ✅ Status bar is hidden

### Test Scenario 2: Status Bar - One Server

1. Open 2 workflow files
2. Start server in panel 1 only
3. Check status bar

**Expected**:
- ✅ Shows "Panel abc123: 3000"
- ✅ Tooltip shows detailed info
- ✅ Clicking opens panel list

### Test Scenario 3: Status Bar - Multiple Servers

1. Open 3 workflow files
2. Start servers in all 3
3. Check status bar

**Expected**:
- ✅ Shows "3 A2A Servers"
- ✅ Clicking opens panel list with all 3

### Test Scenario 4: Panel ID Display

1. Open a workflow file
2. Check toolbar

**Expected**:
- ✅ Panel ID badge shows last 6 chars
- ✅ Hover shows full panel ID
- ✅ Badge has distinctive styling

### Test Scenario 5: Port Display

1. Open workflow file
2. Start A2A server
3. Check toolbar and server status panel

**Expected**:
- ✅ Toolbar shows port badge
- ✅ Server status panel shows assigned port
- ✅ Port matches actual server port

### Test Scenario 6: Panel Info Section

1. Open workflow file
2. Check server status panel

**Expected**:
- ✅ Shows panel ID (short form)
- ✅ Shows assigned port
- ✅ Shows current status
- ✅ Shows config file path

### Test Scenario 7: Status Bar Updates

1. Open 2 panels
2. Start server in panel 1 → check status bar
3. Start server in panel 2 → check status bar
4. Stop server in panel 1 → check status bar

**Expected**:
- ✅ Status bar updates automatically
- ✅ Shows correct count at each step
- ✅ Updates within 2 seconds

---

## Success Criteria

- ✅ Status bar reflects multi-panel state accurately
- ✅ Status bar shows different formats based on server count
- ✅ Panel ID visible in toolbar
- ✅ Port number visible in toolbar and status panel
- ✅ Status bar clickable to show panel list
- ✅ UI styling consistent with VSCode theme
- ✅ Status updates automatically (periodic)
- ✅ All text properly readable in light and dark themes

---

## Accessibility

### Screen Reader Support

Ensure all badges have proper ARIA labels:

```tsx
<div
  className="panel-id-badge"
  role="status"
  aria-label={`Panel identifier: ${panelId}`}
  title={`Panel ID: ${panelId}`}
>
  <span aria-hidden="true">🆔</span>
  <span>{panelId.slice(-6)}</span>
</div>
```

### Keyboard Navigation

Status bar item should be keyboard accessible (already handled by VSCode).

---

## Performance Considerations

### Status Bar Updates

- Use 2-second intervals (not too frequent)
- Cache server count to avoid unnecessary updates
- Dispose interval on deactivation

### UI Re-renders

- Only update when values change
- Use React.memo for badge components if needed

---

## Next Steps

After completing Phase 13D:

1. **Verify** all success criteria met
2. **Test** UI in both light and dark themes
3. **Check** status bar updates correctly
4. **Commit** with message: "Phase 13D: StatusBar and UI Enhancements"
5. **Proceed** to [Phase 13E: Testing and Documentation](PHASE13E_TESTING_DOCS.md)

---

## Time Breakdown

- **StatusBarManager updates**: 2 hours
- **Toolbar UI additions**: 1 hour
- **ServerStatusPanel updates**: 1 hour
- **Styling and polish**: 1 hour
- **Testing and refinement**: 1 hour
- **Total**: 4-6 hours
