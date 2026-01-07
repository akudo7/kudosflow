# リファクタリング計画: possibleTargets の自動抽出による削除

## 概要

conditionalエッジにおける `possibleTargets` パラメータを、Implementationコードの `return` 文から動的に抽出することで、手動記述を不要にする。

**前提条件**: シンプルな `return '文字列リテラル'` パターンのみサポート

---

## 調査結果

### ✅ 削除可能と判断

**理由**:
1. 現在の全ての条件分岐実装（4ファイル、計5箇所）がサポート対象パターンで記述されている
2. 正規表現により `return '文字列リテラル'` パターンを確実に抽出可能
3. 後方互換性を保ちながら段階的な移行が可能

### 検証結果

現在のワークフローJSON (4ファイル) の条件分岐実装を検証:

1. **client.json** - シンプルな early return パターン ✅
2. **task-creation.json** - if-else パターン ✅
3. **quality-evaluation.json** (2箇所) - if-else と early return パターン ✅
4. **research-execution.json** - try-catch with early return パターン ✅

**全てのケースで `return '文字列リテラル'` のみを使用しており、変数やオブジェクトルックアップは使用されていない。**

---

## サポートするパターン

### ✅ サポート対象

```javascript
// パターン1: if-else
if (condition) {
  return 'nodeA';
} else {
  return 'nodeB';
}

// パターン2: if-else if-else
if (condition1) {
  return 'nodeA';
} else if (condition2) {
  return 'nodeB';
} else {
  return 'nodeC';
}

// パターン3: early return
if (condition1) {
  return 'nodeA';
}
if (condition2) {
  return 'nodeB';
}
return 'nodeC';

// パターン4: try-catch with return
try {
  if (condition) {
    return 'nodeA';
  }
  return 'nodeB';
} catch (error) {
  return '__end__';
}
```

### ❌ サポート外（エラー扱い）

```javascript
// 変数を使用
const target = state.phase + '_executor';
return target;

// オブジェクトルックアップ
const targets = { approved: '__end__', rejected: 'refiner' };
return targets[state.status];

// 関数呼び出し
return determineNextNode(state);
```

---

## 実装計画

### Phase 1: 動的抽出ユーティリティの実装

**ファイル**: 新規作成 `webview-ui/src/workflow-editor/utils/extractPossibleTargets.ts`

**実装内容**:

```typescript
/**
 * Implementation コードから possibleTargets を抽出
 * シンプルな return '文字列リテラル' パターンのみサポート
 */
export function extractPossibleTargets(implementation: string): string[] | null {
  // return 'string' または return "string" パターンをマッチ
  const returnPattern = /return\s+['"]([^'"]+)['"]/g;
  const matches = [...implementation.matchAll(returnPattern)];

  if (matches.length === 0) {
    return null; // return 文が見つからない
  }

  // 重複を削除してユニークな targets を抽出
  const targets = matches.map(m => m[1]);
  const uniqueTargets = [...new Set(targets)];

  return uniqueTargets;
}

/**
 * 抽出が成功したかを検証
 */
export function validateExtraction(
  implementation: string,
  extractedTargets: string[] | null
): { valid: boolean; error?: string } {
  // 変数を使用した return を検出
  if (/return\s+[a-zA-Z_$]/.test(implementation) &&
      !/return\s+['"]/.test(implementation)) {
    return {
      valid: false,
      error: 'Variables in return statements are not supported. Use return "literalString" instead.'
    };
  }

  if (!extractedTargets || extractedTargets.length === 0) {
    return {
      valid: false,
      error: 'Could not extract possibleTargets from implementation. Ensure all return statements use string literals.'
    };
  }

  return { valid: true };
}
```

**テストケース**:

```typescript
// Test 1: シンプルな if-else
const code1 = "if (state.status === 'approved') { return '__end__'; } else { return 'retry'; }";
extractPossibleTargets(code1); // => ['__end__', 'retry']

// Test 2: early return
const code2 = "if (x) { return 'a'; } if (y) { return 'b'; } return 'c';";
extractPossibleTargets(code2); // => ['a', 'b', 'c']

// Test 3: 重複削除
const code3 = "if (x) { return '__end__'; } return '__end__';";
extractPossibleTargets(code3); // => ['__end__']

// Test 4: 変数使用（エラー）
const code4 = "const target = 'node'; return target;";
validateExtraction(code4, extractPossibleTargets(code4)); // => { valid: false, error: '...' }
```

---

### Phase 2: JSON読み込み時の自動抽出適用

**ファイル**: `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`

**変更箇所**: 条件分岐エッジの処理部分（現在の行番号: 74-101付近）

**変更内容**:

