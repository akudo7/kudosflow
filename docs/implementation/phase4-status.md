# Phase 4: 実際の品質評価サーバ実装 - 実装ステータス

## 概要

品質評価モックをLLMベースの品質評価とエグゼクティブサマリー生成に置き換えます。

詳細な実装計画: [phase4-plan.md](./phase4-plan.md)

---

## 実装タスク

### Phase 3からのコピー
- [x] Phase 3ファイルを Phase 4にコピー (`cp -r json/a2a/phase3 json/a2a/phase4`)

### 品質評価サーバ実装
- [x] ファイル名変更: `quality-evaluation-mock.json` → `quality-evaluation.json`
- [x] OpenAIモデル設定追加
  - [x] モデルID: evaluationModel
  - [x] model: gpt-4o-mini
  - [x] temperature: 0.2
  - [x] システムプロンプト作成（日本語出力を強調、評価基準とサマリーガイドライン）
- [x] quality_evaluatorノード実装
  - [x] 多層JSON解析ロジック（Phase 3で特定された実際の入力形式に対応）
  - [x] 元のユーザ要求抽出
  - [x] 調査結果抽出（6段階の解析プロセス）
  - [x] 調査結果整形
  - [x] LLMへの評価依頼（包括的なプロンプト構築）
  - [x] 評価結果解析（EVALUATION_START/END）
  - [x] completenessCheck生成
  - [x] qualityScore算出
  - [x] executiveSummary生成
  - [x] recommendations生成
  - [x] missingTopics特定
  - [x] エラーハンドリング（各解析ステップでtry-catch、フォールバック処理）
  - [x] 詳細なログ出力（デバッグ用）
  - [x] 結果構築
- [x] エッジ設定確認

### 出力フォーマット確認
- [x] qualityScore (0-100)
- [x] completenessCheck (各トピック true/false)
- [x] executiveSummary (日本語、500-800文字)
- [x] recommendations配列
- [x] missingTopics配列
- [x] researchResults（元の調査結果も含める）

---

## テストチェックリスト

### 環境確認
- [ ] .envファイルにOPENAI_API_KEY設定済み
- [ ] TypeScriptコンパイル完了

### サーバ起動テスト
- [ ] タスク作成サーバ起動成功 (Port 3001)
- [ ] 調査実行サーバ起動成功 (Port 3002)
- [ ] 品質評価サーバ起動成功 (Port 3003)

### 品質評価テスト
- [ ] 調査結果から評価を生成
- [ ] completenessCheckが正確
- [ ] qualityScoreが妥当
- [ ] 不足トピックが正しく特定される

### エグゼクティブサマリーテスト
- [ ] サマリーが日本語で生成される
- [ ] 文章が自然で読みやすい
- [ ] 長さが適切（500-800文字程度）
- [ ] 全ての要求トピックをカバー
- [ ] 重要な数値データを含む
- [ ] ビジネス判断に役立つ洞察がある
- [ ] 敬体で統一されている

### 推奨事項テスト
- [ ] recommendationsが実用的
- [ ] 改善点が具体的
- [ ] 追加調査が必要な点が明確

### Interruptフローテスト
- [ ] 評価結果がInterruptで表示される
- [ ] ユーザが承認できる
- [ ] ユーザがサマリー改善を要求できる
- [ ] 改善要求が反映される

### エンドツーエンドテスト
- [ ] 完全なワークフロー実行（全承認）
- [ ] ユーザ入力 → タスク → 調査 → 評価 → 完了
- [ ] 各段階でinterrupt正常動作
- [ ] フィードバックループ動作
- [ ] 最終出力が元のユーザ要求を満たす

---

## テスト結果

**実施日**: ___________

### 評価品質
- qualityScore: ___/100
- completenessCheck精度: ⬜ 高 / ⬜ 中 / ⬜ 低
- 不足トピック検出: ⬜ Success / ⬜ Failed

### サマリー品質
- 日本語の自然さ: ⬜ 高 / ⬜ 中 / ⬜ 低
- 長さ: ___文字
- トピックカバー率: ___%
- 数値データ含有: ⬜ あり / ⬜ なし
- 実用性: ⬜ 高 / ⬜ 中 / ⬜ 低

