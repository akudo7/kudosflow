# ワークフローエディタ表示問題 - デバッグログ実装計画

## 問題の概要

`openWorkflowEditor`コマンドを実行してもワークフローエディタが表示されない問題を診断するため、戦略的なデバッグログを追加します。この計画は非侵入的で、既存の機能を変更せず、ログのみを追加します。

## 実行フローと失敗ポイント

### アーキテクチャ
1. **Extension側**: コマンドハンドラ → WorkflowEditorPanel作成 → HTML生成
2. **WebView側**: スクリプトロード → React初期化 → App/useWorkflow
3. **メッセージング**: WebView(ready) → Extension → WebView(init) → ワークフロー変換 → 表示

### 重要な失敗ポイント
- **スクリプト読み込み**: CSP制約、URI マッピング、ビルド問題
- **メッセージパッシング**: ready/init シーケンスの失敗やデッドロック
- **ワークフロー変換**: workflowToReactFlow() でのエラー
- **DOM マウント**: React の #root へのマウント失敗
- **見えないUI**: CSS未ロードや背景色の問題

---

## 実装フェーズ (各フェーズは /clear 後に実行)

### Phase 1: Extension側のコマンドハンドラログ追加 ✅ **完了**

**目的**: コマンド実行から WorkflowEditorPanel 呼び出しまでの流れを追跡

**変更ファイル**: `src/extension.ts`

**実装内容**:

- [x] コマンド呼び出し開始ログ (URI情報含む) - 112-115行目
- [x] ファイルパス取得ログ (dialog経由/直接) - 120, 133-134, 138, 141行目
- [x] ワークフロー設定ロードログ (ノード/エッジ数含む) - 145-154行目
- [x] パネル作成/表示ログ - 157, 163行目
- [x] エラーハンドリングログ強化 - 165行目

**検証手順**:

1. `yarn compile` でビルド ✅
2. F5 でデバッグ実行
3. JSONファイル右クリック → "Open Workflow Editor"
4. Debug Consoleまたはログファイルで `[CMD:openWorkflowEditor]` 確認

**期待されるログ**:
```
[CMD:openWorkflowEditor] Command invoked { uri: '/path/to/workflow.json' }
[CMD:openWorkflowEditor] Using provided URI { filePath: '...' }
[CMD:openWorkflowEditor] Workflow config loaded { nodeCount: 5, edgeCount: 7 }
[CMD:openWorkflowEditor] Editor panel created/shown successfully
```

**実装日**: 2025-12-05

---

### Phase 2: WorkflowEditorPanel 作成とHTML生成ログ ✅ **完了**

**目的**: パネル作成、HTML生成、スクリプトURI生成の検証

**変更ファイル**: `src/webview/WorkflowEditorPanel.ts`

**実装内容**:

- [x] `createOrShow()`: パネル作成/再利用ログ
  - Logger初期化 (28行目)
  - 既存パネル再利用ログ (35行目)
  - 既存パネルへのinit送信ログ (46行目)
  - 新規パネル作成開始ログ (51行目)
  - パネル作成後のインスタンス初期化ログ (65行目)
  - インスタンス作成完了ログ (72行目)

- [x] `constructor()`: HTML生成とイベントリスナー登録ログ
  - 初期化開始ログ (81-82行目)
  - HTML生成開始ログ (89行目)
  - HTML設定完了ログ (91行目)
  - Disposeリスナー登録ログ (95行目)
  - メッセージリスナー登録ログ (103行目)
  - テーマ変更リスナー登録ログ (118行目)
  - ファイルウォッチャー設定ログ (122行目)
  - コンストラクタ完了ログ (126行目)

- [x] `_getHtmlForWebview()`: scriptUri生成ログ
  - Logger初期化 (329行目)
  - scriptUri生成成功ログとURI情報 (335-338行目)
  - nonce生成ログ (342行目)
  - HTML生成完了ログ (356-360行目: 長さ、root要素、script要素の確認)

- [x] `_handleWebviewMessage()`: メッセージ受信ログ (type別)
  - Logger初期化とメッセージ受信ログ (145-149行目)
  - `ready`メッセージ: webview準備完了ログ (153行目)
  - `ready`メッセージ: workflow config読み込み完了ログ (156-160行目)
  - `ready`メッセージ: init送信完了ログ (169行目)
  - `save`メッセージ受信ログ (173行目)
  - `validate`メッセージ受信と結果送信ログ (178, 187-189行目)
  - `error`メッセージ受信ログ (193-195行目)

- [x] `_sendMessage()`: メッセージ送信ログ
  - Logger初期化とポスト前ログ (133-137行目: type、data有無)

