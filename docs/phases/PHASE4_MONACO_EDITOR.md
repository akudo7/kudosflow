# Phase 4: Implementation表示機能

**ステータス**: ☑ 完了

**目標**: ノード内にImplementationコードを表示する（編集機能はPhase 5で実装）

**注**: 当初はMonaco Editorの統合を計画していましたが、VSCode webview環境でのworker読み込み制約により、Phase 4ではシンプルな`<pre>`タグでの読み取り専用表示を実装しました。編集機能はPhase 5で別途実装します。

## タスク

- [x] `WorkflowNode.tsx`作成（カスタムノードコンポーネント）
  - [x] ノード基本UI（タイトル、ハンドル）
  - [x] Implementationコードの表示（`<pre>`タグ）
  - [x] ノードの展開/折りたたみ機能
  - [x] パラメータ/出力の表示
- [x] `WorkflowEditor.tsx`でカスタムノードタイプを登録
- [x] スタイリング（ダークテーマ、モノスペースフォント）
- [x] ビルド & テスト: ノードを展開してImplementationコードが表示される

## 成功基準

- ノードの「展開」ボタンをクリックすると詳細が表示される
- Parametersがフォーマットされて表示される
- Outputがフォーマットされて表示される
- Implementationコードが読みやすく表示される（改行、インデント保持）
- ダークテーマで統一されたUIになっている

## 実装の詳細

### 最終実装: シンプルな`<pre>`表示

VSCode webview環境でのMonaco Editorのworker制約を考慮し、Phase 4ではシンプルで確実に動作する`<pre>`タグでの表示を実装しました。

```typescript
import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';

export const WorkflowNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div
      style={{
        padding: '12px',
        border: '2px solid #555',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        minWidth: isExpanded ? '600px' : '220px',
        minHeight: isExpanded ? '400px' : '80px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        color: '#fff',
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '14px', color: '#4a9eff' }}>
          {nodeData.label}
        </strong>
        <button onClick={toggleExpand}>
          {isExpanded ? '折りたたむ' : '展開'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '10px' }}>
          {/* Parameters */}
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
              Parameters:
            </strong>
            <pre style={{ fontSize: '10px', background: '#1a1a1a', padding: '8px' }}>
              {JSON.stringify(nodeData.parameters, null, 2)}
            </pre>
          </div>

          {/* Output */}
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
              Output:
            </strong>
            <pre style={{ fontSize: '10px', background: '#1a1a1a', padding: '8px' }}>
              {JSON.stringify(nodeData.output, null, 2)}
            </pre>
          </div>

          {/* Implementation */}
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
              Implementation:
            </strong>
            <pre
              style={{
                fontSize: '10px',
                background: '#1a1a1a',
                padding: '8px',
                borderRadius: '4px',
                overflowX: 'auto',
                overflowY: 'auto',
                margin: '4px 0',
                color: '#d8dee9',
                maxHeight: '300px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {nodeData.implementation || '// No implementation'}
            </pre>
          </div>
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
# webviewをビルド
cd webview-ui
yarn build

# 拡張機能をコンパイル
cd ..
yarn compile
```

## Monaco Editorについて

当初、Phase 4ではMonaco Editorの統合を計画していましたが、VSCode webview環境での以下の制約により、シンプルな`<pre>`タグでの表示を採用しました：

### 発生した問題

1. **Worker読み込みエラー**
   - Monaco EditorはWeb Workerを使用してシンタックスハイライトを実現
   - VSCode webview環境ではworkerの外部ファイル読み込みに制限がある
   - インラインWorkerでも完全に解決できず

2. **Content Security Policy (CSP) の制約**
   - `worker-src blob:` を追加してもローディングが完了しない
   - `connect-src` の設定でもリソース取得が失敗

3. **複雑性の増加**
   - Monaco Editorのセットアップが複雑
   - バンドルサイズが大幅に増加（900KB超）
   - トラブルシューティングが困難

### 採用した解決策

**シンプルな`<pre>`タグでの表示**

- ParametersやOutputと同じスタイル
- VSCode webview環境で確実に動作
- 軽量（バンドルサイズ削減）
- 実装がシンプルで保守性が高い
- **編集機能はPhase 5で別途実装**

### CSP設定の改善

Monaco Editorは使用しないものの、将来のために以下のCSP設定を追加しました：

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none';
           style-src ${webview.cspSource} 'nonce-${nonce}';
           font-src ${webview.cspSource};
           script-src 'nonce-${nonce}';
           worker-src blob:;
           child-src blob:;
           connect-src ${webview.cspSource} https:;">
```

## 次のフェーズ

Phase 4が完了したら、[Phase 5: Implementation編集機能](PHASE5_EDITABLE_IMPLEMENTATION.md)に進んでください。

Phase 5では、シンプルなTextAreaを使用した編集機能を実装します。