### 推奨事項
- recommendations数: ___個
- 実用性: ⬜ 高 / ⬜ 中 / ⬜ 低

### Interrupt動作
- 評価表示: ⬜ Success / ⬜ Failed
- 承認フロー: ⬜ Success / ⬜ Failed
- 改善要求: ⬜ Success / ⬜ Failed

### エンドツーエンドテスト
- 完全フロー: ⬜ Success / ⬜ Failed
- 所要時間: _____分
- 最終出力品質: ⬜ 高 / ⬜ 中 / ⬜ 低

---

## サンプル出力

### 入力（元のユーザ要求）

```
矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エクゼクティブサマリーにまとめてください。
```

### 入力（調査結果）

```json
{
  "researchResults": [
    // Phase 3から受け取った調査結果をペースト
  ]
}
```

### 生成された評価結果

```json
{
  "qualityScore": ___,
  "completenessCheck": {
    // 実際に生成されたcompletenessCheckをペースト
  },
  "executiveSummary": "実際に生成されたエグゼクティブサマリーをペースト",
  "recommendations": [
    // 実際に生成された推奨事項をペースト
  ],
  "missingTopics": [
    // 実際に特定された不足トピックをペースト
  ]
}
```

---

## 問題と解決策

### 問題1: 品質評価サーバーがresearchResultsを抽出できない

**説明**:

Phase 4の初期テストで、品質評価サーバーが調査結果を抽出できず、常に`qualityScore: 0`とエラーメッセージを返していました。

**根本原因**:

1. クライアントが5つの調査結果を個別に送信していた（1つずつ5回）
2. 品質評価サーバーは最後の1つしか受け取らなかった
3. データが多重にネストされたJSON文字列になっており、解析が困難だった

**解決策**:

1. **クライアント側修正** ([client.json](../../json/a2a/phase4/client.json)):
   - `orchestrator`ノードのquality_evaluation phaseを修正
   - 全ての`send_message_to_research_agent`ツール結果を収集
   - 以下の構造にまとめて送信:

     ```javascript
     const evaluationData = {
       originalRequest,        // 元のユーザ要求
       researchResults: [...],  // 全ての調査結果の配列
       totalResults: 5
     };
     ```

2. **品質評価サーバー側修正** ([quality-evaluation.json](../../json/a2a/phase4/servers/quality-evaluation.json)):
   - 新しいデータ構造に対応した解析ロジック実装
   - `evaluationData.researchResults`配列をループ処理
   - 各要素から`response.content` → `result.messages` → `assistant.content` → `researchResults`を抽出
   - 全ての調査結果を統合

**実装の詳細**:

クライアント側のコード:

```javascript
// 全ての調査結果を収集してまとめる
const allResearchResults = state.messages
  .filter(msg => (msg._getType && msg._getType() === 'tool') || msg.role === 'tool')
  .filter(msg => msg.name === 'send_message_to_research_agent')
  .map(msg => {
    try {
      const parsed = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
      return parsed;
    } catch (e) {
      console.error('❌ [orchestrator] Failed to parse research result:', e);
      return null;
    }
  })
  .filter(Boolean);

// 元のユーザ要求を取得
const originalRequest = state.messages.find(msg => msg.role === 'user')?.content || '';

// 品質評価用のデータを構築
const evaluationData = {
  originalRequest,
  researchResults: allResearchResults,
  totalResults: allResearchResults.length
};
```

品質評価サーバー側のコード:

```javascript
const evaluationData = JSON.parse(jsonMatch[0]);
originalRequest = evaluationData.originalRequest || '';

// researchResultsの各要素を処理
if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
  for (let i = 0; i < evaluationData.researchResults.length; i++) {
    const item = evaluationData.researchResults[i];

    // response.content（JSON文字列）をパース
    if (item.response && item.response.content) {
      const contentData = JSON.parse(item.response.content);

      // result.messages から調査結果を抽出
      if (contentData.result && contentData.result.messages) {
        const assistantMsg = contentData.result.messages.find(m => m.role === 'assistant');
        if (assistantMsg && assistantMsg.content) {
          const researchData = JSON.parse(assistantMsg.content);

          if (researchData.result && researchData.result.researchResults) {
            const findings = researchData.result.researchResults[0];
            if (findings) {
              researchResults.push(findings);
            }
          }
        }
      }
    }
  }
}
```

