# Phase 4: 実際の品質評価サーバ実装 - 実装計画

## 目標

品質評価モックをLLMベースの品質評価とエグゼクティブサマリー生成に置き換えます。

## 前提条件

- Phase 3が完了し、実際のWeb検索による調査が実行できる
- .envファイルにOPENAI_API_KEYが設定されている

## ⚠️ 重要：Phase 3テスト結果からの特筆事項

### クライアントからの入力形式の実態

Phase 3のテスト実行により、品質評価サーバが受け取るメッセージの**実際の形式**が判明しました。当初の設計想定とは異なる点があるため、Phase 4実装時には以下に注意が必要です。

#### 実際の受信メッセージ形式

品質評価サーバは、以下のような形式でメッセージを受信します：

```
以下の調査結果の品質を評価し、エグゼクティブサマリーを作成してください:
{
  "success": true,
  "agentName": "research_agent",
  "response": {
    "messageId": "96856502-83c5-41e5-a757-068ecd8a3317",
    "content": "{\"taskId\": \"task-123\", \"result\": {...}}"
  },
  "thread_id": "task-123"
}
```

**重要なポイント**：
1. **単一のユーザメッセージ**として送信される（ツール結果ではない）
2. **多層のJSON文字列**が含まれる（JSON → 文字列 → JSON）
3. **プレフィックステキスト**（"以下の調査結果..."）が含まれる
4. **最後のタスク結果のみ**が送信される（5タスク実行しても1つのみ）

#### Phase 3テスト時の動作確認

**タスク実行の流れ**（Phase 3ログより）：
- タスク作成: 5タスク生成
- 調査実行: 各タスクが**個別に**実行される（5回のリクエスト）
  1. 会社概要（206文字、3つのURL）
  2. 製品サービス（223文字、3つのURL）
  3. 強み弱み（276文字、3つのURL）
  4. 中期戦略（240文字、3つのURL）
  5. AIの取り組み（309文字、3つのURL）
- 品質評価: **最後のタスク（AIの取り組み）の結果のみ**を受信

### Phase 4実装への影響

#### 問題1: 調査結果の集約

現在のワークフローでは、品質評価サーバは**5つのタスク結果のうち1つ（最後のもの）しか受け取らない**可能性があります。

**解決策の選択肢**：

**オプションA: クライアント側で全タスクを集約（推奨）**
- クライアントワークフローを修正し、全5タスクの結果を集約して送信
- 品質評価サーバの実装がシンプルに
- より正確な品質評価が可能

**オプションB: 品質評価サーバで部分的な評価**
- 受け取った1タスクのみで評価
- 不完全な評価になる可能性
- 実装はシンプルだが、実用性が低い

**Phase 4では、まずオプションBで実装し、動作確認後にクライアント側の修正（オプションA）を検討することを推奨します。**

#### 問題2: 複雑なJSON解析

受信メッセージから実際の調査結果を抽出するには、以下の多層解析が必要です：

```javascript
// ステップ1: プレフィックステキストを除去してJSON部分を抽出
const jsonMatch = userContent.match(/\{[\s\S]*\}/);

// ステップ2: 外側のJSONをパース
const outerData = JSON.parse(jsonMatch[0]);

// ステップ3: response.content（JSON文字列）をパース
const contentData = JSON.parse(outerData.response.content);

// ステップ4: result.messages から assistant メッセージを取得
const assistantMsg = contentData.result.messages.find(m => m.role === 'assistant');

// ステップ5: assistant.content（JSON文字列）をパース
const researchResult = JSON.parse(assistantMsg.content);

// ステップ6: 実際の調査結果を取得
const findings = researchResult.result.researchResults;
```

**この複雑な解析ロジックを実装に含める必要があります。**

#### 問題3: エラーハンドリングの重要性

多層のJSON解析では、各ステップでエラーが発生する可能性があります：
- JSON文字列の抽出失敗
- JSON.parse()の失敗
- 予期しないデータ構造
- 必須フィールドの欠落

**各解析ステップでtry-catchを使用し、詳細なログ出力を行うことが重要です。**

### Phase 4実装の推奨アプローチ

1. **詳細なログ出力を最優先**
   - 受信メッセージの完全な内容をログ
   - 各解析ステップの結果をログ
   - エラー発生時の詳細情報をログ

