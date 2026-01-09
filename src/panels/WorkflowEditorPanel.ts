import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
  workspace,
} from "vscode";
import * as path from "path";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { A2AServerLauncher } from "../execution/A2AServerLauncher";
import { WorkflowExecutor } from "../execution/WorkflowExecutor";
import { getPanelRegistry } from "../extension";
import { getPortManager } from "../extension";
import { getServerInstanceManager } from "../extension";

/**
 * This class manages the state and behavior of WorkflowEditor webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering WorkflowEditor webview panels
 * - Loading JSON workflow files
 * - Saving modified workflows back to JSON files
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 */
export class WorkflowEditorPanel {
  private readonly panelId: string;
  private assignedPort: number | undefined;
  private configuredPort: number | undefined; // Port from workflow JSON
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private _filePath: string | undefined;
  private _serverLauncher: A2AServerLauncher;
  private _workflowExecutor: WorkflowExecutor;

  constructor(panelId: string, panel: WebviewPanel, extensionUri: Uri, filePath: string | undefined) {
    this.panelId = panelId;
    this._panel = panel;
    this._filePath = filePath;

    // Create A2A server launcher with panelId
    this._serverLauncher = new A2AServerLauncher(this.panelId);
    this._workflowExecutor = new WorkflowExecutor(this._panel);

    // Register with ServerInstanceManager
    const serverManager = getServerInstanceManager();
    serverManager.register(this.panelId, this._serverLauncher);

    // Listen to server status changes
    this._serverLauncher.onStatusChange(() => {
      console.log('[WorkflowEditorPanel] Server status changed, sending update to webview');
      this._sendServerStatus();
    });

    // Set an event listener to listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );

    // Set up message listener
    this._setWebviewMessageListener(this._panel.webview);

    // Initialize port configuration synchronously before loading workflow
    this._initializePortConfiguration();

    // Load the workflow from the JSON file
    this._loadWorkflow();
  }