**検証手順**:

1. `yarn compile` でビルド ✅
2. F5 でデバッグ実行
3. JSONファイル右クリック → "Open Workflow Editor"
4. Debug Consoleまたはログファイルで `[Panel:*]` プレフィックス確認

**期待されるログ**:

```
INFO [Panel:createOrShow] Creating new webview panel { filePath: '...' }
INFO [Panel:createOrShow] Webview panel created, initializing WorkflowEditorPanel instance
INFO [Panel:constructor] Initializing WorkflowEditorPanel { filePath: '...' }
INFO [Panel:constructor] Generating HTML for webview
INFO [Panel:_getHtmlForWebview] Generated script URI { scriptUri: 'vscode-webview://...', extensionUri: '...' }
DEBUG [Panel:_getHtmlForWebview] Generated nonce for CSP
INFO [Panel:_getHtmlForWebview] HTML generated successfully { htmlLength: ..., hasRootDiv: true, hasScript: true }
INFO [Panel:constructor] HTML set to webview
DEBUG [Panel:constructor] Dispose listener registered
DEBUG [Panel:constructor] Message listener registered
DEBUG [Panel:constructor] Theme change listener registered
DEBUG [Panel:constructor] File watcher set up
INFO [Panel:constructor] Constructor complete, waiting for webview ready message
INFO [Panel:createOrShow] WorkflowEditorPanel instance created successfully
DEBUG [Panel:_handleWebviewMessage] Received message from webview { type: 'ready', hasData: false }
INFO [Panel:_handleWebviewMessage] Webview is ready, loading workflow config
INFO [Panel:_handleWebviewMessage] Workflow config loaded, sending init message { hasWorkflow: true, nodeCount: X, edgeCount: Y }
DEBUG [Panel:_sendMessage] Posting message to webview { type: 'init', hasData: true }
INFO [Panel:_handleWebviewMessage] Init message sent to webview
```

**実装日**: 2025-12-05

---

### Phase 3: WebView側 - スクリプトロードとReact初期化ログ ✅ **完了**

**目的**: webview.js のロード、React初期化、DOM マウントの検証

**変更ファイル**: `src/webview-ui/src/index.tsx`

**実装内容**:
- [x] スクリプトロード確認ログ (タイムスタンプ) - 8行目
- [x] DOM readyState 確認ログ - 9行目
- [x] Root要素検出ログ - 12行目
- [x] React root作成ログ - 15-18行目
- [x] レンダリング成功/失敗ログ - 25-37行目
- [x] Root要素未発見時のエラー表示 - 38-48行目

**検証手順**:
1. `yarn compile:webview` でビルド ✅
2. デバッグ実行してエディタを開く
3. **Help > Toggle Developer Tools** で Developer Tools を開く
4. Console タブで `[WebView:index]` 確認

**期待されるログ** (Developer Tools Console):
```
[WebView:index] Script loaded, timestamp: 2025-12-05T...
[WebView:index] DOM readyState: loading (or complete)
[WebView:index] Root container found: true
[WebView:index] Creating React root
[WebView:index] React root created successfully
[WebView:index] React app rendered successfully
```

**実装日**: 2025-12-05

---

### Phase 4: App コンポーネント初期化とメッセージ処理ログ ✅ **完了**

**目的**: App初期化、ロガー設定、メッセージリスナーの検証

**変更ファイル**: `src/webview-ui/src/App.tsx`

**実装内容**:

- [x] App コンポーネントレンダリングログ - 12行目
- [x] VSCode API取得ログ - 15行目
- [x] Logger初期化ログ (成功/失敗) - 26-32行目
- [x] メッセージリスナー登録ログ - 73, 100, 103行目
- [x] メッセージ受信ログ (type別) - 77-96行目
  - `themeChanged` メッセージログ (80行目)
  - `init` with theme メッセージログ (85行目)
  - `saveSuccess` メッセージログ (90行目)
  - `saveError` メッセージログ (94行目)
- [x] ワークフロー状態変化ログ (isLoading, error, nodeCount等) - 113-124行目
- [x] Loading/Error/正常レンダリング状態ログ - 139, 144, 160-169行目

**検証手順**:

1. `yarn compile:webview` でビルド ✅
2. デバッグ実行
3. Developer Tools Console で `[WebView:App]` 確認

