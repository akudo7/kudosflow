# Phase 5: Implementation編集機能

**ステータス**: ☐ 未着手

**目標**: ノード内のImplementationコードを編集可能にする

## ⚠️ 重要な技術的制約

**Monaco EditorはVSCode拡張機能のWebView内では動作しません**

- **問題**: Monaco EditorはWeb Workersに依存しており、WebView内では`importScripts`がサポートされていないためエラーが発生します
- **影響**: Phase 4で試みたMonaco Editorの統合は技術的に不可能
- **対応**: 本フェーズではシンプルなTextAreaベースの実装を採用します

### VSCode WebViewで利用可能な代替案

1. **TextArea（本フェーズで採用）** - シンプルで確実に動作
2. **CodeMirror 6** - Web Workersに依存しない軽量エディタ
3. **Ace Editor** - Web Workersなしで動作
4. **VSCode標準エディタAPI** - カスタムファイルシステムスキーム経由での利用

**参考**: Monaco Editorを使用したい場合は、VSCodeの標準エディタAPIを使用し、`vscode.window.showTextDocument()`でネイティブエディタを開く方法を検討してください。

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

### Option 1: シンプルなTextArea（推奨・本フェーズで採用）

ParametersやOutputと同じスタイルを維持しつつ、編集可能にする最もシンプルなアプローチ。Monaco Editorの制約を回避し、確実に動作します。

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

### Option 2: Monaco Editorの使用（非推奨・WebView内では動作不可）

**⚠️ 注意**: このオプションはVSCode拡張機能のWebView内では**動作しません**。

**技術的な理由**:

- Monaco EditorはWeb Workersを使用してTypeScript言語サービスを実行
- WebView環境では`importScripts`がサポートされていない
- CSP（Content Security Policy）の制約により、workerの動的ロードが失敗

**代替アプローチ**:
Monaco Editorの機能が必要な場合は、WebView内での実装ではなく、以下の方法を検討してください：

1. **@codingame/monaco-vscode-api 🔥 高度な統合**
このNPMモジュールは、Monaco EditorにVS Codeの完全な機能を統合できます
インストール:

  ```bash
  npm install @codingame/monaco-vscode-api
  npm install vscode@npm:@codingame/monaco-vscode-extension-api
  npm install monaco-editor@npm:@codingame/monaco-vscode-editor-api
  ```

特徴:
VS Codeの機能をサービスとして実装し、Monaco Editorのシンプルなサービスを完全機能の代替品でオーバーライド
テーマサービス、言語サービスなどをサポート
WebWorker拡張ホストが利用可能で、Worker内で拡張機能を実行可能

2. **VSCode標準エディタAPIを使用**

   ```typescript
   // カスタムファイルシステムスキームを使用
   const uri = vscode.Uri.parse(`workflow-editor:${nodeId}.ts`);
   const document = await vscode.workspace.openTextDocument(uri);
   await vscode.window.showTextDocument(document);
   ```

3. **CodeMirror 6への移行**
   - Web Workersに依存しない
   - TypeScript構文ハイライト対応
   - WebView内で正常に動作

4. **Ace Editorの使用**
   - 軽量でWebView内で動作
   - 基本的なTypeScript構文サポート

## 推奨アプローチ

**Option 1 (TextArea)** を強く推奨します。理由：

1. **技術的制約の回避** - Monaco EditorのWebView制約問題を完全に回避
2. **実装がシンプル** - 追加の依存関係や複雑な設定が不要
3. **軽量** - バンドルサイズが小さく、起動が高速
4. **確実に動作** - VSCode webview環境での互換性問題がゼロ
5. **十分な機能** - コード編集に必要な基本機能（複数行、インデント、モノスペースフォント）を提供
6. **一貫性** - 既存のParameters/Output表示と同じスタイルを維持

Monaco Editorは将来のフェーズ（Phase 7以降）で、以下が確立されてから再検討してください：

- WebView外での実装アーキテクチャ
- VSCode標準エディタAPIとの統合方法
- より高度な編集機能の必要性の検証

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

### Monaco Editorエラーが出る場合

- **対応不要**: Monaco EditorはWebView内では動作しないため、このフェーズでは使用していません
- Phase 4で残っているMonaco Editor関連のコードは削除してください

## 次のフェーズ

Phase 5が完了したら、[Phase 6: 保存機能の完成](PHASE6_SAVE_FUNCTIONALITY.md)に進んでください。

## 将来の拡張オプション（Phase 7以降で検討）

より高度なコード編集機能が必要になった場合の選択肢：

1. **CodeMirror 6への移行**
   - シンタックスハイライト
   - コード折りたたみ
   - オートコンプリート（基本的なもの）

2. **VSCode標準エディタの統合**
   - 別ウィンドウでネイティブエディタを開く
   - 完全なIntelliSense対応
   - デバッグ機能との統合

3. **Ace Editorの採用**
   - 軽量ながら機能豊富
   - 多言語サポート
