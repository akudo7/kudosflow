import * as vscode from 'vscode';
import { ServerState } from './types';

/**
 * TerminalManager manages VSCode terminal lifecycle for A2A server processes
 */
export class TerminalManager {
  private terminal: vscode.Terminal | undefined;
  private status: ServerState = ServerState.IDLE;
  private outputCallback?: (output: string) => void;
  private terminalCloseListener?: vscode.Disposable;

  /**
   * Create and configure VSCode terminal
   */
  createTerminal(name: string, panelId?: string): vscode.Terminal {
    // Dispose existing terminal if any
    if (this.terminal) {
      this.dispose();
    }

    // Create new terminal
    this.terminal = vscode.window.createTerminal({
      name,
      hideFromUser: false,
      isTransient: false
    });

    // Track terminal for this panel
    if (panelId) {
      console.log(`[TerminalManager] Created terminal for panel ${panelId}: ${name}`);
    }

    // Listen for terminal close event
    this.terminalCloseListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
      if (closedTerminal === this.terminal) {
        console.log('[TerminalManager] Terminal closed, updating status to IDLE');
        this.status = ServerState.IDLE;
        this.terminal = undefined;

        if (this.outputCallback) {
          this.outputCallback('Terminal closed');
        }
      }
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

    // Show terminal and send command
    this.terminal.show();
    this.terminal.sendText(command);
  }

  /**
   * Send text to terminal (without executing)
   */
  sendText(text: string, addNewLine: boolean = true): void {
    if (!this.terminal) {
      throw new Error('Terminal not created');
    }

    this.terminal.sendText(text, addNewLine);
  }

  /**
   * Send Ctrl+C interrupt to terminal
   */
  sendInterrupt(): void {
    if (!this.terminal) {
      throw new Error('Terminal not created');
    }

    // Send Ctrl+C to interrupt running process
    this.terminal.sendText('\u0003', false);
  }

  /**
   * Listen to terminal output for status updates
   * Note: VSCode API doesn't provide direct output access,
   * so we rely on server status detection through other means
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
    const previousStatus = this.status;
    this.status = status;

    // Notify callback if status changed
    if (this.outputCallback && previousStatus !== status) {
      this.outputCallback(`Status changed: ${previousStatus} -> ${status}`);
    }
  }

  /**
   * Check if terminal is active
   */
  isActive(): boolean {
    return this.terminal !== undefined;
  }

  /**
   * Show terminal in view
   */
  show(preserveFocus: boolean = false): void {
    if (this.terminal) {
      this.terminal.show(preserveFocus);
    }
  }

  /**
   * Hide terminal from view
   */
  hide(): void {
    if (this.terminal) {
      this.terminal.hide();
    }
  }

  /**
   * Get terminal instance
   */
  getTerminal(): vscode.Terminal | undefined {
    return this.terminal;
  }

  /**
   * Dispose terminal and clean up
   */
  dispose(): void {
    // Remove terminal close listener
    if (this.terminalCloseListener) {
      this.terminalCloseListener.dispose();
      this.terminalCloseListener = undefined;
    }

    // Dispose terminal
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = undefined;
    }

    // Reset status
    this.status = ServerState.IDLE;
    this.outputCallback = undefined;
  }
}