2. **段階的な実装**
   - まず、受信メッセージの解析ロジックを実装
   - 次に、基本的な品質評価ロジックを実装
   - 最後に、エグゼクティブサマリー生成を実装

3. **フォールバック処理**
   - 解析失敗時のデフォルト動作を定義
   - 部分的なデータでも評価を試みる
   - エラーメッセージを明確に返す

4. **テスト時の確認事項**
   - 実際に受信するメッセージ形式を確認
   - すべてのタスク結果が含まれているか確認
   - 必要に応じてクライアント側の修正を検討

## 実装タスク

### 1. Phase 3ファイルのコピー

```bash
cp -r json/a2a/phase3 json/a2a/phase4
```

### 2. 品質評価サーバの実装 (`quality-evaluation.json`)

**ファイル名変更**: `quality-evaluation-mock.json` → `quality-evaluation.json`

#### モデル設定

```json
{
  "models": [
    {
      "id": "evaluationModel",
      "type": "OpenAI",
      "config": {
        "model": "gpt-4o-mini",
        "temperature": 0.2
      },
      "systemPrompt": "あなたは市場調査の品質評価とレポート作成を専門とするエージェントです。\n\n責任:\n1. 調査結果の完全性と品質を評価する\n2. 元のユーザ要求と調査結果を照合する\n3. 不足している情報や改善点を特定する\n4. 包括的なエグゼクティブサマリーを作成する\n5. 品質スコアと推奨事項を提供する\n\n評価基準:\n- 完全性: 全ての要求トピックがカバーされているか\n- 正確性: 情報が具体的で検証可能か\n- 関連性: 調査結果がユーザ要求に関連しているか\n- 深さ: 表面的ではなく、十分な深さがあるか\n- 構造: 情報が論理的に整理されているか\n\nエグゼクティブサマリー作成ガイドライン:\n- 簡潔で要点を押さえた文章（500-800文字程度）\n- ユーザが求めた全てのトピックに言及\n- 重要な数値やデータポイントを含める\n- ビジネス判断に役立つ洞察を提供\n- 日本語で作成（敬体を使用）\n\n必ず日本語でレスポンスを返してください。"
    }
  ]
}
```

#### ノード実装: quality_evaluator

**目的**: 調査結果を評価し、包括的なエグゼクティブサマリーを生成

**実装ロジック**:

```javascript
// メッセージからユーザの元の要求と調査結果を抽出
const messages = state.messages;

// 元のユーザ要求を取得（最初のユーザメッセージ）
let originalRequest = '';
const firstUserMessage = messages.find(msg => msg.role === 'user');
if (firstUserMessage) {
  originalRequest = firstUserMessage.content || firstUserMessage.parts?.[0]?.text || '';
}

// 調査結果を取得（最後のツール結果）
let researchResults = [];
const lastToolResult = messages
  .filter(msg => msg.role === 'tool' && msg.name === 'send_message_to_research_agent')
  .pop();

if (lastToolResult) {
  try {
    const content = typeof lastToolResult.content === 'string'
      ? JSON.parse(lastToolResult.content)
      : lastToolResult.content;

    researchResults = content.response?.content?.researchResults ||
                     content.researchResults || [];
  } catch (e) {
    console.error('❌ 調査結果解析エラー:', e);
  }
}

console.log('📊 品質評価開始');
console.log('  元の要求:', originalRequest.substring(0, 100) + '...');
console.log('  調査結果数:', researchResults.length);

if (researchResults.length === 0) {
  console.warn('⚠️  調査結果が見つかりません');
  return {
    messages: [
      {
        role: 'assistant',
        content: JSON.stringify({
          error: '調査結果が見つかりません',
          qualityScore: 0,
          executiveSummary: 'エラー: 評価する調査結果がありません。'
        })
      }
    ]
  };
}

// 調査結果を整形
const findingsSummary = researchResults.map(r =>
  `タスク${r.taskId}: ${r.objective}\n結果: ${r.findings}`
).join('\n\n');

// LLMに評価とサマリー作成を依頼
const evaluationPrompt = `以下の市場調査について、品質評価とエグゼクティブサマリーを作成してください。

【元のユーザ要求】
${originalRequest}

【調査結果】
${findingsSummary}

