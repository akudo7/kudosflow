# Phase 5 - Report Generation and Approval

**作成日**: 2025-12-29
**ステータス**: ✅ 完了

---

## 📋 概要

Phase 4の問題を解決し、調査結果から統合レポートを生成してユーザ承認を得てから品質評価に進む新しいフローを実装します。

## 🎯 目的

1. **Phase 4のバグ修正**: 構文エラーを修正し、品質評価サーバを正常に動作させる
2. **レポート生成の導入**: 複数の調査結果を統合した読みやすいレポートを作成
3. **承認ゲートの追加**: ユーザがレポート内容を確認・承認してから品質評価に進む
4. **ワークフローの改善**: より透明性の高い、制御可能なフローを実現

## 🏗️ アーキテクチャ設計

### 新しいワークフロー

```
[Task Creation] → [Approval] → [Research Execution] → [Approval]
  → [Report Generation] → [Report Approval] → [Quality Evaluation] → [Approval] → [Complete]
```

### 新規追加コンポーネント

1. **Report Generation Node** (`report_generator`)
   - 複数の調査結果を収集
   - ネストされたJSONから実際のデータを抽出
   - 統合レポートを生成（マークダウン形式）
   - フラット化されたデータ構造を作成

2. **Report Approval Gate** (`approval_gate_report`)
   - 生成されたレポートをユーザに表示
   - ユーザの承認/修正要求を処理
   - 承認された場合は品質評価フェーズへ
   - 修正要求の場合は調査フェーズに戻る

### フェーズ定義の更新

現在の3フェーズ:
- `task_creation`
- `research_execution`
- `quality_evaluation`

Phase 5で追加:
- `report_generation` (新規)

## 🔧 実装計画

### Step 1: Phase 4バグの修正

**対象ファイル**: `json/a2a/phase4/servers/quality-evaluation.json`

**修正内容**:
1. バックアップから復元、または手動で構文エラーを修正
2. 複雑な多層JSON解析ロジックを削除
3. クライアントから送られるフラット化されたデータを直接使用

**修正前（削除対象）**:
```javascript
// 約50行の多層解析ロジック
for (let i = 0; i < evaluationData.researchResults.length; i++) {
  const item = evaluationData.researchResults[i];
  // レイヤー1, 2, 3の解析...
}
```

**修正後**:
```javascript
// シンプルな直接使用（3行）
if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
  researchResults = evaluationData.researchResults;
}
```

### Step 2: Report Generation Nodeの作成

**対象ファイル**: `json/a2a/phase4/client.json`

**実装内容**:

```javascript
{
  "id": "report_generator",
  "function": {
    "parameters": [
      {
        "name": "state",
        "type": "typeof AgentState.State"
      }
    ],
    "implementation": "..."
  }
}
```

**処理フロー**:
1. `state.messages`から全ての調査結果を収集
2. ネストされたJSONを解析して実際のデータを抽出
3. 統合レポートを生成:
   - セクション1: 元のユーザ要求
   - セクション2: 調査結果サマリー（各タスクの概要）
   - セクション3: 詳細な調査結果（各タスクの詳細）
   - セクション4: 統計情報（タスク数、総文字数など）
4. フラット化されたデータ構造を`state.reportData`に保存
5. レポートテキストを`state.reportText`に保存

### Step 3: Report Approval Gateの作成

**対象ファイル**: `json/a2a/phase4/client.json`

**実装内容**:

```javascript
{
  "id": "approval_gate_report",
  "function": {
    "parameters": [
      {
        "name": "state",
        "type": "typeof AgentState.State"
      }
    ],
    "implementation": "..."
  }
}
```

**処理フロー**:
1. `state.reportText`からレポートを取得
2. ユーザにレポートを表示:
   ```
   📊 調査レポート生成完了

   [レポート内容]

   このレポートで品質評価に進みますか?
   ・「許可」と入力すると品質評価を開始します
   ・その他の入力で調査を再実行します
   ```
3. ユーザ応答を処理:
   - 「許可」→ `currentPhase: 'quality_evaluation'`
   - その他 → `currentPhase: 'research_execution'`, `userFeedback: [user input]`

### Step 4: Orchestratorの更新

**対象ファイル**: `json/a2a/phase4/client.json`

**更新箇所**:

1. **research_executionフェーズの後処理を変更**:
```javascript
if (currentPhase === 'research_execution') {
  // ... 既存のコード ...

  // 変更: 直接quality_evaluationに進まず、report_generationに進む
  return {
    messages: [response],
    currentPhase: 'research_execution',  // そのまま
    userFeedback: null
  };
}
```

2. **quality_evaluationフェーズの簡素化**:
```javascript
if (currentPhase === 'quality_evaluation') {
  console.log('✅ [orchestrator] Invoking QualityEvaluationAgent');

  // 変更: report_generatorで作成済みのデータを使用
  const evaluationStr = JSON.stringify(state.reportData, null, 2);

  let prompt = `以下の調査結果の品質を評価し、エグゼクティブサマリーを作成してください:\n${evaluationStr}`;
  if (state.userFeedback) {
    prompt = `前回の評価へのフィードバック: ${state.userFeedback}\n\n${prompt}`;
  }

  const response = await model.invoke([
    { role: 'system', content: 'You MUST use ONLY the send_message_to_quality_agent tool.' },
    { role: 'user', content: prompt }
  ]);

  return { messages: [response], currentPhase: 'quality_evaluation', userFeedback: null };
}
```

### Step 5: State Annotationの更新

**対象ファイル**: `json/a2a/phase4/client.json`

**追加するフィールド**:

```json
"annotation": {
  // ... 既存のフィールド ...
  "reportData": {
    "type": "any",
    "reducer": "(x, y) => y || x",
    "default": null
  },
  "reportText": {
    "type": "string",
    "reducer": "(x, y) => y || x",
    "default": null
  }
}
```

### Step 6: Edgesの更新

**対象ファイル**: `json/a2a/phase4/client.json`

**追加するエッジ**:

```json
{
  "from": "approval_gate_research",
  "type": "conditional",
  "condition": {
    "name": "routeAfterResearchApproval",
    "function": {
      "parameters": [{ "name": "state", "type": "typeof AgentState.State" }],
      "implementation": "if (state.userDecision === 'approve') { return 'report_generator'; } return 'orchestrator';"
    }
  }
},
{
  "from": "report_generator",
  "to": "approval_gate_report"
},
{
  "from": "approval_gate_report",
  "type": "conditional",
  "condition": {
    "name": "routeAfterReportApproval",
    "function": {
      "parameters": [{ "name": "state", "type": "typeof AgentState.State" }],
      "implementation": "if (state.userDecision === 'approve') { return 'orchestrator'; } return 'orchestrator';"
    }
  }
}
```

**更新が必要なエッジ**:

現在の `approval_gate_research` → `orchestrator` を条件付きに変更（上記参照）

## 📊 データフロー

### 1. Research Execution完了時

**State**:
```javascript
{
  currentPhase: 'research_execution',
  messages: [
    // ... tool messages with research results ...
  ],
  userDecision: 'approve'
}
```

### 2. Report Generation実行時

**Input**: `state.messages`から調査結果を抽出

**Output**:
```javascript
{
  reportData: {
    originalRequest: "...",
    researchResults: [
      { task: "...", findings: "...", sources: [...] },
      // ... more results ...
    ],
    totalResults: 5,
    totalCharacters: 15000
  },
  reportText: "# 調査レポート\n\n## 概要\n...",
  currentPhase: 'research_execution'  // そのまま
}
```

### 3. Report Approval時

**Display to User**:
```
📊 調査レポート生成完了

タスク完了数: 5
総文字数: 15,000

# 調査レポート

## 概要
[ユーザ要求の再確認]

## 調査結果サマリー
1. [タスク1の概要]
2. [タスク2の概要]
...

## 詳細な調査結果
### タスク1: ...
[詳細内容]

このレポートで品質評価に進みますか?
・「許可」と入力すると品質評価を開始します
・その他の入力で調査を再実行します
```

**User approves** → `currentPhase: 'quality_evaluation'`

### 4. Quality Evaluation実行時

**Input**: `state.reportData`（すでにフラット化済み）

**Server receives**:
```json
{
  "originalRequest": "...",
  "researchResults": [
    { "task": "...", "findings": "...", "sources": [...] }
  ],
  "totalResults": 5
}
```

## 🧪 テストシナリオ

### Test 1: 正常フロー

