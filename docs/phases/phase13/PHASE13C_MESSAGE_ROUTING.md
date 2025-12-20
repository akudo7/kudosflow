# Phase 13C: Message Routing and Command Updates

**Status**: ⬜ Not Started
**Estimated Time**: 10-12 hours
**Dependencies**: [Phase 13A](PHASE13A_CORE_ARCHITECTURE.md) (requires panelId)

## Overview

Implement proper message routing between the extension and specific webview panels using panelId as the routing key. This ensures messages are delivered only to their intended recipients and prevents cross-contamination between multiple panels.

## Objective

Create a robust message routing system that:
- Routes extension → webview messages to specific panels
- Filters webview → extension messages by panel
- Prevents message leakage between panels
- Adds panel management commands for user convenience

## Architecture

### Message Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Extension Host                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │  MessageRouter   │◄────────│    PanelRegistry            │  │
│  └────────┬─────────┘         └─────────────────────────────┘  │
│           │                                                     │
│           │ sendToPanel(panelId, message)                      │
│           │ routeFromWebview(message)                          │
│           │                                                     │
│  ┌────────▼──────────┐       ┌────────────────────────────┐   │
│  │  Panel wf-abc123  │       │  Panel wf-def456           │   │
│  │  postMessage()    │       │  postMessage()             │   │
│  └────────┬──────────┘       └─────────┬──────────────────┘   │
└───────────┼──────────────────────────────┼─────────────────────┘
            │                              │
            │ { panelId: 'abc123', ... }   │ { panelId: 'def456', ... }
            │                              │
┌───────────▼──────────────────────────────▼─────────────────────┐
│                        Webview Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┐   ┌────────────────────────────┐   │
│  │  Webview abc123        │   │  Webview def456            │   │
│  │  - Receives only       │   │  - Receives only           │   │
│  │    panelId='abc123'    │   │    panelId='def456'        │   │
│  │    messages            │   │    messages                │   │
│  │  - Ignores others      │   │  - Ignores others          │   │
│  └────────────────────────┘   └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Files

### 1. `src/managers/MessageRouter.ts`

Routes messages between extension and specific webview panels.

#### Features

- **Targeted Routing**: Send messages to specific panel by panelId
- **Broadcast**: Send messages to all panels
- **Message Queue**: Queue messages for panels not yet ready
- **Delivery Guarantees**: Ensure messages reach their destination
- **Debug Logging**: Track message flow for troubleshooting

#### Interface

