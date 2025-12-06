# デバッグログ出力システム実装計画

## プロジェクト情報

**プロジェクトルート:** `/Users/akirakudo/Desktop/MyWork/VSCode/test/hello-scene-graph-manager`

**現在の状況:**

- 14箇所の `console.log/warn/error` 呼び出しが直接使用されている
- 統一されたロギング機構がない
- ログレベルの制御なし
- 出力先の制御なし

**実装目標:**

- ログ出力先を**ファイル**（デフォルト）と**標準出力（console）**で切り替え可能に
- VSCode設定でユーザーがカスタマイズ可能
- ログレベル制御（DEBUG / INFO / WARN / ERROR）
- ファイルローテーション（サイズベース）
- WebView側のログもExtension側で一元管理

## 概要

現在の拡張機能では、14箇所で `console.log/warn/error` を直接呼び出しており、統一されたログ管理がありません。この実装では、ログ出力先をファイル（デフォルト）と標準出力（console）の間で切り替え可能な統一ログシステムを構築します。

## アーキテクチャ

### コンポーネント構成

```
Logger (Singleton)
├── ConsoleTransport (標準出力)
└── FileTransport (ファイル出力)
    ├── ログファイル: context.storagePath/logs/extension-YYYYMMDD.log
    ├── ローテーション: 10MB超過時に新ファイル作成
    └── クリーンアップ: 最大5ファイルまで保持

WebViewLogger
└── メッセージパッシング → Extension Logger へ転送
```

### ログフロー

```
Extension側: Logger.info("message") → Transport → console / file
WebView側: logger.info("message") → postMessage → Extension Logger → Transport
```

## 実装フェーズ

**ステータス凡例:**

- ⏳ 作業中
- ✅ 完了
- ⬜ 未着手

**手順:**

作業開始時: ⬜ を ⏳ に変更
タスク完了時: `- [ ]` を `- [x]` に変更
フェーズ完了時: ⏳ を ✅ に変更

### Phase 1: Logger基盤構築（Extension側） ✅

**目標:** Extension側でログシステムの基盤を構築

**タスク:**

- [x] 1. `src/utils/logger/types.ts` 作成: LogLevel、LogEntry、ILogTransport 型定義
- [x] 2. `src/utils/logger/transports/ConsoleTransport.ts` 作成: console.log/warn/error への出力
- [x] 3. `src/utils/logger/transports/FileTransport.ts` 作成: ファイル出力、ローテーション、バッファリング
- [x] 4. `src/utils/logger/Logger.ts` 作成: シングルトンLoggerクラス、設定読み込み
- [x] 5. `src/utils/logger/index.ts` 作成: エクスポート設定
- [x] 6. `src/extension.ts` 修正: Logger初期化、設定変更リスナー、console.*置換（6箇所）

**成功基準:** Extension側のログがファイルまたはコンソールに出力される

### Phase 2: VSCode設定統合 ✅

**目標:** ユーザーが設定でログ動作をカスタマイズ可能に

**タスク:**

- [x] 1. `package.json` 修正: `contributes.configuration` セクション追加
  - `helloSceneGraphManager.logging.output`: "file" | "console" | "both" (デフォルト: "file")
  - `helloSceneGraphManager.logging.level`: "debug" | "info" | "warn" | "error" | "none" (デフォルト: "info")
  - `helloSceneGraphManager.logging.maxFileSize`: 1MB-100MB (デフォルト: 10MB)
  - `helloSceneGraphManager.logging.maxFiles`: 1-20 (デフォルト: 5)
- [x] 2. Logger.updateConfig() で設定変更をリアルタイム反映

**成功基準:** VSCode設定画面でログオプションが表示され、変更が即座に反映される

### Phase 3: WebView側実装 ✅

**目標:** WebView（ブラウザ環境）からのログをExtension側に転送

**タスク:**

- [x] 1. `src/webview-ui/src/utils/logger.ts` 作成: WebViewLoggerクラス、バッチ送信
- [x] 2. `src/webview/types/messages.ts` 修正: LogMessage、LogBatchMessage 型追加
- [x] 3. `src/webview/WorkflowEditorPanel.ts` 修正: 'log' および 'logBatch' メッセージハンドリング追加
- [x] 4. `src/webview-ui/src/App.tsx` 修正: Logger初期化（initializeLogger呼び出し）

**成功基準:** WebViewからのログがExtension Loggerに転送され、ファイルまたはコンソールに出力される

### Phase 4: 既存コード移行（WebView側） ✅

**目標:** WebView側の既存console.*呼び出しをLogger APIに置換

**タスク:**

- [x] 1. `src/webview-ui/src/App.tsx` 修正: console.error → logger.error（1箇所）
- [x] 2. `src/webview-ui/src/components/FlowEditor.tsx` 修正: console.warn → logger.warn（3箇所）
- [x] 3. `src/webview-ui/src/components/ErrorBoundary.tsx` 修正: console.error → logger.error（1箇所）

**成功基準:** すべてのログがLogger APIを経由し、統一されたフォーマットで出力される

### Phase 5: ドキュメント更新 ✅

**目標:** ログシステムの使用方法をドキュメント化

**タスク:**

- [x] 1. `CLAUDE.md` 更新: Logging Configuration セクション追加
  - 設定オプションの説明
  - ログファイル location
  - ログファイル形式
  - トラブルシューティング

**成功基準:** ユーザーがドキュメントを読んでログシステムを理解できる

## 新規作成ファイル

### Logger基盤（Phase 1）

