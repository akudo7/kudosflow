// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WorkflowEditorPanel } from "./panels/WorkflowEditorPanel";
import { StatusBarManager } from "./execution/StatusBarManager";
import { PanelRegistry } from "./managers/PanelRegistry";
import { PortManager } from "./managers/PortManager";

// Global instances
let statusBarManager: StatusBarManager | undefined;
let panelRegistry: PanelRegistry;
let portManager: PortManager;

/**
 * Activates the extension and sets up the RAG Explorer
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code
 * @returns {void}
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize managers
  panelRegistry = new PanelRegistry();
  portManager = new PortManager();

  console.log('[Extension] Initialized PanelRegistry and PortManager');

  // Initialize StatusBarManager
  statusBarManager = new StatusBarManager();
  context.subscriptions.push(statusBarManager);

  // Register Workflow Editor command
  context.subscriptions.push(
    vscode.commands.registerCommand("kudosflow.openWorkflowEditor", (uri: vscode.Uri) => {
      // Get the file path from the URI
      const filePath = uri.fsPath;
      // Open the workflow editor with the selected JSON file
      WorkflowEditorPanel.render(context.extensionUri, filePath);
    })
  );

  // Register show server status command
  context.subscriptions.push(
    vscode.commands.registerCommand("kudosflow.showServerStatus", () => {
      // This command will be handled by the active WorkflowEditorPanel
      // The status bar item will trigger this when clicked
      vscode.window.showInformationMessage('Click on the server status button in the workflow editor toolbar for details.');
    })
  );
}

/**
 * Deactivates the extension and cleans up resources
 */
export function deactivate() {
  // Dispose all panels
  if (panelRegistry) {
    panelRegistry.disposeAll();
  }

  console.log('[Extension] Deactivated, all panels disposed');
}

/**
 * Get the global StatusBarManager instance
 * @returns {StatusBarManager | undefined} The StatusBarManager instance
 */
export function getStatusBarManager(): StatusBarManager | undefined {
  return statusBarManager;
}

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

