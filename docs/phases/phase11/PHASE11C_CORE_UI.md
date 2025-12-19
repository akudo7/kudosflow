# Phase 11C: Core Workflow UI Translation

**Status**: ⬜ Not Started
**Estimated Time**: 4-5 hours
**Complexity**: Medium (High visibility components)
**Priority**: High - Most visible UI elements

## Overview

Translate all Japanese text in the core workflow editor UI components. These are the most visible elements users interact with constantly.

## Files to Modify

### 1. `webview-ui/src/workflow-editor/WorkflowEditor.tsx`
**Lines**: 152, 158, 312, 326-327, 346, 375, 416, 424, 436, 441
**Content**: Notifications, default labels, delete confirmations, context menu

### 2. `webview-ui/src/workflow-editor/WorkflowToolbar.tsx`
**Lines**: 100-398 (extensive UI labels)
**Content**: Button labels, tooltips, server status messages

### 3. `webview-ui/src/workflow-editor/WorkflowNode.tsx`
**Lines**: 99-815 (extensive form labels)
**Content**: Error messages, button labels, placeholders

### 4. `webview-ui/src/workflow-editor/ToolNode.tsx`
**Lines**: 45, 195, 236
**Content**: Error messages, tooltips, descriptions

### 5. `webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx`
**Lines**: 160-177
**Content**: Panel title, tab labels, close button

## Translation Mappings

### WorkflowEditor.tsx

#### Success/Error Notifications (Lines 152, 158)

```typescript
// Before
message: 'ワークフローを保存しました'
message: `保存に失敗しました: ${message.error}`

// After
message: 'Workflow saved successfully'
message: `Failed to save: ${message.error}`
```

#### Default Node Labels (Lines 312, 326-327)

```typescript
// Before
label: '新しいToolNode'
label: '新しいノード'
implementation: '// コードをここに書く\nreturn state;'

// After
label: 'New ToolNode'
label: 'New Node'
implementation: '// Write code here\nreturn state;'
```

#### Delete Confirmation (Line 346)

```typescript
// Before
`選択した${itemCount}個のアイテムを削除しますか？`

// After
`Delete ${itemCount} selected item(s)?`
```

#### Node Copy Suffix (Line 375)

```typescript
// Before
label: `${node.data.label} (コピー)`

// After
label: `${node.data.label} (Copy)`
```

#### Context Menu (Lines 416, 424, 436, 441)

```typescript
// Before
label: '複製'
label: '削除'
label: 'Function Node追加'
label: 'ToolNode追加'

// After
label: 'Duplicate'
label: 'Delete'
label: 'Add Function Node'
label: 'Add ToolNode'
```

### WorkflowToolbar.tsx

#### Node Add Button (Lines 100-102)

```typescript
// Before
title="新しいノードを追加"
➕ ノード追加

// After
title="Add new node"
➕ Add Node
```

#### Node Type Descriptions (Lines 146, 175)

```typescript
// Before
<div style={{ fontSize: '11px', opacity: 0.7 }}>通常の関数ノード</div>
<div style={{ fontSize: '11px', opacity: 0.7 }}>ツールコールを実行</div>

// After
<div style={{ fontSize: '11px', opacity: 0.7 }}>Standard function node</div>
<div style={{ fontSize: '11px', opacity: 0.7 }}>Execute tool calls</div>
```

#### Duplicate/Delete Buttons (Lines 185-195)

```typescript
// Before
title="選択したノードを複製"
📋 複製
title="選択したアイテムを削除 (Delete)"
🗑️ 削除

// After
title="Duplicate selected node"
📋 Duplicate
title="Delete selected items (Delete)"
🗑️ Delete
```

#### Settings/Chat Buttons (Lines 201-217)

```typescript
// Before
title="ワークフロー設定を開く"
⚙️ 設定
title="チャットを開く/閉じる"
💬 チャット

// After
title="Open workflow settings"
⚙️ Settings
title="Open/close chat"
💬 Chat
```

