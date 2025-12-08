# Phase 2: Webview側の基礎

**ステータス**: ☑ 完了

**目標**: React FlowでJSONのノード/エッジを表示

## タスク

- [ ] `webview-ui/src/workflow-editor/`ディレクトリ作成
- [ ] 型定義ファイル作成 (`workflow.types.ts`)
  - [ ] SceneGraphManagerの型をインポート
  - [ ] React Flow用のノード/エッジ型定義
- [ ] `WorkflowEditor.tsx`作成
  - [ ] React Flow基本セットアップ
  - [ ] VSCode APIのメッセージ受信ハンドラー
  - [ ] nodes/edges stateの管理
  - [ ] 基本的なノード表示（テキストのみ）
- [ ] `workflow-editor.html`作成（エントリポイント）
- [ ] Vite設定更新（新しいエントリポイント追加）
- [ ] ビルド & テスト: JSONのノード/エッジがReact Flowで表示される

## 成功基準

- test.jsonを開いたときに、askName, askJob, showResultノードが表示される
- エッジが正しく接続されている
- ノードをドラッグできる

## 実装の詳細

### workflow.types.ts

```typescript
import { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';

// SceneGraphManager types
export interface WorkflowConfig {
  config?: any;
  stateAnnotation: {
    name: string;
    type: "Annotation.Root";
  };
  annotation: Record<string, AnnotationField>;
  models?: ModelConfig[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stateGraph: any;
}

export interface WorkflowNode {
  id: string;
  function?: {
    parameters: Array<{ name: string; type: string; modelRef?: string }>;
    output: Record<string, string>;
    implementation: string;
  };
  ends?: string[];
}

export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: any;
}

export interface AnnotationField {
  type: string;
  reducer?: string;
  default?: any;
}

// React Flow types
export interface CustomNodeData {
  label: string;
  implementation?: string;
  parameters?: any[];
  output?: Record<string, string>;
}

export type ReactFlowNode = FlowNode<CustomNodeData>;
export type ReactFlowEdge = FlowEdge;
```

### WorkflowEditor.tsx (基本構造)

```typescript
import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge } from './types/workflow.types';
import { jsonToFlow } from './converters/jsonToFlow';
import { flowToJson } from './converters/flowToJson';

// VSCode API
declare const vscode: any;

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [filePath, setFilePath] = useState<string>('');

  // メッセージ受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'loadWorkflow':
          loadWorkflow(message.data, message.filePath);
          break;
        case 'saveSuccess':
          console.log('保存成功');
          break;
        case 'saveError':
          console.error('保存失敗:', message.error);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ command: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadWorkflow = (config: WorkflowConfig, path: string) => {
    setWorkflowConfig(config);
    setFilePath(path);
    const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);
    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleSave = () => {
    if (!workflowConfig) return;
    const updatedConfig = flowToJson(nodes, edges, workflowConfig);
    vscode.postMessage({
      command: 'save',
      data: updatedConfig,
      filePath
    });
  };

  // Ctrl+S handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, workflowConfig, filePath]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
```

## 実行方法

```bash
# Webviewの依存関係をインストール
cd webview-ui
yarn add @xyflow/react

# 開発サーバー起動
yarn start

# ビルド
yarn build
```

## 次のフェーズ

Phase 2が完了したら、[Phase 3: JSON変換ロジック](PHASE3_JSON_CONVERSION.md)に進んでください。
