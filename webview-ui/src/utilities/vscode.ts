import type { WebviewApi } from "vscode-webview";

/**
 * A utility wrapper around the acquireVsCodeApi() function, which enables
 * message passing and state management between the webview and extension
 * contexts.
 *
 * This utility also enables webview code to be run in a web browser-based
 * dev server by using native web browser features that mock the functionality
 * enabled by acquireVsCodeApi.
 */
class VSCodeAPIWrapper {
  private static instance: VSCodeAPIWrapper;
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  private constructor() {
    // シングルトンインスタンスの作成を保証
    if (typeof acquireVsCodeApi === "function") {
      try {
        this.vsCodeApi = acquireVsCodeApi();
      } catch (error) {
        console.error('Failed to acquire VS Code API:', error);
        this.vsCodeApi = undefined;
      }
    } else {
      this.vsCodeApi = undefined;
    }
  }

  public static getInstance(): VSCodeAPIWrapper {
    if (!VSCodeAPIWrapper.instance) {
      VSCodeAPIWrapper.instance = new VSCodeAPIWrapper();
    }
    return VSCodeAPIWrapper.instance;
  }

  /**
   * Post a message (i.e. send arbitrary data) to the owner of the webview.
   *
   * @remarks When running webview code inside a web browser, postMessage will instead
   * log the given message to the console.
   *
   * @param message Abitrary data (must be JSON serializable) to send to the extension context.
   */
  public postMessage(message: unknown) {
    if (this.vsCodeApi) {
      try {
        this.vsCodeApi.postMessage(message);
      } catch (error) {
        console.error('Failed to post message:', error);
      }
    } else {
      console.log('Development mode message:', message);
    }
  }

  /**
   * Get the persistent state stored for this webview.
   *
   * @remarks When running webview source code inside a web browser, getState will retrieve state
   * from local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
   *
   * @return The current state or `undefined` if no state has been set.
   */
  public getState(): unknown | undefined {
    if (this.vsCodeApi) {
      try {
        return this.vsCodeApi.getState();
      } catch (error) {
        console.error('Failed to get state:', error);
        return undefined;
      }
    } else {
      try {
        const state = localStorage.getItem("vscodeState");
        return state ? JSON.parse(state) : undefined;
      } catch (error) {
        console.error('Failed to get state from localStorage:', error);
        return undefined;
      }
    }
  }

  /**
   * Set the persistent state stored for this webview.
   *
   * @remarks When running webview source code inside a web browser, setState will set the given
   * state using local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
   *
   * @param newState New persisted state. This must be a JSON serializable object. Can be retrieved
   * using {@link getState}.
   *
   * @return The new state.
   */
  public setState<T extends unknown | undefined>(newState: T): T {
    if (this.vsCodeApi) {
      try {
        return this.vsCodeApi.setState(newState);
      } catch (error) {
        console.error('Failed to set state:', error);
        return newState;
      }
    } else {
      try {
        localStorage.setItem("vscodeState", JSON.stringify(newState));
        return newState;
      } catch (error) {
        console.error('Failed to set state in localStorage:', error);
        return newState;
      }
    }
  }

}

// シングルトンインスタンスをエクスポート
export const vscode = VSCodeAPIWrapper.getInstance();