/**
 * InterruptHandler manages workflow interrupt state
 *
 * Responsibilities:
 * - Store current interrupt state
 * - Provide interrupt information to UI
 * - Clear interrupt after resume
 * - Check if waiting for interrupt
 */

export interface InterruptState {
  interrupt: any; // GraphInterrupt from @kudos/scene-graph-manager
  message: string;
  timestamp: Date;
}

export class InterruptHandler {
  private currentInterrupt?: InterruptState;

  /**
   * Set current interrupt
   */
  setInterrupt(interrupt: any, message?: string): void {
    this.currentInterrupt = {
      interrupt,
      message: message || interrupt.message || 'User input required',
      timestamp: new Date()
    };
  }

  /**
   * Get current interrupt state
   */
  getInterrupt(): InterruptState | undefined {
    return this.currentInterrupt;
  }

  /**
   * Clear interrupt
   */
  clearInterrupt(): void {
    this.currentInterrupt = undefined;
  }

  /**
   * Check if waiting for interrupt
   */
  isWaitingForInterrupt(): boolean {
    return this.currentInterrupt !== undefined;
  }

  /**
   * Get resume data for WorkflowEngine
   */
  getResumeData(): any {
    return this.currentInterrupt?.interrupt;
  }

  /**
   * Get interrupt message
   */
  getMessage(): string {
    return this.currentInterrupt?.message || '';
  }

  /**
   * Get interrupt timestamp
   */
  getTimestamp(): Date | undefined {
    return this.currentInterrupt?.timestamp;
  }
}
