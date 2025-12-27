# Phase 2: 実際のタスク作成サーバ実装 - 実装計画

## 目標

タスク作成モックを実際のOpenAI LLM実装に置き換えます。

## 前提条件

- Phase 1が完了し、モックを使用したHITLワークフローが動作している
- .envファイルにOPENAI_API_KEYが設定されている

## 実装タスク

### 1. Phase 1ファイルのコピー

```bash
cp -r json/a2a/phase1 json/a2a/phase2
```

### 2. タスク作成サーバの実装 (`task-creation.json`)

**ファイル名変更**: `task-creation-mock.json` → `task-creation.json`

#### モデル設定

```json
{
  "models": [
    {
      "id": "taskModel",
      "type": "OpenAI",
      "config": {
        "model": "gpt-4o-mini",
        "temperature": 0.3
      },
      "systemPrompt": "あなたは市場調査のタスク作成を専門とするエージェントです。\n\n責任:\n1. ユーザの調査依頼を分析し、実行可能なタスクに分解する\n2. 各タスクに明確な目的、手法、成果物、成功基準を設定する\n3. タスクの優先順位付けと依存関係の特定\n4. タスクの実現可能性とスコープの検証\n\nタスク作成ガイドライン:\n- 各タスクには以下を含める: 明確な目的、具体的な手法、期待される成果物、成功基準、見積工数\n- データソース、調査方法、分析アプローチを考慮する\n- 可能な限りタスクを独立させる\n- 検証と品質チェックポイントを含める\n- 潜在的な課題と代替案を考慮する\n\n日本語での調査依頼に対応し、包括的で実行可能なタスクリストを作成してください。"
    }
  ]
}
```

#### ノード実装: task_creator

**目的**: ユーザの調査依頼から構造化されたタスクリストを生成

**実装ロジック**:

```javascript
const lastMessage = state.messages[state.messages.length - 1];
let userContent = '';

// メッセージからユーザ入力を抽出
if (lastMessage) {
  if (lastMessage.content) {
    userContent = lastMessage.content;
  } else if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
    userContent = lastMessage.parts[0]?.text || lastMessage.parts[0]?.content || '';
  } else if (typeof lastMessage === 'string') {
    userContent = lastMessage;
  }
}

console.log('📝 タスク作成リクエスト:', userContent);

// LLMプロンプトの作成
const taskPrompt = `以下の調査依頼に対して、詳細なタスクリストを作成してください:

${userContent}

各タスクは以下のJSON形式で作成してください:
{
  "id": タスクID (数値),
  "objective": "タスクの目的",
  "methodology": "調査手法",
  "deliverables": "成果物",
  "success_criteria": "成功基準",
  "estimated_effort": "見積工数（例: 2時間）",
  "dependencies": "依存タスク（例: タスク1, 2）"
}

必ず以下の形式でレスポンスを返してください:
TASK_LIST_START
[JSONタスク配列]
TASK_LIST_END

また、総タスク数と総見積時間も計算してください。`;

// LLM呼び出し
const response = await model.invoke([
  { role: 'user', content: taskPrompt }
]);

const content = response.content || '';
console.log('🤖 LLMレスポンス受信');

// タスクリストの抽出
const taskListMatch = content.match(/TASK_LIST_START\s*([\s\S]*?)\s*TASK_LIST_END/);
let taskList = [];

if (taskListMatch) {
  try {
    taskList = JSON.parse(taskListMatch[1].trim());
    console.log('✅ タスクリスト解析成功:', taskList.length, 'タスク');
  } catch (e) {
    console.error('❌ タスクリスト解析エラー:', e);
    // フォールバックタスク
    taskList = [
      {
        id: 1,
        objective: userContent,
        methodology: '情報収集と分析',
        deliverables: '調査レポート',
        success_criteria: '包括的な情報収集',
        estimated_effort: '3時間',
        dependencies: 'なし'
      }
    ];
  }
} else {
  console.warn('⚠️  TASK_LIST マーカーが見つかりません、フォールバック使用');
  taskList = [
    {
      id: 1,
      objective: userContent,
      methodology: '情報収集と分析',
      deliverables: '調査レポート',
      success_criteria: '包括的な情報収集',
      estimated_effort: '3時間',
      dependencies: 'なし'
    }
  ];
}

// 総時間の計算
const totalHours = taskList.reduce((sum, task) => {
  const hours = parseInt((task.estimated_effort || '0時間').replace(/[^\d]/g, '')) || 0;
  return sum + hours;
}, 0);

// レスポンスの構築
const result = {
  taskList: taskList,
  totalTasks: taskList.length,
  totalEstimatedHours: totalHours
};

console.log('📊 タスクリスト完成:', result.totalTasks, 'タスク,', result.totalEstimatedHours, '時間');

return {
  messages: [
    {
      role: 'assistant',
      content: JSON.stringify(result)
    }
  ],
  taskList: taskList
};
```

