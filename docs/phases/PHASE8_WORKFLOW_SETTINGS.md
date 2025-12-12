# Phase 8: ワークフロー設定エディタ

**ステータス**: ⬜ 未開始

**目標**: ワークフローのメタデータ（Config、State定義、Annotationフィールド）を編集する機能を追加

## 概要

Phase 8では、現在はノードのimplementationコードのみ編集可能なワークフローエディタに、ワークフロー全体の構造を編集する機能を追加します。

### フェーズ分割

実装の複雑度に基づき、3つのサブフェーズに分割:

- **Phase 8A**: ノード名 + シンプルなConfig編集（簡単 - 1-2日）
- **Phase 8B**: StateGraph ドロップダウン編集（中程度 - 1-2日）
- **Phase 8C**: Annotationフィールド CRUD（複雑 - 3-4日）

---

## Phase 8A: ノード名 + シンプルなConfig編集

**ステータス**: ☑ 完了
**推定時間**: 1-2日 (9-13時間)
**複雑度**: 簡単

### 実装機能

#### 1. ノード名（Node ID）編集

- ノード一覧での名前編集
- ノードヘッダーでのインライン編集（ダブルクリック）
- **ユニーク制約**: すべてのノード名は一意である必要がある
- **予約語チェック**: `__start__`, `__end__` は使用不可
- **エッジの自動更新**: ノード名変更時にエッジのsource/targetを自動更新

#### 2. Config編集

```json
"config": {
  "recursionLimit": 25,           // ← 数値入力、デフォルト 25
  "eventEmitter": {
    "defaultMaxListeners": 25     // ← 数値入力、デフォルト 25
  }
}
```

#### 3. StateAnnotation編集

```json
"stateAnnotation": {
  "name": "InterruptWorkflowState",  // ← テキスト入力
  "type": "Annotation.Root"          // ← 常に固定（編集不可）
}
```

### UI設計

**新規コンポーネント: WorkflowSettingsPanel（右サイドバー）**

```
┌──────────────────────────────────────────┐
│  [ツールバー: 保存 | ノード追加 | ⚙️ 設定] │
├──────────────────────────┬───────────────┤
│                          │               │
│   React Flowキャンバス   │   設定パネル  │
│                          │   (右側表示)  │
│   [ノード & エッジ]      │               │
│                          │   [タブUI]    │
│                          │   ノード│設定 │
│                          │               │
└──────────────────────────┴───────────────┘
```

**タブ構成:**

- **ノード**: ノード名の一覧と編集
- **設定**: Config + StateAnnotation編集

### ファイル構成

#### 新規ファイル

```
webview-ui/src/workflow-editor/
├── WorkflowSettingsPanel.tsx           # メインの設定パネル（右サイドバー）
├── settings/
│   ├── NodeNameEditor.tsx              # ノード名一覧エディタ
│   ├── ConfigEditor.tsx                # Config数値入力フォーム
│   └── StateAnnotationEditor.tsx       # StateAnnotation編集フォーム
└── utils/
    └── validation.ts                   # バリデーション関数
```

#### 修正ファイル

1. **WorkflowEditor.tsx**
   - 状態追加: `showSettings`, `workflowConfig`
   - ハンドラ追加: `handleUpdateWorkflowConfig()`, `handleNodeNameChange()`
   - `<WorkflowSettingsPanel>` コンポーネント統合

2. **WorkflowToolbar.tsx**
   - "⚙️ 設定" ボタン追加
   - `onToggleSettings` コールバック追加

3. **WorkflowNode.tsx**
   - ヘッダーのダブルクリックでインライン編集
   - 入力状態管理（useState）
   - バリデーションフィードバックUI

4. **types/workflow.types.ts**
   - `ValidationResult` 型追加

### バリデーションロジック

**ノード名バリデーション:**

```typescript
validateNodeName(newName: string, nodes: ReactFlowNode[], excludeId?: string): ValidationResult
  - 空文字チェック
  - 予約語チェック (__start__, __end__)
  - ユニークネスチェック（既存ノードIDと重複しない）
  → { valid: boolean, error?: string }
```

