# Phase 1: モックレスポンスでのHITL動作確認 - 実装計画

## 目標

モックサーバレスポンスを使用してHuman-in-the-Loopワークフローを検証します。

## 実装タスク

### 1. ディレクトリ構造の作成

```bash
json/a2a/phase1/
├── servers/
│   ├── task-creation-mock.json
│   ├── research-execution-mock.json
│   └── quality-evaluation-mock.json
└── client-mock.json
```

### 2. タスク作成モックサーバ (`task-creation-mock.json`)

**ポート**: 3001

**モックレスポンス**:
```json
{
  "taskList": [
    {
      "id": 1,
      "objective": "会社概要の調査",
      "methodology": "Web検索および公開情報の分析",
      "deliverables": "会社プロファイルドキュメント",
      "success_criteria": "包括的な会社情報",
      "estimated_effort": "2時間",
      "dependencies": "なし"
    },
    {
      "id": 2,
      "objective": "製品・サービスの調査（デジタコ、ドラレコ、車載メーター）",
      "methodology": "製品カタログと技術仕様の分析",
      "deliverables": "製品分析レポート",
      "success_criteria": "詳細な製品情報",
      "estimated_effort": "3時間",
      "dependencies": "タスク1"
    },
    {
      "id": 3,
      "objective": "強み・弱み分析",
      "methodology": "SWOT分析",
      "deliverables": "SWOT分析ドキュメント",
      "success_criteria": "明確な競争優位性の特定",
      "estimated_effort": "2時間",
      "dependencies": "タスク1, 2"
    }
  ],
  "totalTasks": 3,
  "totalEstimatedHours": 7
}
```

**実装内容**:
- `config.a2aEndpoint.port`: 3001
- `config.a2aEndpoint.agentCard`: TaskCreationAgent設定
- シンプルな`mock_responder`ノード: 固定JSONを返す
- MemorySaverチェックポインター

### 3. 調査実行モックサーバ (`research-execution-mock.json`)

**ポート**: 3002

**モックレスポンス**:
```json
{
  "researchResults": [
    {
      "taskId": 1,
      "objective": "会社概要の調査",
      "findings": "矢崎総業は1929年創業の大手自動車部品メーカー。従業員約28万人、売上高1.7兆円。ワイヤーハーネスで世界シェア30%。",
      "sources": [
        "https://www.yazaki-group.com/",
        "https://example.com/company-info"
      ],
      "completionStatus": "completed"
    },
    {
      "taskId": 2,
      "objective": "製品・サービスの調査",
      "findings": "デジタルタコグラフ: 運行管理システム、ドライブレコーダー: 事故記録・予防、車載メーター: 速度計、燃料計等の計器類",
      "sources": [
        "https://example.com/products"
      ],
      "completionStatus": "completed"
    },
    {
      "taskId": 3,
      "objective": "強み・弱み分析",
      "findings": "強み: 世界トップシェア、グローバルネットワーク、技術力。弱み: 自動車産業依存、EV化対応の遅れ。",
      "sources": [
        "https://example.com/analysis"
      ],
      "completionStatus": "completed"
    }
  ],
  "summary": "3つのタスク全てが完了しました"
}
```

**実装内容**:
- `config.a2aEndpoint.port`: 3002
- `config.a2aEndpoint.agentCard`: ResearchExecutionAgent設定
- シンプルな`mock_responder`ノード: 固定JSONを返す
- MemorySaverチェックポインター

### 4. 品質評価モックサーバ (`quality-evaluation-mock.json`)

**ポート**: 3003

