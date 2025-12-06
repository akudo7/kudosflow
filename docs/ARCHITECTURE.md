# アーキテクチャ設計

## ファイル構成

```
src/
├── extension.ts                          # 新しいコマンド登録
├── panels/
│   ├── ComponentGalleryPanel.ts         # 既存（変更なし）
│   └── WorkflowEditorPanel.ts           # 🆕 新規作成
└── utilities/
    ├── getUri.ts                         # 既存（利用）
    └── getNonce.ts                       # 既存（利用）

webview-ui/src/
├── workflow-editor/                      # 🆕 新規ディレクトリ
│   ├── WorkflowEditor.tsx               # メインコンポーネント
│   ├── WorkflowNode.tsx                 # カスタムノード（Monaco Editor付き）
│   ├── WorkflowEdge.tsx                 # カスタムエッジ
│   ├── WorkflowToolbar.tsx              # ツールバー（保存、追加、削除）
│   ├── converters/
│   │   ├── jsonToFlow.ts                # JSON → React Flow変換
│   │   └── flowToJson.ts                # React Flow → JSON変換
│   └── types/
│       └── workflow.types.ts            # 型定義
└── workflow-editor.html                  # 🆕 エントリHTML

package.json                              # コマンド、右クリックメニュー追加
```

## データフロー

```
JSON File (test.json)
    ↓ [User Right-Click]
Extension (WorkflowEditorPanel)
    ↓ [Load & Send via postMessage]
Webview (WorkflowEditor)
    ↓ [jsonToFlow converter]
React Flow State (nodes, edges)
    ↓ [User Edit]
React Flow State (modified)
    ↓ [Ctrl+S]
Webview (flowToJson converter)
    ↓ [postMessage to Extension]
Extension (Save with confirmation)
    ↓ [Write to file]
JSON File (updated)
```

## メッセージプロトコル

### Extension → Webview

```typescript
{ command: 'loadWorkflow', data: WorkflowConfig, filePath: string }
{ command: 'saveSuccess' }
{ command: 'saveError', error: string }
```

### Webview → Extension

```typescript
{ command: 'save', data: WorkflowConfig, filePath: string }
{ command: 'ready' }
{ command: 'error', message: string }
```

## コンポーネント構造

### Extension Side (Node.js context)

- **WorkflowEditorPanel.ts**: Webviewパネルのライフサイクル管理
  - パネル作成・破棄
  - HTMLコンテンツ生成
  - メッセージハンドリング
  - ファイル読み込み・保存

### Webview Side (Browser context)

- **WorkflowEditor.tsx**: メインコンポーネント
  - React Flowのセットアップ
  - ノード/エッジの状態管理
  - メッセージ送受信
  - キーボードショートカット処理

- **WorkflowNode.tsx**: カスタムノードコンポーネント
  - Monaco Editor埋め込み
  - 展開/折りたたみ機能
  - パラメータ表示
  - コード編集

- **WorkflowToolbar.tsx**: ツールバー
  - 保存ボタン
  - ノード追加ボタン
  - 削除ボタン
  - Dirty状態表示

- **converters/**: JSON変換ロジック
  - `jsonToFlow.ts`: WorkflowConfig → React Flow形式
  - `flowToJson.ts`: React Flow形式 → WorkflowConfig

## セキュリティ

### Content Security Policy (CSP)

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none';
           style-src ${webview.cspSource} 'unsafe-inline';
           script-src 'nonce-${nonce}';
           font-src ${webview.cspSource};
           img-src ${webview.cspSource} data:;"
/>
```

- Nonce生成により、信頼できるスクリプトのみ実行
- リソースルートを制限し、不正なファイルアクセスを防止
- インラインスタイルは最小限に制限

## パフォーマンス最適化

1. **retainContextWhenHidden**: Webviewの状態を保持し、再表示時の読み込みを高速化
2. **React.memo**: WorkflowNodeコンポーネントをメモ化し、不要な再レンダリングを防止
3. **useCallback**: イベントハンドラーをメモ化し、子コンポーネントの再レンダリングを最小化
4. **Monaco Editor**: automaticLayout有効化により、リサイズ時の自動調整

## 技術スタック

### Extension側

- **TypeScript**: 型安全なコード
- **VSCode Extension API**: パネル作成、ファイル操作
- **@kudos/scene-graph-manager**: ワークフロー型定義

### Webview側

- **React 18**: UIコンポーネント
- **React Flow (@xyflow/react)**: ノードベースエディタ
- **Monaco Editor (@monaco-editor/react)**: コードエディタ
- **Vite**: 高速ビルドシステム

## ビルド設定

### vite.config.ts

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        workflowEditor: resolve(__dirname, 'workflow-editor.html'),
      },
    },
  },
});
```

### package.json scripts

```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "start:webview": "cd webview-ui && yarn start",
    "build:webview": "cd webview-ui && yarn build",
    "package": "yarn build:webview && vsce package"
  }
}
```

## 依存パッケージ

### Extension側 (package.json)

```json
{
  "dependencies": {
    "@kudos/scene-graph-manager": "^1.x.x"
  }
}
```

### Webview側 (webview-ui/package.json)

```json
{
  "dependencies": {
    "@xyflow/react": "^12.x.x",
    "@monaco-editor/react": "^4.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x"
  }
}
```

## 注意事項

1. **既存機能への影響なし**: ComponentGalleryPanelは変更せず、完全に独立した機能として実装
2. **型安全性**: TypeScriptの厳格な型チェックを活用
3. **エラーハンドリング**: JSON解析エラー、ファイル保存エラーを適切に処理
4. **UX**: ドラッグ&ドロップ、キーボードショートカット、確認ダイアログなど直感的な操作
5. **拡張性**: 新しいノードタイプやエッジタイプを追加しやすい設計
