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

##### Phase 9A: ノードParameters/Output編集機能 ⬜

- Parameters編集UI実装（add/remove/modify）
- Output編集UI実装（add/remove/modify）
- パラメータ名/出力キーバリデーション
- 空のparameters/outputケース対応
- Implementation編集パターンと統一されたUI/UX

##### Phase 9B: 型定義とA2Aクライアント設定 ☑

- A2AClientConfig型定義
- WorkflowConfigへのa2aClients追加
- JSON変換ロジック更新
- A2Aクライアントバリデーション

##### Phase 9C: ToolNodeサポートと条件付きエッジ強化 ⬜

- ToolNode型実装
- ConditionalEdgeCondition型定義
- possibleTargets配列サポート
- ToolNode UIコンポーネント

##### Phase 9D: モデル設定の拡張 ☑

- ModelConfig拡張（type、config、bindA2AClients、systemPrompt）
- Modelsタブ追加
- モデルエディタUI
- モデルバリデーション

##### Phase 9E: MCPサーバー統合 ⬜

- MCPServerConfig型定義
- mcpServers設定サポート
- MCPサーバーエディタUI
- bindMcpServersサポート

##### Phase 9F: A2A/MCP管理UI ⬜

- A2Aクライアントエディタ
- ノードバッジ表示（🔗 A2A、🔌 MCP、🛠️ ToolNode）
- 設定パネル統合
- 包括的なUI実装

#### [Phase 10: ワークフロー実行機能](phases/PHASE10_WORKFLOW_EXECUTION.md) ⬜

A2Aサーバーとチャット形式でのワークフロー実行機能の実装

##### Phase 10A: Terminal統合とA2Aサーバー起動 ⬜

- TerminalManagerでVSCodeターミナル管理
- A2AServerLauncherでサーバー起動/停止
- サーバーステータスUI実装
- サーバー制御メッセージハンドラー
- インラインサーバースクリプト作成

##### Phase 10B: チャットUI基盤 ⬜

- ChatPanelコンポーネント作成
- メッセージ表示コンポーネント
- チャット入力（Enter/Shift+Enter対応）
- 割り込みプロンプト表示
- チャットトグルボタンと未読バッジ

##### Phase 10C: ワークフロー実行エンジン統合 ⬜

- WorkflowExecutorで実行管理
- GraphInterrupt検知と処理
- 割り込み後の再開機能
- 実行メッセージのストリーミング
- セッションとスレッドID管理

##### Phase 10D: 高度な機能と仕上げ ⬜

- 実行中ノードの視覚的フィードバック
- 実行履歴（セッション保存/読み込み）
- サーバーステータス詳細パネル
- 実行設定タブ
- キーボードショートカット
- ステータスバー統合

#### [Phase 11: 国際化(i18n) - 日本語から英語への変換](phases/PHASE11_I18N.md) ⬜

全てのJavaScript UIテキストを英語に変換し、英語圏ユーザーへのアクセシビリティを向上

**概要:**
- 35ファイルに渡る包括的な翻訳作業
- UIラベル、検証メッセージ、ダイアログ、ツールチップの変換
- 一貫した専門用語の使用

##### Phase 11A: Validationレイヤー ⬜

- validation.tsの~30個の検証メッセージを翻訳
- ノード名、フィールド名、パラメータ、出力、モデル、MCPサーバーの検証
- 推定時間: 3-4時間

##### Phase 11B: Extension側 ☑

- Extension側のダイアログとコメントを翻訳
- 保存/エラーダイアログ、成功通知
- 推定時間: 1-2時間

##### Phase 11C: コアワークフローUI ⬜

- メインワークフローエディタコンポーネントを翻訳
- ツールバー、エディタ、ノード、設定パネル
- 推定時間: 4-5時間

##### Phase 11D: 設定コンポーネント ⬜

- 14個の設定フォームとエディタを翻訳
- フォームラベル、モーダルタイトル、確認ダイアログ
- 推定時間: 4-5時間

##### Phase 11E: レガシーコンポーネント ⬜

- 旧キャンバスとユーティリティコンポーネントを翻訳
- 残りのコンポーネントを完全に翻訳
- 推定時間: 2-3時間

#### [Phase 12: プロジェクトの減量化と最適化](phases/PHASE12_PROJECT_REDUCTION.md) ☑

レガシーコード削除、未使用依存関係の削減、ビルド最適化によるプロジェクト減量化

**概要:**

- 20+ファイル削除 (~1,728行のコード)
- 10個の未使用依存関係削除 (~197MB node_modules)
- ビルドシステム最適化
- パッケージサイズ18%削減 (~2.1MB)
- インクリメンタルビルド67%高速化

**実績:**

