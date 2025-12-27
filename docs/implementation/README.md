# A2A Client/Server 実装計画

## 概要

Human-in-the-Loop (HITL) 機能を持つA2A (Agent-to-Agent) クライアント/サーバシステムを、4つのフェーズに分けて段階的に実装します。

## システムアーキテクチャ

```
ユーザ入力 → A2Aクライアント (HITL) → サーバ1: タスクリスト作成
                                      → サーバ2: 調査実行
                                      → サーバ3: 品質評価
                                      → ユーザレスポンス (許可/却下/修正)
```

### ユーザ入力例

```
矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エクゼクティブサマリーにまとめてください。
```

## 主要要件

### A2Aサーバ (3サーバ、interrupt不使用)

1. **タスクリスト作成サーバ** (Port 3001)
   - 入力: ユーザの調査依頼
   - 出力: 目的、手法、成果物を含む構造化タスクリスト
   - モデル: OpenAI gpt-4o-mini (temperature: 0.3)

2. **調査実行サーバ** (Port 3002)
   - 入力: 承認されたタスクリスト
   - 出力: Web検索による調査結果
   - モデル: OpenAI gpt-4o-mini (temperature: 0.3)
   - MCP: web-searchサーバ

3. **品質評価サーバ** (Port 3003)
   - 入力: 調査結果
   - 出力: 品質評価とエグゼクティブサマリー
   - モデル: OpenAI gpt-4o-mini (temperature: 0.2)

### A2Aクライアント (interruptでHITL実装)

- **interrupt()を使用したオーケストレーターワークフロー**
- 各サーバレスポンス後:
  - サーバ出力をユーザに表示
  - interrupt()でユーザ判断を待機
  - 「許可」→ 次のサーバへ進む
  - その他 (却下/修正) → 同じサーバをユーザフィードバック付きでリトライ

- **サーバ実行順序**: タスク作成 → 調査 → 評価

## 重要な設計判断: Interrupt実装

### 既存client.jsonの問題点

現在の`approval_handler`ノード実装には以下の問題があります:
1. Interruptロジックがノード実装の深部に埋め込まれている
2. ツール結果の複雑な解析処理
3. 断片化された状態管理
4. フロー制御が理解しづらい

### 新設計: シンプルなInterruptパターン

**基本原則**: 各サーバ呼び出しの直後に承認ゲートを配置

**フロー**:
```
START → タスクサーバ呼出 → 承認ゲート1 (interrupt) → 調査サーバ呼出 → 承認ゲート2 (interrupt) → 評価サーバ呼出 → 承認ゲート3 (interrupt) → END
         ↑_________________|                            ↑_________________|                            ↑_________________|
            (却下/修正時)                                  (却下/修正時)                                  (却下/修正時)
```

**状態フィールド**:
```json
{
  "messages": [],
  "currentPhase": "task_creation",  // task_creation | research | evaluation | completed
  "lastServerResponse": null,        // 最後のサーバレスポンスを保存
  "userDecision": null               // approve | reject | modify
}
```

**実装パターン**:
- 各approval_gateノードがサーバレスポンスと共に`interrupt()`を呼び出し
- ユーザ入力を`userDecision`に格納
- 条件付きエッジが`userDecision`に基づいてルーティング:
  - "approve"または"許可"を含む → 次のフェーズへ
  - それ以外 → 同じサーバをリトライ

## 実装フェーズ

各フェーズの詳細な実装計画は、以下の個別ファイルを参照してください:

- [Phase 1: モックレスポンスでのHITL動作確認](./phase1-plan.md)
- [Phase 2: 実際のタスク作成サーバ実装](./phase2-plan.md)
- [Phase 3: 実際の調査実行サーバ実装](./phase3-plan.md)
- [Phase 4: 実際の品質評価サーバ実装](./phase4-plan.md)

## ファイル構成

