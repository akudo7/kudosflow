import * as path from 'path';
import * as fs from 'fs';
import { TerminalManager } from './TerminalManager';
import { ServerState, ServerStatus, ServerEndpoints } from './types';

/**
 * A2AServerLauncher orchestrates A2A server launch and lifecycle management
 */
export class A2AServerLauncher {
  private terminalManager: TerminalManager;
  private currentPort: number | undefined;
  private currentFilePath: string | undefined;
  private startTime: Date | undefined;
  private statusChangeCallback?: () => void;

  constructor() {
    this.terminalManager = new TerminalManager();

    // Listen to terminal status changes
    this.terminalManager.listenToOutput((output: string) => {
      console.log('[A2AServerLauncher] Terminal output:', output);

      // If terminal was closed, reset state
      if (output.includes('Terminal closed')) {
        console.log('[A2AServerLauncher] Terminal closed, resetting state');
        this.currentPort = undefined;
        this.currentFilePath = undefined;
        this.startTime = undefined;
      }

      // Notify status change callback
      if (this.statusChangeCallback) {
        this.statusChangeCallback();
      }
    });
  }

  /**
   * Register callback for status changes
   */
  onStatusChange(callback: () => void): void {
    this.statusChangeCallback = callback;
  }

  /**
   * Launch A2A server for workflow
   */
  async launchServer(configPath: string, port?: number): Promise<void> {
    // Validate config file exists
    if (!fs.existsSync(configPath)) {
      throw new Error(`Workflow config not found: ${configPath}`);
    }

    // Validate config is valid JSON
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      JSON.parse(configContent);
    } catch (error: any) {
      throw new Error(`Invalid workflow JSON: ${error.message}`);
    }

    // Check if server is already running
    if (this.isServerRunning()) {
      throw new Error('Server is already running. Stop it first.');
    }

    // Use default port if not specified
    const serverPort = port || 3000;

    // Create terminal with descriptive name
    const terminalName = `A2A Server - ${path.basename(configPath)} (Port ${serverPort})`;
    this.terminalManager.createTerminal(terminalName);

    // Update status to starting
    this.terminalManager.setStatus(ServerState.STARTING);

    // Build launch command
    const command = this.buildLaunchCommand(configPath, serverPort);

    // Execute command
    await this.terminalManager.executeCommand(command);

    // Store current state
    this.currentPort = serverPort;
    this.currentFilePath = configPath;
    this.startTime = new Date();

    // Update status after delay (wait for server startup)
    setTimeout(() => {
      if (this.terminalManager.getStatus() === ServerState.STARTING) {
        this.terminalManager.setStatus(ServerState.RUNNING);
      }
    }, 2000);
  }

  /**
   * Build server launch command
   */
  private buildLaunchCommand(configPath: string, port: number): string {
    // Get absolute path to serverRunner.js in the compiled output
    const extensionOutDir = path.join(__dirname);
    const serverRunnerPath = path.join(extensionOutDir, 'serverRunner.js');

    // Escape paths for command line
    const escapedConfigPath = configPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const escapedRunnerPath = serverRunnerPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // Build Node.js command to run the server
    return `node -e "require('${escapedRunnerPath}').runServer('${escapedConfigPath}', ${port})"`;
  }

  /**
   * Stop running server
   */
  async stopServer(): Promise<void> {
    if (!this.isServerRunning()) {
      throw new Error('No server is running');
    }

    // Update status
    this.terminalManager.setStatus(ServerState.STOPPING);

    // Send Ctrl+C to stop the server process
    this.terminalManager.sendInterrupt();

    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 500));

    // Dispose terminal
    this.terminalManager.dispose();

    // Reset state
    this.currentPort = undefined;
    this.currentFilePath = undefined;
    this.startTime = undefined;
  }

  /**
   * Restart server with current configuration
   */
  async restartServer(): Promise<void> {
    if (!this.currentFilePath) {
      throw new Error('No active server to restart');
    }

    const filePath = this.currentFilePath;
    const port = this.currentPort;

    await this.stopServer();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.launchServer(filePath, port);
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
   * Get current server status
   */
  getServerStatus(): ServerStatus {
    const state = this.terminalManager.getStatus();

    return {
      state,
      port: this.currentPort,
      endpoints: this.getServerEndpoints(),
      startTime: this.startTime
    };
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    const status = this.terminalManager.getStatus();
    return status === ServerState.RUNNING || status === ServerState.STARTING;
  }

  /**
   * Get current port
   */
  getCurrentPort(): number | undefined {
    return this.currentPort;
  }

  /**
   * Get current file path
   */
  getCurrentFilePath(): string | undefined {
    return this.currentFilePath;
  }

  /**
   * Show server terminal
   */
  showTerminal(): void {
    this.terminalManager.show();
  }

  /**
   * Dispose launcher and clean up
   */
  dispose(): void {
    this.terminalManager.dispose();
    this.currentPort = undefined;
    this.currentFilePath = undefined;
    this.startTime = undefined;
  }
}