**期待されるログ**:
```
[WebView:App] Component rendering
[WebView:App] VSCode API acquired
[WebView:App] Initializing logger
[WebView:App] Logger initialized successfully
[WebView:App] Registering message listener
[WebView:App] Message listener registered
[WebView:App] Skipping validation - workflow loading or no config { isLoading: true, hasConfig: false }
[WebView:App] Message received from extension { type: 'init', hasData: true }
[WebView:App] Init message received with theme { theme: 'dark' }
[WebView:App] Workflow state changed { nodeCount: 7, edgeCount: 8, hasConfig: true }
[WebView:App] Rendering FlowEditor { nodeCount: 7, edgeCount: 8, theme: 'vs-dark', isDirty: false, isSaving: false, ... }
```

**実装日**: 2025-12-05

---

### Phase 5: useWorkflow hook とワークフロー変換ログ ✅ **完了**

**目的**: メッセージ受信、ワークフロー変換、状態更新の検証

**変更ファイル**:
- `src/webview-ui/src/hooks/useWorkflow.ts`
- `src/webview-ui/src/utils/converter.ts`

**実装内容 (useWorkflow.ts)**:
- [x] Hook初期化ログ - 30行目
- [x] メッセージハンドラ登録ログ - 43行目
- [x] `ready` メッセージ送信ログ - 117行目
- [x] メッセージ受信ログ (type, hasWorkflow) - 47-51行目
- [x] init処理: ワークフロー情報ログ - 57-62行目
- [x] workflowToReactFlow() 呼び出しログ - 65行目
- [x] 変換成功ログ (ReactFlowノード/エッジ数) - 69-72行目
- [x] 変換エラーログ - 85-88行目
- [x] 状態更新完了ログ - 83行目
- [x] errorメッセージ受信ログ - 100-102行目

**実装内容 (converter.ts)**:
- [x] 変換開始ログ (入力ノード/エッジ数) - 53-58行目
- [x] 特殊ノード (start/end) 必要性ログ - 67-70行目
- [x] startノード作成ログ - 74行目
- [x] endノード作成ログ - 87行目
- [x] ノード変換開始ログ - 99行目
- [x] ノード変換ループログ (各ノードID, type) - 103-107行目
- [x] ノード変換完了ログ - 121行目
- [x] エッジ変換開始ログ - 124行目
- [x] エッジ変換ループログ (from/to, isConditional) - 129-134行目
- [x] conditional edges作成ログ - 150-153行目
- [x] エッジ変換完了ログ - 171行目
- [x] レイアウト適用ログ - 174, 176行目
- [x] 変換完了ログ (出力ノード/エッジ数) - 178-181行目

**検証手順**:
1. `yarn compile:webview` でビルド ✅
2. デバッグ実行
3. Developer Tools Console で `[WebView:useWorkflow]` と `[WebView:converter]` 確認

**期待されるログ**:
```
[WebView:useWorkflow] Hook initialized
[WebView:useWorkflow] Message handler registered
[WebView:useWorkflow] Sending ready message to extension
[WebView:useWorkflow] Message received { type: 'init', hasWorkflow: true, hasFilePath: true }
[WebView:useWorkflow] Init message received { filePath: '...', hasWorkflow: true, nodeCount: 5, edgeCount: 7 }
[WebView:useWorkflow] Calling workflowToReactFlow()
[WebView:converter] Starting workflow to ReactFlow conversion { nodeCount: 5, edgeCount: 7, hasStateAnnotation: true, hasAnnotation: true }
[WebView:converter] Special nodes check { needsStartNode: true, needsEndNode: true }
[WebView:converter] Creating start node
[WebView:converter] Creating end node
[WebView:converter] Converting workflow nodes to ReactFlow nodes
[WebView:converter] Processing node { id: 'node1', isToolNode: false, hasFunction: true }
...
[WebView:converter] Node conversion complete { totalNodes: 7 }
[WebView:converter] Converting workflow edges to ReactFlow edges
[WebView:converter] Processing edge { from: '__start__', to: 'node1', type: 'normal', isConditional: false }
...
[WebView:converter] Edge conversion complete { totalEdges: 8 }
[WebView:converter] Applying automatic layout
[WebView:converter] Layout complete
[WebView:converter] Conversion successful { reactFlowNodeCount: 7, reactFlowEdgeCount: 8 }
[WebView:useWorkflow] Conversion successful { reactFlowNodeCount: 7, reactFlowEdgeCount: 8 }
[WebView:useWorkflow] State updated successfully
```

**実装日**: 2025-12-05

---

### Phase 6: ErrorBoundary とFlowEditor レンダリングログ ✅ **完了**

**目的**: 最終レンダリング段階でのエラー捕捉とレンダリング確認

**変更ファイル**:
- `src/webview-ui/src/components/ErrorBoundary.tsx`
- `src/webview-ui/src/components/FlowEditor.tsx`