**モックレスポンス**:
```json
{
  "qualityScore": 85,
  "completenessCheck": {
    "companyOverview": true,
    "productsServices": true,
    "strengthsWeaknesses": true,
    "strategy": false,
    "aiInitiatives": false
  },
  "executiveSummary": "矢崎総業は1929年創業の大手自動車部品メーカーで、ワイヤーハーネスで世界シェア30%を誇ります。主力製品としてデジタルタコグラフ、ドライブレコーダー、車載メーターを展開。強みはグローバルネットワークと技術力ですが、EV化対応に課題があります。",
  "recommendations": [
    "中期戦略情報の追加調査が必要",
    "AI取り組みに関する詳細情報の収集が必要"
  ],
  "missingTopics": ["中期戦略", "AI取り組み"]
}
```

**実装内容**:
- `config.a2aEndpoint.port`: 3003
- `config.a2aEndpoint.agentCard`: QualityEvaluationAgent設定
- シンプルな`mock_responder`ノード: 固定JSONを返す
- MemorySaverチェックポインター

### 5. クライアント実装 (`client-mock.json`)

**新しい設計パターン**:

#### 状態アノテーション
```json
{
  "annotation": {
    "messages": {
      "type": "BaseMessage[]",
      "reducer": "(x, y) => x.concat(y)",
      "default": []
    },
    "currentPhase": {
      "type": "string",
      "reducer": "(x, y) => y || x",
      "default": "task_creation"
    },
    "taskServerResponse": {
      "type": "any",
      "reducer": "(x, y) => y || x",
      "default": null
    },
    "researchServerResponse": {
      "type": "any",
      "reducer": "(x, y) => y || x",
      "default": null
    },
    "evaluationServerResponse": {
      "type": "any",
      "reducer": "(x, y) => y || x",
      "default": null
    },
    "userDecision": {
      "type": "string",
      "reducer": "(x, y) => y || x",
      "default": null
    }
  }
}
```

#### ノード構成

1. **orchestrator_task** - タスクサーバを呼び出す
2. **tools** - A2Aツールを実行
3. **approval_gate_task** - タスク承認用のinterrupt
4. **orchestrator_research** - 調査サーバを呼び出す
5. **approval_gate_research** - 調査承認用のinterrupt
6. **orchestrator_evaluation** - 評価サーバを呼び出す
7. **approval_gate_evaluation** - 評価承認用のinterrupt

#### フローロジック

```
START
  ↓
orchestrator_task (phase: task_creation)
  ↓
tools (send_message_to_task_agent)
  ↓
approval_gate_task (interrupt)
  ↓ (userDecision判定)
  ├─ "許可" → orchestrator_research (phase: research)
  └─ その他 → orchestrator_task (リトライ)

orchestrator_research (phase: research)
  ↓
tools (send_message_to_research_agent)
  ↓
approval_gate_research (interrupt)
  ↓ (userDecision判定)
  ├─ "許可" → orchestrator_evaluation (phase: evaluation)
  └─ その他 → orchestrator_research (リトライ)

orchestrator_evaluation (phase: evaluation)
  ↓
tools (send_message_to_quality_agent)
  ↓
approval_gate_evaluation (interrupt)
  ↓ (userDecision判定)
  ├─ "許可" → END
  └─ その他 → orchestrator_evaluation (リトライ)
```

#### Interruptノードの実装例

```javascript
// approval_gate_task ノード
const lastToolResult = state.messages
  .filter(msg => msg.role === 'tool' && msg.name === 'send_message_to_task_agent')
  .pop();

if (lastToolResult) {
  console.log('📋 タスクサーバからのレスポンスを受信');

  // レスポンスを解析
  let response;
  try {
    response = typeof lastToolResult.content === 'string'
      ? JSON.parse(lastToolResult.content)
      : lastToolResult.content;
  } catch (e) {
    console.error('レスポンス解析エラー:', e);
    return { messages: [], userDecision: null };
  }

  // タスクリストを抽出
  const taskList = response.response?.content?.taskList || response.taskList || [];

  if (taskList.length > 0) {
    // タスクサマリーを作成
    const summary = taskList.map((t, i) =>
      `${i+1}. ${t.objective} (${t.estimated_effort})`
    ).join('\n');

    const totalHours = response.response?.content?.totalEstimatedHours ||
                      response.totalEstimatedHours || 0;

    // Interruptでユーザ承認を要求
    const message = `📋 タスクリスト作成完了\n\n` +
                    `合計タスク数: ${taskList.length}\n` +
                    `予想時間: ${totalHours}時間\n\n` +
                    `タスク:\n${summary}\n\n` +
                    `このタスクリストで調査を進めますか？\n` +
                    `・「許可」と入力すると調査を開始します\n` +
                    `・その他の入力でタスクを再生成します`;

    console.log('⏸️  ユーザ承認待ち');
    const userResponse = interrupt(message);
    console.log('✅ ユーザレスポンス:', userResponse);

    return {
      messages: [],
      taskServerResponse: response,
      userDecision: userResponse || 'pending'
    };
  }
}

return { messages: [], userDecision: null };
```