#### ノード構成

```json
{
  "nodes": [
    {
      "id": "task_creator",
      "function": {
        "parameters": [
          {
            "name": "state",
            "type": "typeof AgentState.State"
          },
          {
            "name": "model",
            "type": "ModelConfig",
            "modelRef": "taskModel"
          }
        ],
        "implementation": "上記のロジック"
      }
    }
  ],
  "edges": [
    {
      "from": "__start__",
      "to": "task_creator"
    },
    {
      "from": "task_creator",
      "to": "__end__"
    }
  ]
}
```

### 3. クライアント設定の更新

**ファイル名**: `client-mock.json` → `client.json`

**A2Aクライアント設定の更新**:

```json
{
  "a2aClients": {
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json",
      "timeout": 30000
    },
    "research_agent": {
      "cardUrl": "http://localhost:3002/.well-known/agent.json",
      "timeout": 30000
    },
    "quality_agent": {
      "cardUrl": "http://localhost:3003/.well-known/agent.json",
      "timeout": 30000
    }
  }
}
```

*注意*: Phase 2では、`task_agent`のみが実装サーバを指し、他の2つは引き続きモックサーバを使用します。

### 4. タスクリスト出力フォーマット

**標準出力形式**:

```json
{
  "taskList": [
    {
      "id": 1,
      "objective": "矢崎総業の会社概要調査",
      "methodology": "公式ウェブサイト、企業情報データベース、ニュース記事の分析",
      "deliverables": "会社プロファイル（設立年、事業内容、従業員数、売上高等）",
      "success_criteria": "包括的で正確な企業基本情報の収集",
      "estimated_effort": "2時間",
      "dependencies": "なし"
    },
    {
      "id": 2,
      "objective": "製品・サービスの詳細調査（デジタコ、ドラレコ、車載メーター）",
      "methodology": "製品カタログ、技術仕様書、顧客レビューの分析",
      "deliverables": "製品ごとの機能、仕様、市場ポジショニング資料",
      "success_criteria": "各製品の特徴と競合優位性の明確化",
      "estimated_effort": "3時間",
      "dependencies": "タスク1"
    },
    {
      "id": 3,
      "objective": "強み・弱み分析",
      "methodology": "SWOT分析、業界レポート、財務諸表分析",
      "deliverables": "SWOT分析レポート",
      "success_criteria": "明確な競争優位性と課題の特定",
      "estimated_effort": "2時間",
      "dependencies": "タスク1, タスク2"
    },
    {
      "id": 4,
      "objective": "中期戦略の調査",
      "methodology": "IR資料、経営方針発表資料、業界ニュースの分析",
      "deliverables": "中期経営計画サマリー",
      "success_criteria": "今後3-5年の戦略方向性の把握",
      "estimated_effort": "2時間",
      "dependencies": "タスク1"
    },
    {
      "id": 5,
      "objective": "AI取り組みの調査",
      "methodology": "プレスリリース、技術ブログ、特許情報の分析",
      "deliverables": "AI関連プロジェクトと技術投資のリスト",
      "success_criteria": "AI活用事例と今後の展開の把握",
      "estimated_effort": "2時間",
      "dependencies": "タスク1"
    }
  ],
  "totalTasks": 5,
  "totalEstimatedHours": 11
}
```

