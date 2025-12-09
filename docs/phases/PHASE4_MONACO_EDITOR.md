# Phase 4: Monaco Editor統合

**ステータス**: ☑ 完了

**目標**: ノード内にMonaco Editorを表示してコードを編集

## タスク

- [x] `@monaco-editor/react`をインストール
- [x] `WorkflowNode.tsx`作成（カスタムノードコンポーネント）
  - [x] ノード基本UI（タイトル、ハンドル）
  - [x] Monaco Editorコンポーネント埋め込み
  - [x] コード変更時のハンドラー
  - [x] ノードの展開/折りたたみ機能
  - [x] パラメータ/出力の表示
- [x] `WorkflowEditor.tsx`でカスタムノードタイプを登録
- [x] スタイリング（CSSまたはstyled-components）
- [x] ビルド & テスト: ノードをクリックしてコード編集できる

## 成功基準

- ノードをクリックするとMonaco Editorが表示される
- implementationコードを編集できる
- 編集内容が保存時にJSONに反映される
- TypeScript/JavaScriptのシンタックスハイライトが機能する

## 実装の詳細

### WorkflowNode.tsx

```typescript
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Editor from '@monaco-editor/react';
import { CustomNodeData } from './types/workflow.types';

export const WorkflowNode = memo(({ data, id }: NodeProps<CustomNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState(data.implementation || '');

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      data.implementation = value;
    }
  };

  return (
    <div
      style={{
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        background: 'white',
        minWidth: isExpanded ? '500px' : '200px',
        minHeight: isExpanded ? '300px' : '60px',
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{data.label}</strong>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '折りたたむ' : '展開'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '5px' }}>
            <strong>Parameters:</strong>
            <pre style={{ fontSize: '10px' }}>
              {JSON.stringify(data.parameters, null, 2)}
            </pre>
          </div>

          <div style={{ marginBottom: '5px' }}>
            <strong>Implementation:</strong>
          </div>

          <Editor
            height="200px"
            defaultLanguage="typescript"
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
```

### WorkflowEditor.tsx への追加

```typescript
import { WorkflowNode } from './WorkflowNode';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

// ReactFlowコンポーネント内
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}  // 追加
  fitView
>
```

## 実行方法

```bash
# Monaco Editorをインストール
cd webview-ui
yarn add @monaco-editor/react

# 開発サーバー起動
yarn start
```

## 次のフェーズ

Phase 4が完了したら、[Phase 5: 保存機能の完成](PHASE5_SAVE_FUNCTIONALITY.md)に進んでください。
