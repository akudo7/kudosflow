# JSON Configuration Examples

このディレクトリには、SceneGraphManagerのワークフロー設定ファイル（JSON）の例が含まれています。

## 📁 ディレクトリ構成

```
json/
├── README.md                    # このファイル
├── interrupt.json               # 割り込み処理の例
├── model.json                   # モデル設定の基本例
├── ollama.json                  # Ollama使用例
├── a2a/                         # A2A (Agent-to-Agent) 設定
│   ├── client.json              # A2Aクライアント設定
│   └── servers/                 # A2Aサーバー設定
│       ├── quality-evaluation.json
│       ├── research-execution.json
│       └── task-creation.json
├── a2a-jp/                      # A2A 日本語設定
│   ├── client.json
│   └── servers/
│       ├── quality-evaluation.json
│       ├── research-execution.json
│       └── task-creation.json
└── skills/                      # スキルシステム関連
    ├── skills-example.json      # スキル機能の基本例
    ├── skills-example/          # 追加のスキル例
    │   ├── peer-collaboration-example.json
    │   └── remote-skills-example.json
    └── workflows/               # ワークフロー例
        ├── patterns/            # パターン実装
        │   ├── handoffs_workflow.json
        │   ├── peer_collaboration_team.json
        │   ├── skills_office_automation.json
        │   └── subagents_research.json
        └── practical/           # 実用的な例
            ├── customer_support_workflow.json
            ├── data_analysis_workflow.json
            ├── document_generation_workflow.json
            └── web_research_workflow.json
```

## 📄 ファイル説明

### ルートレベルのファイル

#### interrupt.json
ユーザー割り込み処理のワークフロー例。

**特徴:**
- 人間の介入が必要なポイントでの中断
- 状態の保存と復元
- インタラクティブなワークフロー

**使用シーン:**
- 承認フローの実装
- 手動レビューが必要な処理
- ユーザー確認を伴うタスク

#### model.json
基本的なモデル設定の例。

**特徴:**
- 複数のAIモデルの設定
- Anthropic Claude、OpenAI GPT、Ollamaの使用例
- システムプロンプトの設定
- パラメータ調整（temperature、maxTokensなど）

**含まれる設定:**
- モデルの初期化
- 基本的なメッセージフロー
- シンプルなワークフロー構造

#### ollama.json
Ollamaを使用したローカルLLMの実行例。

**特徴:**
- ローカルで動作するLLMの使用
- プライバシーに配慮した実装
- カスタムモデルのサポート

**使用シーン:**
- オフライン環境での実行
- データの外部送信を避けたい場合
- カスタムモデルのテスト

### a2a/ - Agent-to-Agent プロトコル

#### client.json
A2Aクライアントの設定例。複数のエージェントと通信するクライアント側の設定。

**特徴:**
- リモートエージェントへの接続
- エージェントカードの取得
- タスクの委譲とレスポンス処理

#### servers/ サブディレクトリ
A2Aサーバーとして動作するエージェントの設定例。

- **quality-evaluation.json** - 品質評価エージェント
- **research-execution.json** - 調査実行エージェント
- **task-creation.json** - タスク作成エージェント

### a2a-jp/ - Agent-to-Agent 日本語対応

`a2a/` と同じ構造で、日本語に最適化された設定例。

**特徴:**
- 日本語システムプロンプト
- 日本語コンテキストでの最適化
- 文化的配慮を含むレスポンス

### skills/ - スキルシステム

スキル機能を使用したワークフローの例。詳細は [skills/README.md](skills/README.md) を参照してください。

**主な内容:**
- プログレッシブディスクロージャ（段階的スキル開示）
- ローカルスキルの管理
- リモートスキルとの連携
- パターン実装例（ハンドオフ、ピアコラボレーション、サブエージェント）
- 実用的なワークフロー例（カスタマーサポート、データ分析、Web調査など）

## 🚀 使用方法

### 基本的な使い方

```typescript
import { WorkflowEngine } from '@kudosflow/scene-graph-manager';
import fs from 'fs';

// JSONファイルの読み込み
const config = JSON.parse(
  fs.readFileSync('./json/model.json', 'utf-8')
);

// WorkflowEngineの初期化
const engine = new WorkflowEngine(config);
await engine.build();

// ワークフローの実行
const result = await engine.invoke({
  messages: [
    { role: "user", content: "こんにちは" }
  ]
});

console.log(result.messages[result.messages.length - 1].content);
```

### 環境変数の設定

ワークフローを実行する前に、必要な環境変数を設定してください：

```bash
# Anthropic API Key
export ANTHROPIC_API_KEY="your-api-key"

# OpenAI API Key
export OPENAI_API_KEY="your-api-key"

# Azure OpenAI (使用する場合)
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_ENDPOINT="https://your-endpoint.openai.azure.com"
```

### ストリーミング実行

