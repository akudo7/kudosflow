# Phase 1: Extension側の基礎

**ステータス**: ⬜ 未開始

**目標**: JSONファイルの右クリックメニューとWorkflowEditorPanel作成

## タスク

- [ ] package.jsonにコマンド追加 (`kudosflow.openWorkflowEditor`)
- [ ] package.jsonに右クリックメニュー追加（explorer/context, `*.json`に対して）
- [ ] `src/panels/WorkflowEditorPanel.ts`を作成
  - [ ] ComponentGalleryPanelを参考にwebview作成
  - [ ] HTMLテンプレート生成（CSP対応、nonce生成）
  - [ ] リソースURI変換（getUri使用）
  - [ ] メッセージハンドラー実装（save, ready, error）
  - [ ] JSONファイル読み込みロジック
  - [ ] JSONファイル保存ロジック（確認ダイアログ付き）
- [ ] `src/extension.ts`にコマンド登録
- [ ] ビルド & テスト: 右クリックでパネルが開くことを確認

## 成功基準

- JSONファイルを右クリック → "Open Workflow Editor"が表示される
- メニュー選択でwebviewパネルが開く
- JSONファイルの内容がwebviewに送信される（console.logで確認）

## 実装の詳細

### package.json の変更

```json
{
  "contributes": {
    "commands": [
      {
        "command": "kudosflow.openWorkflowEditor",
        "title": "Open Workflow Editor",
        "category": "Kudosflow"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "kudosflow.openWorkflowEditor",
          "when": "resourceExtname == .json",
          "group": "navigation"
        }
      ]
    }
  }
}
```

### WorkflowEditorPanel.ts のスケルトン

```typescript
export class WorkflowEditorPanel {
  public static currentPanel: WorkflowEditorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _filePath: string;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, filePath: string) {
    this._panel = panel;
    this._filePath = filePath;
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._loadWorkflow();
  }

  public static render(extensionUri: vscode.Uri, filePath: string) {
    if (WorkflowEditorPanel.currentPanel) {
      WorkflowEditorPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel(
        "workflowEditor",
        "Workflow Editor",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "out"),
            vscode.Uri.joinPath(extensionUri, "webview-ui/build")
          ]
        }
      );
      WorkflowEditorPanel.currentPanel = new WorkflowEditorPanel(panel, extensionUri, filePath);
    }
  }

  private async _loadWorkflow() {
    const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(this._filePath));
    const workflow = JSON.parse(fileContent.toString());
    this._panel.webview.postMessage({
      command: 'loadWorkflow',
      data: workflow,
      filePath: this._filePath
    });
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        switch (message.command) {
          case 'save':
            await this._saveWorkflow(message.data);
            break;
          case 'error':
            vscode.window.showErrorMessage(message.message);
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async _saveWorkflow(data: any) {
    const answer = await vscode.window.showWarningMessage(
      'ワークフローを保存しますか？',
      'はい',
      'いいえ'
    );

    if (answer === 'はい') {
      try {
        const content = JSON.stringify(data, null, 2);
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(this._filePath),
          Buffer.from(content, 'utf8')
        );
        this._panel.webview.postMessage({ command: 'saveSuccess' });
        vscode.window.showInformationMessage('ワークフローを保存しました');
      } catch (error) {
        this._panel.webview.postMessage({
          command: 'saveError',
          error: String(error)
        });
        vscode.window.showErrorMessage('保存に失敗しました: ' + error);
      }
    }
  }
}
```

## 実行方法

```bash
# TypeScriptをコンパイル
yarn compile

# F5キーで拡張機能を起動してテスト
```

## 次のフェーズ

Phase 1が完了したら、[Phase 2: Webview側の基礎](PHASE2_WEBVIEW_BASICS.md)に進んでください。