```typescript
// Before
const possibleTargets = edge.possibleTargets || [];

// After
import { extractPossibleTargets } from '../utils/extractPossibleTargets';

let possibleTargets = edge.possibleTargets;

// possibleTargets が無い場合は自動抽出
if (!possibleTargets && edge.condition?.function?.implementation) {
  const extracted = extractPossibleTargets(edge.condition.function.implementation);
  if (extracted) {
    possibleTargets = extracted;
    console.log(`[jsonToFlow] Auto-extracted possibleTargets for ${edge.from}:`, extracted);
  } else {
    console.warn(`[jsonToFlow] Failed to extract possibleTargets for ${edge.from}`);
    possibleTargets = [];
  }
} else {
  possibleTargets = possibleTargets || [];
}

// 以降は既存のロジック（possibleTargets を使用してエッジを生成）
```

**動作**:
- JSON に `possibleTargets` があればそれを使用（後方互換性）
- 無ければ `implementation` から自動抽出
- 抽出失敗時は空配列（エラーにはしない）

---

### Phase 3: UI での自動推測機能（オプション）

**ファイル**: `webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx`

**追加機能**: Implementation コード入力時にリアルタイムで possibleTargets を推測・表示

**実装内容**:

```typescript
import { extractPossibleTargets, validateExtraction } from '../utils/extractPossibleTargets';

// State 追加
const [extractedTargets, setExtractedTargets] = useState<string[]>([]);
const [showSuggestion, setShowSuggestion] = useState(false);

// Implementation コード変更時に自動抽出
const handleImplementationChange = (newImplementation: string) => {
  setImplementation(newImplementation);

  // 自動抽出を試行
  const extracted = extractPossibleTargets(newImplementation);
  if (extracted && extracted.length > 0) {
    setExtractedTargets(extracted);
    setShowSuggestion(true);
  } else {
    setExtractedTargets([]);
    setShowSuggestion(false);
  }
};

// UI に「自動検出された possibleTargets を使用」ボタンを追加
{showSuggestion && extractedTargets.length > 0 && (
  <div className="suggestion-box" style={{
    padding: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginTop: '10px'
  }}>
    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
      🔍 Auto-detected targets: <strong>{extractedTargets.join(', ')}</strong>
    </p>
    <button
      onClick={() => setSelectedTargets(extractedTargets)}
      style={{
        padding: '4px 8px',
        fontSize: '12px',
        cursor: 'pointer'
      }}
    >
      Use detected targets
    </button>
  </div>
)}
```

**UX向上効果**:
- ユーザーが implementation を書いた瞬間に possibleTargets を提案
- ワンクリックで選択可能
- 手動選択も引き続き可能

---

### Phase 4: 型定義の更新

**ファイル**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

**変更内容**:

```typescript
export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: ConditionalEdgeCondition;
  possibleTargets?: string[];  // Optional - 自動抽出可能
}
```

**変更点**:
- `possibleTargets` は既に optional (`?`) なので変更不要
- ただしコメントを追加して「自動抽出可能」であることを明示

**削除対象**:
- `ConditionalEdgeCondition.function` から `possibleTargets` を削除（すでに edge level に移行済み）

---

### Phase 5: JSON ファイルから possibleTargets を削除（オプション）

**目的**: 既存の JSON ファイルから possibleTargets を削除し、自動抽出に完全移行

**対象ファイル**:
- `json/a2a/client.json:139`
- `json/a2a/servers/task-creation.json:172`
- `json/a2a/servers/quality-evaluation.json:200, 218`
- `json/a2a/servers/research-execution.json:205`

**削除内容**:

```json
// Before
{
  "type": "conditional",
  "from": "approval_gate",
  "condition": { ... },
  "possibleTargets": ["__end__", "task_refiner"]  // ← この行を削除
}

// After
{
  "type": "conditional",
  "from": "approval_gate",
  "condition": { ... }
}
```

**注意**: Phase 1-4 が完了し、十分にテストしてから実施すること

---

### Phase 6: バリデーションロジックの更新

**ファイル**: `webview-ui/src/workflow-editor/utils/validation.ts`

**変更箇所**: `validateConditionalEdge` 関数（現在の行番号: 361-420付近）

**変更内容**:

```typescript
import { extractPossibleTargets, validateExtraction } from './extractPossibleTargets';

export function validateConditionalEdge(
  condition: ConditionalEdgeCondition,
  possibleTargets: string[] | undefined,
  nodeIds: string[]
): ValidationResult {
  // possibleTargets が無い場合は自動抽出
  let targets = possibleTargets;

  if (!targets && condition.function?.implementation) {
    const extracted = extractPossibleTargets(condition.function.implementation);
    const validation = validateExtraction(condition.function.implementation, extracted);

    if (!validation.valid) {
      return validation; // 抽出失敗時はエラーを返す
    }

    targets = extracted!;
    console.log('[Validation] Auto-extracted possibleTargets:', targets);
  }

  // 既存のバリデーション処理
  if (targets && targets.length > 0) {
    const validNodeIds = [...nodeIds, '__end__'];
    for (const target of targets) {
      if (!validNodeIds.includes(target)) {
        return {
          valid: false,
          error: `Invalid target: "${target}" does not exist in the workflow`,
        };
      }
    }
  }

  return { valid: true };
}
```