**ステータス**: ✅ 解決済み

---

### 問題2
**説明**: _今後発見される問題用のプレースホルダー_

**解決策**: _解決方法を記載_

**ステータス**: ⬜ 解決済み / ⬜ 未解決

---

## メモと観察事項

**実装日**: 2025-12-27

### 実装の主要な変更点

#### Phase 3テスト結果を踏まえた設計

Phase 3のテスト結果から、品質評価サーバが受信するメッセージの実際の形式が判明しました：
- 単一のユーザメッセージとして送信される（ツール結果ではない）
- 多層のJSON文字列が含まれる（最大6層の解析が必要）
- プレフィックステキスト（"以下の調査結果の品質を評価し..."）が含まれる
- 最後のタスク結果のみが含まれる可能性がある

これに基づき、堅牢な解析ロジックを実装しました。

#### 多層JSON解析の実装

**解析の6段階プロセス**:
```
プレフィックステキスト + JSON文字列
  └─ outerData (success, agentName, thread_id, response)
      └─ response.content (JSON文字列)
          └─ contentData (taskId, result)
              └─ result.messages
                  ├─ user メッセージ（元のユーザ要求）
                  └─ assistant メッセージ（調査結果、JSON文字列）
                      └─ researchData (result.researchResults)
```

**実装した解析ステップ**:
1. プレフィックステキスト除去とJSON部分抽出（正規表現 `/\{[\s\S]*\}/`）
2. 外側のJSONパース（outerData取得）
3. `response.content`（JSON文字列）のパース
4. `result.messages`から元のユーザ要求とassistantメッセージを抽出
5. assistantメッセージ（JSON文字列）をパース
6. 実際の調査結果（`researchResults`配列）を取得

**エラーハンドリング**:
- 各解析ステップで個別に`try-catch`を使用
- 解析失敗時のフォールバック処理（全体をテキストとして扱う）
- 詳細なログ出力（各ステップの成功/失敗を記録）
- 調査結果が見つからない場合の明確なエラーレスポンス（debugInfo付き）

### 評価ロジック

**評価軸の定義**:
- **完全性** (`completenessCheck`): 元のユーザ要求の全トピックがカバーされているか
- **品質スコア** (`qualityScore`): 完全性、具体性、関連性、深さを総合評価（0-100点）
- **推奨事項** (`recommendations`): さらなる調査や改善が必要な点を特定
- **不足トピック** (`missingTopics`): カバーされていないトピックをリスト

**LLMプロンプト構造**:
```
【元のユーザ要求】
{originalRequest}

【調査結果】
タスク1: {objective}
結果: {findings}
タスク2: ...

評価基準と出力形式の指示（EVALUATION_START/END マーカー）
```

**評価プロンプトの工夫**:
- コンテキスト明確化: 元の要求と調査結果を明確に分離
- 出力形式指定: EVALUATIONマーカーとJSON構造の明示
- 評価基準の再提示: 各評価項目の定義を詳細に説明
- 具体的な指示: 各フィールドに含めるべき内容を明記

### サマリー生成

**エグゼクティブサマリーのガイドライン**:
- 簡潔で要点を押さえた文章（500-800文字）
- ユーザが求めた全てのトピックに言及
- 重要な数値やデータポイントを含める
- ビジネス判断に役立つ洞察を提供
- 日本語で作成（敬体を使用）

**システムプロンプトの工夫**:
1. **役割定義**: 市場調査の品質評価とレポート作成の専門家
2. **評価基準の明示**: 完全性、正確性、関連性、深さ、構造
3. **サマリーガイドラインの詳細化**: 長さ、内容、スタイルの具体的な指示
4. **日本語の強調**: 「必ず日本語でレスポンスを返してください」を明記

**実装**:
- LLMにサマリー作成を依頼（元の要求と調査結果を提供）
- EVALUATIONマーカーでJSON結果を抽出
- マーカーが見つからない場合のフォールバック処理（レスポンス全体の先頭800文字を使用）
- 生成されたサマリーの長さをログ出力（品質確認用）

### パフォーマンス

**最適化の考慮事項**:
- temperature: 0.2（低めに設定して一貫性を確保）
- モデル: gpt-4o-mini（コストとパフォーマンスのバランス）
- 詳細なログ出力（デバッグとトラブルシューティングを容易に）