  /**
   * Creates and renders a new webview panel for workflow editing.
   * Each invocation creates a new instance, enabling multi-instance support.
   *
   * @param extensionUri The URI of the directory containing the extension
   * @param filePath The path to the JSON workflow file to open
   * @returns The newly created WorkflowEditorPanel instance
   */
  public static render(extensionUri: Uri, filePath: string): WorkflowEditorPanel {
    const panelRegistry = getPanelRegistry();
    const panelId = panelRegistry.generateId();

    const panel = window.createWebviewPanel(
      `workflowEditor-${panelId}`,
      `Workflow: ${path.basename(filePath)}`,
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

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    console.log(`[WorkflowEditorPanel] Disposing panel ${this.panelId.slice(-6)}`);

    // Stop server if running
    if (this._serverLauncher.isServerRunning()) {
      console.log(`[WorkflowEditorPanel] Stopping server for panel ${this.panelId.slice(-6)}`);
      this._serverLauncher.stopServer().catch(console.error);
    }

    // Unregister from ServerInstanceManager
    const serverManager = getServerInstanceManager();
    serverManager.unregister(this.panelId);

    // Dispose of server launcher
    this._serverLauncher.dispose();

    // Dispose of workflow executor
    this._workflowExecutor.dispose();

    // Release port (both configured and auto-allocated ports)
    const portManager = getPortManager();
    const releasedPort = this.configuredPort || this.assignedPort;
    if (releasedPort !== undefined) {
      portManager.releasePort(this.panelId);
      const portType = this.configuredPort ? 'configured' : 'auto-allocated';
      console.log(`[WorkflowEditorPanel] Released ${portType} port ${releasedPort} for panel ${this.panelId.slice(-6)}`);
    }

    // Unregister from panel registry
    const panelRegistry = getPanelRegistry();
    panelRegistry.unregister(this.panelId);

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Initialize port configuration by reading the workflow JSON synchronously
   */
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

      // Extract port from workflow config if specified
      // Check for port at: config.a2aEndpoint.port (following reference implementation)
      const port = workflow.config?.a2aEndpoint?.port;
      if (port && typeof port === 'number') {
        this.configuredPort = port;
        console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} using configured port ${this.configuredPort} from JSON (config.a2aEndpoint.port)`);
      } else {
        console.log(`[WorkflowEditorPanel] Panel ${this.panelId.slice(-6)} will use auto-allocated port (no config.a2aEndpoint.port found)`);
      }
    } catch (error) {
      console.error(`[WorkflowEditorPanel] Failed to read port configuration:`, error);
    }
  }

  /**
   * Loads the workflow from the JSON file and sends it to the webview
   */
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

  /**
   * Sets up the message listener for webview messages
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.command) {
          case "save":
            await this._saveWorkflow(message.data);
            break;
          case "reload":
            // Reload workflow from JSON file
            await this._loadWorkflow();
            break;
          case "ready":
            // Webview is ready, load the workflow
            await this._loadWorkflow();
            break;
          case "error":
            window.showErrorMessage(message.message || "An error occurred");
            break;
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
          case "initializeWorkflow":
            await this._initializeWorkflow(message.sessionId, message.filePath);
            break;
          case "executeWorkflow":
            await this._executeWorkflow(message.sessionId, message.input);
            break;
          case "resumeWorkflow":
            await this._resumeWorkflow(message.sessionId, message.input);
            break;
          case "getExecutionState":
            this._sendExecutionState(message.sessionId);
            break;
          case "clearSession":
            this._clearSession(message.sessionId);
            break;
          case "clearChatHistory":
            await this._clearChatHistory(message.sessionId, message.threadId);
            break;
          case "clearAllChatHistory":
            await this._clearAllChatHistory();
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  /**
   * Saves the workflow data to the JSON file
   */
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

  /**
   * Start A2A server for the workflow
   */
  private async _startA2AServer(filePath: string, port?: number): Promise<void> {
    try {
      // Priority: 1. Explicit port parameter, 2. Configured port from JSON, 3. Auto-allocated port
      const serverPort = port || this.configuredPort || this.assignedPort;

      if (!serverPort) {
        window.showErrorMessage('No port available for this panel.');
        return;
      }

      await this._serverLauncher.launchServer(filePath, serverPort);
      console.log(`[WorkflowEditorPanel] Server started on port ${serverPort}`);
      this._sendServerStatus();
      window.showInformationMessage(
        `A2A Server started on port ${serverPort}`
      );
    } catch (error: any) {
      console.error(`[WorkflowEditorPanel] Failed to start server:`, error);
      this._panel.webview.postMessage({
        command: "serverError",
        panelId: this.panelId,
        error: error.message,
      });
      window.showErrorMessage(`Failed to start server: ${error.message}`);
    }
  }

  /**
   * Stop A2A server
   */
  private async _stopA2AServer(): Promise<void> {
    try {
      await this._serverLauncher.stopServer();
      this._sendServerStatus();
      window.showInformationMessage("A2A Server stopped");
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: "serverError",
        panelId: this.panelId,
        error: error.message,
      });
      window.showErrorMessage(`Failed to stop server: ${error.message}`);
    }
  }

  /**
   * Restart A2A server
   */
  private async _restartServer(): Promise<void> {
    try {
      await this._serverLauncher.restartServer();
      this._sendServerStatus();
      window.showInformationMessage("A2A Server restarted");
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: "serverError",
        panelId: this.panelId,
        error: error.message,
      });
      window.showErrorMessage(`Failed to restart server: ${error.message}`);
    }
  }

  /**
   * Send server status to webview
   */
  private _sendServerStatus(): void {
    const status = this._serverLauncher.getServerStatus();
    this._panel.webview.postMessage({
      command: "serverStatus",
      panelId: this.panelId,
      status,
    });
  }

  /**
   * Initialize workflow for execution
   */
  private async _initializeWorkflow(sessionId: string, filePath: string): Promise<void> {
    try {
      await this._workflowExecutor.initializeWorkflow(sessionId, filePath);
    } catch (error: any) {
      window.showErrorMessage(`Failed to initialize workflow: ${error.message}`);
    }
  }

  /**
   * Execute workflow with user input
   */
  private async _executeWorkflow(sessionId: string, input: string): Promise<void> {
    try {
      await this._workflowExecutor.execute(sessionId, input);
    } catch (error: any) {
      window.showErrorMessage(`Execution error: ${error.message}`);
    }
  }

  /**
   * Resume workflow after interrupt
   */
  private async _resumeWorkflow(sessionId: string, input: string): Promise<void> {
    try {
      await this._workflowExecutor.resume(sessionId, input);
    } catch (error: any) {
      window.showErrorMessage(`Resume error: ${error.message}`);
    }
  }

  /**
   * Send execution state to webview
   */
  private _sendExecutionState(sessionId: string): void {
    const state = this._workflowExecutor.getExecutionState(sessionId);
    this._panel.webview.postMessage({
      command: "executionState",
      panelId: this.panelId,
      state,
    });
  }

  /**
   * Clear execution session
   */
  private _clearSession(sessionId: string): void {
    this._workflowExecutor.clearSession(sessionId);
  }

  /**
   * Clear chat history for a specific session
   */
  private async _clearChatHistory(sessionId: string, threadId?: string): Promise<void> {
    try {
      const newThreadId = await this._workflowExecutor.clearChatHistory(sessionId, threadId);
      console.log(`[WorkflowEditorPanel] Chat history cleared for session ${sessionId}. New thread_id: ${newThreadId}`);
    } catch (error: any) {
      console.error('[WorkflowEditorPanel] Failed to clear chat history:', error);
      this._panel.webview.postMessage({
        command: 'error',
        message: `Failed to clear chat history: ${error.message}`
      });
    }
  }

  /**
   * Clear chat history for all sessions
   */
  private async _clearAllChatHistory(): Promise<void> {
    try {
      const results = await this._workflowExecutor.clearAllChatHistory();
      console.log(`[WorkflowEditorPanel] All chat history cleared (${results.size} sessions)`);

      // Notify webview of success
      this._panel.webview.postMessage({
        command: 'allChatHistoryCleared',
        sessionCount: results.size
      });
    } catch (error: any) {
      console.error('[WorkflowEditorPanel] Failed to clear all chat history:', error);
      this._panel.webview.postMessage({
        command: 'error',
        message: `Failed to clear all chat history: ${error.message}`
      });
    }
  }

  /**
   * Get the panel ID for this instance.
   */
  public getPanelId(): string {
    return this.panelId;
  }

  /**
   * Get the file path being edited.
   */
  public getFilePath(): string | undefined {
    return this._filePath;
  }

  /**
   * Check if this is a new workflow (not yet saved)
   */
  public isNewWorkflow(): boolean {
    return this._filePath === undefined;
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

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be rendered
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);
    // Codicon font file from the React build output
    const codiconFontUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "codicon.ttf",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}'; worker-src blob:; child-src blob:; connect-src ${webview.cspSource} https:;">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Workflow Editor</title>
          <style nonce="${nonce}">
            @font-face {
              font-family: "codicon";
              font-display: block;
              src: url("${codiconFontUri}") format("truetype");
            }
          </style>
        </head>
        <body>
          <div id="root" data-editor="workflow"></div>
          <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
          </script>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
