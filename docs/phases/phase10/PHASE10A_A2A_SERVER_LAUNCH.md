# Phase 10A: Terminal Integration & A2A Server Launch

**Status**: ⬜ 未開始
**Time**: 3-4 days
**Complexity**: High
**Priority**: ⭐ Foundation Phase

## Overview

Launch workflow as A2A server in VSCode terminal with full lifecycle management. This phase establishes the foundation for running workflows as standalone Agent-to-Agent protocol servers.

## Goal

Enable users to launch workflow JSON files as HTTP servers that expose A2A protocol endpoints for external agent communication.

## Architecture

### Components

1. **TerminalManager** - Manages VSCode terminal lifecycle
2. **A2AServerLauncher** - Orchestrates server launch/stop
3. **Message Handlers** - Extension ↔ Webview communication
4. **Server Status UI** - Toolbar controls and status display

### Server Launch Strategy

Two possible approaches:

**Option A: Use existing CLI/server** (if available)
```bash
cd /Users/akirakudo/Desktop/MyWork/CLI/server
yarn server <workflow-json-path>
```

**Option B: Inline server script in extension**
```bash
node -e "require('./out/execution/serverRunner.js').runServer('<json-path>', port)"
```

### Server Implementation Pattern

Following the reference implementation at `/Users/akirakudo/Desktop/MyWork/CLI/server/src/server.ts`:

1. Load WorkflowConfig from JSON file (lines 28-60)
2. Build WorkflowEngine instance (line 129-130)
3. Create AgentCard from config (lines 65-115)
4. Setup Express app with A2A routes (lines 194-304)
5. Start server on specified port (lines 307-323)

## Implementation Tasks

### Task 1: TerminalManager (`src/execution/TerminalManager.ts`)

Create terminal lifecycle manager (150-200 lines):

```typescript
import * as vscode from 'vscode';

export enum ServerState {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export class TerminalManager {
  private terminal: vscode.Terminal | undefined;
  private serverProcess: any;
  private status: ServerState = ServerState.IDLE;
  private outputCallback?: (output: string) => void;

  /**
   * Create and configure VSCode terminal
   */
  createTerminal(name: string): vscode.Terminal {
    this.terminal = vscode.window.createTerminal({
      name,
      hideFromUser: false
    });
    return this.terminal;
  }

  /**
   * Execute command in terminal
   */
  async executeCommand(command: string): Promise<void> {
    if (!this.terminal) {
      throw new Error('Terminal not created');
    }

    this.terminal.show();
    this.terminal.sendText(command);
  }

  /**
   * Listen to terminal output for status updates
   * Note: VSCode API doesn't provide direct output access,
   * so we rely on terminal output patterns
   */
  listenToOutput(callback: (output: string) => void): void {
    this.outputCallback = callback;
  }

  /**
   * Get current server status
   */
  getStatus(): ServerState {
    return this.status;
  }

  /**
   * Update server status
   */
  setStatus(status: ServerState): void {
    this.status = status;
  }

  /**
   * Dispose terminal and clean up
   */
  dispose(): void {
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = undefined;
    }
    this.status = ServerState.IDLE;
  }
}
```

**Key Responsibilities:**
- Create and manage VSCode terminals
- Track process lifecycle (starting → running → stopped)
- Parse terminal output for server status messages
- Detect port binding success/failure
- Handle graceful shutdown
- Clean up resources on dispose

### Task 2: A2AServerLauncher (`src/execution/A2AServerLauncher.ts`)

Server launch orchestration (200-250 lines):