**将来的な改善案**:
- キャッシング: 同じ調査結果への複数回評価の最適化
- ストリーミング: 長いサマリーの段階的表示
- 評価の並列化: 複数の評価軸を独立して並列評価

### 詳細なログ出力

デバッグとトラブルシューティングを容易にするため、以下を詳細にログ出力:
- 受信メッセージの分析（長さ、プレビュー）
- 各JSON解析ステップの結果（✓成功、⚠️警告、❌エラー）
- 抽出された元のユーザ要求と調査結果のサマリー
- LLMプロンプトの長さ
- LLMレスポンスの内容（長さ、プレビュー）
- 最終的な評価結果のサマリー（qualityScore、recommendations数、missingTopics数、サマリー長）

**ログフォーマット**:
```
================================================================================
📊 [QualityEvaluation] 品質評価開始
================================================================================

📨 受信メッセージ分析:
🔍 JSON解析開始...
📋 解析結果サマリー:
🤖 LLMに評価依頼を送信...
✅ LLMレスポンス受信
✅ 評価結果解析成功
📋 評価レポート完成

================================================================================
✅ [QualityEvaluation] 品質評価完了
================================================================================
```

### エンドツーエンド

Phase 4の完成により、完全なエンドツーエンドワークフローが実現:

**フロー**:
```
1. ユーザ入力（矢崎総業の調査依頼）
   ↓
2. タスク作成サーバ（5-7タスクのリスト生成）
   ↓
3. ユーザ承認 (interrupt)
   ↓
4. 調査実行サーバ（各タスクをWeb検索で調査）
   ↓
5. ユーザ承認 (interrupt)
   ↓
6. 品質評価サーバ（評価とエグゼクティブサマリー生成）← Phase 4実装
   ↓
7. ユーザ承認 (interrupt)
   ↓
8. 完了
```

**各段階でのHuman-in-the-Loop**:
- サーバレスポンスをユーザに表示
- interrupt()でユーザ判断を待機
- 「許可」→ 次のフェーズへ進む
- その他（却下/修正）→ 同じサーバをフィードバック付きでリトライ

---

## 成功基準達成状況

- [ ] ✅ 品質評価ロジックが動作する
- [ ] ✅ エグゼクティブサマリーが包括的で構造化されている
- [ ] ✅ サマリーが日本語で自然に記述される
- [ ] ✅ 不足情報が適切に識別される
- [ ] ✅ 改善推奨事項が実用的
- [ ] ✅ 完全なエンドツーエンドワークフローが機能

---

## 完全ワークフロー最終検証

### 機能検証
- [ ] ✅ ユーザ入力 → タスク生成 → 調査 → 評価 → 完了の全フロー
- [ ] ✅ 各段階でinterruptが正常動作
- [ ] ✅ ユーザが各段階でフロー制御可能（承認/却下/修正）
- [ ] ✅ フィードバックが各サーバに正しく伝達
- [ ] ✅ 最終出力が元のユーザ要求を満たす

### 品質検証
- [ ] ✅ タスクリストが包括的
- [ ] ✅ 調査結果が具体的で信頼できる
- [ ] ✅ エグゼクティブサマリーが実用的
- [ ] ✅ 全体の所要時間が妥当（15-30分程度）

### エラーハンドリング検証
- [ ] ✅ APIエラーが適切に処理される
- [ ] ✅ タイムアウトが適切に処理される
- [ ] ✅ 不正な入力が適切に処理される
- [ ] ✅ サーバ間の通信エラーが適切に処理される

---

## 本番運用への準備

- [ ] ログとモニタリング設定
- [ ] エラーアラート設定
- [ ] 重要データのバックアップ設定
- [ ] 使用方法ドキュメント作成
- [ ] トラブルシューティングガイド作成
- [ ] パフォーマンスチューニング

---

## 完了

Phase 4が完了したら:
- [ ] このステータスファイルに結果を記録
- [ ] サンプル出力を記録
- [ ] 完全ワークフロー最終検証を完了
- [ ] 本番運用準備チェックリストを確認

🎉 **全4フェーズ完了おめでとうございます！**

本番環境で使用可能なA2A Human-in-the-Loopシステムが完成しました。
