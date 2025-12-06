# Phase 3: JSON変換ロジック

**ステータス**: ⬜ 未開始

**目標**: WorkflowConfig ⇔ React Flow形式の相互変換

## タスク

- [ ] `converters/jsonToFlow.ts`作成
  - [ ] WorkflowConfig → React Flow nodes/edgesに変換
  - [ ] ノード位置の自動レイアウト（Dagre/ELKまたは簡易的な計算）
  - [ ] 特殊ノード（\_\_start\_\_, \_\_end\_\_）のハンドリング
  - [ ] 条件付きエッジのサポート
- [ ] `converters/flowToJson.ts`作成
  - [ ] React Flow nodes/edges → WorkflowConfigに変換
  - [ ] 元のconfig, stateAnnotation, annotationを保持
  - [ ] ノードのfunction.implementationを更新
  - [ ] エッジのfrom/toを更新
- [ ] 単体テスト作成（test.jsonで検証）
- [ ] ビルド & テスト: 往復変換でデータが保持される

## 成功基準

- test.jsonをロード → 編集 → 保存 → 再ロードでデータが正しく復元される
- ノードの追加・削除・移動が正しくJSONに反映される
- エッジの接続・切断が正しくJSONに反映される

## 実装の詳細

### jsonToFlow.ts

```typescript
import { WorkflowConfig, WorkflowNode, ReactFlowNode, ReactFlowEdge } from '../types/workflow.types';

export function jsonToFlow(config: WorkflowConfig): {
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[]
} {
  const nodes: ReactFlowNode[] = [];
  const edges: ReactFlowEdge[] = [];

  // ノード変換
  config.nodes.forEach((node, index) => {
    nodes.push({
      id: node.id,
      type: 'workflowNode', // カスタムノードタイプ
      position: {
        x: 100 + (index % 3) * 300,
        y: 100 + Math.floor(index / 3) * 200
      },
      data: {
        label: node.id,
        implementation: node.function?.implementation || '',
        parameters: node.function?.parameters || [],
        output: node.function?.output || {},
      },
    });
  });

  // 特殊ノード追加
  nodes.push({
    id: '__start__',
    type: 'input',
    position: { x: 100, y: 0 },
    data: { label: 'Start' },
  });
  nodes.push({
    id: '__end__',
    type: 'output',
    position: { x: 100, y: 600 },
    data: { label: 'End' },
  });

  // エッジ変換
  config.edges.forEach((edge, index) => {
    edges.push({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to || '',
      type: edge.type === 'conditional' ? 'smoothstep' : 'default',
    });
  });

  return { nodes, edges };
}
```

### flowToJson.ts

```typescript
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge } from '../types/workflow.types';

export function flowToJson(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  originalConfig: WorkflowConfig
): WorkflowConfig {
  const workflowNodes = nodes
    .filter(n => n.id !== '__start__' && n.id !== '__end__')
    .map(node => ({
      id: node.id,
      function: {
        parameters: node.data.parameters || [],
        output: node.data.output || {},
        implementation: node.data.implementation || '',
      },
    }));

  const workflowEdges = edges.map(edge => ({
    from: edge.source,
    to: edge.target,
    type: (edge.type === 'smoothstep' ? 'conditional' : 'normal') as 'conditional' | 'normal',
  }));

  return {
    ...originalConfig,
    nodes: workflowNodes,
    edges: workflowEdges,
  };
}
```

## テスト方法

```bash
# test.jsonをWorkflowEditorで開く
# ノードをドラッグして位置を変更
# Ctrl+Sで保存
# ファイルを閉じて再度開く
# 変更が保持されていることを確認
```

## 次のフェーズ

Phase 3が完了したら、[Phase 4: Monaco Editor統合](PHASE4_MONACO_EDITOR.md)に進んでください。