**エッジ更新ロジック:**

```typescript
handleNodeNameChange(oldId: string, newId: string):
  1. validateNodeName() でバリデーション
  2. nodes配列を更新（id, data.label）
  3. edges配列を更新（source === oldId → newId, target === oldId → newId）
  4. setNodes(), setEdges() で状態更新
  5. setIsDirty(true) でダーティフラグ
```

### タスクリスト

- [x] `validation.ts` 作成: `validateNodeName()` 実装
- [x] `WorkflowSettingsPanel.tsx` 作成: 基本構造、タブUI
- [x] `NodeNameEditor.tsx` 作成: ノード一覧とインライン編集
- [x] `ConfigEditor.tsx` 作成: 数値入力フォーム
- [x] `StateAnnotationEditor.tsx` 作成: テキスト入力フォーム
- [x] `WorkflowToolbar.tsx` 修正: "⚙️ 設定" ボタン追加
- [x] `WorkflowEditor.tsx` 修正: 状態管理、ハンドラ追加、パネル統合
- [x] `WorkflowNode.tsx` 修正: ヘッダーダブルクリック編集機能
- [x] `types/workflow.types.ts` 修正: ValidationResult型追加
- [x] テスト: ノード名変更でエッジが正しく更新されるか確認
- [x] テスト: 重複名のバリデーションエラー表示確認
- [x] テスト: Config値の保存・読み込み確認

---

## Phase 8B: StateGraph ドロップダウン編集

**ステータス**: ☑ 完了
**推定時間**: 1-2日 (7-10時間)
**複雑度**: 中程度

### 実装機能

#### 1. stateGraph.annotationRef編集

```json
"stateGraph": {
  "annotationRef": "InterruptWorkflowState",  // ← ドロップダウン選択
  "config": {
    "checkpointer": {
      "type": "MemorySaver"  // ← ドロップダウン選択
    }
  }
}
```

- **ドロップダウン選択**: `workflowConfig.stateAnnotation.name` から自動取得
- **バリデーション**: stateAnnotation.nameと一致必須

#### 2. stateGraph.config.checkpointer.type編集

- **ドロップダウン選択肢**: `"MemorySaver"` | `"SqliteSaver"` | `"RedisSaver"`

### UI設計

**設定パネルに新規タブ追加:**

- タブ名: **"State Graph"**

```
Annotation Reference:
[InterruptWorkflowState ▼]  ← stateAnnotation.nameから自動取得

Checkpointer Type:
[MemorySaver ▼]
Options: MemorySaver, SqliteSaver, RedisSaver
```

### ファイル構成

#### 新規ファイル

```
webview-ui/src/workflow-editor/settings/
└── StateGraphEditor.tsx                # StateGraph編集フォーム
```

#### 修正ファイル

1. **WorkflowSettingsPanel.tsx**
   - "State Graph" タブ追加
   - `<StateGraphEditor>` コンポーネント統合

2. **utils/validation.ts**
   - `validateStateGraph()` 関数追加
   - annotationRefとstateAnnotation.nameの一致確認

### タスクリスト

- [x] `StateGraphEditor.tsx` 作成: ドロップダウンUI
- [x] `WorkflowSettingsPanel.tsx` 修正: State Graphタブ追加
- [x] `validation.ts` 修正: `validateStateGraph()` 追加
- [x] annotationRefドロップダウン: stateAnnotation.nameから自動取得
- [x] checkpointerドロップダウン: 3つの選択肢実装
- [x] バリデーション警告表示: annotationRef不一致時
- [x] テスト: stateGraph変更の保存・読み込み確認

---

## Phase 8C: Annotationフィールド CRUD

**ステータス**: ☑ 完了
**推定時間**: 3-4日 (22-28時間)
**複雑度**: 複雑

### 実装機能

#### Annotationフィールドの構造

