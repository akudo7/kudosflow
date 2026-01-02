# JSON Schema Refactoring: a2aClients → a2aServers, function → handler, implementation → function

**Status**: Planning Phase
**Date**: 2026-01-02
**Breaking Change**: Yes (Major Version Bump Required)

---

## 📋 Table of Contents

1. [概要 (Overview)](#概要-overview)
2. [変更理由 (Rationale)](#変更理由-rationale)
3. [プロパティマッピング (Property Mapping)](#プロパティマッピング-property-mapping)
4. [実装フェーズ (Implementation Phases)](#実装フェーズ-implementation-phases)
5. [移行ガイド (Migration Guide)](#移行ガイド-migration-guide)
6. [FAQ](#faq)

---

## 概要 (Overview)

本リファクタリングでは、ワークフローシステムで使用されるJSONスキーマの重要なプロパティ名を変更します。

### 変更内容

1. **`a2aClients` → `a2aServers`**
   - スコープ: トップレベルのワークフロー設定
   - 理由: これらのエンティティはクライアントではなく、接続先のサーバーを表すため、より正確な命名に変更

2. **`function` → `handler` (親オブジェクト) および `implementation` → `function` (プロパティ)**
   - スコープ: ノード関数および条件付きエッジ関数
   - 変更: `node.function.implementation` → `node.handler.function`
   - 変更: `edge.condition.function.implementation` → `edge.condition.handler.function`
   - 理由:
     - `function` はJavaScriptの予約語であり、親オブジェクト名として不適切
     - `handler` はNode.jsエコシステムで一般的な用語
     - `handler.function` の組み合わせが自然で理解しやすい

---

## 変更理由 (Rationale)

### a2aClients → a2aServers

現在の命名 `a2aClients` は誤解を招きます:

- **現状**: このオブジェクトは、ワークフローエンジンが接続する**リモートA2Aサーバー**の設定を保持
- **問題**: "clients" という名前は、これらが接続先のサーバーであることを明確に示していない
- **解決**: `a2aServers` に変更することで、これらが接続先のサーバー設定であることを明確化

**技術的詳細**:
- これらの設定は `A2AClient.fromCardUrl()` を使用してクライアントインスタンスを作成するために使用される
- しかし、設定自体はサーバーのエンドポイント情報を含むため、`a2aServers` がより適切

### function → handler, implementation → function

現在の命名 `function.implementation` には複数の問題があります:

**問題点**:
1. 親オブジェクト名が `function` (JavaScriptの予約語) である
2. オブジェクト指向の観点から不自然な命名
3. TypeScript型名 `NodeFunction` とJSON内プロパティ名の不一致

**解決策**:
- 親オブジェクトを `handler` に変更
- `implementation` を `function` に変更

**最終的な構造**:
- `node.handler.function` - ノードのハンドラー関数コード
- `edge.condition.handler.function` - 条件付きエッジのハンドラー関数コード

**代替案の検討**:
| 案 | 利点 | 欠点 | 評価 |
|----|------|------|------|
| `handler.function` | Node.jsで一般的、短くて明確 | TypeScript型名との乖離 | ⭐⭐⭐⭐⭐ **採用** |
| `executor.function` | ワークフローエンジンに適合 | やや長い | ⭐⭐⭐⭐ |
| `handler.function` | TypeScript型名と整合 | 長い、冗長 | ⭐⭐⭐ |
| `action.function` | Redux等で一般的 | 混乱の可能性 | ⭐⭐⭐ |
| `func.function` | 短い | 省略形は可読性低下 | ⭐⭐ |

**選択理由**:
- `handler` はNode.js/イベント駆動プログラミングで広く使用される用語
- `handler.function` という組み合わせが自然で直感的
- JavaScriptの予約語ではない
- 短くて覚えやすい

---

## 影響範囲 (Impact Scope)

### システムレイヤー

1. **SceneGraphManager** (外部依存)
   - 型定義: `a2a.ts`, `index.ts`
   - 実装: `workflow.ts` (5箇所の変更)

2. **VSCode Extension**
   - 型定義: `workflow.types.ts`
   - コンバーター: `jsonToFlow.ts`, `flowToJson.ts`
   - UI コンポーネント: ノードエディター、設定パネル

3. **JSON ワークフローファイル**
   - 6ファイル (model.json, interrupt.json, a2a/client.json, a2a/servers/*.json)

### 破壊的変更 (Breaking Changes)

⚠️ **既存のワークフローファイルは互換性がありません**

以下の操作は失敗します:
- 古いスキーマのワークフローファイルの読み込み
- 古いスキーマを期待するコードでの実行
- SceneGraphManagerとVSCode Extensionのバージョン不一致

---

## プロパティマッピング (Property Mapping)

| 旧プロパティ | 新プロパティ | 場所 | 型 |
|------------|------------|------|-----|
| `a2aClients` | `a2aServers` | Top-level `WorkflowConfig` | `Record<string, A2AServerConfig>` |
| `node.function` | `node.handler` | `WorkflowNode` (親オブジェクト) | `NodeFunction` |
| `node.function.implementation` | `node.handler.function` | `WorkflowNode.handler` | `string` |
| `condition.function` | `condition.handler` | `ConditionalEdgeCondition` (親オブジェクト) | `ConditionalEdgeFunction` |
| `condition.function.implementation` | `condition.handler.function` | `ConditionalEdgeCondition.handler` | `string` |
| `A2AClientConfig` (型名) | `A2AServerConfig` | Type definition | Interface |
| `A2AClientsConfig` (型名) | `A2AServersConfig` | Type alias | Type |

**重要**: TypeScript型名 `NodeFunction` と `ConditionalEdgeFunction` は変更されません。JSON内のプロパティ名のみが `handler` に変更されます。

---

## 実装フェーズ (Implementation Phases)

リファクタリングは以下の順序で実施します:

### Phase 1: SceneGraphManager Updates
**詳細**: [phase1-scenegraphmanager.md](./a2aservers-handler/phase1-scenegraphmanager.md)

- 型定義の更新 (`a2a.ts`, `index.ts`)
- `workflow.ts` の実装変更
- ビルドとテスト

**所要時間目安**: 2-3時間

---

### Phase 2: VSCode Extension Updates
**詳細**: [phase2-vscode-extension.md](./a2aservers-handler/phase2-vscode-extension.md)

- TypeScript型定義の更新 (`workflow.types.ts`)
- コンバーターの変更 (`jsonToFlow.ts`, `flowToJson.ts`)
- UIコンポーネントの更新
- ビルドとテスト

**所要時間目安**: 3-4時間

---

### Phase 3: JSON Workflow File Updates
**詳細**: [phase3-json-files.md](./a2aservers-handler/phase3-json-files.md)

- 6つのJSONファイルの更新
- 自動移行スクリプトの実行
- バリデーションとテスト

**所要時間目安**: 1-2時間

---

### Phase 4: Documentation Updates
**詳細**: 本ドキュメント

- ARCHITECTURE.md の更新
- IMPLEMENTATION_PLAN.md の更新
- CLAUDE.md の更新

**所要時間目安**: 1時間

---

### Phase 5: Testing and Validation
**詳細**: 各フェーズドキュメント内

- 統合テスト
- E2Eテスト
- パフォーマンステスト

**所要時間目安**: 2-3時間

---

**総所要時間目安**: 9-13時間

---

## 移行ガイド (Migration Guide)

### 既存ワークフローファイルの更新

#### ステップ 1: a2aClients の置換

```json
// 変更前
{
  "config": { ... },
  "a2aClients": {
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json",
      "timeout": 30000
    }
  }
}

// 変更後
{
  "config": { ... },
  "a2aServers": {
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json",
      "timeout": 30000
    }
  }
}
```

#### ステップ 2: 全ノードの function → handler および implementation → function 置換

```json
// 変更前
{
  "nodes": [
    {
      "id": "askName",
      "function": {
        "parameters": [
          { "name": "state", "type": "State" }
        ],
        "implementation": "const userInput = interrupt('What is your name?');\nif (!userInput) {\n  throw new Error('No name provided');\n}\nreturn { name: userInput };"
      }
    }
  ]
}

// 変更後
{
  "nodes": [
    {
      "id": "askName",
      "handler": {  // 'function' から 'handler' に変更
        "parameters": [
          { "name": "state", "type": "State" }
        ],
        "function": "const userInput = interrupt('What is your name?');\nif (!userInput) {\n  throw new Error('No name provided');\n}\nreturn { name: userInput };"  // 'implementation' から 'function' に変更
      }
    }
  ]
}
```

#### ステップ 3: 条件付きエッジの function → handler および implementation → function 置換

```json
// 変更前
{
  "edges": [
    {
      "from": "orchestrator",
      "type": "conditional",
      "condition": {
        "name": "route_phase",
        "function": {
          "parameters": [
            { "name": "state", "type": "State" }
          ],
          "implementation": "if (state.currentPhase === 1) {\n  return Send('approval_gate_phase_1');\n}"
        }
      }
    }
  ]
}

// 変更後
{
  "edges": [
    {
      "from": "orchestrator",
      "type": "conditional",
      "condition": {
        "name": "route_phase",
        "handler": {  // 'function' から 'handler' に変更
          "parameters": [
            { "name": "state", "type": "State" }
          ],
          "function": "if (state.currentPhase === 1) {\n  return Send('approval_gate_phase_1');\n}"  // 'implementation' から 'function' に変更
        }
      }
    }
  ]
}
```

### 自動移行スクリプト (推奨)

以下のNode.jsスクリプトで一括変換可能:

```javascript
const fs = require('fs');
const path = require('path');

function migrateWorkflowFile(filePath) {
  console.log(`Migrating: ${filePath}`);

  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  let json = JSON.parse(content);

  // 1. Rename a2aClients → a2aServers
  if (json.a2aClients) {
    json.a2aServers = json.a2aClients;
    delete json.a2aClients;
  }

  // 2. Rename function → handler and implementation → function in nodes
  if (json.nodes) {
    json.nodes.forEach(node => {
      if (node.function) {
        // Rename parent object: function → handler
        node.handler = node.function;
        delete node.function;

        // Rename child property: implementation → function
        if (node.handler.implementation !== undefined) {
          node.handler.function = node.handler.implementation;
          delete node.handler.implementation;
        }
      }
    });
  }

  // 3. Rename function → handler and implementation → function in conditional edges
  if (json.edges) {
    json.edges.forEach(edge => {
      if (edge.condition?.function) {
        // Rename parent object: function → handler
        edge.condition.handler = edge.condition.function;
        delete edge.condition.function;

        // Rename child property: implementation → function
        if (edge.condition.handler.implementation !== undefined) {
          edge.condition.handler.function = edge.condition.handler.implementation;
          delete edge.condition.handler.implementation;
        }
      }
    });
  }

  // Write back with formatting
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log(`✅ Migrated: ${filePath}`);
}

// Migrate all JSON files
const jsonDir = path.join(__dirname, '../json');
const files = [
  'model.json',
  'interrupt.json',
  'a2a/client.json',
  'a2a/servers/task-creation.json',
  'a2a/servers/research-execution.json',
  'a2a/servers/quality-evaluation.json'
];

files.forEach(file => {
  const filePath = path.join(jsonDir, file);
  if (fs.existsSync(filePath)) {
    migrateWorkflowFile(filePath);
  } else {
    console.warn(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✅ Migration complete!');
```

### 手動移行手順

自動スクリプトを使用しない場合:

1. **バックアップ作成**: 全JSONファイルのバックアップを作成
2. **検索置換 1**: `"a2aClients":` → `"a2aServers":`
3. **検索置換 2**: ノード配列内の `"function": {` → `"handler": {`
4. **検索置換 3**: `handler` オブジェクト内の `"implementation":` → `"function":`
5. **検索置換 4**: エッジ配列の condition 内の `"function": {` → `"handler": {`
6. **検索置換 5**: condition.handler 内の `"implementation":` → `"function":`
7. **検証**: 各ファイルが有効なJSONであることを確認
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('path/to/file.json'))"
   ```

**重要**: 順序を守ってください。親オブジェクト(`function` → `handler`)を先に変更してから、子プロパティ(`implementation` → `function`)を変更することで混乱を避けられます。

---

## コード例 (Code Examples)

### 例1: シンプルなワークフロー (model.json)

**変更前**:
```json
{
  "config": {
    "recursionLimit": 100
  },
  "stateAnnotation": {
    "name": "State",
    "type": "Annotation.Root"
  },
  "nodes": [
    {
      "id": "askName",
      "function": {
        "parameters": [
          { "name": "state", "type": "State" }
        ],
        "implementation": "const userInput = interrupt('What is your name?');\nreturn { name: userInput };"
      }
    }
  ]
}
```

**変更後**:
```json
{
  "config": {
    "recursionLimit": 100
  },
  "stateAnnotation": {
    "name": "State",
    "type": "Annotation.Root"
  },
  "nodes": [
    {
      "id": "askName",
      "handler": {  // 変更: function → handler
        "parameters": [
          { "name": "state", "type": "State" }
        ],
        "function": "const userInput = interrupt('What is your name?');\nreturn { name: userInput };"  // 変更: implementation → function
      }
    }
  ]
}
```

### 例2: A2Aクライアント設定 (a2a/client.json)

**変更前**:
```json
{
  "config": {
    "recursionLimit": 100
  },
  "a2aClients": {
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json",
      "timeout": 30000
    },
    "research_agent": {
      "cardUrl": "http://localhost:3002/.well-known/agent.json",
      "timeout": 30000
    }
  },
  "models": [
    {
      "id": "mainModel",
      "type": "OpenAI",
      "config": { "model": "gpt-4" },
      "bindA2AClients": true
    }
  ],
  "nodes": [
    {
      "id": "orchestrator",
      "function": {
        "parameters": [
          { "name": "state", "type": "State" },
          { "name": "model", "type": "Model", "modelRef": "mainModel" }
        ],
        "implementation": "const response = await model.invoke(state.messages);\nreturn { messages: state.messages.concat(response) };"
      }
    },
    {
      "id": "tools",
      "type": "ToolNode",
      "useA2AClients": true
    }
  ]
}
```

**変更後**:
```json
{
  "config": {
    "recursionLimit": 100
  },
  "a2aServers": {  // 変更: a2aClients → a2aServers
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json",
      "timeout": 30000
    },
    "research_agent": {
      "cardUrl": "http://localhost:3002/.well-known/agent.json",
      "timeout": 30000
    }
  },
  "models": [
    {
      "id": "mainModel",
      "type": "OpenAI",
      "config": { "model": "gpt-4" },
      "bindA2AClients": true
    }
  ],
  "nodes": [
    {
      "id": "orchestrator",
      "handler": {  // 変更: function → handler
        "parameters": [
          { "name": "state", "type": "State" },
          { "name": "model", "type": "Model", "modelRef": "mainModel" }
        ],
        "function": "const response = await model.invoke(state.messages);\nreturn { messages: state.messages.concat(response) };"  // 変更: implementation → function
      }
    },
    {
      "id": "tools",
      "type": "ToolNode",
      "useA2AClients": true
    }
  ]
}
```

### 例3: 条件付きエッジ

**変更前**:
```json
{
  "edges": [
    {
      "from": "orchestrator",
      "type": "conditional",
      "condition": {
        "name": "route_decision",
        "function": {
          "parameters": [
            { "name": "state", "type": "State" }
          ],
          "implementation": "const lastMessage = state.messages[state.messages.length - 1];\nif (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {\n  return Send('tools');\n} else {\n  return Send('__end__');\n}"
        }
      }
    }
  ]
}
```

**変更後**:
```json
{
  "edges": [
    {
      "from": "orchestrator",
      "type": "conditional",
      "condition": {
        "name": "route_decision",
        "handler": {  // 変更: function → handler
          "parameters": [
            { "name": "state", "type": "State" }
          ],
          "function": "const lastMessage = state.messages[state.messages.length - 1];\nif (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {\n  return Send('tools');\n} else {\n  return Send('__end__');\n}"  // 変更: implementation → function
        }
      }
    }
  ]
}
```

---

## 影響を受けるファイル (Affected Files)

### SceneGraphManager (外部リポジトリ)

```
/Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager/
├── src/
│   ├── types/
│   │   ├── a2a.ts                    [型定義変更: A2AWorkflowConfig]
│   │   └── index.ts                  [型定義変更: NodeFunction, ConditionalEdgeFunction]
│   └── lib/
│       └── workflow.ts               [実装変更: 5箇所]
```

**変更箇所**:
- `A2AWorkflowConfig` インターフェース
- `NodeFunction` インターフェース
- `ConditionalEdgeFunction` インターフェース
- `WorkflowEngine.initializeA2AClients()` → `initializeA2AServers()`
- 動的関数生成ロジック (2箇所)

### VSCode Extension

```
/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/
├── webview-ui/src/workflow-editor/
│   ├── types/
│   │   └── workflow.types.ts        [型定義変更: 4インターフェース]
│   ├── converters/
│   │   ├── jsonToFlow.ts            [変換ロジック変更: 2箇所]
│   │   └── flowToJson.ts            [変換ロジック変更: 2箇所]
│   └── components/
│       └── (要調査: ノードエディター、設定パネル)
```

**変更箇所**:
- `WorkflowConfig`, `A2AClientConfig`, `WorkflowNode`, `ConditionalEdgeCondition`, `CustomNodeData` インターフェース
- `jsonToFlow()` 関数
- `flowToJson()` 関数
- UI コンポーネント (要検索)

### JSON ワークフローファイル (6ファイル)

```
/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/
├── model.json                       [4ノード: implementation変更]
├── interrupt.json                   [3ノード: implementation変更]
└── a2a/
    ├── client.json                  [a2aClients変更 + 複数ノード/エッジ]
    └── servers/
        ├── task-creation.json       [1ノード: implementation変更]
        ├── research-execution.json  [1ノード: implementation変更]
        └── quality-evaluation.json  [1ノード: implementation変更]
```

**統計**:
- 合計ノード数: ~15ノード
- 合計条件付きエッジ数: ~10エッジ
- a2aClients設定: 1ファイル

---

## テスト計画 (Testing Plan)

### 単体テスト

- [ ] SceneGraphManagerの型定義が正しくエクスポートされる
- [ ] VSCode Extensionの型定義がSceneGraphManagerと一致
- [ ] `jsonToFlow()` が新しいスキーマを正しく変換
- [ ] `flowToJson()` が新しいスキーマを正しく出力

### 統合テスト

- [ ] 各JSONファイルが正常に読み込まれる
- [ ] ノードがReact Flowキャンバスに正しく表示される
- [ ] ノードエディターで `function` プロパティが編集可能
- [ ] 保存時に新しいスキーマで出力される
- [ ] 条件付きエッジが正しく評価される

### 実行テスト

- [ ] `model.json` のワークフローが正常実行される
- [ ] `interrupt.json` のワークフローが正常実行される
- [ ] `a2a/client.json` のA2Aサーバー接続が成功
- [ ] 各A2Aサーバー (task-creation, research-execution, quality-evaluation) が起動
- [ ] オーケストレーターがA2Aサーバーと通信できる

### エッジケーステスト

- [ ] `function` プロパティが空文字列の場合
- [ ] `a2aServers` が空オブジェクトの場合
- [ ] 条件付きエッジの `function` が構文エラーを含む場合
- [ ] 古いスキーマのファイルを読み込んだ場合 (エラー表示の確認)

---

## ロールバックプラン (Rollback Plan)

万が一、問題が発生した場合:

### 即座のロールバック手順

1. **Gitリバート**: すべてのコミットをリバート
   ```bash
   git revert <commit-hash>
   ```

2. **SceneGraphManagerのバージョン固定**: `package.json` で古いバージョンを指定
   ```json
   {
     "dependencies": {
       "@kudos/scene-graph-manager": "1.x.x"
     }
   }
   ```

3. **JSONファイルのバックアップから復元**

### 部分的ロールバック

問題が特定のレイヤーに限定される場合:

- **VSCode Extensionのみ**: Extension側の変更をリバート、SceneGraphManagerは維持
- **JSONファイルのみ**: 移行スクリプトを逆方向で実行

---

## バージョニング戦略 (Versioning Strategy)

### セマンティックバージョニング

この変更は**破壊的変更**であるため、メジャーバージョンを上げる必要があります:

- **SceneGraphManager**: `1.x.x` → `2.0.0`
- **VSCode Extension**: `0.x.x` → `1.0.0` (初回リリースの場合)

### 互換性マトリックス

| SceneGraphManager | VSCode Extension | 互換性 |
|-------------------|------------------|-------|
| 1.x.x | 0.x.x (旧スキーマ) | ✅ 互換 |
| 2.0.0+ | 1.0.0+ (新スキーマ) | ✅ 互換 |
| 1.x.x | 1.0.0+ | ❌ 非互換 |
| 2.0.0+ | 0.x.x | ❌ 非互換 |

### リリースノート (推奨内容)

```markdown
## [2.0.0] - 2026-01-XX

### 💥 BREAKING CHANGES

- Renamed `a2aClients` to `a2aServers` in workflow configuration
- Renamed `function.implementation` to `function.function` for all node and edge functions
- Old workflow JSON files are not compatible and must be migrated

### Migration Guide

See [docs/refactoring/json-schema-refactoring-a2aservers-function.md] for detailed migration instructions.

### 🔧 Changed

- Updated SceneGraphManager types and implementation
- Updated VSCode Extension converters and type definitions
- Migrated all 6 JSON workflow files to new schema

### 📝 Documentation

- Added comprehensive refactoring documentation
- Updated ARCHITECTURE.md and IMPLEMENTATION_PLAN.md
```

---

## FAQ

### Q1: 古いワークフローファイルは動作しますか？

**A**: いいえ。この変更は破壊的変更です。既存のワークフローファイルは移行が必要です。

### Q2: 移行スクリプトは安全ですか？

**A**: はい。スクリプトはJSONの構造を解析し、必要な変更のみを適用します。ただし、実行前にバックアップを作成することを強く推奨します。

### Q3: なぜ `handler.function` という命名にしたのですか？

**A**: 当初 `function.function` が検討されましたが、重複と混乱を避けるため、親オブジェクトを `handler` に変更しました。これにより:
- JavaScriptの予約語 `function` との衝突を回避
- TypeScript型名 `NodeFunction` との整合性を維持
- より明確で理解しやすい構造を実現

代替案として `code`, `handler`, `body` も検討されましたが、型名との整合性と明確性から `handler.function` が選択されました。

### Q4: SceneGraphManagerを更新しなくてもVSCode Extensionだけ更新できますか？

**A**: いいえ。SceneGraphManagerが基盤となる型定義と実行ロジックを提供しているため、SceneGraphManagerを先に更新する必要があります。

### Q5: この変更はパフォーマンスに影響しますか？

**A**: いいえ。これはプロパティ名の変更のみであり、実行時のパフォーマンスに影響はありません。

---

## チェックリスト (Implementation Checklist)

### Phase 1: SceneGraphManager ✅ **完了 (2026-01-02)**

- [x] `a2a.ts`: `A2AWorkflowConfig` インターフェース更新
- [x] `a2a.ts`: 型エイリアス `A2AClientsConfig` → `A2AServersConfig` 変更
- [x] `a2a.ts`: `A2AClientConfig` → `A2AServerConfig` インターフェース名変更
- [x] `index.ts`: `NodeFunction.implementation` → `NodeFunction.function` 変更
- [x] `index.ts`: `ConditionalEdgeFunction.implementation` → `ConditionalEdgeFunction.function` 変更
- [x] `workflow.ts`: `initializeA2AClients()` → `initializeA2AServers()` 変更
- [x] `workflow.ts`: 3箇所の `this.config.a2aClients` → `this.config.a2aServers` 変更
- [x] `workflow.ts`: 2箇所の `funcDef.implementation` → `funcDef.function` 変更
- [x] `a2a/types/index.ts`: エクスポート型名の更新
- [x] `src/index.ts`: エクスポート型名の更新
- [x] SceneGraphManagerのビルド成功

**注意**: 型定義は `implementation` → `function` に変更されましたが、JSONスキーマでは親オブジェクト名が `function` → `handler` に変更されます（Phase 2以降で対応）。

### Phase 2: VSCode Extension - Type Definitions ✅ **完了 (2026-01-02)**

- [x] `workflow.types.ts`: `A2AClientConfig` → `A2AServerConfig` 変更
- [x] `workflow.types.ts`: `WorkflowConfig.a2aClients` → `a2aServers` 変更
- [x] `workflow.types.ts`: `WorkflowNode.function` → `WorkflowNode.handler` (親オブジェクト) 変更
- [x] `workflow.types.ts`: `WorkflowNode.handler.implementation` → `function` 変更
- [x] `workflow.types.ts`: `ConditionalEdgeCondition.function` → `handler` (親オブジェクト) 変更
- [x] `workflow.types.ts`: `ConditionalEdgeCondition.handler.implementation` → `function` 変更
- [x] `workflow.types.ts`: `CustomNodeData.implementation` → `function` 変更 (フラット構造維持)

### Phase 2: VSCode Extension - Converters ✅ **完了 (2026-01-02)**

- [x] `jsonToFlow.ts`: line 21 - `condition.function?.implementation` → `condition.handler?.function` 変更
- [x] `jsonToFlow.ts`: line 56-57 - `node.function?.implementation/parameters` → `node.handler?.function/parameters` 変更
- [x] `jsonToFlow.ts`: line 79-80 - `condition.function?.implementation` → `condition.handler?.function` 変更
- [x] `flowToJson.ts`: line 38-41 - `workflowNode.function` → `workflowNode.handler` 変更
- [x] `flowToJson.ts`: line 38-41 - `node.data.implementation` → `node.data.function` 変更
- [x] `flowToJson.ts`: line 77-80 - `edge.data.condition.function` → `handler` 変更
- [x] `flowToJson.ts`: line 77-80 - `implementation: ''` → `function: ''` 変更

### Phase 2: VSCode Extension - UI Components ✅ **完了 (2026-01-02)**

- [x] `NodeEditorDialog.tsx`: `implementation` → `function` 変更 (3箇所)
- [x] `ConditionalEdgeFormModal.tsx`: `implementation` → `functionCode`, `condition.function` → `condition.handler` 変更
- [x] `A2AClientEditor.tsx`: `a2aClients` → `a2aServers`, `A2AClientConfig` → `A2AServerConfig`, UIテキスト更新
- [x] `A2AClientFormModal.tsx`: `A2AClientConfig` → `A2AServerConfig` 変更
- [x] `WorkflowSettingsPanel.tsx`: タブ名 `a2aClients` → `a2aServers`, ハンドラー名更新
- [x] `WorkflowEditor.tsx`: ログメッセージ更新、条件付きエッジのデフォルトスキーマ修正
- [x] `validation.ts`: `A2AClientConfig` → `A2AServerConfig`, `client` → `server`, `condition.function` → `condition.handler` 変更
- [x] Extension のビルドとテスト成功 (TypeScript + Vite)

### Phase 3: JSON Workflow Files
- [ ] `model.json` 移行
- [ ] `interrupt.json` 移行
- [ ] `a2a/client.json` 移行
- [ ] `a2a/servers/task-creation.json` 移行
- [ ] `a2a/servers/research-execution.json` 移行
- [ ] `a2a/servers/quality-evaluation.json` 移行
- [ ] 全JSONファイルの構文検証

### Phase 4: Documentation
- [ ] このドキュメントの完成
- [ ] `IMPLEMENTATION_PLAN.md` の更新
- [ ] `ARCHITECTURE.md` の更新
- [ ] `CLAUDE.md` の更新
- [ ] Phase ドキュメントの更新 (該当する場合)

### Phase 5: Testing
- [ ] 単体テスト実行
- [ ] 統合テスト実行
- [ ] 実行テスト実行
- [ ] エッジケーステスト実行
- [ ] リリースノート作成

---

## 追加リソース (Additional Resources)

- [SceneGraphManager Repository](file:///Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager)
- [VSCode Extension Source](file:///Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest)
- [JSON Workflow Files](file:///Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json)
- [Previous Refactoring: Remove possibleTargets](file:///Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/docs/refactoring/remove-possibleTargets.md)
- [Previous Refactoring: Remove function.output](file:///Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/docs/refactoring/remove-function-output.md)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-02
**Author**: Generated by Claude Code (Planning Phase)
