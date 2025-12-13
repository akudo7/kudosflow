# SceneGraphManager ワークフローJSONビジュアルエディタ実装計画

**作成日**: 2025-12-06
**ステータス**: Phase 1開始前
**最終更新**: ドキュメント分割（2025-12-06）

## プロジェクト概要

VSCode拡張機能に、SceneGraphManagerのワークフローJSONファイルをビジュアルに編集できるエディタを追加します。React Flowを使用したノード/エッジベースの編集インターフェースと、Monaco Editorを使用したノードコード編集機能を実装します。

### 目標

- JSONファイルを右クリック → React Flowキャンバスで開く
- ノード/エッジをドラッグ&ドロップで編集
- ノード内にMonaco Editorを配置してコード（implementation）を編集
- Ctrl+Sで保存（確認プロンプト付き）
- ComponentGalleryPanelとは別の新規エディタとして実装

### 技術スタック

- **Extension側**: TypeScript, VSCode Extension API
- **Webview側**: React, React Flow (@xyflow/react), Monaco Editor (@monaco-editor/react)
- **通信**: VSCode Webview Message Passing API

## ドキュメント構成

### アーキテクチャ設計

詳細な設計情報は以下を参照してください:

- [アーキテクチャ設計](ARCHITECTURE.md)
  - ファイル構成
  - データフロー
  - メッセージプロトコル
  - コンポーネント構造
  - セキュリティ (CSP)
  - パフォーマンス最適化
  - 技術スタック
  - ビルド設定

### 実装フェーズ

各フェーズは独立して実装可能です。以下のリンクから各フェーズの詳細を確認してください:

#### [Phase 1: Extension側の基礎](phases/PHASE1_EXTENSION_BASICS.md) ⬜

JSONファイルの右クリックメニューとWorkflowEditorPanel作成

**主なタスク:**

- package.jsonにコマンド追加
- 右クリックメニュー追加
- WorkflowEditorPanel.ts作成
- JSONファイル読み込み・保存ロジック

#### [Phase 2: Webview側の基礎](phases/PHASE2_WEBVIEW_BASICS.md) ☑

React FlowでJSONのノード/エッジを表示

**主なタスク:**

- workflow-editor/ディレクトリ作成
- 型定義ファイル作成
- WorkflowEditor.tsx作成
- React Flow基本セットアップ

#### [Phase 3: JSON変換ロジック](phases/PHASE3_JSON_CONVERSION.md) ☑

WorkflowConfig ⇔ React Flow形式の相互変換

**主なタスク:**

- jsonToFlow.ts作成
- flowToJson.ts作成
- 往復変換のテスト

#### [Phase 4: Monaco Editor統合](phases/PHASE4_MONACO_EDITOR.md) ☑

ノード内にMonaco Editorを表示してコードを編集

**主なタスク:**

- @monaco-editor/reactインストール
- WorkflowNode.tsx作成
- Monaco Editor埋め込み
- 展開/折りたたみ機能

#### [Phase 5: Implementation編集機能](phases/PHASE5_EDITABLE_IMPLEMENTATION.md) ⬜

ノード内のImplementationコードを編集可能にする

**主なタスク:**

- TextAreaコンポーネントの実装
- リアルタイム編集機能
- 編集UIの改善
- Tabキーのインデント対応

#### [Phase 6: 保存機能の完成](phases/PHASE6_SAVE_FUNCTIONALITY.md) ☑

Ctrl+Sでの保存と確認ダイアログの実装

**主なタスク:**

- Ctrl+Sキーバインド
- 変更検知（dirty state）
- 保存ツールバーボタン
- 保存成功/失敗フィードバック

#### [Phase 7: CRUD操作](phases/PHASE7_CRUD_OPERATIONS.md) ☑

ノード/エッジの追加・削除・複製機能

**主なタスク:**

- ノード追加機能
- ノード削除機能
- ノード複製機能
- エッジ削除機能
- コンテキストメニュー

#### [Phase 8: ワークフロー設定エディタ](phases/PHASE8_WORKFLOW_SETTINGS.md) ☑