**実装内容 (ErrorBoundary.tsx)**:
- [x] ErrorBoundary初期化ログ - 17行目
- [x] エラー捕捉ログ (getDerivedStateFromError) - 26-29行目
- [x] エラー詳細ログ (componentDidCatch, stack trace) - 34-39行目
- [x] エラーUI表示ログ - 57-60行目
- [x] 正常レンダリングログ (children表示) - 113行目

**実装内容 (FlowEditor.tsx)**:
- [x] FlowEditor wrapper レンダリングログ (ReactFlowProvider) - 516-519行目
- [x] FlowEditorInner レンダリングログ (ノード/エッジ数、theme、isDirty等) - 82-89行目
- [x] State初期化ログ (nodes, edges, selectedNode等) - 95-98行目
- [x] initialNodes/Edges更新ログ - 361-371行目
- [x] ReactFlow コンポーネントレンダリングログ - 437-440行目

**検証手順**:
1. `yarn compile:webview` でビルド ✅
2. デバッグ実行
3. Developer Tools Console で `[WebView:ErrorBoundary]` と `[WebView:FlowEditor]` 確認

**期待されるログ**:
```
[WebView:ErrorBoundary] Initialized
[WebView:ErrorBoundary] Rendering children (no error)
[WebView:FlowEditor] Wrapper rendering (ReactFlowProvider)
[WebView:FlowEditor] Component rendering { initialNodeCount: 7, initialEdgeCount: 8, theme: 'vs-dark' }
[WebView:FlowEditor] State initialized { nodeCount: 7, edgeCount: 8 }
```

**実装日**: 2025-12-05

---

## ビルドとデバッグ手順

### ビルドコマンド
```bash
# Extension側のみビルド
yarn compile

# WebView側のみビルド
yarn compile:webview

# 両方ビルド
yarn compile:all
```

### デバッグ実行とログ確認
1. VSCode で **F5** キー押下 (Run Extension)
2. 新しいVSCodeウィンドウが開く
3. JSONファイルを右クリック → **"Open Workflow Editor"**
4. **メインのVSCode** (Extension Host) で確認:
   - **Debug Console**: Extension側のログ
   - **ログファイル**: `<workspace>/logs/extension-YYYYMMDD.log`
5. **新しいVSCodeウィンドウ** (拡張機能実行中) で確認:
   - **Help > Toggle Developer Tools** → **Console**: WebView側のログ

### ログ出力先設定 (推奨)
```json
// settings.json
{
  "helloSceneGraphManager.logging.output": "both",  // ファイル+コンソール両方
  "helloSceneGraphManager.logging.level": "debug"   // すべてのログレベル出力
}
```

---

## トラブルシューティング指針

### ログ分析チェックリスト

#### Extension側 (Phase 1-2)
- [ ] コマンドが呼び出されているか? (`[CMD:openWorkflowEditor] Command invoked`)
- [ ] ワークフローファイルが正常にロードされたか? (`Workflow config loaded`)
- [ ] WorkflowEditorPanel が作成されたか? (`Panel created`)
- [ ] HTML が生成され、scriptUri が正しいか? (`[Panel:_getHtmlForWebview]`)
- [ ] `ready` メッセージを受信したか? (`[Panel:_handleWebviewMessage] Received message { type: 'ready' }`)
- [ ] `init` メッセージを送信したか? (`Init message sent to webview`)

#### WebView初期化 (Phase 3-4)
- [ ] webview.js スクリプトがロードされたか? (`[WebView:index] Script loaded`)
- [ ] `#root` 要素が見つかったか? (`Root container found: true`)
- [ ] React が正常にマウントされたか? (`React app rendered successfully`)
- [ ] App コンポーネントがレンダリングされたか? (`[WebView:App] Component rendering`)
- [ ] ロガーが初期化されたか? (`Logger initialized successfully`)
- [ ] メッセージリスナーが登録されたか? (`Message listener registered`)

#### ワークフロー処理 (Phase 5)
- [ ] `ready` メッセージを送信したか? (`[WebView:useWorkflow] Sending ready message`)
- [ ] `init` メッセージを受信したか? (`Message received { type: 'init' }`)
- [ ] workflowToReactFlow() が成功したか? (`[WebView:converter] Conversion successful`)
- [ ] ReactFlowノード/エッジが生成されたか? (`reactFlowNodeCount: X`)
- [ ] 状態が正しく更新されたか? (`State updated successfully`)

#### レンダリング (Phase 6)
- [ ] ErrorBoundary がエラーをキャッチしたか? (エラー時のみ表示)
- [ ] FlowEditor が正常にレンダリングされたか? (`[WebView:FlowEditor] Component rendering`)
- [ ] ReactFlow コンポーネントが表示されたか? (UI確認)