以下の形式でレスポンスを返してください:
EVALUATION_START
{
  "qualityScore": 品質スコア（0-100）,
  "completenessCheck": {
    "各要求トピック": true/false（カバーされているか）
  },
  "executiveSummary": "日本語のエグゼクティブサマリー（500-800文字）",
  "recommendations": ["改善推奨事項1", "改善推奨事項2", ...],
  "missingTopics": ["不足トピック1", "不足トピック2", ...]
}
EVALUATION_END

評価基準:
- completenessCheck: 元のユーザ要求から各トピックを抽出し、カバー状況を判定
- qualityScore: 完全性、具体性、関連性、深さを総合的に評価
- executiveSummary: ビジネス判断に役立つ、簡潔で包括的なサマリー
- recommendations: さらなる調査や改善が必要な点
- missingTopics: カバーされていないトピック`;

console.log('🤖 LLMに評価依頼送信');

const response = await model.invoke([
  { role: 'user', content: evaluationPrompt }
]);

const content = response.content || '';
const evaluationMatch = content.match(/EVALUATION_START\s*([\s\S]*?)\s*EVALUATION_END/);

let evaluation;

if (evaluationMatch) {
  try {
    evaluation = JSON.parse(evaluationMatch[1].trim());
    console.log('✅ 評価完了 - スコア:', evaluation.qualityScore);
  } catch (e) {
    console.error('❌ 評価結果解析エラー:', e);
    // フォールバック評価
    evaluation = {
      qualityScore: 70,
      completenessCheck: {},
      executiveSummary: content.substring(0, 800),
      recommendations: ['評価結果の解析に失敗しました'],
      missingTopics: []
    };
  }
} else {
  console.warn('⚠️  EVALUATION マーカーが見つかりません');
  // マーカーなしのフォールバック
  evaluation = {
    qualityScore: 70,
    completenessCheck: {},
    executiveSummary: content.substring(0, 800),
    recommendations: [],
    missingTopics: []
  };
}

// 最終結果の構築
const result = {
  qualityScore: evaluation.qualityScore,
  completenessCheck: evaluation.completenessCheck,
  executiveSummary: evaluation.executiveSummary,
  recommendations: evaluation.recommendations || [],
  missingTopics: evaluation.missingTopics || [],
  researchResults: researchResults  // 元の調査結果も含める
};

console.log('📋 評価レポート完成');
console.log('  品質スコア:', result.qualityScore);
console.log('  推奨事項:', result.recommendations.length);
console.log('  不足トピック:', result.missingTopics.length);

return {
  messages: [
    {
      role: 'assistant',
      content: JSON.stringify(result)
    }
  ]
};
```

#### 代替実装: 詳細評価版（オプション）

より詳細な評価を行うために、複数の評価軸を個別に評価:

```javascript
// 完全性評価
const completenessScore = await evaluateCompleteness(originalRequest, researchResults, model);

// 正確性評価
const accuracyScore = await evaluateAccuracy(researchResults, model);

// 深さ評価
const depthScore = await evaluateDepth(researchResults, model);

// 総合スコア
const totalScore = (completenessScore + accuracyScore + depthScore) / 3;

// エグゼクティブサマリー生成
const executiveSummary = await generateSummary(originalRequest, researchResults, model);
```

### 3. 品質評価出力フォーマット

**標準出力形式**:

```json
{
  "qualityScore": 88,
  "completenessCheck": {
    "会社概要": true,
    "製品サービス（デジタコ）": true,
    "製品サービス（ドラレコ）": true,
    "製品サービス（車載メーター）": true,
    "強み": true,
    "弱み": true,
    "中期戦略": true,
    "AI取り組み": true
  },
  "executiveSummary": "矢崎総業株式会社は1929年創業の大手自動車部品メーカーで、ワイヤーハーネスにおいて世界シェア約30%を誇る業界リーダーです。2023年度の連結売上高は約1.7兆円、全世界で約28万人の従業員を擁しています。\n\n主力製品として、デジタルタコグラフは運行管理システムとして運転時間・速度・走行距離を記録し、運行管理の効率化と安全運転促進に貢献しています。ドライブレコーダーは事故記録機能に加え、危険運転の検知・警告機能を備え、クラウド連携による遠隔管理も実現しています。車載メーターは従来の速度計・燃料計に加え、カスタマイズ可能なデジタルディスプレイへの移行を進めています。\n\n競争優位性として、ワイヤーハーネスでの世界トップシェア、45カ国以上に展開するグローバルネットワーク、長年の実績による技術力と顧客信頼、垂直統合による品質管理体制が挙げられます。一方、課題として、自動車産業への高い依存度（売上の約90%）、EV化による配線減少の影響、新興国メーカーとの価格競争、サプライチェーンリスクが存在します。\n\n中期経営計画「YAZAKI VISION 2030」では、電動化・自動運転への対応、環境配慮型製品の開発、デジタル技術の活用、新事業領域への進出を重点戦略とし、2030年までに売上高2兆円、営業利益率5%以上を目標としています。\n\nAI活用については、製造現場でのAI検査システム、物流最適化、製品開発でのAIシミュレーションを展開しており、2023年にAI・IoT推進室を設立してDX推進を加速させています。",
  "recommendations": [
    "中期戦略の具体的な数値目標と進捗状況の追加調査",
    "AI関連の投資額や提携企業の詳細情報の収集",
    "競合他社との詳細な比較分析",
    "EV化への具体的な対応製品と市場投入時期の調査"
  ],
  "missingTopics": [],
  "researchResults": [
    // 元の調査結果全体を含める
  ]
}
```

### 4. クライアント最終フロー

Phase 4では、全てのサーバが実装されているため、完全なエンドツーエンドワークフローが機能します:

```
ユーザ入力
  ↓
タスクリスト作成（Phase 2実装）
  ↓
ユーザ承認 (interrupt)
  ↓
Web調査実行（Phase 3実装）
  ↓
ユーザ承認 (interrupt)
  ↓
品質評価とサマリー生成（Phase 4実装）
  ↓
ユーザ承認 (interrupt)
  ↓
完了
```

## テスト手順

### サーバ起動

```bash
# ターミナル1 - タスク作成サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase4/servers/task-creation.json', 3001)"

# ターミナル2 - 調査実行サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase4/servers/research-execution.json', 3002)"

# ターミナル3 - 品質評価サーバ
node -e "require('./out/execution/serverRunner.js').runServer('./json/a2a/phase4/servers/quality-evaluation.json', 3003)"
```

### テストシナリオ 1: 完全なエンドツーエンドフロー

**ユーザ入力**:
```
矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エグゼクティブサマリーにまとめてください。
```

**期待される動作**:
1. タスクリスト生成（5-7タスク）→ ユーザ承認
2. Web検索による調査実行 → ユーザ承認
3. 品質評価とエグゼクティブサマリー生成 → ユーザ承認
4. 完了

**検証ポイント**:
- [ ] 全ての要求トピックが`completenessCheck`でtrueになる
- [ ] 品質スコアが80以上
- [ ] エグゼクティブサマリーが全トピックをカバー
- [ ] サマリーが500-800文字程度
- [ ] 日本語が自然で読みやすい

### テストシナリオ 2: 不完全な調査結果の評価

**意図的に不完全なタスクリストを承認**（例: AI取り組みを除外）

**期待される動作**:
1. 品質評価サーバが不足を検出
2. `completenessCheck`で該当トピックがfalse
3. `missingTopics`に不足トピックがリスト
4. `recommendations`に追加調査の推奨
5. 品質スコアが低下（60-70程度）

### テストシナリオ 3: サマリーの質の検証

**生成されたエグゼクティブサマリーの質を確認**:

- [ ] 文章が論理的で読みやすい
- [ ] 重要な数値データが含まれる
- [ ] ビジネス判断に役立つ洞察がある
- [ ] 適切な長さ（長すぎず短すぎず）
- [ ] 敬体で統一されている
- [ ] 誤字脱字がない

### テストシナリオ 4: フィードバックループ

**初回評価後、ユーザが改善要求**:
```
エグゼクティブサマリーが長すぎます。重要なポイントだけに絞って300文字程度にまとめてください。
```

**期待される動作**:
1. フィードバックが含まれた新しいリクエストがLLMに送られる
2. より簡潔なサマリーが生成される
3. 品質スコアは維持される
4. ユーザが満足するまでループ可能

## 検証項目