**動作**:
- possibleTargets が明示的に指定されている場合はそれを検証
- 無い場合は自動抽出してから検証
- 抽出失敗（変数使用など）の場合はエラー

---

### Phase 7: テストとドキュメント更新

#### テスト項目

**単体テスト** (`extractPossibleTargets.test.ts` 新規作成):

```typescript
import { extractPossibleTargets, validateExtraction } from './extractPossibleTargets';

describe('extractPossibleTargets', () => {
  test('シンプルな if-else', () => {
    const code = "if (x) { return 'a'; } else { return 'b'; }";
    expect(extractPossibleTargets(code)).toEqual(['a', 'b']);
  });

  test('early return', () => {
    const code = "if (x) { return 'a'; } if (y) { return 'b'; } return 'c';";
    expect(extractPossibleTargets(code)).toEqual(['a', 'b', 'c']);
  });

  test('重複削除', () => {
    const code = "if (x) { return '__end__'; } return '__end__';";
    expect(extractPossibleTargets(code)).toEqual(['__end__']);
  });

  test('ダブルクォート対応', () => {
    const code = 'if (x) { return "a"; } else { return "b"; }';
    expect(extractPossibleTargets(code)).toEqual(['a', 'b']);
  });

  test('console.log などは無視', () => {
    const code = "console.log('test'); if (x) { return 'a'; } return 'b';";
    expect(extractPossibleTargets(code)).toEqual(['a', 'b']);
  });
});

describe('validateExtraction', () => {
  test('変数使用を検出', () => {
    const code = "const target = 'node'; return target;";
    const extracted = extractPossibleTargets(code);
    const result = validateExtraction(code, extracted);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Variables in return statements');
  });

  test('正常なケースはエラー無し', () => {
    const code = "if (x) { return 'a'; } return 'b';";
    const extracted = extractPossibleTargets(code);
    const result = validateExtraction(code, extracted);
    expect(result.valid).toBe(true);
  });
});
```

**統合テスト**:
1. ✅ 既存のワークフローJSONが possibleTargets 無しで正常に読み込まれる
2. ✅ 条件分岐エッジの自動抽出が正しく動作する
3. ✅ UI での自動推測機能が動作する
4. ✅ バリデーションが正しく機能する
5. ✅ 変数を使った return 文がエラーになる

#### ドキュメント更新

**`docs/a2a/config-reference.md`**:

```markdown
### Conditional Edge

条件分岐エッジは、ワークフローの実行フローを動的に制御します。

#### possibleTargets（オプショナル）

- **型**: `string[]`
- **説明**: 条件分岐の可能な遷移先ノード ID の配列
- **省略可能**: implementation コードから自動抽出されます
- **自動抽出の条件**: `return '文字列リテラル'` 形式のみサポート

**例**:

```json
{
  "type": "conditional",
  "from": "decision_node",
  "condition": {
    "name": "shouldContinue",
    "function": {
      "parameters": [{"name": "state", "type": "typeof AgentState.State"}],
      "implementation": "if (state.status === 'approved') { return '__end__'; } else { return 'retry'; }"
    }
  }
  // possibleTargets は省略可能（["__end__", "retry"] が自動抽出される）
}
```

**注意事項**:
- 変数を使った return は非サポート: `const target = 'node'; return target;` ❌
- オブジェクトルックアップは非サポート: `return targets[state.status];` ❌
- 明示的に指定する場合は、implementation の return 値と一致させること
```

**`CLAUDE.md`**:

```markdown
## Conditional Edges (条件分岐エッジ)

条件分岐エッジでは、`possibleTargets` が自動抽出されます。

### 自動抽出機能

implementation コードから `return '文字列リテラル'` パターンを検出し、possibleTargets を自動生成します。

**サポートされるパターン**:
- `if (condition) { return 'nodeA'; } else { return 'nodeB'; }`
- early return パターン
- try-catch 内の return

**サポートされないパターン**:
- 変数を使った return
- オブジェクトルックアップ
- 関数呼び出しの結果を return

明示的に `possibleTargets` を指定することも可能です。
```

---

## 実装の優先順位

### 必須実装（Phase 1-4, 6）

1. ✅ **Phase 1**: 動的抽出ユーティリティ実装（新規ファイル作成）
2. ✅ **Phase 2**: JSON読み込み時の自動抽出（jsonToFlow.ts 修正）
3. ✅ **Phase 4**: 型定義更新（コメント追加）
4. ✅ **Phase 6**: バリデーションロジック更新