```typescript
import { PanelRegistry } from './PanelRegistry';

/**
 * Routes messages between extension and specific webview panels.
 *
 * Ensures messages are delivered only to their intended recipient panels
 * and prevents cross-contamination in multi-instance scenarios.
 *
 * @example
 * ```typescript
 * const router = new MessageRouter(panelRegistry);
 *
 * // Send to specific panel
 * router.sendToPanel('wf-abc123', { command: 'serverStatus', status: 'running' });
 *
 * // Broadcast to all panels
 * router.broadcast({ command: 'extensionUpdate', version: '1.0.0' });
 * ```
 */
export class MessageRouter {
  private panelRegistry: PanelRegistry;
  private messageQueue: Map<string, any[]>;  // Queue for panels not yet ready
  private readonly DEBUG = false;

  constructor(panelRegistry: PanelRegistry) {
    this.panelRegistry = panelRegistry;
    this.messageQueue = new Map();
  }

  /**
   * Send a message to a specific panel.
   *
   * If the panel doesn't exist, the message is queued for later delivery.
   *
   * @param panelId - The target panel ID
   * @param message - The message to send (will be augmented with panelId)
   */
  sendToPanel(panelId: string, message: any): void {
    const panel = this.panelRegistry.getPanel(panelId);

    if (!panel) {
      this.log(`Panel ${panelId.slice(-6)} not found, queueing message`);
      this.queueMessage(panelId, message);
      return;
    }

    // Ensure message includes panelId
    const routedMessage = {
      ...message,
      panelId
    };

    this.log(`Routing to panel ${panelId.slice(-6)}: ${message.command}`);
    panel.postMessage(routedMessage);
  }

  /**
   * Broadcast a message to all active panels.
   *
   * Each panel receives the message with its own panelId.
   *
   * @param message - The message to broadcast
   */
  broadcast(message: any): void {
    const panels = this.panelRegistry.getAllPanels();
    this.log(`Broadcasting to ${panels.length} panels: ${message.command}`);

    for (const panel of panels) {
      const routedMessage = {
        ...message,
        panelId: panel.getPanelId()
      };
      panel.postMessage(routedMessage);
    }
  }

  /**
   * Route a message received from a webview to the appropriate handler.
   *
   * Validates that the message includes a panelId and routes accordingly.
   *
   * @param message - The message from the webview
   */
  routeFromWebview(message: any): void {
    const { panelId, command } = message;

    if (!panelId) {
      console.warn('[MessageRouter] Received message without panelId:', command);
      return;
    }

    const panel = this.panelRegistry.getPanel(panelId);

    if (!panel) {
      console.warn(`[MessageRouter] Panel ${panelId.slice(-6)} not found for message: ${command}`);
      return;
    }

    this.log(`Routing from webview ${panelId.slice(-6)}: ${command}`);
    // Message is already at the correct panel (it sent it)
    // This method is mainly for logging and validation
  }

  /**
   * Queue a message for a panel that doesn't exist yet.
   *
   * Messages are delivered when the panel becomes available.
   *
   * @param panelId - The panel ID
   * @param message - The message to queue
   */
  queueMessage(panelId: string, message: any): void {
    if (!this.messageQueue.has(panelId)) {
      this.messageQueue.set(panelId, []);
    }
    this.messageQueue.get(panelId)!.push(message);
    this.log(`Queued message for panel ${panelId.slice(-6)}, queue size: ${this.messageQueue.get(panelId)!.length}`);
  }

  /**
   * Flush queued messages for a panel.
   *
   * Called when a new panel is registered.
   *
   * @param panelId - The panel ID
   */
  flushQueue(panelId: string): void {
    const queue = this.messageQueue.get(panelId);

    if (!queue || queue.length === 0) {
      return;
    }

    this.log(`Flushing ${queue.length} queued messages for panel ${panelId.slice(-6)}`);

    for (const message of queue) {
      this.sendToPanel(panelId, message);
    }

    this.messageQueue.delete(panelId);
  }

  /**
   * Clear all queued messages for a panel.
   *
   * Called when a panel is disposed.
   *
   * @param panelId - The panel ID
   */
  clearQueue(panelId: string): void {
    if (this.messageQueue.delete(panelId)) {
      this.log(`Cleared message queue for panel ${panelId.slice(-6)}`);
    }
  }

  /**
   * Get queue size for debugging.
   *
   * @param panelId - The panel ID
   * @returns Number of queued messages
   */
  getQueueSize(panelId: string): number {
    return this.messageQueue.get(panelId)?.length || 0;
  }

  /**
   * Enable debug logging.
   */
  enableDebug(): void {
    (this as any).DEBUG = true;
  }

  private log(message: string): void {
    if (this.DEBUG) {
      console.log(`[MessageRouter] ${message}`);
    }
  }
}
```

---

## Modified Files

### 1. `src/panels/WorkflowEditorPanel.ts`

**Changes Required**:

#### Step 1: Update All postMessage() Calls

Every `this._panel.webview.postMessage()` call must include `panelId`.

**Examples**:

```typescript
// _loadWorkflow() - Already updated in 13A
private _loadWorkflow() {
  const workflowData = fs.readFileSync(this._filePath, 'utf-8');
  const workflow = JSON.parse(workflowData);

  this._panel.webview.postMessage({
    command: 'loadWorkflow',
    panelId: this.panelId,  // ✅
    data: workflow,
    filePath: this._filePath
  });
}

// _handleServerStatusChange()
private _handleServerStatusChange(status: ServerStatus) {
  this._panel.webview.postMessage({
    command: 'serverStatus',
    panelId: this.panelId,  // ✅ ADD
    status: status
  });
}

// _handleWorkflowExecutionUpdate()
private _handleWorkflowExecutionUpdate(update: any) {
  this._panel.webview.postMessage({
    command: 'workflowExecutionUpdate',
    panelId: this.panelId,  // ✅ ADD
    update: update
  });
}

// After save
private async _saveWorkflow(data: any) {
  try {
    // ... save logic
    this._panel.webview.postMessage({
      command: 'saveSuccess',
      panelId: this.panelId,  // ✅ ADD
      filePath: this._filePath
    });
  } catch (error) {
    this._panel.webview.postMessage({
      command: 'saveError',
      panelId: this.panelId,  // ✅ ADD
      error: String(error)
    });
  }
}

// Chat messages
private _handleChatResponse(response: any) {
  this._panel.webview.postMessage({
    command: 'chatResponse',
    panelId: this.panelId,  // ✅ ADD
    response: response
  });
}

// Icon paths
private async _sendIconPath(filename: string) {
  const iconPath = getUri(...);

  this._panel.webview.postMessage({
    command: 'iconPath',
    panelId: this.panelId,  // ✅ ADD
    filename: filename,
    path: iconPath.toString()
  });
}
```