## テスト手順

### サーバ起動

```bash
# ターミナル1 - 実装されたタスク作成サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase2/servers/task-creation.json', 3001)"

# ターミナル2 - モック調査サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase2/servers/research-execution-mock.json', 3002)"

# ターミナル3 - モック評価サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase2/servers/quality-evaluation-mock.json', 3003)"
```

### テストシナリオ 1: 基本的なタスク生成

**ユーザ入力**:
```
矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エクゼクティブサマリーにまとめてください。
```

**期待される動作**:
1. タスク作成サーバがOpenAI APIを呼び出す
2. 5-7個程度のタスクが生成される
3. 各タスクに全ての必須フィールドが含まれる
4. タスクが論理的な順序で並んでいる
5. 依存関係が適切に設定されている
6. 総見積時間が妥当（10-15時間程度）

### テストシナリオ 2: タスクの再生成（ユーザフィードバック）

**初回ユーザ入力**: 上記と同じ

**タスクリスト提示後、ユーザが却下**:
```
タスクが多すぎます。もっと大きな塊でまとめて、3-4個のタスクにしてください。
```

**期待される動作**:
1. フィードバックが含まれた新しいリクエストがLLMに送られる
2. より少ないタスク数（3-4個）で再生成される
3. 各タスクのスコープが大きくなる
4. ユーザが承認するまでこのループを繰り返せる

### テストシナリオ 3: 簡潔な依頼からの詳細タスク生成

**ユーザ入力**:
```
トヨタ自動車の競合分析をしてください
```

**期待される動作**:
1. 簡潔な依頼から詳細なタスクリストが生成される
2. 競合分析に必要な要素（市場シェア、製品比較、財務分析等）がカバーされる
3. 各タスクが具体的な調査手法を含む

### テストシナリオ 4: 日本語と英語の混在入力

**ユーザ入力**:
```
Teslaの日本市場戦略とEV充電インフラについて調査してください
```

**期待される動作**:
1. 日本語と英語が混在した入力を正しく処理
2. 適切なタスクリストが日本語で生成される

## 検証項目

- [ ] タスク作成サーバがOpenAI APIに正常に接続
- [ ] 日本語入力（矢崎総業の例）を正しく処理
- [ ] 包括的なタスクリストが生成される
- [ ] タスクリストに全ての必須フィールドが含まれる
- [ ] 出力フォーマットが期待されるJSON構造に一致
- [ ] Interruptがタスクリストを正しく表示
- [ ] ユーザがタスクを承認/却下できる
- [ ] 却下時にフィードバックと共に新しいタスクリストが生成される
- [ ] Phase 1のモックサーバとの統合が正常に動作

## 成功基準

✅ ユーザリクエストから実際のタスクリストが生成される
✅ タスクリストが包括的で構造化されている
✅ LLMが日本語の調査依頼を正しく理解する
✅ ユーザフィードバックに基づいてタスクを改善できる
✅ 出力が次フェーズ（調査実行）の入力として使用可能

## トラブルシューティング

### 問題: タスクリストの解析エラー

**原因**: LLMがTASK_LIST_START/ENDマーカーを使用しない

**解決策**:
1. システムプロンプトを調整してマーカー使用を強調
2. フォールバックロジックを改善
3. LLMレスポンスからJSONを抽出する別のパターンマッチングを追加

### 問題: OpenAI APIエラー

**原因**: APIキーが無効、またはレート制限

**解決策**:
1. .envファイルのOPENAI_API_KEYを確認
2. APIキーの有効性をOpenAIダッシュボードで確認
3. リクエスト頻度を下げる（temperature調整）

### 問題: タスクの質が低い

**原因**: システムプロンプトが不十分

**解決策**:
1. システムプロンプトをより詳細にする
2. 具体的な例を追加
3. temperature値を調整（0.2-0.4の範囲で実験）

## 次のステップ

Phase 2が完了したら、[phase2-status.md](./phase2-status.md) に結果を記録し、Phase 3（調査実行サーバの実装）へ進みます。
