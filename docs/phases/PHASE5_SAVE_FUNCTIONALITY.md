# Phase 5: 保存機能の完成

**ステータス**: ⬜ 未開始

**目標**: Ctrl+Sでの保存と確認ダイアログの実装

## タスク

- [ ] Ctrl+Sキーバインドの実装（Phase 2で基本実装済み）
- [ ] 変更検知（dirty state）の実装
  - [ ] ノード/エッジ変更時にフラグ設定
  - [ ] 保存後にフラグクリア
  - [ ] 未保存時の警告表示
- [ ] 保存ツールバーボタン追加
- [ ] 保存成功/失敗のフィードバック表示
- [ ] ビルド & テスト: 保存が正しく動作する

## 成功基準

- Ctrl+Sで確認ダイアログが表示される
- 「はい」を選択するとJSONファイルが更新される
- 保存後に成功メッセージが表示される
- 未保存の変更がある場合にインジケータが表示される

## 実装の詳細

### WorkflowToolbar.tsx

```typescript
import React from 'react';

interface Props {
  onSave: () => void;
  isDirty: boolean;
}

export const WorkflowToolbar: React.FC<Props> = ({ onSave, isDirty }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <button onClick={onSave} disabled={!isDirty}>
        💾 保存 {isDirty && '●'}
      </button>
    </div>
  );
};
```

### WorkflowEditor.tsx への追加

```typescript
const [isDirty, setIsDirty] = useState(false);

// ノード/エッジ変更時
const handleNodesChange = useCallback(
  (changes: any) => {
    onNodesChange(changes);
    setIsDirty(true);
  },
  [onNodesChange]
);

const handleEdgesChange = useCallback(
  (changes: any) => {
    onEdgesChange(changes);
    setIsDirty(true);
  },
  [onEdgesChange]
);

const handleSave = () => {
  if (!workflowConfig) return;
  const updatedConfig = flowToJson(nodes, edges, workflowConfig);
  vscode.postMessage({
    command: 'save',
    data: updatedConfig,
    filePath
  });
  setIsDirty(false);
};
```

## テスト方法

```bash
# test.jsonをWorkflowEditorで開く
# ノードを編集する
# ツールバーに「●」が表示されることを確認
# Ctrl+Sを押す
# 確認ダイアログが表示されることを確認
# 「はい」を選択
# 成功メッセージが表示されることを確認
# ツールバーの「●」が消えることを確認
```

## 次のフェーズ

Phase 5が完了したら、[Phase 6: CRUD操作](PHASE6_CRUD_OPERATIONS.md)に進んでください。