```typescript
// ストリーミングでリアルタイムに結果を取得
for await (const chunk of engine.stream(
  { messages: [{ role: "user", content: "長い説明をお願いします" }] },
  { streamMode: "values" }
)) {
  console.log("Update:", chunk);
}
```

### A2A ワークフローの実行

```typescript
// A2Aクライアント設定の読み込み
const a2aConfig = JSON.parse(
  fs.readFileSync('./json/a2a/client.json', 'utf-8')
);

const engine = new WorkflowEngine(a2aConfig);
await engine.build();

// リモートエージェントを活用した実行
const result = await engine.invoke({
  messages: [
    { role: "user", content: "この論文の品質を評価してください" }
  ]
});
```

## 🎯 ユースケース別の推奨ファイル

### シンプルなチャットボット

→ [model.json](model.json)

### カスタマーサポート

→ [skills/workflows/practical/customer_support_workflow.json](skills/workflows/practical/customer_support_workflow.json)

### データ分析自動化

→ [skills/workflows/practical/data_analysis_workflow.json](skills/workflows/practical/data_analysis_workflow.json)

### Web調査

→ [skills/workflows/practical/web_research_workflow.json](skills/workflows/practical/web_research_workflow.json)

### 複数エージェントの協調作業

→ [skills/workflows/patterns/peer_collaboration_team.json](skills/workflows/patterns/peer_collaboration_team.json)

### 承認フロー付きワークフロー

→ [interrupt.json](interrupt.json)

### ローカル実行（Ollama）

→ [ollama.json](ollama.json)

## 📚 関連ドキュメント

### 設計ガイド

- [CLAUDE.md](../CLAUDE.md) - プロジェクト全体の技術ドキュメント
- [Workflow Design Guide](../docs/guides/WORKFLOW_DESIGN_GUIDE.md) - ワークフロー設計ガイド
- [Skills Authoring Guide](../docs/guides/SKILLS_AUTHORING_GUIDE.md) - スキル作成ガイド

### パターンとベストプラクティス

- [Patterns Comparison](../docs/guides/PATTERNS_COMPARISON.md) - 各パターンの比較
- [Performance Tuning Guide](../docs/guides/PERFORMANCE_TUNING_GUIDE.md) - パフォーマンス最適化
- [Troubleshooting Guide](../docs/guides/TROUBLESHOOTING_GUIDE.md) - トラブルシューティング

### API リファレンス

- [README.md](../README.md) - プロジェクト全体のREADME
- [LangGraph Skills Implementation](../docs/LANGGRAPH_SKILLS_IMPLEMENTATION/README.md) - スキルシステムの実装詳細

## 🔧 カスタマイズのヒント

### モデルの変更

```json
{
  "models": [
    {
      "id": "my_model",
      "type": "anthropic",
      "config": {
        "model": "claude-3-5-sonnet-20241022",
        "temperature": 0.7,
        "maxTokens": 4096
      }
    }
  ]
}
```

### システムプロンプトのカスタマイズ

```json
{
  "models": [
    {
      "id": "custom_assistant",
      "type": "anthropic",
      "config": { ... },
      "systemPrompt": "あなたは専門的な技術サポートエージェントです。常に丁寧で正確な回答を心がけてください。"
    }
  ]
}
```

### ツールの追加

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./workspace"]
    }
  },
  "models": [
    {
      "id": "assistant_with_tools",
      "bindMcpServers": ["filesystem"]
    }
  ]
}
```

## 🧪 テスト

各設定ファイルの動作確認用テストは [../tests/skills/](../tests/skills/) にあります：

- `test-skills.ts` - スキル機能のテスト
- `test-skills-phase4.mjs` - Phase 4 スキルシステムのテスト
- `test_skills_loading.ts` - スキル読み込みのテスト
- `test_skills_integration.ts` - 統合テスト
- その他のパターン別テスト

### テストの実行

```bash
# TypeScriptテストのビルドと実行
yarn build
node dist/tests/skills/test-skills.js

# mjsテストの直接実行
node tests/skills/test-skills-phase4.mjs
```

## 💡 よくある質問

### Q: どのファイルから始めればいい？

A: シンプルな例から始めることをお勧めします：

1. [model.json](model.json) - 基本的なワークフロー
2. [skills/skills-example.json](skills/skills-example.json) - スキル機能の基本
3. [skills/workflows/practical/](skills/workflows/practical/) - 実用例

### Q: 自分のワークフローを作成するには？

A: 既存の例をコピーして、以下を変更してください：

1. モデル設定（APIキー、モデル名）
2. システムプロンプト
3. ノードとエッジの構成
4. 使用するスキルやツール

### Q: エラーが発生した場合は？

A: [Troubleshooting Guide](../docs/guides/TROUBLESHOOTING_GUIDE.md) を参照してください。

## 📝 ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) を参照してください。

## 🤝 コントリビューション

新しいワークフロー例の追加や改善を歓迎します！
詳細は [README.md](../README.md) を参照してください。

---

**最終更新:** 2026-02-06
**バージョン:** 2.0.0