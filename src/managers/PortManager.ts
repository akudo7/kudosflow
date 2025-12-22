import * as net from 'net';

/**
 * Manages automatic port allocation for A2A server instances.
 *
 * Ensures each panel gets a unique, available port starting from basePort (3000).
 * Automatically checks system availability and recycles released ports.
 *
 * @example
 * ```typescript
 * const portManager = new PortManager();
 * const port = await portManager.allocatePort('wf-abc123');  // Returns 3000
 * // ... use port ...
 * portManager.releasePort('wf-abc123');  // Release for reuse
 * ```
 */
export class PortManager {
  private basePort: number = 3000;
  private allocatedPorts: Map<string, number>;  // panelId → port
  private usedPorts: Set<number>;  // Track all allocated ports

  constructor(basePort: number = 3000) {
    this.basePort = basePort;
    this.allocatedPorts = new Map();
    this.usedPorts = new Set();
  }

  /**
   * Allocate an available port for a panel.
   *
   * Searches for the lowest available port starting from basePort,
   * checking both internal allocations and system availability.
   *
   * @param panelId - The panel ID requesting a port
   * @returns The allocated port number
   * @throws Error if unable to allocate a port after MAX_ATTEMPTS
   */
  async allocatePort(panelId: string): Promise<number> {
    // Check if already allocated
    const existingPort = this.allocatedPorts.get(panelId);
    if (existingPort !== undefined) {
      console.log(`[PortManager] Panel ${panelId} already has port ${existingPort}`);
      return existingPort;
    }

    // Find next available port
    const MAX_ATTEMPTS = 100;
    let port = this.basePort;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        // Port is available
        this.allocatedPorts.set(panelId, port);
        this.usedPorts.add(port);
        console.log(`[PortManager] Allocated port ${port} to panel ${panelId}`);
        return port;
      }
      port++;
      attempts++;
    }

    throw new Error(`Unable to allocate port after ${MAX_ATTEMPTS} attempts`);
  }

  /**
   * Reserve a specific port for a panel (e.g., from workflow JSON config).
   *
   * This method is used when the port is explicitly configured in the workflow JSON
   * at config.a2aEndpoint.port. It reserves the port without checking system availability,
   * assuming the configured port is intentional.
   *
   * @param panelId - The panel ID requesting the port
   * @param port - The specific port number to reserve
   * @returns The reserved port number
   * @throws Error if the port is already allocated to another panel
   */
  reservePort(panelId: string, port: number): number {
    // Check if this panel already has a port allocated
    const existingPort = this.allocatedPorts.get(panelId);
    if (existingPort !== undefined) {
      if (existingPort === port) {
        console.log(`[PortManager] Panel ${panelId} already has reserved port ${port}`);
        return port;
      } else {
        // Release old port and reserve new one
        this.usedPorts.delete(existingPort);
        console.log(`[PortManager] Panel ${panelId} changing from port ${existingPort} to ${port}`);
      }
    }

    // Check if the port is already used by another panel
    if (this.usedPorts.has(port)) {
      const existingPanelId = Array.from(this.allocatedPorts.entries())
        .find(([_, p]) => p === port)?.[0];
      throw new Error(
        `Port ${port} is already reserved by panel ${existingPanelId}. ` +
        `Please use a different port in your workflow configuration.`
      );
    }

    // Reserve the port
    this.allocatedPorts.set(panelId, port);
    this.usedPorts.add(port);
    console.log(`[PortManager] Reserved configured port ${port} for panel ${panelId}`);
    return port;
  }

  /**
   * Release a port when panel closes.
   * Makes the port available for reuse.
   *
   * @param panelId - The panel ID releasing its port
   */
  releasePort(panelId: string): void {
    const port = this.allocatedPorts.get(panelId);
    if (port !== undefined) {
      this.allocatedPorts.delete(panelId);
      this.usedPorts.delete(port);
      console.log(`[PortManager] Released port ${port} from panel ${panelId}`);
    }
  }

  /**
   * Get the allocated port for a panel.
   *
   * @param panelId - The panel ID
   * @returns The allocated port, or undefined if not allocated
   */
  getPort(panelId: string): number | undefined {
    return this.allocatedPorts.get(panelId);
  }

  /**
   * Check if a specific port is currently allocated.
   *
   * @param port - The port number to check
   * @returns True if port is allocated, false otherwise
   */
  isPortAllocated(port: number): boolean {
    return this.usedPorts.has(port);
  }

  /**
   * Get all currently allocated ports.
   *
   * @returns Array of allocated port numbers
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.usedPorts);
  }

  /**
   * Get port allocation map.
   *
   * @returns Map of panelId to port assignments
   */
  getPortMap(): Map<string, number> {
    return new Map(this.allocatedPorts);
  }

  /**
   * Check if a port is available on the system.
   *
   * Attempts to bind to the port to verify availability.
   *
   * @param port - The port number to check
   * @returns Promise resolving to true if available, false if in use
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          // Other error, consider unavailable
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Reset all port allocations.
   * Useful for testing or cleanup.
   */
  reset(): void {
    this.allocatedPorts.clear();
    this.usedPorts.clear();
    console.log('[PortManager] Reset all port allocations');
  }
}
