// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ComponentGalleryPanel } from "./panels/ComponentGalleryPanel";
import { WorkflowEditorPanel } from "./panels/WorkflowEditorPanel";

/**
 * Activates the extension and sets up the RAG Explorer
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code
 * @returns {void}
 */
export function activate(context: vscode.ExtensionContext): void {
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("reactflowtest.helloworld", () => {
      // ComponentGalleryPanelのrenderメソッドを呼び出し
      ComponentGalleryPanel.render(context.extensionUri);
    })
  );

  // Register Workflow Editor command
  context.subscriptions.push(
    vscode.commands.registerCommand("kudosflow.openWorkflowEditor", (uri: vscode.Uri) => {
      // Get the file path from the URI
      const filePath = uri.fsPath;
      // Open the workflow editor with the selected JSON file
      WorkflowEditorPanel.render(context.extensionUri, filePath);
    })
  );
}

