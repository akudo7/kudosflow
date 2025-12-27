# Phase 3: 実際の調査実行サーバ実装 - 実装計画

## 目標

調査実行モックをWeb検索を使用する実装に置き換えます（MCP web-searchサーバ統合）。

## 前提条件

- Phase 2が完了し、実際のタスクリストが生成できる
- MCP web-searchサーバがインストールされている
  - パス: `/Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js`
- .envファイルにOPENAI_API_KEYが設定されている

## 実装タスク

### 1. Phase 2ファイルのコピー

```bash
cp -r json/a2a/phase2 json/a2a/phase3
```

### 2. 調査実行サーバの実装 (`research-execution.json`)

**ファイル名変更**: `research-execution-mock.json` → `research-execution.json`

#### MCP設定

```json
{
  "mcpServers": {
    "web-search": {
      "transport": "stdio",
      "command": "node",
      "args": [
        "/Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js"
      ]
    }
  },
  "config": {
    "mcpServers": {
      "config": {
        "throwOnLoadError": false,
        "prefixToolNameWithServerName": true,
        "additionalToolNamePrefix": "mcp"
      }
    }
  }
}
```

#### モデル設定

```json
{
  "models": [
    {
      "id": "researchModel",
      "type": "OpenAI",
      "config": {
        "model": "gpt-4o-mini",
        "temperature": 0.3
      },
      "bindMcpServers": true,
      "systemPrompt": "あなたは市場調査を専門とするリサーチエージェントです。\n\n責任:\n1. タスクリストに基づいて包括的な調査を実行する\n2. Web検索ツールを使用して関連情報を収集する\n3. 収集した情報を構造化して整理する\n4. 信頼できる情報源を特定し、引用する\n5. 調査結果を各タスクにマッピングする\n\n調査ガイドライン:\n- 各タスクの目的と成功基準を理解する\n- 複数の情報源から情報を収集する\n- 事実と意見を区別する\n- 情報の鮮度と信頼性を評価する\n- 検索クエリを最適化して関連性の高い結果を得る\n\nWeb検索ツール:\n- mcp_web-search_search: キーワード検索を実行\n  - 日本語・英語の両方に対応\n  - 複数の検索を組み合わせて包括的な情報を収集\n\n日本語での調査依頼に対応し、構造化された調査結果を返してください。"
    }
  ]
}
```

#### ノード実装: research_executor

**目的**: タスクリストに基づいてWeb検索を実行し、調査結果を収集

**実装ロジック**:

```javascript
const lastMessage = state.messages[state.messages.length - 1];
let taskList = [];

// タスクリストの抽出
try {
  let content = lastMessage.content;
  if (typeof content === 'string') {
    const parsed = JSON.parse(content);
    taskList = parsed.taskList || parsed.response?.content?.taskList || [];
  } else if (content && content.taskList) {
    taskList = content.taskList;
  }
} catch (e) {
  console.error('❌ タスクリスト解析エラー:', e);
  // フォールバック: メッセージから直接抽出を試みる
  if (state.taskList && Array.isArray(state.taskList)) {
    taskList = state.taskList;
  }
}

console.log('🔬 調査開始:', taskList.length, 'タスク');

if (taskList.length === 0) {
  console.warn('⚠️  タスクリストが空です');
  return {
    messages: [
      {
        role: 'assistant',
        content: JSON.stringify({
          error: 'タスクリストが見つかりません',
          researchResults: []
        })
      }
    ]
  };
}

// 各タスクについて調査を実行
const researchResults = [];

for (const task of taskList) {
  console.log(`📊 タスク ${task.id}: ${task.objective}`);

  // 検索クエリの構築
  const searchQuery = `${task.objective} ${task.methodology || ''}`;

  // LLMに検索実行を依頼（MCPツールを使用）
  const researchPrompt = `以下のタスクについて、Web検索ツール（mcp_web-search_search）を使用して調査してください:

タスクID: ${task.id}
目的: ${task.objective}
手法: ${task.methodology}
成功基準: ${task.success_criteria}

検索を実行し、以下の形式で結果をまとめてください:
RESEARCH_START
{
  "taskId": ${task.id},
  "objective": "${task.objective}",
  "findings": "調査結果の要約（詳細に記述）",
  "sources": ["URL1", "URL2", ...],
  "completionStatus": "completed"
}
RESEARCH_END`;

  try {
    const response = await model.invoke([
      { role: 'user', content: researchPrompt }
    ]);

    const content = response.content || '';
    const resultMatch = content.match(/RESEARCH_START\s*([\s\S]*?)\s*RESEARCH_END/);

    if (resultMatch) {
      const result = JSON.parse(resultMatch[1].trim());
      researchResults.push(result);
      console.log(`✅ タスク ${task.id} 完了`);
    } else {
      // フォールバック: マーカーなしの結果
      researchResults.push({
        taskId: task.id,
        objective: task.objective,
        findings: content.substring(0, 500) + '...',
        sources: [],
        completionStatus: 'completed'
      });
      console.log(`⚠️  タスク ${task.id} 完了（マーカーなし）`);
    }
  } catch (error) {
    console.error(`❌ タスク ${task.id} エラー:`, error);
    researchResults.push({
      taskId: task.id,
      objective: task.objective,
      findings: `調査中にエラーが発生しました: ${error.message}`,
      sources: [],
      completionStatus: 'error'
    });
  }
}

// 結果のまとめ
const summary = `${researchResults.length}個のタスク調査が完了しました`;
const result = {
  researchResults: researchResults,
  summary: summary
};

console.log('📋 調査完了:', summary);

return {
  messages: [
    {
      role: 'assistant',
      content: JSON.stringify(result)
    }
  ]
};
```