- [ ] サーバがOpenAI APIに正常接続
- [ ] Phase 3からの調査結果を正しく受け取る
- [ ] 調査結果の完全性を評価
- [ ] 品質スコアを生成
- [ ] 包括的なエグゼクティブサマリーを作成
- [ ] サマリーが日本語で作成される
- [ ] 全ての要求トピックをカバー
- [ ] Interruptが評価結果を正しく表示
- [ ] 完全なエンドツーエンドワークフローが動作
- [ ] 最終出力がユーザ要求を満たす

## 成功基準

✅ 品質評価ロジックが動作する
✅ エグゼクティブサマリーが包括的で構造化されている
✅ サマリーが日本語で自然に記述される
✅ 不足情報が適切に識別される
✅ 改善推奨事項が実用的
✅ 完全なエンドツーエンドワークフローが機能

## 完全ワークフローの最終検証

Phase 4完了後、以下を確認:

### 機能検証
- [ ] ユーザ入力 → タスク生成 → 調査 → 評価 → 完了の全フロー
- [ ] 各段階でinterruptが正常動作
- [ ] ユーザが各段階でフロー制御可能（承認/却下/修正）
- [ ] フィードバックが各サーバに正しく伝達
- [ ] 最終出力が元のユーザ要求を満たす

### 品質検証
- [ ] タスクリストが包括的
- [ ] 調査結果が具体的で信頼できる
- [ ] エグゼクティブサマリーが実用的
- [ ] 全体の所要時間が妥当（15-30分程度）

### エラーハンドリング検証
- [ ] API エラーが適切に処理される
- [ ] タイムアウトが適切に処理される
- [ ] 不正な入力が適切に処理される
- [ ] サーバ間の通信エラーが適切に処理される

## トラブルシューティング

### 問題: エグゼクティブサマリーが短すぎる/長すぎる

**原因**: LLMが長さ指示を守らない

**解決策**:
1. プロンプトで文字数を明確に指定
2. temperature を下げる（0.1-0.2）
3. 生成後に長さをチェックして再生成

### 問題: completenessCheckの精度が低い

**原因**: 元のユーザ要求からトピック抽出が不正確

**解決策**:
1. ユーザ要求を構造化して解析
2. より詳細なプロンプトでトピック抽出を指示
3. 調査結果とのマッチングロジックを改善

### 問題: 品質スコアが常に高い/低い

**原因**: 評価基準が適切でない

**解決策**:
1. 複数の評価軸を独立して評価
2. 具体的な評価基準をプロンプトに含める
3. 実際の調査結果を使って評価ロジックを調整

### 問題: 日本語の品質が低い

**原因**: LLMが英語で考えてから翻訳している

**解決策**:
1. システムプロンプトで「必ず日本語で考え、日本語で出力」を強調
2. temperature を下げる
3. 生成後に品質チェックを追加

## パフォーマンス最適化

### キャッシング

同じ調査結果に対して複数回評価を行う場合、中間結果をキャッシュ:

```javascript
const evaluationCache = new Map();
const cacheKey = JSON.stringify({ originalRequest, researchResults });

if (evaluationCache.has(cacheKey)) {
  return evaluationCache.get(cacheKey);
}

// 評価実行
const evaluation = await performEvaluation(...);
evaluationCache.set(cacheKey, evaluation);
```

### ストリーミング

エグゼクティブサマリーが長い場合、ストリーミングで段階的に表示:

```javascript
// OpenAI streaming APIを使用
const stream = await model.stream([{ role: 'user', content: evaluationPrompt }]);

let executiveSummary = '';
for await (const chunk of stream) {
  executiveSummary += chunk.content;
  // 段階的に表示（オプション）
}
```

## 本番運用への準備

Phase 4完了後、本番運用に向けて:

1. **ログとモニタリング**: 各サーバのログを集約し、パフォーマンスをモニタリング
2. **エラーアラート**: 重大なエラー時に通知を送信
3. **バックアップ**: 重要な調査結果をバックアップ
4. **ドキュメント**: 使用方法とトラブルシューティングガイドを作成
5. **パフォーマンスチューニング**: 実際の使用状況に基づいて最適化

## 次のステップ

Phase 4が完了したら、[phase4-status.md](./phase4-status.md) に結果を記録します。

全4フェーズが完了すると、本番環境で使用可能なA2A Human-in-the-Loopシステムが完成します！