## テスト手順

### 前提条件
- [ ] TypeScriptコンパイル完了: `yarn compile`
- [ ] .envファイルにOPENAI_API_KEY設定済み (モックでは不要だが、環境整合性のため)

### テストシナリオ 1: 正常フロー（全承認）

1. 3つのモックサーバを起動
2. クライアントワークフローを実行
3. ユーザ入力: 「矢崎総業の調査をお願いします」
4. タスクサーバレスポンス → Interrupt発生
5. ユーザ入力: 「許可」
6. 調査サーバレスポンス → Interrupt発生
7. ユーザ入力: 「許可」
8. 評価サーバレスポンス → Interrupt発生
9. ユーザ入力: 「許可」
10. ワークフロー完了

**期待結果**: 全てのinterruptが正しくトリガーされ、「許可」で次のフェーズへ進む

### テストシナリオ 2: タスク却下とリトライ

1. クライアントワークフローを実行
2. タスクサーバレスポンス → Interrupt発生
3. ユーザ入力: 「タスクが多すぎます、もっと簡潔にしてください」
4. タスクサーバに再度リクエスト（フィードバック付き）
5. 新しいタスクリスト → Interrupt発生
6. ユーザ入力: 「許可」
7. 以降、正常フローで進行

**期待結果**: 却下後、フィードバックと共にタスクサーバがリトライされる

### テストシナリオ 3: 調査結果の修正要求

1. タスク承認まで進む
2. 調査サーバレスポンス → Interrupt発生
3. ユーザ入力: 「AI取り組みの情報が不足しています、追加調査してください」
4. 調査サーバに再度リクエスト（フィードバック付き）
5. 更新された調査結果 → Interrupt発生
6. ユーザ入力: 「許可」
7. 評価フェーズへ進行

**期待結果**: 修正要求後、フィードバックと共に調査サーバがリトライされる

## 検証項目

- [ ] 全3サーバが正常起動
- [ ] クライアントが全サーバに接続
- [ ] タスクサーバのモックレスポンスが表示される
- [ ] Interrupt 1がトリガーされ、ユーザ入力を待つ
- [ ] 「許可」入力で調査サーバへ進む
- [ ] 却下/修正入力でタスクサーバがリトライされる
- [ ] 調査サーバのモックレスポンスが表示される
- [ ] Interrupt 2がトリガーされ、ユーザ入力を待つ
- [ ] 「許可」入力で評価サーバへ進む
- [ ] 評価サーバのモックレスポンスが表示される
- [ ] Interrupt 3がトリガーされ、ユーザ入力を待つ
- [ ] 完全なエンドツーエンドワークフローが完了

## 成功基準

✅ Human-in-the-loopワークフローがモックデータで機能する
✅ ユーザが各段階で承認/却下/修正できる
✅ フロー制御が正しく動作する
✅ Interruptメカニズムが期待通りに動作する
✅ ユーザフィードバックがサーバリトライに正しく渡される

## 次のステップ

Phase 1が完了したら、[phase1-status.md](./phase1-status.md) に結果を記録し、Phase 2へ進みます。
