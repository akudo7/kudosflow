# リファクタリング計画: function.output パラメータの削除

## 概要

ワークフローJSON設定における `function.output` パラメータは実行時には使用されておらず、UI/ドキュメント目的のみで存在している。このパラメータを削除することで、設定ファイルをシンプルにし、メンテナンス性を向上させる。

## 調査結果

### 現状の使用状況

| 使用箇所 | 目的 | 影響度 |
|---------|------|--------|
| **Runtime (実行時)** | ❌ 使用されていない | なし |
| **UI表示** | ✅ ノードエディタで表示・編集 | 高 |
| **バリデーション** | ✅ 条件分岐エッジの型チェック | 中 |
| **ドキュメント** | ✅ 自己文書化メタデータ | 低 |

### 実行フロー分析

```
ワークフロー実行時:
1. WorkflowEngine が workflow config を読み込み
2. ノードの implementation コードを実行
3. return 文の返り値で状態を更新
   → function.output は参照されない
```

**結論**: `function.output` と実際の `return` 文は独立しており、`output` の記述内容は実行に影響しない。

## リファクタリング計画

### Phase 1: 型定義の更新

**対象ファイル**: [webview-ui/src/workflow-editor/types/workflow.types.ts](../../webview-ui/src/workflow-editor/types/workflow.types.ts)

**変更内容**:
```typescript
// Before
export interface WorkflowNode {
  id: string;
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    output: Record<string, string> | string;  // ← 削除
    implementation: string;
  };
}

// After
export interface WorkflowNode {
  id: string;
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    implementation: string;
  };
}
```

**同様に更新が必要な型**:
- `ConditionalEdgeCondition` インターフェース
- その他 `function.output` を参照する型定義

---

### Phase 2: UIコンポーネントの更新

#### 2.1 ノードエディタダイアログ

**対象ファイル**: [webview-ui/src/workflow-editor/NodeEditorDialog.tsx](../../webview-ui/src/workflow-editor/NodeEditorDialog.tsx)

**削除する機能**:
- 出力フィールドの表示セクション
- `outputValue` state
- 出力の追加/編集/削除ハンドラー
- 出力キーのバリデーション関数 (`validateOutputKey`)

**該当コード箇所**:
```typescript
// 削除対象: output state
const [outputValue, setOutputValue] = useState<Array<{ key: string; type: string }>>(
  Object.entries(nodeData.output || {}).map(([k, v]) => ({ key: k, type: v }))
);

// 削除対象: output field rendering
{/* Output section in UI */}

// 削除対象: save時の output 処理
output: tempOutput,  // この行を削除
```

#### 2.2 条件分岐エッジフォーム

**対象ファイル**: [webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx](../../webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx)

**変更内容**:
```typescript
// Before
const newCondition: ConditionalEdgeCondition = {
  name: conditionName.trim(),
  function: {
    parameters: parameters,
    output: outputType,  // ← この行を削除
    implementation: implementation.trim(),
  },
};

// After
const newCondition: ConditionalEdgeCondition = {
  name: conditionName.trim(),
  function: {
    parameters: parameters,
    implementation: implementation.trim(),
  },
};
```

**追加作業**:
- `outputType` state の削除
- Output Type 入力フィールドの削除

---

### Phase 3: バリデーションロジックの更新

**対象ファイル**: [webview-ui/src/workflow-editor/utils/validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts)

**削除する検証**:
```typescript
// 削除対象: Line 390-395
if (typeof condition.function.output !== 'string') {
  return {
    valid: false,
    error: 'Output must be a string',
  };
}
```

**理由**: `output` フィールドが存在しなくなるため、この検証は不要。

---

### Phase 4: JSON設定ファイルの更新

**対象ファイル**:
- [json/a2a/client.json](../../json/a2a/client.json)
- [json/a2a/orchestrator.json](../../json/a2a/orchestrator.json)
- [json/model.json](../../json/model.json)
- その他すべてのワークフローJSON

**変更例**:
```json
// Before
{
  "id": "askName",
  "function": {
    "parameters": [...],
    "output": {
      "messages": "string[]",
      "userName": "string"
    },
    "implementation": "..."
  }
}

// After
{
  "id": "askName",
  "function": {
    "parameters": [...],
    "implementation": "..."
  }
}
```