#### Server Controls (Lines 245-387)

```typescript
// Before
title="A2A サーバーを起動"
▶️ サーバー起動
<span>起動中...</span>
title={`サーバー情報を表示 (Port ${serverStatus.port || 3000})`}
実行中
サーバー情報
ポート: {serverStatus.port || 3000}
エンドポイント:
title="サーバーを再起動"
🔄 再起動
title="サーバーを停止"
⏹️ 停止
<span>サーバーエラー</span>

// After
title="Start A2A server"
▶️ Start Server
<span>Starting...</span>
title={`Show server info (Port ${serverStatus.port || 3000})`}
Running
Server Info
Port: {serverStatus.port || 3000}
Endpoints:
title="Restart server"
🔄 Restart
title="Stop server"
⏹️ Stop
<span>Server Error</span>
```

#### Save Button (Lines 396-398)

```typescript
// Before
title="ワークフローを保存 (Ctrl+S)"
💾 保存

// After
title="Save workflow (Ctrl+S)"
💾 Save
```

### WorkflowNode.tsx

#### Error Messages (Lines 99, 165, 169, 215, 219)

```typescript
// Before
setNameError('ノード名を入力してください');
setParamsError(`パラメータ ${i + 1}: ${validation.error}`);
setParamsError(`パラメータ ${i + 1}: 型を入力してください`);
setOutputError(`出力 ${i + 1}: ${validation.error}`);
setOutputError(`出力 ${i + 1}: 型を入力してください`);

// After
setNameError('Please enter a node name');
setParamsError(`Parameter ${i + 1}: ${validation.error}`);
setParamsError(`Parameter ${i + 1}: Please enter a type`);
setOutputError(`Output ${i + 1}: ${validation.error}`);
setOutputError(`Output ${i + 1}: Please enter a type`);
```

#### UI Labels (Lines 372, 400, 433, 448, 563, 584, 600, 643, 658, 744, 765, 781, 815, 864)

```typescript
// Before
title="ダブルクリックして名前を編集"
{isExpanded ? '折りたたむ' : '展開'}
{isEditingParams ? '✓ 完了' : '✏️ 編集'}
パラメータなし
+ パラメータ追加
キャンセル
<div style={{ color: '#999' }}>パラメータなし</div>
{isEditingOutput ? '✓ 完了' : '✏️ 編集'}
出力なし
+ 出力追加
キャンセル
<div style={{ color: '#999' }}>(出力なし)</div>
{isEditing ? '✓ 完了' : '✏️ 編集'}
title="クリックして編集"

// After
title="Double-click to edit name"
{isExpanded ? 'Collapse' : 'Expand'}
{isEditingParams ? '✓ Done' : '✏️ Edit'}
No parameters
+ Add Parameter
Cancel
<div style={{ color: '#999' }}>No parameters</div>
{isEditingOutput ? '✓ Done' : '✏️ Edit'}
No output
+ Add Output
Cancel
<div style={{ color: '#999' }}>(No output)</div>
{isEditing ? '✓ Done' : '✏️ Edit'}
title="Click to edit"
```

### ToolNode.tsx

#### Error and Tooltips (Lines 45, 195, 236)

```typescript
// Before
setNameError('ノード名を入力してください');
title="ダブルクリックで編集"
このノードはツールコールをオーケストレートします

// After
setNameError('Please enter a node name');
title="Double-click to edit"
This node orchestrates tool calls
```

### WorkflowSettingsPanel.tsx

#### Panel Header and Tabs (Lines 160-177)

```typescript
// Before
<div style={titleStyle}>ワークフロー設定</div>
<button onClick={onClose} style={closeButtonStyle} title="閉じる">
ノード
設定

// After
<div style={titleStyle}>Workflow Settings</div>
<button onClick={onClose} style={closeButtonStyle} title="Close">
Nodes
Settings
```

