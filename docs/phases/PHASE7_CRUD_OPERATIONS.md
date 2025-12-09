# Phase 7: CRUD操作

**ステータス**: ⬜ 未開始

**目標**: ノード/エッジの追加・削除・複製機能

## タスク

- [ ] ノード追加機能
  - [ ] 追加ボタンUI
  - [ ] 新しいノードのデフォルト値設定
  - [ ] 一意なIDの生成
- [ ] ノード削除機能
  - [ ] 選択ノードの削除
  - [ ] 接続エッジの自動削除
  - [ ] 確認ダイアログ
- [ ] ノード複製機能
  - [ ] 選択ノードのクローン
  - [ ] 新しい位置に配置
- [ ] エッジ削除機能
  - [ ] エッジ選択時の削除
- [ ] コンテキストメニュー（右クリックメニュー）
- [ ] ビルド & テスト: CRUD操作が正しく動作する

## 成功基準

- 「ノード追加」ボタンで新しいノードが作成される
- ノードを選択してDeleteキーで削除できる
- ノードを右クリックして「複製」できる
- エッジを選択してDeleteキーで削除できる

## 実装の詳細

### WorkflowToolbar.tsx への追加

```typescript
interface Props {
  onSave: () => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  isDirty: boolean;
}

export const WorkflowToolbar: React.FC<Props> = ({
  onSave,
  onAddNode,
  onDeleteSelected,
  isDirty
}) => {
  return (
    <div style={toolbarStyle}>
      <button onClick={onSave} disabled={!isDirty}>
        💾 保存 {isDirty && '●'}
      </button>
      <button onClick={onAddNode}>
        ➕ ノード追加
      </button>
      <button onClick={onDeleteSelected}>
        🗑️ 削除
      </button>
    </div>
  );
};
```

### WorkflowEditor.tsx への追加

```typescript
const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

const handleAddNode = useCallback(() => {
  const newNode: ReactFlowNode = {
    id: `node_${Date.now()}`,
    type: 'workflowNode',
    position: { x: 250, y: 250 },
    data: {
      label: '新しいノード',
      implementation: '// コードをここに書く',
      parameters: [{ name: 'state', type: 'any' }],
      output: {},
    },
  };
  setNodes((nds) => [...nds, newNode]);
  setIsDirty(true);
}, [setNodes]);

const handleDeleteSelected = useCallback(() => {
  if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

  const confirmed = window.confirm('選択したアイテムを削除しますか？');
  if (!confirmed) return;

  setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
  setEdges((eds) => eds.filter((e) => !selectedEdges.includes(e.id)));
  setSelectedNodes([]);
  setSelectedEdges([]);
  setIsDirty(true);
}, [selectedNodes, selectedEdges, setNodes, setEdges]);

const onSelectionChange = useCallback(({ nodes, edges }: any) => {
  setSelectedNodes(nodes.map((n: any) => n.id));
  setSelectedEdges(edges.map((e: any) => e.id));
}, []);

// キーボードショートカット
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDeleteSelected();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleDeleteSelected]);
```

## テスト方法

```bash
# test.jsonをWorkflowEditorで開く
# 「ノード追加」ボタンをクリック
# 新しいノードが表示されることを確認
# ノードを選択してDeleteキーを押す
# 確認ダイアログが表示され、削除されることを確認
# エッジを選択してDeleteキーを押す
# エッジが削除されることを確認
```

## 次のフェーズ

Phase 7が完了したら、全フェーズの実装が終了します。
最終的な統合テストとドキュメント更新を行ってください。