**作業方法**:
1. 各JSONファイルを開く
2. 全ノードから `"output": { ... },` 行を削除
3. 条件分岐エッジから `"output": "string",` 行を削除

---

### Phase 5: ドキュメントの更新

**対象ファイル**:
- [docs/a2a/config-reference.md](../../docs/a2a/config-reference.md)
- [CLAUDE.md](../../CLAUDE.md)
- その他ワークフロー設定に関する文書

**更新内容**:
1. `function.output` の説明を削除
2. 「ノードの出力は `implementation` の `return` 文で定義される」と明記
3. サンプルコードから `output` フィールドを削除

---

### Phase 6: テストとクリーンアップ

#### 6.1 動作確認項目

- [ ] ノードエディタでノードを作成・編集できる
- [ ] 条件分岐エッジを作成・編集できる
- [ ] ワークフローの保存・読み込みが正常に動作
- [ ] ワークフローの実行が正常に動作（output削除前と同じ結果）
- [ ] TypeScriptのビルドエラーがない
- [ ] ESLintの警告がない

#### 6.2 クリーンアップ

- 未使用のユーティリティ関数を削除
- 未使用のimport文を削除
- コメントの整合性確認

---

## 実装順序

推奨される実装順序:

1. **Phase 4**: JSONファイルから `output` を削除（後方互換性確認のため）
2. **Phase 3**: バリデーションロジックを更新
3. **Phase 2**: UIコンポーネントを更新
4. **Phase 1**: 型定義を更新（TypeScriptエラーが出る箇所を修正）
5. **Phase 5**: ドキュメントを更新
6. **Phase 6**: テストとクリーンアップ

---

## リスクと対策

### リスク 1: 既存のワークフローJSONとの互換性

**リスク**: 古いJSONファイルに `output` が残っている場合の動作

**対策**:
- JSONパーサーは未知のフィールドを無視するため、`output` が残っていても動作に影響しない
- 段階的に移行可能（一度にすべてのJSONを更新しなくても良い）

### リスク 2: 外部パッケージの型定義との不一致

**リスク**: `@kudos/scene-graph-manager` の型定義に `output` が含まれている

**対策**:
- 確認した結果、実行時に `output` を使用していないことを検証済み
- 型の不一致は TypeScript の `Omit` または型アサーションで対応可能

### リスク 3: ドキュメント情報の喪失

**リスク**: ノードが何を返すのかの情報が失われる

**対策**:
- `implementation` コードにJSDocコメントで出力を記述することを推奨
- 例:
```typescript
/**
 * @returns {Object} Returns { messages: string[], userName: string }
 */
const userInput = interrupt('What is your name?');
return { messages: ['Hello!'], userName: userInput };
```

---

## 期待される効果

### メリット

1. **シンプル性**: JSON設定が簡潔になり、理解しやすくなる
2. **一貫性**: 実際の動作と設定の記述が一致する（混乱の防止）
3. **保守性**: 管理するフィールドが減り、メンテナンスが容易になる
4. **パフォーマンス**: わずかながらJSON解析とメモリ使用量が削減

### デメリット

1. **自己文書化の喪失**: ノードの出力型情報がUI上で確認できなくなる
   - 対策: コードコメントで補完
2. **将来的な型チェック機能**: 実装が困難になる
   - 対策: 必要になった時点で TypeScript の型アノテーションを導入

---

## 代替案

### 案1: output を optional にする

```typescript
function?: {
  parameters: Array<{ name: string; type: string; modelRef?: string }>;
  output?: Record<string, string> | string;  // optional
  implementation: string;
}
```

**メリット**: 既存のJSONとの完全な後方互換性
**デメリット**: 使用されないフィールドが残り続ける

### 案2: output を documentation フィールドにリネーム

```typescript
function?: {
  parameters: Array<{ name: string; type: string; modelRef?: string }>;
  documentation?: {
    output: Record<string, string>;
  };
  implementation: string;
}
```

**メリット**: ドキュメント目的であることが明確
**デメリット**: JSONが複雑になる

---

## まとめ

`function.output` パラメータは実行時に使用されていないため、安全に削除可能。削除により設定ファイルがシンプルになり、実際の動作との一貫性が向上する。段階的な実装により、リスクを最小限に抑えながら移行できる。

**推奨**: このリファクタリングを実施する

---

**作成日**: 2025-12-26
**ステータス**: 計画中（実装待ち）