#### 代替実装: 並列検索版（オプション）

より高速に調査を実行するために、複数のタスクを並列処理することも可能:

```javascript
// Promise.allを使用した並列実行
const researchPromises = taskList.map(async (task) => {
  const researchPrompt = `タスク ${task.id}: ${task.objective} について調査してください...`;

  try {
    const response = await model.invoke([
      { role: 'user', content: researchPrompt }
    ]);
    // 結果の処理
    return processResult(response, task);
  } catch (error) {
    return {
      taskId: task.id,
      objective: task.objective,
      findings: `エラー: ${error.message}`,
      sources: [],
      completionStatus: 'error'
    };
  }
});

const researchResults = await Promise.all(researchPromises);
```

### 3. 調査結果出力フォーマット

**標準出力形式**:

```json
{
  "researchResults": [
    {
      "taskId": 1,
      "objective": "矢崎総業の会社概要調査",
      "findings": "矢崎総業株式会社は1929年（昭和4年）に創業された大手自動車部品メーカーです。主力製品はワイヤーハーネスで、世界シェアは約30%を誇ります。2023年度の連結売上高は約1.7兆円、従業員数は全世界で約28万人です。事業領域は自動車用電線・電装部品、計器・メーター類、空調機器、ガス機器など多岐にわたります。",
      "sources": [
        "https://www.yazaki-group.com/",
        "https://www.yazaki-group.com/corporate/profile/",
        "https://www.yazaki-group.com/ir/"
      ],
      "completionStatus": "completed"
    },
    {
      "taskId": 2,
      "objective": "製品・サービスの詳細調査（デジタコ、ドラレコ、車載メーター）",
      "findings": "【デジタルタコグラフ】運行管理システムとして、運転時間、速度、走行距離などを記録。法定三要素の記録機能を備え、運行管理の効率化と安全運転の促進に貢献。【ドライブレコーダー】事故時の映像記録だけでなく、危険運転の検知・警告機能を搭載。クラウド連携により遠隔管理も可能。【車載メーター】速度計、燃料計、水温計などの計器類。近年はデジタル表示への移行が進み、カスタマイズ可能なディスプレイを提供。",
      "sources": [
        "https://www.yazaki-group.com/products/automotive/",
        "https://www.yazaki-group.com/products/meters/"
      ],
      "completionStatus": "completed"
    },
    {
      "taskId": 3,
      "objective": "強み・弱み分析",
      "findings": "【強み】(1)ワイヤーハーネスで世界トップシェア、(2)グローバルネットワーク（45カ国以上に展開）、(3)長年の実績による技術力と顧客信頼、(4)垂直統合による品質管理。【弱み】(1)自動車産業への高い依存度（売上の約90%）、(2)EV化による配線減少の影響、(3)新興国メーカーとの価格競争、(4)半導体不足などサプライチェーンリスク。",
      "sources": [
        "https://www.yazaki-group.com/ir/library/",
        "https://example.com/industry-analysis"
      ],
      "completionStatus": "completed"
    },
    {
      "taskId": 4,
      "objective": "中期戦略の調査",
      "findings": "矢崎総業の中期経営計画「YAZAKI VISION 2030」では、(1)電動化・自動運転への対応、(2)環境配慮型製品の開発、(3)デジタル技術の活用、(4)新事業領域への進出を重点戦略としています。特にEV用高電圧ハーネスやeモーター関連部品への投資を強化。2030年までに売上高2兆円、営業利益率5%以上を目標としています。",
      "sources": [
        "https://www.yazaki-group.com/ir/policy/",
        "https://www.yazaki-group.com/sustainability/"
      ],
      "completionStatus": "completed"
    },
    {
      "taskId": 5,
      "objective": "AI取り組みの調査",
      "findings": "矢崎総業のAI活用は主に3つの領域: (1)製造現場でのAI検査システム（不良品検知の精度向上）、(2)物流最適化（配送ルート・在庫管理のAI予測）、(3)製品開発でのAIシミュレーション（ハーネス配線設計の最適化）。2023年にはAI・IoT推進室を設立し、DX推進を加速。今後はコネクテッドカー向けのAI搭載製品開発にも注力する計画。",
      "sources": [
        "https://www.yazaki-group.com/news/2023/",
        "https://www.yazaki-group.com/technology/"
      ],
      "completionStatus": "completed"
    }
  ],
  "summary": "5個のタスク調査が完了しました"
}
```

## テスト手順

### MCP web-searchサーバの確認

```bash
# MCPサーバのパスを確認
ls -la /Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js

# テスト実行（手動）
node /Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js
```