## Testing Checklist

### WorkflowEditor.tsx
- [ ] Save workflow → Verify "Workflow saved successfully" notification
- [ ] Trigger save error → Verify "Failed to save" notification
- [ ] Add new Function Node → Verify default label "New Node"
- [ ] Add new ToolNode → Verify default label "New ToolNode"
- [ ] Delete multiple items → Verify "Delete N selected item(s)?" confirmation
- [ ] Duplicate node → Verify "(Copy)" suffix in English
- [ ] Right-click node → Verify context menu in English

### WorkflowToolbar.tsx
- [ ] Hover over all buttons → Verify tooltips in English
- [ ] Click "➕ Add Node" → Verify dropdown shows "Standard function node" and "Execute tool calls"
- [ ] Verify all toolbar buttons: Duplicate, Delete, Settings, Chat, Save
- [ ] Start A2A server → Verify "Starting..." then "Running" status
- [ ] View server info → Verify "Port:", "Endpoints:" labels
- [ ] Restart/Stop server → Verify button labels in English
- [ ] Trigger server error → Verify "Server Error" message

### WorkflowNode.tsx
- [ ] Try to save node with empty name → Verify "Please enter a node name" error
- [ ] Try to add parameter without type → Verify "Please enter a type" error
- [ ] Try to add output without type → Verify "Please enter a type" error
- [ ] Hover over node name → Verify "Double-click to edit name" tooltip
- [ ] Toggle parameters section → Verify "Collapse"/"Expand" button
- [ ] Edit parameters → Verify "✓ Done"/"✏️ Edit" toggle
- [ ] Node with no parameters → Verify "No parameters" message
- [ ] Click "+ Add Parameter" → Verify button text in English
- [ ] Cancel parameter edit → Verify "Cancel" button
- [ ] Edit outputs → Verify similar English labels
- [ ] Click "+ Add Output" → Verify button text in English
- [ ] Node with no output → Verify "(No output)" message

### ToolNode.tsx
- [ ] Try to save ToolNode with empty name → Verify English error
- [ ] Hover over ToolNode name → Verify "Double-click to edit" tooltip
- [ ] Verify description: "This node orchestrates tool calls"

### WorkflowSettingsPanel.tsx
- [ ] Click "⚙️ Settings" → Panel opens with "Workflow Settings" title
- [ ] Verify tabs show "Nodes" and "Settings"
- [ ] Hover over close button → Verify "Close" tooltip

## Success Criteria

- [ ] All Japanese text in 5 core UI files translated to English
- [ ] All button labels and tooltips in English
- [ ] All error messages in English
- [ ] All status messages in English
- [ ] No Japanese characters remain in core workflow UI files
- [ ] TypeScript compilation succeeds
- [ ] All UI interactions work correctly
- [ ] No visual layout issues from text length changes

## Implementation Steps

1. **WorkflowEditor.tsx**: Translate notifications and context menu
2. **WorkflowToolbar.tsx**: Translate all button labels and server messages
3. **WorkflowNode.tsx**: Translate error messages and form labels
4. **ToolNode.tsx**: Translate error and description
5. **WorkflowSettingsPanel.tsx**: Translate panel header and tabs
6. **Verify no Japanese remains** in these 5 files
7. **Compile**: `yarn compile && yarn build:webview`
8. **Test**: Follow testing checklist above
9. **Commit changes**

## Estimated Time Breakdown

- WorkflowEditor.tsx: 30 minutes
- WorkflowToolbar.tsx: 1.5 hours (most labels)
- WorkflowNode.tsx: 1.5 hours (extensive form labels)
- ToolNode.tsx: 15 minutes
- WorkflowSettingsPanel.tsx: 15 minutes
- Testing: 1 hour
- **Total**: 4-5 hours

## Next Phase

After completing Phase 11C, proceed to [Phase 11D: Settings Components](PHASE11D_SETTINGS.md).
