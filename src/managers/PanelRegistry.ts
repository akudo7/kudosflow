import { Webview } from 'vscode';
import { WorkflowEditorPanel } from '../panels/WorkflowEditorPanel';

/**
 * Central registry for tracking all active WorkflowEditorPanel instances.
 *
 * This singleton class maintains a registry of all open workflow editor panels,
 * enabling multi-instance support and proper resource management.
 *
 * @example
 * ```typescript
 * const registry = new PanelRegistry();
 * const panelId = registry.generateId();
 * const panel = new WorkflowEditorPanel(panelId, ...);
 * registry.register(panel);
 * ```
 */
export class PanelRegistry {
  private panels: Map<string, WorkflowEditorPanel>;

  constructor() {
    this.panels = new Map();
  }

  /**
   * Generate a unique panel ID.
   * Format: wf-{timestamp}-{random}
   *
   * @returns A unique panel identifier
   *
   * @example
   * ```typescript
   * const id = registry.generateId();  // "wf-1703012345678-a1b2c3"
   * ```
   */
  generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `wf-${timestamp}-${random}`;
  }

  /**
   * Register a new panel instance in the registry.
   *
   * @param panel - The WorkflowEditorPanel instance to register
   * @throws Error if a panel with the same ID already exists
   */
  register(panel: WorkflowEditorPanel): void {
    const panelId = panel.getPanelId();
    if (this.panels.has(panelId)) {
      throw new Error(`Panel with ID ${panelId} already registered`);
    }
    this.panels.set(panelId, panel);
    console.log(`[PanelRegistry] Registered panel: ${panelId}`);
  }

  /**
   * Unregister a panel instance from the registry.
   *
   * @param panelId - The ID of the panel to unregister
   */
  unregister(panelId: string): void {
    if (this.panels.delete(panelId)) {
      console.log(`[PanelRegistry] Unregistered panel: ${panelId}`);
    }
  }

  /**
   * Get a panel by its panel ID.
   *
   * @param panelId - The panel ID to look up
   * @returns The panel instance, or undefined if not found
   */
  getPanel(panelId: string): WorkflowEditorPanel | undefined {
    return this.panels.get(panelId);
  }

  /**
   * Get a panel by its file path.
   * Returns the first panel editing the specified file.
   *
   * @param filePath - The absolute file path
   * @returns The panel instance, or undefined if not found
   */
  getPanelByFilePath(filePath: string): WorkflowEditorPanel | undefined {
    for (const panel of this.panels.values()) {
      if (panel.getFilePath() === filePath) {
        return panel;
      }
    }
    return undefined;
  }

  /**
   * Get a panel by its webview reference.
   *
   * @param webview - The webview instance
   * @returns The panel instance, or undefined if not found
   */
  getPanelByWebview(webview: Webview): WorkflowEditorPanel | undefined {
    for (const panel of this.panels.values()) {
      if (panel.getWebview() === webview) {
        return panel;
      }
    }
    return undefined;
  }

  /**
   * Get all active panel instances.
   *
   * @returns Array of all registered panels
   */
  getAllPanels(): WorkflowEditorPanel[] {
    return Array.from(this.panels.values());
  }

  /**
   * Get the number of active panels.
   *
   * @returns Count of registered panels
   */
  getPanelCount(): number {
    return this.panels.size;
  }

  /**
   * Dispose all panels and clear the registry.
   * Useful during extension deactivation.
   */
  disposeAll(): void {
    console.log(`[PanelRegistry] Disposing all ${this.panels.size} panels`);
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();
  }

  /**
   * Check if a panel with the given ID exists.
   *
   * @param panelId - The panel ID to check
   * @returns True if panel exists, false otherwise
   */
  hasPanel(panelId: string): boolean {
    return this.panels.has(panelId);
  }
}