### サーバ起動

```bash
# ターミナル1 - 実装されたタスク作成サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase3/servers/task-creation.json', 3001)"

# ターミナル2 - 実装された調査実行サーバ（MCP統合）
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase3/servers/research-execution.json', 3002)"

# ターミナル3 - モック評価サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase3/servers/quality-evaluation-mock.json', 3003)"
```

### テストシナリオ 1: 基本的な調査フロー

**ユーザ入力**:
```
矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エクゼクティブサマリーにまとめてください。
```

**期待される動作**:
1. Phase 2のタスク作成サーバがタスクリスト生成
2. ユーザがタスクリストを承認
3. 調査サーバが各タスクについてWeb検索を実行
4. 各タスクの調査結果が情報源URLと共に返される
5. 調査結果がInterruptで表示される

### テストシナリオ 2: 調査結果の質の確認

**検証ポイント**:
- [ ] 実際のWeb検索が実行されている（モックではない）
- [ ] 調査結果が具体的で詳細
- [ ] 情報源URLが実在する
- [ ] 日本語の調査依頼に対して適切な日本語サイトを検索
- [ ] 各タスクの目的と調査結果が一致

### テストシナリオ 3: 調査の再実行（追加情報要求）

**初回調査後、ユーザが追加要求**:
```
AI取り組みの情報が不足しています。具体的なプロジェクト名や提携企業、投資額などの詳細を追加調査してください。
```

**期待される動作**:
1. フィードバックが含まれた新しいリクエストがLLMに送られる
2. 追加のWeb検索が実行される
3. より詳細な調査結果が返される
4. 前回の調査結果と統合される

### テストシナリオ 4: エラーハンドリング

**想定エラー**:
- Web検索がタイムアウト
- 検索結果が見つからない
- MCP接続エラー

**期待される動作**:
1. エラーが適切にログ出力される
2. エラータスクの`completionStatus`が"error"になる
3. 他のタスクは正常に続行される
4. エラーメッセージがユーザに表示される

## 検証項目

- [ ] MCP web-searchサーバが正常に起動
- [ ] サーバがMCPツールをモデルにバインド
- [ ] Phase 2からのタスクリストを正しく受け取る
- [ ] 各タスクについてWeb検索が実行される
- [ ] 関連性の高い情報が取得される
- [ ] 調査結果が構造化されている
- [ ] 出力に情報源URL が含まれる
- [ ] Interruptが調査結果を正しく表示
- [ ] 他のサーバとの統合が正常に動作

## 成功基準

✅ Web検索統合が動作する
✅ 調査結果が関連性があり、よく構造化されている
✅ 実際のWebページから情報を取得できる
✅ 情報源が明確に記録される
✅ 複数タスクの調査を効率的に実行できる
✅ エラーが適切にハンドリングされる

## トラブルシューティング

### 問題: MCPサーバが起動しない

**原因**: パスが間違っている、またはNode.jsバージョン不一致

**解決策**:
1. MCPサーバのパスを確認: `ls -la /Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js`
2. Node.jsバージョンを確認: `node --version`
3. MCPサーバを単独で実行してエラーを確認

### 問題: Web検索が実行されない

**原因**: MCPツールがモデルにバインドされていない

**解決策**:
1. `bindMcpServers: true`が設定されているか確認
2. サーバ起動ログでMCPサーバの読み込みを確認
3. ツール名のプレフィックスを確認（`mcp_web-search_search`）

### 問題: 検索結果の質が低い

**原因**: 検索クエリが最適化されていない

**解決策**:
1. システムプロンプトに検索クエリ最適化の指示を追加
2. タスクの`methodology`フィールドを活用
3. 複数の検索クエリを組み合わせる
4. 検索結果の数を増やす

### 問題: タスクリスト解析エラー

**原因**: Phase 2からの出力フォーマットが期待と異なる

**解決策**:
1. Phase 2の出力フォーマットを確認
2. より柔軟な解析ロジックを実装（複数のフォーマットに対応）
3. デバッグログを追加して実際の入力を確認

## パフォーマンス最適化

### 並列実行の実装

タスク数が多い場合、順次実行では時間がかかります。並列実行を実装することで高速化できます:

```javascript
// 3タスクずつバッチ処理
const batchSize = 3;
for (let i = 0; i < taskList.length; i += batchSize) {
  const batch = taskList.slice(i, i + batchSize);
  const batchResults = await Promise.all(
    batch.map(task => executeResearch(task, model))
  );
  researchResults.push(...batchResults);
}
```

### キャッシング

同じ検索クエリを複数回実行しないよう、結果をキャッシュ:

```javascript
const searchCache = new Map();

async function cachedSearch(query) {
  if (searchCache.has(query)) {
    console.log('📦 キャッシュヒット:', query);
    return searchCache.get(query);
  }

  const result = await performSearch(query);
  searchCache.set(query, result);
  return result;
}
```

## 次のステップ

Phase 3が完了したら、[phase3-status.md](./phase3-status.md) に結果を記録し、Phase 4（品質評価サーバの実装）へ進みます。