#### Step 2: Update Message Listener to Filter by panelId

**In _setWebviewMessageListener()**:

```typescript
private _setWebviewMessageListener(webview: Webview) {
  webview.onDidReceiveMessage(
    (message: any) => {
      // ✅ ADD: Filter messages for this panel only
      if (message.panelId && message.panelId !== this.panelId) {
        // Ignore messages for other panels
        return;
      }

      switch (message.command) {
        case 'save':
          this._saveWorkflow(message.data);
          break;

        case 'getIconPath':
          this._sendIconPath(message.filename);
          break;

        case 'startA2AServer':
          this._startA2AServer(this._filePath, message.port);
          break;

        case 'stopA2AServer':
          this._serverLauncher.stopServer();
          break;

        case 'restartA2AServer':
          this._serverLauncher.restartServer();
          break;

        case 'chatMessage':
          this._handleChatMessage(message.message, message.sessionId);
          break;

        case 'interruptResponse':
          this._handleInterruptResponse(message.sessionId, message.response);
          break;

        case 'error':
          console.error(`[WorkflowEditorPanel] Error from webview:`, message);
          break;

        default:
          console.warn(`[WorkflowEditorPanel] Unknown command: ${message.command}`);
      }
    },
    null,
    this._disposables
  );
}
```

#### Step 3: Add postMessage Helper

**Add helper method**:

```typescript
/**
 * Send a message to this panel's webview.
 *
 * Automatically includes panelId in the message.
 *
 * @param message - The message to send
 */
public postMessage(message: any): void {
  this._panel.webview.postMessage({
    ...message,
    panelId: this.panelId
  });
}
```

Then update all `this._panel.webview.postMessage()` to `this.postMessage()`.

---

### 2. `webview-ui/src/workflow-editor/WorkflowEditor.tsx`

**Changes Required**:

#### Step 1: Add panelId State

**Add state at component top**:

```typescript
const [panelId, setPanelId] = useState<string | null>(null);
```

#### Step 2: Update Message Handler

**In useEffect for message handling**:

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    // ✅ ADD: Ignore messages for other panels
    if (message.panelId && message.panelId !== panelId) {
      return;
    }

    switch (message.command) {
      case 'loadWorkflow':
        // ✅ CHANGED: Store panelId on first load
        if (!panelId) {
          setPanelId(message.panelId);
          console.log(`[WorkflowEditor] Panel ID: ${message.panelId}`);
        }

        // Load workflow data
        setWorkflowData(message.data);
        setFilePath(message.filePath);
        setIsDirty(false);
        break;

      case 'serverStatus':
        setServerStatus(message.status);
        break;

      case 'workflowExecutionUpdate':
        handleExecutionUpdate(message.update);
        break;

      case 'saveSuccess':
        setIsDirty(false);
        vscode.postMessage({
          command: 'info',
          value: 'Workflow saved successfully'
        });
        break;

      case 'saveError':
        vscode.postMessage({
          command: 'error',
          target: 'Save Error',
          value: message.error
        });
        break;

      case 'chatResponse':
        handleChatResponse(message.response);
        break;

      case 'iconPath':
        // Store icon path
        setIconPath(message.filename, message.path);
        break;

      default:
        console.warn(`[WorkflowEditor] Unknown command: ${message.command}`);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [panelId]);  // ✅ CHANGED: Add panelId dependency
```

#### Step 3: Update All Outgoing Messages

**Add panelId to every vscode.postMessage() call**:

```typescript
// Save
const handleSave = () => {
  vscode.postMessage({
    command: 'save',
    panelId,  // ✅ ADD
    data: workflowData
  });
};

// Start server
const handleStartServer = (port?: number) => {
  vscode.postMessage({
    command: 'startA2AServer',
    panelId,  // ✅ ADD
    port
  });
};