### 一般的な問題と診断方法

#### 1. スクリプトが読み込まれない
**症状**: `[WebView:index]` ログが全く出ない

**診断**:
- Developer Tools Console で CSP エラーを確認
- Extension側ログで scriptUri が正しく生成されているか確認
- `dist/webview/webview.js` ファイルが存在するか確認: `ls -la dist/webview/`
- `yarn compile:webview` を再実行

#### 2. メッセージングが機能しない
**症状**: `ready` を送信したが `init` を受信しない

**診断**:
- Extension側で `[Panel:_handleWebviewMessage] Received message { type: 'ready' }` があるか確認
- `[Panel:_sendMessage] Posting message { type: 'init' }` があるか確認
- WebView側で `[WebView:useWorkflow] Message received { type: 'init' }` があるか確認
- メッセージリスナーが正しく登録されているか確認

#### 3. ワークフロー変換エラー
**症状**: `[WebView:converter]` でエラーログが出る

**診断**:
- ワークフローJSONファイルの構造を確認
- `nodes` 配列が正しいフォーマットか確認 (id, parameters, output, implementation)
- `edges` 配列が正しいフォーマットか確認 (from, to, type)
- `stateAnnotation` が存在するか確認

#### 4. レンダリングされない (白い画面)
**症状**: ログは正常だが画面が白い

**診断**:
- Developer Tools の **Console** でエラー確認
- Developer Tools の **Elements** タブで `#root` 要素を確認
- ErrorBoundary がエラーをキャッチしていないか確認
- CSS が正しくロードされているか確認 (Network タブ)
- 背景色が白で見えないだけか確認 (ノードが存在するか Elements タブで確認)

---

## 成功基準

すべてのフェーズ完了後、以下が確認できれば成功です:

### 1. Extension側ログ (`logs/extension-YYYYMMDD.log` または Debug Console)
```
INFO [CMD:openWorkflowEditor] Command invoked
INFO [Panel:createOrShow] Creating or showing panel
INFO [Panel:constructor] HTML set to webview
INFO [Panel:_handleWebviewMessage] Webview is ready
INFO [Panel:_handleWebviewMessage] Init message sent to webview
```

### 2. WebView側ログ (Developer Tools Console)
```
[WebView:index] Script loaded
[WebView:index] React app rendered successfully
[WebView:App] Component rendering
[WebView:App] Logger initialized successfully
[WebView:useWorkflow] Sending ready message to extension
[WebView:useWorkflow] Message received { type: 'init' }
[WebView:converter] Starting workflow to ReactFlow conversion
[WebView:converter] Conversion successful
[WebView:FlowEditor] Component rendering
```

### 3. 画面表示
ワークフローエディタのUI (ノード、エッジ、ツールバー等) が正常に表示される

---

## Critical Files

実装で変更するファイルの優先順:

1. **`src/webview-ui/src/index.tsx`** (Phase 3)
   - WebView側のエントリーポイント
   - スクリプトロードとReact初期化の最初のログポイント

2. **`src/webview/WorkflowEditorPanel.ts`** (Phase 2)
   - パネル作成、HTML生成、メッセージングの中心
   - Extension↔WebView通信の鍵

3. **`src/webview-ui/src/hooks/useWorkflow.ts`** (Phase 5)
   - ready/initメッセージシーケンス
   - ワークフロー変換の実行ポイント

4. **`src/extension.ts`** (Phase 1)
   - コマンドハンドラ
   - 問題の起点となる最初のエントリーポイント

5. **`src/webview-ui/src/utils/converter.ts`** (Phase 5)
   - ワークフローJSON→ReactFlow変換ロジック
   - 変換エラーの診断に必須

6. **`src/webview-ui/src/App.tsx`** (Phase 4)
   - App初期化とメッセージリスナー
   - ワークフロー状態管理

7. **`src/webview-ui/src/components/ErrorBoundary.tsx`** (Phase 6)
   - React エラー捕捉

8. **`src/webview-ui/src/components/FlowEditor.tsx`** (Phase 6)
   - 最終レンダリング

---

## 注意事項

- **非侵入的**: ログ追加のみで、既存の機能やロジックは変更しません
- **段階的実装**: 各フェーズは独立しており、`/clear` 後に順次実行できます
- **検証重視**: 各フェーズで必ず検証手順を実行し、ログが正しく出力されることを確認します
- **Developer Tools**: WebView側のログは必ず Developer Tools の Console で確認します (Debug Consoleには出ません)
- **ログレベル**: デバッグ時は `"debug"` レベルを使用し、問題解決後は `"info"` に戻すことを推奨します
