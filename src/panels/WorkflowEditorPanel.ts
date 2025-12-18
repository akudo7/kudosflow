import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
  workspace,
} from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { A2AServerLauncher } from "../execution/A2AServerLauncher";
import { WorkflowExecutor } from "../execution/WorkflowExecutor";

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
  public static currentPanel: WorkflowEditorPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private _filePath: string;
  private _serverLauncher: A2AServerLauncher;
  private _workflowExecutor: WorkflowExecutor;

  private constructor(panel: WebviewPanel, extensionUri: Uri, filePath: string) {
    this._panel = panel;
    this._filePath = filePath;
    this._serverLauncher = new A2AServerLauncher();
    this._workflowExecutor = new WorkflowExecutor(this._panel);

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

    // Load the workflow from the JSON file
    this._loadWorkflow();
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension
   * @param filePath The path to the JSON workflow file to open
   */
  public static render(extensionUri: Uri, filePath: string) {
    if (WorkflowEditorPanel.currentPanel) {
      // If the webview panel already exists reveal it
      WorkflowEditorPanel.currentPanel._panel.reveal(ViewColumn.One);
      // Update the file path and reload
      WorkflowEditorPanel.currentPanel._filePath = filePath;
      WorkflowEditorPanel.currentPanel._loadWorkflow();
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        "workflowEditor",
        "Workflow Editor",
        ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            Uri.joinPath(extensionUri, "out"),
            Uri.joinPath(extensionUri, "webview-ui/build"),
            Uri.joinPath(extensionUri, "resources"),
          ],
        }
      );

      WorkflowEditorPanel.currentPanel = new WorkflowEditorPanel(
        panel,
        extensionUri,
        filePath
      );
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    WorkflowEditorPanel.currentPanel = undefined;

    // Stop server if running
    if (this._serverLauncher.isServerRunning()) {
      this._serverLauncher.stopServer().catch(console.error);
    }

    // Dispose of server launcher
    this._serverLauncher.dispose();

    // Dispose of workflow executor
    this._workflowExecutor.dispose();

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
   * Loads the workflow from the JSON file and sends it to the webview
   */
  private async _loadWorkflow() {
    try {
      const fileContent = await workspace.fs.readFile(Uri.file(this._filePath));
      const workflow = JSON.parse(fileContent.toString());

      this._panel.webview.postMessage({
        command: "loadWorkflow",
        data: workflow,
        filePath: this._filePath,
      });

      console.log(`Loaded workflow from: ${this._filePath}`);
      console.log("Workflow data:", JSON.stringify(workflow, null, 2));
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
    const answer = await window.showWarningMessage(
      "ワークフローを保存しますか？",
      "はい",
      "いいえ"
    );

    if (answer === "はい") {
      try {
        const content = JSON.stringify(data, null, 2);
        await workspace.fs.writeFile(
          Uri.file(this._filePath),
          Buffer.from(content, "utf8")
        );

        this._panel.webview.postMessage({ command: "saveSuccess" });
        window.showInformationMessage("ワークフローを保存しました");
      } catch (error) {
        this._panel.webview.postMessage({
          command: "saveError",
          error: String(error),
        });
        window.showErrorMessage(`保存に失敗しました: ${error}`);
      }
    }
  }

  /**
   * Start A2A server for the workflow
   */
  private async _startA2AServer(filePath: string, port?: number): Promise<void> {
    try {
      const serverPort = port || 3000;
      await this._serverLauncher.launchServer(filePath, serverPort);
      this._sendServerStatus();
      window.showInformationMessage(
        `A2A Server started on port ${serverPort}`
      );
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: "serverError",
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