```json
"annotation": {
  "messages": {
    "type": "string[]",
    "reducer": "(x, y) => x.concat(y)",
    "default": []
  },
  "userApproval": {
    "type": "boolean | null",
    "reducer": "(x, y) => y !== undefined ? y : x",
    "default": null
  }
}
```

#### CRUD操作

1. **フィールド追加**: モーダルダイアログでフィールド作成
2. **フィールド編集**: 既存フィールドの値を変更
3. **フィールド削除**: 確認ダイアログ後に削除

### UI設計

**設定パネルに新規タブ追加:**

- タブ名: **"Annotation"**

```
┌──────────────────────────────────────────────┐
│ Field Name    | Type        | Default        │
├──────────────────────────────────────────────┤
│ messages      | string[]    | []        [✏️][🗑️]│
│ userApproval  | boolean|null| null      [✏️][🗑️]│
│ draftStep     | number      | 1         [✏️][🗑️]│
└──────────────────────────────────────────────┘
[+ フィールド追加]
```

**モーダルフォーム（追加/編集）:**

```
┌─────────────────────────────────────┐
│ Annotationフィールド編集            │
├─────────────────────────────────────┤
│ Field Name: [____________]          │
│             ℹ️ 有効なJS識別子が必要 │
│                                     │
│ Type:       [____________]          │
│             (例: string, number)    │
│                                     │
│ Reducer:    (任意)                  │
│             ┌───────────────────┐   │
│             │ (x, y) => ...     │   │
│             │                   │   │
│             └───────────────────┘   │
│                                     │
│ Default:    [____________]          │
│             (JSON値)                │
│                                     │
│          [キャンセル]  [保存]       │
└─────────────────────────────────────┘
```

### ファイル構成

#### 新規ファイル

```
webview-ui/src/workflow-editor/settings/
├── AnnotationFieldsEditor.tsx          # テーブルビュー + CRUD操作
└── AnnotationFieldForm.tsx             # モーダルフォーム（追加/編集用）
```

#### 修正ファイル

1. **WorkflowSettingsPanel.tsx**
   - "Annotation" タブ追加
   - `<AnnotationFieldsEditor>` 統合

2. **utils/validation.ts**
   - `validateFieldName()` 追加: JS識別子バリデーション
   - `isReservedKeyword()` 追加: 予約語チェック

### バリデーションロジック

**フィールド名バリデーション:**

```typescript
validateFieldName(fieldName: string, existingFields: Record<string, any>, excludeField?: string): ValidationResult
  - 空文字チェック
  - JS識別子正規表現: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
  - 予約語チェック (break, case, class, const, etc.)
  - ユニークネスチェック
  → { valid: boolean, error?: string }
```

**予約語リスト:**

```typescript
const reservedKeywords = [
  'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'export',
  'extends', 'finally', 'for', 'function', 'if', 'import',
  'in', 'instanceof', 'let', 'new', 'return', 'super',
  'switch', 'this', 'throw', 'try', 'typeof', 'var',
  'void', 'while', 'with', 'yield'
];
```

### タスクリスト

- [x] `AnnotationFieldsEditor.tsx` 作成: テーブルビュー
- [x] `AnnotationFieldForm.tsx` 作成: モーダルフォーム
- [x] `WorkflowSettingsPanel.tsx` 修正: Annotationタブ追加
- [x] `validation.ts` 修正: `validateFieldName()`, `isReservedKeyword()` 追加
- [x] CRUD操作実装: 追加、編集、削除
- [x] Reducerコードエディタ: TextArea with syntax awareness
- [x] Default値JSON解析: 型に応じた入力補助
- [x] エラー表示: インラインエラーメッセージ
- [x] テスト: フィールド追加・編集・削除の動作確認
- [x] テスト: バリデーションエラーの表示確認
- [x] テスト: 保存後のJSON構造確認

---

## 共通の技術設計

### データフロー

```
User Input (設定パネル)
    ↓
Component State (useState)
    ↓
Validation Layer
    ↓
WorkflowEditor.workflowConfig (via callback)
    ↓
setIsDirty(true)
    ↓
User clicks Save (Ctrl+S)
    ↓
flowToJson(nodes, edges, workflowConfig)
    ↓
vscode.postMessage({ command: 'save', data, filePath })
    ↓
Extension saves to file
```