```
json/a2a/
├── phase1/                           # モック実装
│   ├── servers/
│   │   ├── task-creation-mock.json
│   │   ├── research-execution-mock.json
│   │   └── quality-evaluation-mock.json
│   └── client-mock.json
├── phase2/                           # 実際のタスク作成
│   ├── servers/
│   │   ├── task-creation.json       (実装)
│   │   ├── research-execution-mock.json
│   │   └── quality-evaluation-mock.json
│   └── client.json
├── phase3/                           # 実際の調査実行
│   ├── servers/
│   │   ├── task-creation.json
│   │   ├── research-execution.json  (実装)
│   │   └── quality-evaluation-mock.json
│   └── client.json
└── phase4/                           # 実際の品質評価
    ├── servers/
    │   ├── task-creation.json
    │   ├── research-execution.json
    │   └── quality-evaluation.json  (実装)
    └── client.json

docs/implementation/
├── README.md                        # このファイル (全体概要)
├── phase1-plan.md                   # Phase 1 実装計画
├── phase2-plan.md                   # Phase 2 実装計画
├── phase3-plan.md                   # Phase 3 実装計画
├── phase4-plan.md                   # Phase 4 実装計画
├── phase1-status.md                 # Phase 1 実装ステータス
├── phase2-status.md                 # Phase 2 実装ステータス
├── phase3-status.md                 # Phase 3 実装ステータス
└── phase4-status.md                 # Phase 4 実装ステータス
```

## 環境セットアップ

**.envファイル** (.env.exampleからコピーして、実際のAPIキーを追加):
```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here  # オプション (この実装では未使用)
```

**システム起動方法**:

1. **サーバ起動** (別々のターミナルで):
```bash
# ターミナル1 - タスク作成サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase1/servers/task-creation-mock.json', 3001)"

# ターミナル2 - 調査実行サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase1/servers/research-execution-mock.json', 3002)"

# ターミナル3 - 品質評価サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase1/servers/quality-evaluation-mock.json', 3003)"
```

2. **クライアント実行** (VSCode拡張機能経由):
- ワークフローエディタパネルを開く
- `json/a2a/phase1/client-mock.json`を読み込む
- "Execute Workflow"をクリック
- Interruptプロンプトで対話

## テスト戦略

### Phase 1 テスト (モック)
1. 3つのモックサーバを全て起動
2. クライアントワークフローを実行
3. 各サーバ後にinterruptがトリガーされることを確認
4. "許可" → 次のフェーズへ進むことをテスト
5. 却下 → フィードバック付きでリトライすることをテスト
6. 修正 → 修正リクエスト付きでリトライすることをテスト

### Phase 2-4 テスト (段階的な実装)
1. 一度に1つのモックサーバを実装に置き換え
2. 実装が有効な出力を生成することを確認
3. interrupt/承認フローが引き続き機能することを確認
4. 実際のユーザリクエスト (矢崎総業の例) でテスト
5. エンドツーエンドのワークフロー完了を確認

## 成功基準

### Phase 1
✅ モックデータでHuman-in-the-loopワークフローが機能
✅ ユーザが各段階で承認/却下/修正可能
✅ フロー制御が正しく動作

### Phase 2
✅ ユーザリクエストから実際のタスクリスト生成
✅ タスクリストが包括的で構造化されている

### Phase 3
✅ Web検索統合が動作
✅ 調査結果が関連性があり、よく構造化されている

### Phase 4
✅ 品質評価が動作
✅ エグゼクティブサマリーが生成される
✅ 完全なエンドツーエンドワークフローが機能

## 実装の進め方

1. **/clear後、フェーズごとに実装依頼**
   - ユーザが言う: `/clear 実装依頼: Phase 1を実装してください`
   - 要求されたフェーズのみを実装
   - チェックボックス付きのステータスファイルを更新

2. **各フェーズは前のフェーズの上に構築**
   - 前フェーズから動作するファイルをコピー
   - ターゲットサーバの実装のみを置き換え
   - クライアント設定を一貫して保つ
   - 実装が進むにつれてステータスファイルを更新

3. **デバッグのヒント**:
   - エラー確認のためターミナルのサーバログをチェック
   - .envファイルがOPENAI_API_KEYと共に存在することを確認
   - MCPサーバパスを確認: `/Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js`
   - ポート競合を確認 (3001, 3002, 3003): `lsof -i :3001`
   - テストにVSCode拡張機能のワークフローエディタを使用
   - 起動エラーのためserverRunner.jsの出力をチェック

## 完了

全4フェーズが完了すると:
- ✅ Phase 1: モックを使用したHITLワークフロー
- ✅ Phase 2: 実際のタスク作成
- ✅ Phase 3: 実際の調査実行
- ✅ Phase 4: 実際の品質評価

システムは矢崎総業の調査例で本番使用可能になります。