1. ユーザが調査依頼
2. タスクリスト承認
3. 調査実行
4. 調査結果承認
5. **レポート生成**（新規）
6. **レポート承認**（新規）
7. 品質評価
8. 評価結果承認
9. 完了

**期待される動作**:
- レポートが5つの調査結果を統合して表示
- レポートが読みやすいマークダウン形式
- 品質評価サーバが正常に動作（qualityScore > 0）

### Test 2: レポート修正フロー

1. ... (Test 1と同じステップ5まで)
6. ユーザがレポートを拒否し、修正要求を入力
7. システムが調査フェーズに戻る
8. 修正された調査を実行
9. 新しいレポート生成
10. レポート承認
11. 品質評価
12. 完了

**期待される動作**:
- ユーザフィードバックが調査エージェントに渡される
- 修正された調査結果で新しいレポートが生成される

### Test 3: 品質評価サーバの動作確認

1. レポート承認まで進む
2. 品質評価サーバが起動
3. フラット化されたデータを受信
4. qualityScoreを計算（> 0であること）
5. executiveSummaryを生成
6. recommendationsを提供

**期待される動作**:
- サーバが構文エラーなく起動
- JSON解析エラーが発生しない
- qualityScoreが適切に計算される（0でない）

## 📝 実装チェックリスト

### Phase 4バグ修正
- [ ] バックアップファイルの確認
- [ ] quality-evaluation.jsonの修正
- [ ] サーバ起動テスト
- [ ] 構文エラーの解消確認

### Phase 5実装
- [ ] State annotationに`reportData`と`reportText`を追加
- [ ] `report_generator`ノードの実装
- [ ] `approval_gate_report`ノードの実装
- [ ] `orchestrator`ノードの更新（quality_evaluationフェーズの簡素化）
- [ ] エッジ定義の更新
- [ ] `approval_gate_research`の条件分岐を更新

### テスト
- [ ] 単体テスト: report_generatorノード
- [ ] 単体テスト: approval_gate_reportノード
- [ ] 統合テスト: 正常フロー（Test 1）
- [ ] 統合テスト: レポート修正フロー（Test 2）
- [ ] 統合テスト: 品質評価サーバの動作（Test 3）

### ドキュメント
- [ ] phase5-status.mdの作成
- [ ] phase4-bug.mdのステータス更新
- [ ] IMPLEMENTATION.mdの更新

## 🎯 成功基準

1. ✅ Phase 4のバグが完全に修正されている
2. ✅ レポート生成機能が正常に動作する
3. ✅ レポート承認ゲートがユーザ入力を正しく処理する
4. ✅ 品質評価サーバが構文エラーなく起動する
5. ✅ 品質評価サーバがqualityScore > 0を返す
6. ✅ エンドツーエンドテストが全て成功する
7. ✅ レポートが読みやすく、情報が整理されている

## 🚀 実装順序

1. **Day 1**: Phase 4バグ修正 + サーバ動作確認
2. **Day 2**: Report Generator実装 + 単体テスト
3. **Day 3**: Report Approval Gate実装 + Orchestrator更新
4. **Day 4**: エッジ更新 + 統合テスト
5. **Day 5**: エンドツーエンドテスト + ドキュメント更新

## 📚 参考資料

- [phase4-bug.md](./phase4-bug.md) - Phase 4のバグ詳細
- [phase4-status.md](./phase4-status.md) - Phase 4実装ステータス
- [client.json](../../json/a2a/phase4/client.json) - クライアント設定
- [quality-evaluation.json](../../json/a2a/phase4/servers/quality-evaluation.json) - 品質評価サーバ設定

## 💡 設計の利点

1. **透明性**: ユーザが品質評価前にレポート全体を確認できる
2. **制御性**: レポートに問題があれば調査をやり直せる
3. **保守性**: レポート生成ロジックが独立したノードに分離
4. **スケーラビリティ**: 将来的にレポート形式を拡張しやすい
5. **デバッグ性**: 各フェーズの出力が明確に分離されている

## ⚠️ 注意事項

1. **後方互換性**: Phase 4の既存動作を壊さないように注意
2. **パフォーマンス**: レポート生成が重い場合は最適化が必要
3. **エラーハンドリング**: JSON解析失敗時の適切なフォールバック
4. **ユーザ体験**: レポートが長すぎる場合の表示方法を検討

---

**次のステップ**: phase5-status.mdを作成し、実装を開始