### 状態管理パターン

**WorkflowEditor.tsx:**

```typescript
const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
const [showSettings, setShowSettings] = useState(false);

const handleUpdateWorkflowConfig = useCallback((updates: Partial<WorkflowConfig>) => {
  setWorkflowConfig(prev => ({ ...prev!, ...updates }));
  setIsDirty(true);
}, []);
```

**WorkflowSettingsPanel.tsx:**

```typescript
interface Props {
  show: boolean;
  workflowConfig: WorkflowConfig;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  onClose: () => void;
  onUpdateConfig: (updates: Partial<WorkflowConfig>) => void;
  onUpdateNodes: (nodes: ReactFlowNode[]) => void;
  onUpdateEdges: (edges: ReactFlowEdge[]) => void;
}
```

### VSCodeテーマスタイリング

```typescript
const panelStyle = {
  background: 'var(--vscode-sideBar-background)',
  border: '1px solid var(--vscode-sideBar-border)',
  color: 'var(--vscode-sideBar-foreground)',
};

const inputStyle = {
  background: 'var(--vscode-input-background)',
  color: 'var(--vscode-input-foreground)',
  border: '1px solid var(--vscode-input-border)',
};
```

---

## テスト計画

### Phase 8A テスト

- [x] ノード名変更後、キャンバス上で即座に反映される
- [x] エッジのsource/targetが正しく更新される
- [x] 重複名入力時、エラー表示される
- [x] 予約語入力時、エラー表示される
- [x] Config値が保存・読み込みできる
- [x] StateAnnotation.nameが保存・読み込みできる

### Phase 8B テスト

- [ ] annotationRefドロップダウンに正しい値が表示される
- [ ] checkpointer.typeドロップダウンに3つの選択肢が表示される
- [ ] annotationRef不一致時、警告表示される
- [ ] StateGraph変更が保存・読み込みできる

### Phase 8C テスト

- [ ] 新しいフィールドを追加できる
- [ ] フィールド名が無効な場合、エラー表示される
- [ ] 予約語使用時、エラー表示される
- [ ] 重複名使用時、エラー表示される
- [ ] 既存フィールドを編集できる
- [ ] フィールドを削除できる
- [ ] すべての変更が保存・読み込みできる

---

## 成功基準

### Phase 8A ☑

- ✓ ノード名を設定パネルで編集できる
- ✓ ノード名をノードヘッダーでダブルクリック編集できる
- ✓ 重複名、予約語がバリデーションで防止される
- ✓ ノード名変更時にエッジが自動更新される
- ✓ Config値を編集できる
- ✓ StateAnnotation名を編集できる

### Phase 8B

- ✓ StateGraph.annotationRefをドロップダウンで選択できる
- ✓ StateGraph.checkpointer.typeをドロップダウンで選択できる
- ✓ annotationRef不一致時に警告表示される

### Phase 8C

- ✓ Annotationフィールドをテーブルビューで一覧表示できる
- ✓ 新しいフィールドを追加できる
- ✓ 既存フィールドを編集できる
- ✓ フィールドを削除できる
- ✓ 適切なバリデーションが機能する

---

## 実装順序の推奨

1. **Phase 8A** から開始（最も簡単、基礎を構築）
2. **Phase 8B** を実装（Phase 8Aの構造を再利用）
3. **Phase 8C** を最後に実装（最も複雑）

---

## 次のフェーズ

Phase 8完了後、ワークフローエディタは完全な機能を持ちます:

- ノード/エッジのビジュアル編集 ✓ (Phase 1-7)
- Implementationコードの編集 ✓ (Phase 4-5)
- ワークフロー設定の編集 ✓ (Phase 8)

---

## 参考資料

- [test.json](../../json/test.json) - テスト用ワークフローデータ
- [WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx)
- [workflow.types.ts](../../webview-ui/src/workflow-editor/types/workflow.types.ts)