```typescript
import * as path from 'path';
import * as fs from 'fs';
import { TerminalManager, ServerState } from './TerminalManager';
import { ServerStatus, ServerEndpoints } from './types';

export class A2AServerLauncher {
  private terminalManager: TerminalManager;
  private currentPort: number | undefined;
  private currentFilePath: string | undefined;

  constructor() {
    this.terminalManager = new TerminalManager();
  }

  /**
   * Launch A2A server for workflow
   */
  async launchServer(configPath: string, port?: number): Promise<void> {
    // Validate config file exists
    if (!fs.existsSync(configPath)) {
      throw new Error(`Workflow config not found: ${configPath}`);
    }

    // Use default port if not specified
    const serverPort = port || 3000;

    // Create terminal
    const terminal = this.terminalManager.createTerminal(
      `A2A Server - ${path.basename(configPath)}`
    );

    // Update status
    this.terminalManager.setStatus(ServerState.STARTING);

    // Build launch command
    const command = this.buildLaunchCommand(configPath, serverPort);

    // Execute command
    await this.terminalManager.executeCommand(command);

    // Store current state
    this.currentPort = serverPort;
    this.currentFilePath = configPath;

    // Update status after delay (wait for server startup)
    setTimeout(() => {
      this.terminalManager.setStatus(ServerState.RUNNING);
    }, 2000);
  }

  /**
   * Build server launch command
   */
  private buildLaunchCommand(configPath: string, port: number): string {
    // Option A: Use existing CLI
    // return `cd /Users/akirakudo/Desktop/MyWork/CLI/server && yarn server ${configPath}`;

    // Option B: Use inline server runner
    return `node -e "require('${__dirname}/serverRunner.js').runServer('${configPath}', ${port})"`;
  }

  /**
   * Stop running server
   */
  async stopServer(): Promise<void> {
    this.terminalManager.setStatus(ServerState.STOPPING);

    // Send Ctrl+C to terminal
    this.terminalManager.dispose();

    this.currentPort = undefined;
    this.currentFilePath = undefined;
  }

  /**
   * Restart server
   */
  async restartServer(): Promise<void> {
    if (!this.currentFilePath) {
      throw new Error('No active server to restart');
    }

    await this.stopServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.launchServer(this.currentFilePath, this.currentPort);
  }

  /**
   * Get server endpoints
   */
  getServerEndpoints(): ServerEndpoints | undefined {
    if (!this.currentPort) {
      return undefined;
    }

    const baseUrl = `http://localhost:${this.currentPort}`;
    return {
      agentCard: `${baseUrl}/.well-known/agent.json`,
      messageSend: `${baseUrl}/message/send`,
      tasks: `${baseUrl}/tasks`
    };
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.terminalManager.getStatus() === ServerState.RUNNING;
  }

  /**
   * Dispose launcher and clean up
   */
  dispose(): void {
    this.terminalManager.dispose();
  }
}
```

### Task 3: Type Definitions (`src/execution/types.ts`)

Define shared types (50-100 lines):

```typescript
export interface ServerStatus {
  state: 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  port?: number;
  pid?: number;
  endpoints?: ServerEndpoints;
  error?: string;
  startTime?: Date;
}

export interface ServerEndpoints {
  agentCard: string;      // http://localhost:3000/.well-known/agent.json
  messageSend: string;    // http://localhost:3000/message/send
  tasks: string;          // http://localhost:3000/tasks
}

export interface ServerConfig {
  port: number;
  autoRestart: boolean;
  timeout: number;
}
```

### Task 4: Server Runner (`src/execution/serverRunner.ts`)

Inline server implementation (100-150 lines):

```typescript
import express from 'express';
import { WorkflowEngine } from '@kudos/scene-graph-manager';
import * as fs from 'fs';