- node_modules: ~1.2GB → ~1.0GB (16%削減)
- .vsix file: ~12MB → ~9.9MB (18%削減)
- Webview bundle: ~600KB → ~448KB (25%削減)
- Incremental build: ~15s → ~5s (67%高速化)

##### [Phase 12A: Legacy Command and Panel Removal](phases/phase12/PHASE12A_LEGACY_COMMAND.md) ☑

- `reactflowtest.helloworld`コマンド削除 ✅
- ComponentGalleryPanel.ts削除 (~208行) ✅
- 完了日: 2025-12-19

##### [Phase 12B: Legacy Canvas Components Removal](phases/phase12/PHASE12B_LEGACY_CANVAS.md) ☑

- 16+のレガシーキャンバスコンポーネント削除 ✅
- App.tsx, CanvasNode.tsx, ReactFlowContext.tsx等 ✅
- reactflow@11パッケージ削除 ✅
- resources/ディレクトリ削除 ✅
- 完了日: 2025-12-19

##### [Phase 12C: Unused Dependencies Cleanup](phases/phase12/PHASE12C_DEPENDENCIES.md) ☑

- webpack, dotenv, @a2a-js/sdk等の未使用パッケージ削除 ✅
- @mui/lab, react-redux等の削除 ✅
- ~197MB node_modules削減 ✅
- 完了日: 2025-12-19

##### [Phase 12D: Build System Optimization](phases/phase12/PHASE12D_BUILD_OPTIMIZATION.md) ☑

- webpack.config.js削除 ✅
- .vscodeignore最適化 ✅
- tsconfig.json最適化（インクリメンタルビルド） ✅
- 67%ビルド高速化達成 ✅
- 完了日: 2025-12-19

##### [Phase 12E: Final Cleanup and Documentation](phases/phase12/PHASE12E_FINAL_CLEANUP.md) ☑

- 未使用SCSSファイル削除（既に削除済み） ✅
- CHANGELOG.md更新 ✅
- SIZE_COMPARISON.mdレポート作成 ✅
- CLAUDE.md更新（ComponentGalleryPanel参照削除） ✅
- IMPLEMENTATION_PLAN.md更新 ✅
- 完了日: 2025-12-19

**Phase 12完了日**: 2025-12-19
**詳細レポート**: [SIZE_COMPARISON.md](SIZE_COMPARISON.md)

#### [Phase 13: マルチインスタンスサポート](phases/PHASE13_MULTI_INSTANCE.md) ☑

複数のワークフローエディタパネルを同時に開く機能の実装

**概要:**

- 各パネルに独立したA2Aサーバーインスタンス
- 自動ポート割り当てシステム
- パネル間の完全な分離とセッション管理
- すべてのユーザー要件を満たす基本実装完了

**実装フェーズ:**

##### Phase 13A: PanelRegistry & Port Management ☑

- PanelRegistryでパネル追跡管理 ✅
- PortManagerで自動ポート割り当て (3000, 3001, 3002...) ✅
- PortManagerでJSONベースのポート設定対応 (config.a2aEndpoint.port) ✅
- 一意のpanelId生成システム ✅
- 完了日: 2025-12-20
- 更新日: 2025-12-22 (JSONポート設定機能追加)

##### Phase 13B: Server Instance Management ☑

- ServerInstanceManagerで各パネルのサーバー管理 ✅
- パネルごとに独立したA2AServerLauncher ✅
- サーバーインスタンスのライフサイクル管理 ✅
- パネル閉鎖時の自動クリーンアップ ✅
- 完了日: 2025-12-20

##### Phase 13C: Message Routing ❌ 未実装

- MessageRouterパターン - 実装したが問題発生により削除
- panelIdベースのメッセージフィルタリング - 不要と判断
- **理由**: Phase 13A/Bで既にパネル分離が達成されており、追加の複雑性は不要

##### Phase 13D: UI Enhancement ❌ 未実装

- 拡張されたStatusBar UI - コア機能で十分
- パネル切り替えコマンド - 不要と判断
- **理由**: すべての必要な機能がPhase 13A/Bで実装済み

##### Phase 13E: Testing & Documentation ❌ 未実装

- 正式なテストスイート - 手動テストで十分
- パフォーマンステスト - 基本実装で問題なし
- **理由**: 機能が正常に動作することを確認済み

**Phase 13完了状況**: Phase 13A & 13B完了、Phase 13C/D/E未実装

**実績**:

- ✅ 複数パネル同時起動
- ✅ 独立したA2Aサーバー (ポート自動割り当て)
- ✅ JSONベースのポート設定対応 (config.a2aEndpoint.port)
- ✅ パネル間の完全分離
- ✅ すべてのユーザー要件達成
**完了日**: 2025-12-20
**更新日**: 2025-12-22 (JSONポート設定機能追加)
**詳細**: [PHASE13_MULTI_INSTANCE.md](phases/PHASE13_MULTI_INSTANCE.md)

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
