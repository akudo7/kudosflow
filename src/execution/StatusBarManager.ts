import * as vscode from 'vscode';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  showExecuting(workflowName: string): void {
    this.statusBarItem.text = `$(sync~spin) Executing: ${workflowName}`;
    this.statusBarItem.tooltip = 'Workflow execution in progress';
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.command = undefined;
    this.statusBarItem.show();
  }

  showServerRunning(port: number): void {
    this.statusBarItem.text = `$(server) A2A Server :${port}`;
    this.statusBarItem.tooltip = 'A2A server is running. Click to view status.';
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.command = 'kudosflow.showServerStatus';
    this.statusBarItem.show();
  }

  showIdle(): void {
    this.statusBarItem.text = '$(circle-large-outline) Workflow Idle';
    this.statusBarItem.tooltip = 'No active execution';
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.command = undefined;
    this.statusBarItem.hide();
  }

  showError(message: string): void {
    this.statusBarItem.text = `$(error) ${message}`;
    this.statusBarItem.tooltip = 'Execution error. Click for details.';
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    this.statusBarItem.command = undefined;
    this.statusBarItem.show();

    // Auto-hide error after 10 seconds
    setTimeout(() => {
      if (this.statusBarItem.text.startsWith('$(error)')) {
        this.showIdle();
      }
    }, 10000);
  }

  showServerStarting(port: number): void {
    this.statusBarItem.text = `$(sync~spin) Starting A2A Server :${port}`;
    this.statusBarItem.tooltip = 'A2A server is starting...';
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.command = undefined;
    this.statusBarItem.show();
  }

  showServerStopping(): void {
    this.statusBarItem.text = `$(sync~spin) Stopping A2A Server`;
    this.statusBarItem.tooltip = 'A2A server is stopping...';
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.command = undefined;
    this.statusBarItem.show();
  }

  showServerError(error: string): void {
    this.statusBarItem.text = `$(error) Server Error`;
    this.statusBarItem.tooltip = error;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    this.statusBarItem.command = undefined;
    this.statusBarItem.show();

    // Auto-hide error after 10 seconds
    setTimeout(() => {
      if (this.statusBarItem.text.startsWith('$(error)')) {
        this.showIdle();
      }
    }, 10000);
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
