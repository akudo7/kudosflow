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

  /**
   * アイコンのパスを取得するためのメッセージを送信する
   * @param filename アイコンのファイル名
   * @returns Promise<string> アイコンのパス
   */
  public async getIconPath(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        if (message.command === "iconPath" && message.filename === filename) {
          window.removeEventListener("message", messageHandler);
          resolve(message.path);
        }
      };

      // メッセージハンドラーを設定
      window.addEventListener("message", messageHandler);

      // リトライメカニズムの実装
      const maxRetries = 3;
      let retryCount = 0;

      const tryPostMessage = () => {
        if (retryCount >= maxRetries) {
          window.removeEventListener("message", messageHandler);
          reject(new Error(`Failed to get icon path after ${maxRetries} attempts`));
          return;
        }

        this.postMessage({
          command: "getIconPath",
          filename: filename
        });

        retryCount++;
        setTimeout(() => {
          if (retryCount < maxRetries) {
            tryPostMessage();
          }
        }, 2000); // 2秒後にリトライ
      };

      tryPostMessage();

      // 開発環境のフォールバック
      if (!this.vsCodeApi) {
        window.removeEventListener("message", messageHandler);
        resolve(`resources/icons/${filename}`);
      }
    });
  }
}

// シングルトンインスタンスをエクスポート
export const vscode = VSCodeAPIWrapper.getInstance();