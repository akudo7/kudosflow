import { A2AServerLauncher } from './A2AServerLauncher';

/**
 * Manages all A2A server instances across workflow editor panels.
 *
 * This singleton tracks server launchers associated with each panel,
 * enabling multi-server support and coordinated lifecycle management.
 *
 * @example
 * ```typescript
 * const manager = new ServerInstanceManager();
 * manager.register('wf-abc123', serverLauncher);
 * const runningCount = manager.getRunningCount();  // 1
 * ```
 */
export class ServerInstanceManager {
  private instances: Map<string, A2AServerLauncher>;

  constructor() {
    this.instances = new Map();
  }

  /**
   * Register a server launcher instance for a panel.
   *
   * @param panelId - The panel ID
   * @param launcher - The A2AServerLauncher instance
   * @throws Error if a launcher for this panel already exists
   */
  register(panelId: string, launcher: A2AServerLauncher): void {
    if (this.instances.has(panelId)) {
      throw new Error(`Server launcher already registered for panel ${panelId}`);
    }
    this.instances.set(panelId, launcher);
    console.log(`[ServerInstanceManager] Registered server for panel ${panelId}`);
  }

  /**
   * Unregister a server launcher when panel closes.
   *
   * @param panelId - The panel ID
   */
  unregister(panelId: string): void {
    if (this.instances.delete(panelId)) {
      console.log(`[ServerInstanceManager] Unregistered server for panel ${panelId}`);
    }
  }

  /**
   * Get the server launcher for a specific panel.
   *
   * @param panelId - The panel ID
   * @returns The launcher instance, or undefined if not found
   */
  getInstance(panelId: string): A2AServerLauncher | undefined {
    return this.instances.get(panelId);
  }

  /**
   * Get all registered server instances.
   *
   * @returns Map of panelId to launcher instances
   */
  getAllInstances(): Map<string, A2AServerLauncher> {
    return new Map(this.instances);
  }

  /**
   * Get the count of currently running servers.
   *
   * @returns Number of servers in RUNNING state
   */
  getRunningCount(): number {
    let count = 0;
    for (const launcher of this.instances.values()) {
      if (launcher.isServerRunning()) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get the count of registered server instances (running or not).
   *
   * @returns Total number of registered instances
   */
  getInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Stop all running servers.
   * Useful during extension deactivation.
   *
   * @returns Promise that resolves when all servers stopped
   */
  async stopAll(): Promise<void> {
    console.log(`[ServerInstanceManager] Stopping all ${this.instances.size} servers`);
    const stopPromises: Promise<void>[] = [];

    for (const launcher of this.instances.values()) {
      if (launcher.isServerRunning()) {
        stopPromises.push(launcher.stopServer());
      }
    }

    await Promise.all(stopPromises);
    console.log('[ServerInstanceManager] All servers stopped');
  }

  /**
   * Get server status for all instances.
   *
   * @returns Array of server status objects
   */
  getAllServerStatus(): Array<{
    panelId: string;
    isRunning: boolean;
    port?: number;
    filePath?: string;
  }> {
    const statuses: Array<any> = [];

    for (const [panelId, launcher] of this.instances.entries()) {
      statuses.push({
        panelId,
        isRunning: launcher.isServerRunning(),
        port: launcher.getCurrentPort(),
        filePath: launcher.getCurrentFilePath()
      });
    }

    return statuses;
  }

  /**
   * Check if any server is running.
   *
   * @returns True if at least one server is running
   */
  hasRunningServers(): boolean {
    return this.getRunningCount() > 0;
  }
}