// Stop server
const handleStopServer = () => {
  vscode.postMessage({
    command: 'stopA2AServer',
    panelId  // ✅ ADD
  });
};

// Restart server
const handleRestartServer = () => {
  vscode.postMessage({
    command: 'restartA2AServer',
    panelId  // ✅ ADD
  });
};

// Chat message
const handleSendMessage = (text: string) => {
  vscode.postMessage({
    command: 'chatMessage',
    panelId,  // ✅ ADD
    message: text,
    sessionId: currentSessionId
  });
};

// Interrupt response
const handleInterruptResponse = (response: any) => {
  vscode.postMessage({
    command: 'interruptResponse',
    panelId,  // ✅ ADD
    sessionId: currentSessionId,
    response
  });
};

// Get icon path
const requestIconPath = (filename: string) => {
  vscode.postMessage({
    command: 'getIconPath',
    panelId,  // ✅ ADD
    filename
  });
};

// Error reporting
const reportError = (target: string, value: string) => {
  vscode.postMessage({
    command: 'error',
    panelId,  // ✅ ADD
    target,
    value
  });
};
```

---

### 3. `src/extension.ts`

**Changes Required**:

#### Step 1: Add MessageRouter

```typescript
import { MessageRouter } from './managers/MessageRouter';

let messageRouter: MessageRouter;

export function getMessageRouter(): MessageRouter {
  if (!messageRouter) {
    throw new Error('MessageRouter not initialized');
  }
  return messageRouter;
}
```

#### Step 2: Initialize in activate()

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Initialize managers
  panelRegistry = new PanelRegistry();
  portManager = new PortManager();
  serverInstanceManager = new ServerInstanceManager();
  messageRouter = new MessageRouter(panelRegistry);  // ✅ ADD

  console.log('[Extension] Initialized all managers');

  // ... register commands
}
```

#### Step 3: Add Panel Management Commands

```typescript
// ✅ ADD: Close all panels command
context.subscriptions.push(
  vscode.commands.registerCommand('kudosflow.closeAllPanels', () => {
    const panelCount = panelRegistry.getPanelCount();

    if (panelCount === 0) {
      vscode.window.showInformationMessage('No workflow panels open.');
      return;
    }

    panelRegistry.disposeAll();
    vscode.window.showInformationMessage(`Closed ${panelCount} workflow panel(s).`);
  })
);

// ✅ ADD: Show panel list command
context.subscriptions.push(
  vscode.commands.registerCommand('kudosflow.showPanelList', async () => {
    const panels = panelRegistry.getAllPanels();

    if (panels.length === 0) {
      vscode.window.showInformationMessage('No workflow panels open.');
      return;
    }

    const items = panels.map(panel => {
      const port = panel.getAssignedPort();
      const shortId = panel.getPanelId().slice(-6);

      return {
        label: path.basename(panel.getFilePath()),
        description: `Panel ${shortId} - Port ${port || 'N/A'}`,
        detail: panel.getFilePath(),
        panelId: panel.getPanelId()
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a workflow panel to focus',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selected) {
      const panel = panelRegistry.getPanel(selected.panelId);
      if (panel) {
        panel.reveal();
      }
    }
  })
);
```

#### Step 4: Add to package.json Commands

