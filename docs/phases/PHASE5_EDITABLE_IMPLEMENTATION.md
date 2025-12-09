# Phase 5: Implementation編集機能

**ステータス**: ☐ 未着手

**目標**: ノード内のImplementationコードを編集可能にする

## タスク

- [ ] TextAreaコンポーネントの実装
  - [ ] 複数行編集対応
  - [ ] シンタックスハイライト風のスタイリング
  - [ ] リサイズ可能な入力エリア
- [ ] リアルタイム編集機能
  - [ ] onChange ハンドラーで nodeData.implementation を更新
  - [ ] フロー状態への反映
- [ ] 編集UIの改善
  - [ ] フォントをモノスペースに変更
  - [ ] 行番号の表示（オプション）
  - [ ] Tabキーのインデント対応
- [ ] ビルド & テスト: コードを編集して保存できる

## 成功基準

- ノードを展開してImplementationエリアをクリックすると編集可能になる
- 複数行のコードを編集できる
- Tabキーで適切にインデントできる
- 編集内容がリアルタイムでノードデータに反映される
- Ctrl+Sで編集内容がJSONファイルに保存される

## 実装の詳細

### Option 1: シンプルなTextArea（推奨）

ParametersやOutputと同じスタイルを維持しつつ、編集可能にする最もシンプルなアプローチ。

```typescript
// WorkflowNode.tsx
import React, { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CustomNodeData } from './types/workflow.types';

export const WorkflowNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(nodeData.implementation || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    // リアルタイムでノードデータを更新
    nodeData.implementation = newCode;
  }, [nodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tabキーでインデント挿入
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      nodeData.implementation = newValue;
      // カーソル位置を調整
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  }, [code, nodeData]);

  return (
    <div style={{ /* 既存のスタイル */ }}>
      {/* ... 既存のコード ... */}

      {isExpanded && (
        <div style={{ marginTop: '10px' }}>
          {/* Parameters, Output sections ... */}

          {/* Implementation Section */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '12px', color: '#88c0d0' }}>
                Implementation:
              </strong>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '2px 8px',
                  background: isEditing ? '#4a9eff' : '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                {isEditing ? '✓ 完了' : '✏️ 編集'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  fontSize: '11px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  background: '#1a1a1a',
                  color: '#d8dee9',
                  border: '1px solid #4a9eff',
                  borderRadius: '4px',
                  padding: '8px',
                  margin: '4px 0',
                  resize: 'vertical',
                  lineHeight: '1.5',
                  whiteSpace: 'pre',
                  overflowWrap: 'normal',
                  overflowX: 'auto',
                }}
                spellCheck={false}
                autoComplete="off"
              />
            ) : (
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
                  cursor: 'pointer',
                }}
                onClick={() => setIsEditing(true)}
                title="クリックして編集"
              >
                {code || '// No implementation'}
              </pre>
            )}
          </div>

          {/* Ends section ... */}
        </div>
      )}
    </div>
  );
});
```

### Option 2: Monaco Editorの再導入（高機能）

VSCode webview環境の制約を解決した上で、Monaco Editorを使用する。

**前提条件**:
- Phase 4で発生したworker読み込み問題を完全に解決
- CSP設定が正しく構成されている
- Monaco Editorのリソースが正常にロードできる

```typescript
// WorkflowNode.tsx
import Editor from '@monaco-editor/react';

// 編集モードの実装
{isEditing ? (
  <div style={{ border: '1px solid #4a9eff', borderRadius: '4px' }}>
    <Editor
      height="300px"
      defaultLanguage="typescript"
      value={code}
      onChange={handleCodeChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 11,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  </div>
) : (
  <pre /* read-only display */ />
)}
```

## 推奨アプローチ

**Option 1 (TextArea)** を推奨します。理由：

1. **実装がシンプル** - Monaco Editorのworker問題を回避
2. **軽量** - バンドルサイズが小さい
3. **確実に動作** - VSCode webview環境での制約が少ない
4. **十分な機能** - コード編集に必要な基本機能を提供

Monaco Editorは将来のフェーズ（Phase 7以降）で、より安定した実装方法が確立されてから検討することを推奨します。

## 実装手順

1. **WorkflowNode.tsxを更新**
   ```bash
   # 編集モードの状態管理を追加
   # TextAreaコンポーネントの実装
   # イベントハンドラーの追加
   ```

2. **スタイリングの調整**
   ```bash
   # モノスペースフォントの適用
   # エディタ風の背景色とボーダー
   # リサイズハンドルの表示
   ```

3. **Tabキー処理の実装**
   ```bash
   # onKeyDownハンドラーでTabキーをインターセプト
   # 2スペースのインデント挿入
   # カーソル位置の調整
   ```

4. **ビルド & テスト**
   ```bash
   cd webview-ui
   yarn build
   cd ..
   yarn compile
   ```

5. **動作確認**
   - ノードを展開
   - 「編集」ボタンをクリック
   - コードを編集
   - Tabキーでインデント
   - 「完了」ボタンをクリック
   - Ctrl+Sで保存

## トラブルシューティング

### TextAreaが正しく表示されない場合
- `resize: 'vertical'` が正しく適用されているか確認
- `minHeight` を適切な値に設定

### Tabキーが動作しない場合
- `e.preventDefault()` が呼ばれているか確認
- `onKeyDown` ハンドラーが正しくバインドされているか確認

### 編集内容が保存されない場合
- `nodeData.implementation` が正しく更新されているか確認
- `flowToJson` コンバーターが implementation フィールドを正しく処理しているか確認

## 次のフェーズ

Phase 5が完了したら、[Phase 6: 保存機能の完成](PHASE6_SAVE_FUNCTIONALITY.md)に進んでください。