```
src/utils/logger/
├── index.ts                          # 公開API
├── types.ts                          # 型定義
├── Logger.ts                         # Loggerクラス
└── transports/
    ├── ConsoleTransport.ts           # Console出力
    └── FileTransport.ts              # File出力
```

### WebView Logger（Phase 3）

```
src/webview-ui/src/utils/
└── logger.ts                         # WebViewLogger
```

## 修正ファイル

### Extension側（Phase 1-2）

- ✅ `src/extension.ts` - Logger初期化、console.*置換（6箇所）
- ✅ `package.json` - contributes.configuration追加

### WebView側（Phase 3-4）

- ✅ `src/webview/WorkflowEditorPanel.ts` - logメッセージハンドリング追加
- ✅ `src/webview/types/messages.ts` - LogMessage型追加
- ✅ `src/webview-ui/src/App.tsx` - Logger初期化、console.*置換（1箇所）
- ✅ `src/webview-ui/src/components/FlowEditor.tsx` - console.*置換（3箇所）
- ✅ `src/webview-ui/src/components/ErrorBoundary.tsx` - console.*置換（1箇所）

### ドキュメント（Phase 5）

- ✅ `CLAUDE.md` - ログシステムドキュメント追加

## VSCode設定オプション

ユーザーは以下の設定をカスタマイズ可能：

### helloSceneGraphManager.logging.output

ログ出力先を選択

- `"file"` (デフォルト): ファイルのみに出力
- `"console"`: VSCode Debug Consoleのみに出力
- `"both"`: ファイルとコンソールの両方に出力

### helloSceneGraphManager.logging.level

最小ログレベル

- `"debug"`: すべてのログを出力
- `"info"` (デフォルト): INFO以上を出力
- `"warn"`: WARN以上を出力
- `"error"`: ERRORのみ出力
- `"none"`: ログを出力しない

### helloSceneGraphManager.logging.maxFileSize

ログファイルの最大サイズ（バイト）

- 最小: 1048576 (1MB)
- 最大: 104857600 (100MB)
- デフォルト: 10485760 (10MB)

### helloSceneGraphManager.logging.maxFiles

保持するログファイル数

- 最小: 1
- 最大: 20
- デフォルト: 5

## ログファイル

### 保存場所

```
<extension-storage-path>/logs/
├── extension-20251205.log       # 当日の最初のログファイル
├── extension-20251205-001.log   # ローテーション後（10MB超過時）
├── extension-20251205-002.log   # 2回目のローテーション
└── ...
```

### ファイル形式

JSON形式（1行1エントリ）:

```json
{"timestamp":"2025-12-05T10:30:45.123Z","level":1,"message":"Starting workflow...","context":"extension"}
{"timestamp":"2025-12-05T10:30:46.456Z","level":1,"message":"[WebView] Workflow loaded successfully","context":"webview"}
{"timestamp":"2025-12-05T10:30:47.789Z","level":3,"message":"Error executing command","meta":[{"name":"Error","message":"Connection failed","stack":"..."}],"context":"extension"}
```

### ログローテーション

- **サイズベース**: ファイルサイズが `maxFileSize` を超えたら新しいファイルを作成
- **日付ベース**: 日付が変わったら新しいファイルを作成
- **クリーンアップ**: `maxFiles` を超えたら最も古いファイルを削除

## 技術的考慮事項

### パフォーマンス

- **非同期書き込み**: UIスレッドをブロックしない
- **バッファリング**: 1秒ごとまたは100エントリでフラッシュ
- **バッチ送信**: WebViewから500msごとまたは50メッセージ

### セキュリティ

- **ファイルパーミッション**: 0o600 (rw-------)
- **機密情報のサニタイズ**: password、token、apiKey、secret などをマスク

### エラーハンドリング

- **フォールバック**: ファイル書き込み失敗時はコンソールに出力
- **警告表示**: 初期化失敗時にユーザーに通知
- **継続動作**: ログエラーでもアプリケーションは継続

### メモリ管理

- **バッファサイズ制限**: 最大100エントリまたは1MB
- **WriteStreamクローズ**: dispose時に適切にクローズ
- **古いファイル削除**: maxFiles設定に基づき自動削除

## デフォルト設定

```json
{
  "helloSceneGraphManager.logging.output": "file",
  "helloSceneGraphManager.logging.level": "info",
  "helloSceneGraphManager.logging.maxFileSize": 10485760,
  "helloSceneGraphManager.logging.maxFiles": 5
}
```

この設定により、合計50MB（10MB × 5ファイル）のディスク容量を使用します。

## 成功メトリクス

1. ✅ Extension側のログがファイルに出力される
2. ✅ VSCode設定でログ出力先を変更できる
3. ✅ ログレベルで出力を制御できる
4. ✅ WebViewからのログがExtension側に転送される
5. ✅ すべてのconsole.*呼び出しがLogger APIに置換される
6. ✅ ログファイルが自動ローテーションされる（実装済み）
7. ✅ 古いログファイルが自動削除される（実装済み）
8. ✅ ドキュメントが整備される

## 将来の拡張（Post-MVP）

- **ログビューア**: VSCode内でログファイルを表示・検索するUI
- **リモートログ**: ログを外部サーバーに送信
- **構造化ログ**: より詳細なメタデータ（ユーザーID、セッションIDなど）
- **ログ分析**: エラー頻度、パフォーマンス指標の可視化
- **ログエクスポート**: ZIP形式でログをエクスポート

## 参考リソース

- **VSCode Extension API**: https://code.visualstudio.com/api
- **Node.js fs module**: https://nodejs.org/api/fs.html
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/