### オプション実装（Phase 3, 5, 7）

5. ⚠️ **Phase 3**: UI での自動推測機能（UX向上、優先度: 中）
6. ⚠️ **Phase 5**: 既存JSONから possibleTargets 削除（段階的に実施可能）
7. ⚠️ **Phase 7**: テストとドキュメント更新（優先度: 高、Phase 1-4 完了後）

---

## 後方互換性

### possibleTargets が残っている場合の動作

**優先順位**:
1. JSON に `possibleTargets` が明示されている → それを使用
2. `possibleTargets` が無い → implementation から自動抽出
3. 自動抽出失敗 → 空配列（Phase 2）またはエラー（Phase 6）

**コード例**:

```typescript
// 後方互換性を保つロジック
if (edge.possibleTargets) {
  // 明示的な possibleTargets があればそれを使用
  possibleTargets = edge.possibleTargets;
} else if (edge.condition?.function?.implementation) {
  // 無ければ自動抽出
  const extracted = extractPossibleTargets(edge.condition.function.implementation);
  possibleTargets = extracted || [];
}
```

### マイグレーション戦略

**段階的移行が可能**:

1. **Phase 1-4, 6 を実装** → 自動抽出機能を追加（既存JSONはそのまま動作）
2. **新規ワークフロー** → possibleTargets を省略可能に
3. **既存ワークフロー** → possibleTargets を残したまま動作継続
4. **Phase 5 を実施** → 任意のタイミングで possibleTargets を削除

**ロールバック**: Phase 5 実施前であれば、いつでも元に戻せる

---

## 期待される効果

### メリット

1. **JSON の簡潔化**: possibleTargets の手動記述が不要
2. **整合性の自動保証**: Implementation と possibleTargets の不一致が発生しない
3. **開発体験の向上**: ユーザーは return 文を書くだけで自動認識
4. **メンテナンス性向上**: implementation を変更すれば自動的に possibleTargets も更新

### デメリットと対策

1. **複雑な実装のサポート不可**
   - 対策: エラーメッセージで明示的に誘導
   - 対策: ドキュメントにサポート範囲を明記

2. **パフォーマンス**: 正規表現による解析コスト
   - 対策: キャッシュ機構の導入（必要に応じて）
   - 現状: エッジ数は少ないため影響軽微

3. **デバッグ難易度**: 自動抽出ロジックが隠れる
   - 対策: console.log で抽出結果を出力
   - 対策: UI に抽出結果を表示（Phase 3）

---

## 実装箇所サマリー

### 新規作成

- `webview-ui/src/workflow-editor/utils/extractPossibleTargets.ts`
- `webview-ui/src/workflow-editor/utils/extractPossibleTargets.test.ts` (Phase 7)

### 修正対象

- `webview-ui/src/workflow-editor/converters/jsonToFlow.ts`
- `webview-ui/src/workflow-editor/settings/ConditionalEdgeFormModal.tsx` (Phase 3)
- `webview-ui/src/workflow-editor/types/workflow.types.ts`
- `webview-ui/src/workflow-editor/utils/validation.ts`

### JSON ファイル（Phase 5 で削除）

- `json/a2a/client.json:139`
- `json/a2a/servers/task-creation.json:172`
- `json/a2a/servers/quality-evaluation.json:200, 218`
- `json/a2a/servers/research-execution.json:205`

### ドキュメント更新

- `docs/a2a/config-reference.md`
- `CLAUDE.md`

---

## まとめ

**調査結果**: ✅ **possibleTargets の自動抽出による削除が可能**

シンプルな return 文のみをサポートする制約により、Implementation コードから possibleTargets を動的に抽出できることが確認されました。

### 推奨実装戦略

**必須実装** (Phase 1-4, 6):
1. ✅ 動的抽出ユーティリティの実装
2. ✅ JSON読み込み時の自動抽出適用
3. ✅ 型定義の更新（コメント追加）
4. ✅ バリデーションロジックの更新

**オプション実装** (Phase 3, 5, 7):
5. ⚠️ UI での自動推測機能（UX向上、優先度中）
6. ⚠️ 既存JSONから possibleTargets 削除（段階的移行可能）
7. ⚠️ テストとドキュメント更新（優先度高）

### 期待される効果

- **JSON の簡潔化**: possibleTargets の手動記述が不要
- **整合性の自動保証**: Implementation と possibleTargets の不一致が発生しない
- **開発体験の向上**: return 文を書くだけで自動認識
- **後方互換性維持**: 既存の possibleTargets は動作し続ける

---

**作成日**: 2025-12-26
**ステータス**: 調査完了・実装計画策定完了・実装準備完了
**関連ドキュメント**: [remove-function-output.md](./remove-function-output.md) (同様のリファクタリング事例)