ワークフローのメタデータ（Config、State、Annotation）の編集機能

##### Phase 8A: ノード名 + シンプルなConfig編集 ☑

- ノード名（Node ID）編集とユニーク制約
- Config編集（recursionLimit, defaultMaxListeners）
- StateAnnotation名編集
- 右サイドバー設定パネルUI

##### Phase 8B: StateGraph ドロップダウン編集 ☑

- annotationRefドロップダウン選択
- checkpointer.typeドロップダウン選択
- バリデーション機能

##### Phase 8C: Annotationフィールド CRUD ☑

- Annotationフィールドの追加・編集・削除
- モーダルフォームUI
- JS識別子バリデーション

#### [Phase 9: A2A Client/Server & 高度な機能](phases/PHASE9_A2A_MCP_ADVANCED.md) ⬜

エージェント間通信と高度なワークフロー機能の実装

##### Phase 9A: 型定義とA2Aクライアント設定 ⬜

- A2AClientConfig型定義
- WorkflowConfigへのa2aClients追加
- JSON変換ロジック更新
- A2Aクライアントバリデーション

##### Phase 9B: ToolNodeサポートと条件付きエッジ強化 ⬜

- ToolNode型実装
- ConditionalEdgeCondition型定義
- possibleTargets配列サポート
- ToolNode UIコンポーネント

##### Phase 9C: モデル設定の拡張 ⬜

- ModelConfig拡張（type、config、bindA2AClients、systemPrompt）
- Modelsタブ追加
- モデルエディタUI
- モデルバリデーション

##### Phase 9D: MCPサーバー統合 ⬜

- MCPServerConfig型定義
- mcpServers設定サポート
- MCPサーバーエディタUI
- bindMcpServersサポート

##### Phase 9E: A2A/MCP管理UI ⬜

- A2Aクライアントエディタ
- ノードバッジ表示（🔗 A2A、🔌 MCP、🛠️ ToolNode）
- 設定パネル統合
- 包括的なUI実装

## フェーズ実行方法

各フェーズは独立して実装可能です。以下のコマンドで実装を開始してください:

```bash
# Phase 1の実装
Phase 1を実装してください

# Phase 2の実装
Phase 2を実装してください

# ... 以降同様
```

各フェーズ完了後、該当フェーズのファイル内のチェックボックス（⬜ → ☑）を更新してください。

## クイックスタート

### インストール

```bash
# 全依存関係をインストール
yarn install:all
```

### 開発

```bash
# Extension側のコンパイル
yarn compile

# Webview側の開発サーバー起動
yarn start:webview

# 拡張機能のテスト（F5キー）
# VSCodeのExtension Development Hostが起動します
```

### ビルド

```bash
# Webviewをビルド
yarn build:webview

# 拡張機能をパッケージング
yarn package
```

## 参考リソース

- **React Flow公式ドキュメント**: <https://reactflow.dev/>
- **Monaco Editor公式**: <https://microsoft.github.io/monaco-editor/>
- **VSCode Extension API**: <https://code.visualstudio.com/api>
- **SceneGraphManagerソース**: `/Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager`
- **既存の実装参考**: `src/panels/ComponentGalleryPanel.ts`

## 注意事項

1. **ComponentGalleryPanelを変更しない**: 既存の機能は保持します
2. **型安全性**: TypeScriptの型を厳密に定義します
3. **エラーハンドリング**: JSON解析エラー、保存エラーを適切に処理します
4. **パフォーマンス**: 大きなワークフローでもスムーズに動作するよう最適化します
5. **UX**: ドラッグ&ドロップ、キーボードショートカットなど直感的な操作を提供します

## 進捗管理

各フェーズの進捗は、個別のフェーズファイル内で管理してください:

- ⬜ 未開始
- 🔄 進行中
- ☑ 完了

## 次のステップ

1. [アーキテクチャ設計](ARCHITECTURE.md)を確認
2. [Phase 1](phases/PHASE1_EXTENSION_BASICS.md)から実装開始
3. 各フェーズ完了後、次のフェーズに進む
4. 全フェーズ完了後、統合テストを実施