**In package.json**:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "kudosflow.openWorkflowEditor",
        "title": "Open in Workflow Editor",
        "category": "KudosFlow"
      },
      {
        "command": "kudosflow.closeAllPanels",
        "title": "Close All Workflow Panels",
        "category": "KudosFlow"
      },
      {
        "command": "kudosflow.showPanelList",
        "title": "Show Workflow Panel List",
        "category": "KudosFlow"
      }
    ]
  }
}
```

---

## Testing

### Test Scenario 1: Message Isolation

1. Open panels A, B, C
2. Start server in panel B
3. Check console logs

**Expected**:
- ✅ Panel A receives no serverStatus messages
- ✅ Panel B receives serverStatus for itself only
- ✅ Panel C receives no serverStatus messages

### Test Scenario 2: Save Message Routing

1. Open 3 workflow files
2. Edit and save panel 1
3. Check UI feedback

**Expected**:
- ✅ Panel 1 shows "Workflow saved successfully"
- ✅ Panel 2 shows no message
- ✅ Panel 3 shows no message
- ✅ Only panel 1's file is updated on disk

### Test Scenario 3: Chat Message Isolation

1. Open 2 workflow files with servers
2. Send chat message in panel 1: "Hello from panel 1"
3. Send chat message in panel 2: "Hello from panel 2"

**Expected**:
- ✅ Panel 1 chat shows only its conversation
- ✅ Panel 2 chat shows only its conversation
- ✅ No message cross-contamination

### Test Scenario 4: Simultaneous Execution

1. Open 3 workflow files
2. Start execution in all 3 simultaneously
3. Monitor execution updates

**Expected**:
- ✅ Each panel shows only its own execution progress
- ✅ No execution state leakage between panels

### Test Scenario 5: Panel List Command

1. Open 4 workflow files
2. Run command: `KudosFlow: Show Workflow Panel List`
3. Select a panel from the list

**Expected**:
- ✅ Quick pick shows all 4 panels with details
- ✅ Shows panel IDs and port numbers
- ✅ Selecting a panel brings it to focus
- ✅ Panel titles show file names

### Test Scenario 6: Close All Panels Command

1. Open 5 workflow files
2. Start servers on 3 of them
3. Run command: `KudosFlow: Close All Workflow Panels`

**Expected**:
- ✅ All 5 panels close
- ✅ All 3 servers stop
- ✅ All ports released
- ✅ Confirmation message shows count

---

## Success Criteria

- ✅ Messages route to correct panels only
- ✅ No message leakage between panels
- ✅ panelId filtering works in both directions
- ✅ Panel management commands work correctly
- ✅ Message queue handles delayed delivery
- ✅ All webview messages include panelId
- ✅ All extension messages include panelId

---

## Message Routing Patterns

### Pattern 1: Request-Response

```typescript
// Webview sends request
vscode.postMessage({
  command: 'startA2AServer',
  panelId: 'wf-abc123',
  port: 3000
});

// Extension sends response
panel.postMessage({
  command: 'serverStatus',
  panelId: 'wf-abc123',
  status: { state: 'RUNNING', port: 3000 }
});
```

### Pattern 2: Broadcast (if needed)

```typescript
// Extension broadcasts to all panels
messageRouter.broadcast({
  command: 'extensionUpdate',
  version: '2.0.0'
});

// Each webview receives with its own panelId
// Panel A: { command: 'extensionUpdate', panelId: 'wf-abc123', version: '2.0.0' }
// Panel B: { command: 'extensionUpdate', panelId: 'wf-def456', version: '2.0.0' }
```

### Pattern 3: Queued Delivery

```typescript
// Message sent before panel ready
messageRouter.sendToPanel('wf-new123', {
  command: 'initialConfig',
  config: { ... }
});
// → Message queued

// Panel registers
panelRegistry.register(newPanel);
messageRouter.flushQueue('wf-new123');
// → Queued messages delivered
```

---

## Debugging

### Enable Router Debug Logging

```typescript
// In extension.ts activate()
messageRouter.enableDebug();
```

### Monitor Message Flow

Add to WorkflowEditor.tsx:

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    console.log('[WorkflowEditor] Received:', {
      command: message.command,
      panelId: message.panelId,
      myPanelId: panelId,
      willHandle: message.panelId === panelId
    });

    // ... rest of handler
  };
}, [panelId]);
```

---

## Common Issues

### Issue: Messages not received in webview

**Cause**: panelId mismatch or not set
**Solution**: Check console for panelId values, verify message.panelId === webview.panelId

### Issue: All panels receive same message

**Cause**: Missing panelId filter in webview
**Solution**: Add early return for panelId mismatch

### Issue: Panel not in list command

**Cause**: Panel not registered
**Solution**: Verify PanelRegistry.register() is called in constructor

---

## Next Steps

After completing Phase 13C:

1. **Verify** all success criteria met
2. **Test** message isolation thoroughly
3. **Check** commands work as expected
4. **Commit** with message: "Phase 13C: Message Routing and Command Updates"
5. **Proceed** to [Phase 13D: StatusBar and UI Enhancements](PHASE13D_UI_ENHANCEMENTS.md)

---

## Time Breakdown

- **MessageRouter implementation**: 3 hours
- **Panel message handling updates**: 3 hours
- **Webview message handling updates**: 3 hours
- **Command implementation**: 1 hour
- **Testing and debugging**: 2 hours
- **Total**: 10-12 hours