export async function runServer(configPath: string, port: number): Promise<void> {
  // Load workflow config
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const workflowConfig = JSON.parse(configContent);

  // Create workflow engine
  const engine = new WorkflowEngine(workflowConfig);

  // Create Express app
  const app = express();
  app.use(express.json());

  // A2A Protocol routes
  app.get('/.well-known/agent.json', (req, res) => {
    const agentCard = {
      name: workflowConfig.name || 'Workflow Agent',
      description: workflowConfig.description || 'A workflow-based agent',
      capabilities: ['message/send', 'tasks']
    };
    res.json(agentCard);
  });

  app.post('/message/send', async (req, res) => {
    try {
      const { message, thread_id } = req.body;
      const result = await engine.execute({ input: message, thread_id });
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/tasks', (req, res) => {
    res.json({ tasks: [] }); // Placeholder
  });

  // Start server
  app.listen(port, () => {
    console.log(`✓ A2A Server running on port ${port}`);
    console.log(`  Agent Card: http://localhost:${port}/.well-known/agent.json`);
    console.log(`  Message Send: http://localhost:${port}/message/send`);
  });
}
```

### Task 5: Message Handlers (`src/panels/WorkflowEditorPanel.ts`)

Add server control message handlers (+100 lines):

```typescript
private async _handleMessageFromWebview(message: any) {
  switch (message.command) {
    // ... existing handlers

    case "startA2AServer":
      await this._startA2AServer(message.filePath, message.port);
      break;

    case "stopA2AServer":
      await this._stopA2AServer();
      break;

    case "getServerStatus":
      this._sendServerStatus();
      break;

    case "restartServer":
      await this._restartServer();
      break;
  }
}

private async _startA2AServer(filePath: string, port: number) {
  try {
    await this._serverLauncher.launchServer(filePath, port);
    this._updateServerStatus();
    vscode.window.showInformationMessage('A2A Server started successfully');
  } catch (error: any) {
    this._sendError(`Failed to start server: ${error.message}`);
    vscode.window.showErrorMessage(`Server error: ${error.message}`);
  }
}

private async _stopA2AServer() {
  try {
    await this._serverLauncher.stopServer();
    this._updateServerStatus();
    vscode.window.showInformationMessage('A2A Server stopped');
  } catch (error: any) {
    this._sendError(`Failed to stop server: ${error.message}`);
  }
}

private _updateServerStatus() {
  const status = {
    state: this._serverLauncher.isServerRunning() ? 'running' : 'idle',
    port: this._serverLauncher['currentPort'],
    endpoints: this._serverLauncher.getServerEndpoints()
  };

  this._panel.webview.postMessage({
    command: 'serverStatus',
    status
  });
}
```

### Task 6: Server Status UI (`webview-ui/src/workflow-editor/WorkflowToolbar.tsx`)

Add server controls to toolbar (+80 lines):

```tsx
import { Button, Chip, IconButton, Box, Badge } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

{/* Server Control Section */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
  {serverStatus.state === 'idle' && (
    <Button
      variant="contained"
      color="primary"
      size="small"
      startIcon={<PlayArrowIcon />}
      onClick={handleStartServer}
    >
      Run A2A Server
    </Button>
  )}

  {serverStatus.state === 'running' && (
    <>
      <Chip
        icon={<CheckCircleIcon />}
        label={`Server Running (Port ${serverStatus.port})`}
        color="success"
        size="small"
      />
      <IconButton size="small" onClick={handleStopServer}>
        <StopIcon />
      </IconButton>
      <IconButton size="small" onClick={handleViewEndpoints}>
        <InfoIcon />
      </IconButton>
    </>
  )}

  {serverStatus.state === 'error' && (
    <Chip
      icon={<ErrorIcon />}
      label="Server Error"
      color="error"
      size="small"
      onClick={handleShowError}
    />
  )}
</Box>
```

## Files to Create

1. `src/execution/TerminalManager.ts` (150-200 lines)
2. `src/execution/A2AServerLauncher.ts` (200-250 lines)
3. `src/execution/types.ts` (50-100 lines)
4. `src/execution/serverRunner.ts` (100-150 lines)

## Files to Modify

1. `src/panels/WorkflowEditorPanel.ts` (+100 lines) - Message handlers, server lifecycle
2. `webview-ui/src/workflow-editor/WorkflowToolbar.tsx` (+80 lines) - Server UI controls
3. `webview-ui/src/workflow-editor/WorkflowEditor.tsx` (+50 lines) - Server state management
4. `webview-ui/src/workflow-editor/types/workflow.types.ts` (+30 lines) - Server types
5. `package.json` (+3 dependencies) - Add @a2a-js/sdk, express, dotenv

## Dependencies to Install

Add to `package.json`:
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

Run: `yarn install`

## Testing Checklist

- [ ] Terminal creates successfully
- [ ] Server launches with valid workflow JSON
- [ ] Server status updates correctly (idle → starting → running)
- [ ] Port conflict detected and reported
- [ ] Server endpoints are accessible (curl test)
- [ ] Server stops gracefully (no orphan processes)
- [ ] Terminal output displays correctly
- [ ] Error handling (invalid JSON, missing dependencies)
- [ ] Server restart after crash
- [ ] Multiple workflow files can start servers on different ports

## Success Criteria

Phase 10A is complete when:

- ✓ Terminal launches for A2A server
- ✓ Server runs in VSCode terminal
- ✓ Server status displays in toolbar
- ✓ Start/stop buttons work correctly
- ✓ Endpoints accessible externally
- ✓ Error messages clear and actionable
- ✓ No orphan processes on stop
- ✓ Port conflicts handled gracefully

## Next Phase

After completing Phase 10A, proceed to [Phase 10B: Chat UI Foundation](PHASE10B_CHAT_UI_FOUNDATION.md) to create the interactive chat interface for workflow execution.
