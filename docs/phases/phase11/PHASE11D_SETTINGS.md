# Phase 11D: Settings Components Translation

**Status**: ⬜ Not Started
**Estimated Time**: 4-5 hours
**Complexity**: Medium (Many files, systematic work)
**Priority**: Medium - Settings UI

## Overview

Translate all Japanese text in the settings components (14 files). These components handle workflow configuration through forms, modals, and editors.

## Files to Modify

### Settings Editors (6 files)

1. `webview-ui/src/workflow-editor/settings/AnnotationFieldsEditor.tsx`
2. `webview-ui/src/workflow-editor/settings/ConfigEditor.tsx`
3. `webview-ui/src/workflow-editor/settings/StateAnnotationEditor.tsx`
4. `webview-ui/src/workflow-editor/settings/StateGraphEditor.tsx`
5. `webview-ui/src/workflow-editor/settings/ModelEditor.tsx`
6. `webview-ui/src/workflow-editor/settings/MCPServerEditor.tsx`
7. `webview-ui/src/workflow-editor/settings/A2AClientEditor.tsx`

### Form Modals (5 files)

8. `webview-ui/src/workflow-editor/settings/AnnotationFieldForm.tsx`
9. `webview-ui/src/workflow-editor/settings/ModelFormModal.tsx`
10. `webview-ui/src/workflow-editor/settings/MCPServerFormModal.tsx`
11. `webview-ui/src/workflow-editor/settings/A2AClientFormModal.tsx`

### Other Settings Components (3 files)

12. `webview-ui/src/workflow-editor/settings/NodeNameEditor.tsx`
13. `webview-ui/src/workflow-editor/settings/NodeBadges.tsx`
14. `webview-ui/src/workflow-editor/settings/ExecutionSettings.tsx`

## Translation Mappings

### AnnotationFieldsEditor.tsx (Lines 195-269)

```typescript
// Before
+ フィールド追加
フィールドがありません
title="編集"
title="削除"
フィールド "<strong>{deletingField}</strong>" を削除しますか?
キャンセル
削除

// After
+ Add Field
No fields
title="Edit"
title="Delete"
Delete field "<strong>{deletingField}</strong>"?
Cancel
Delete
```

### ConfigEditor.tsx (Lines 76, 90)

```typescript
// Before
ワークフローの最大再帰回数 (デフォルト: 25)
イベントエミッターの最大リスナー数 (デフォルト: 25)

// After
Maximum workflow recursion limit (default: 25)
Maximum event emitter listeners (default: 25)
```

### StateAnnotationEditor.tsx (Lines 68, 75, 82)

```typescript
// Before
ワークフローの状態アノテーション名
placeholder="例: InterruptWorkflowState"
タイプは常に固定です (編集不可)

// After
Workflow state annotation name
placeholder="Example: InterruptWorkflowState"
Type is always fixed (read-only)
```

### StateGraphEditor.tsx (Lines 107-108)

```typescript
// Before
Annotation Referenceが State Annotation名 "{stateAnnotationName}" と一致しません。
不一致の場合、ワークフローが正しく動作しない可能性があります。

// After
Annotation Reference does not match State Annotation name "{stateAnnotationName}".
If mismatched, the workflow may not function correctly.
```

### ModelEditor.tsx (Lines 42-43, 225, 230, 295)

```typescript
// Before
alert(
  `モデル "${modelId}" は以下のノードで参照されています:\n${nodeNames}\n\n先にノードのパラメータから参照を削除してください。`
);
+ モデル追加
モデルがありません
モデル "<strong>{deletingModelId}</strong>" を削除しますか?

// After
alert(
  `Model "${modelId}" is referenced by the following nodes:\n${nodeNames}\n\nPlease remove references from node parameters first.`
);
+ Add Model
No models
Delete model "<strong>{deletingModelId}</strong>"?
```

### MCPServerEditor.tsx (Lines 206, 211, 276)

```typescript
// Before
+ MCPサーバー追加
MCPサーバーがありません
MCPサーバー "<strong>{deletingServerId}</strong>" を削除しますか?

// After
+ Add MCP Server
No MCP servers
Delete MCP server "<strong>{deletingServerId}</strong>"?
```

### A2AClientEditor.tsx (Lines 206, 211, 272)

```typescript
// Before
+ A2Aクライアント追加
A2Aクライアントがありません
A2Aクライアント "<strong>{deletingClientId}</strong>" を削除しますか?

// After
+ Add A2A Client
No A2A clients
Delete A2A client "<strong>{deletingClientId}</strong>"?
```

### AnnotationFieldForm.tsx (Lines 52, 62)

```typescript
// Before
'型を入力してください'
'デフォルト値は有効なJSONである必要があります'

// After
'Please enter a type'
'Default value must be valid JSON'
```

### ModelFormModal.tsx (Lines 242-351)

**Modal Title:**
```typescript
// Before
{isEditing ? `モデル編集: ${modelId}` : 'モデル追加'}

// After
{isEditing ? `Edit Model: ${modelId}` : 'Add Model'}
```

**Form Labels:**
```typescript
// Before
モデルID
モデルタイプ
モデル名
Temperature
Temperature (0-2)
System Prompt
A2Aクライアントをバインド
MCPサーバーをバインド
キャンセル
保存
削除

// After
Model ID
Model Type
Model Name
Temperature
Temperature (0-2)
System Prompt
Bind A2A Clients
Bind MCP Servers
Cancel
Save
Delete
```

### MCPServerFormModal.tsx (Lines 47-355)

**Validation Errors (Lines 47-94):**
```typescript
// Before
'Server IDを入力してください'
'Transportを選択してください'
'Commandを入力してください'
'URLを入力してください'
'URLは http または https で始まる必要があります'
'有効なURL形式ではありません'

// After
'Please enter a server ID'
'Please select a transport type'
'Please enter a command'
'Please enter a URL'
'URL must start with http or https'
'Invalid URL format'
```

**Modal Title (Line 267):**
```typescript
// Before
{isEditing ? `MCPサーバー編集: ${serverId}` : 'MCPサーバー追加'}

// After
{isEditing ? `Edit MCP Server: ${serverId}` : 'Add MCP Server'}
```

**Form Labels:**
```typescript
// Before
Server ID
Transport
Command
引数 (Args)
URL
+ 引数追加
削除
キャンセル
保存

// After
Server ID
Transport
Command
Arguments (Args)
URL
+ Add Argument
Delete
Cancel
Save
```

### A2AClientFormModal.tsx (Lines 197-248)

**Modal Title:**
```typescript
// Before
{isEditing ? `A2Aクライアント編集: ${clientId}` : 'A2Aクライアント追加'}

// After
{isEditing ? `Edit A2A Client: ${clientId}` : 'Add A2A Client'}
```

**Form Labels:**
```typescript
// Before
Client ID
Card URL
Timeout (秒)
キャンセル
保存
削除

// After
Client ID
Card URL
Timeout (seconds)
Cancel
Save
Delete
```

### NodeNameEditor.tsx

```typescript
// Before
ノード一覧
ノード名を変更するには、下のリストから選択してください。

// After
Node List
Select a node from the list below to rename it.
```

### NodeBadges.tsx

```typescript
// Before
title="このノードはA2Aクライアントを使用します"
title="このノードはMCPサーバーを使用します"
title="ToolNode"

// After
title="This node uses A2A clients"
title="This node uses MCP servers"
title="ToolNode"
```

### ExecutionSettings.tsx

```typescript
// Before
実行設定
ストリーミングを有効にする
デバッグモードを有効にする

// After
Execution Settings
Enable streaming
Enable debug mode
```

## Testing Checklist

### Annotation Fields Editor
- [ ] Open Settings → Annotation tab
- [ ] Verify "No fields" message when empty
- [ ] Click "+ Add Field" → Verify button text
- [ ] Add field → Edit → Verify "Edit" tooltip
- [ ] Try to delete field → Verify confirmation in English
- [ ] Verify "Cancel" and "Delete" buttons in confirmation

### Config Editor
- [ ] Open Settings → Settings tab
- [ ] Verify recursion limit label in English
- [ ] Verify event emitter label in English

### State Annotation Editor
- [ ] Open Settings → Settings tab
- [ ] Verify "Workflow state annotation name" label
- [ ] Verify placeholder text in English
- [ ] Verify type field shows "(read-only)" in English

### State Graph Editor
- [ ] Open Settings → State Graph tab
- [ ] Create annotation mismatch → Verify warning in English

### Model Editor
- [ ] Open Settings → Models tab
- [ ] Verify "No models" message when empty
- [ ] Click "+ Add Model" → Verify modal title
- [ ] Fill form → Verify all labels in English
- [ ] Try to delete model referenced by node → Verify alert in English
- [ ] Delete model → Verify confirmation in English
- [ ] Verify "Cancel", "Save", "Delete" buttons

### MCP Server Editor
- [ ] Open Settings → MCP Servers tab
- [ ] Verify "No MCP servers" message when empty
- [ ] Click "+ Add MCP Server" → Verify modal title
- [ ] Fill form with invalid data → Verify validation errors in English
- [ ] Add argument → Verify "+ Add Argument" button
- [ ] Delete MCP server → Verify confirmation in English

### A2A Client Editor
- [ ] Open Settings → A2A Clients tab
- [ ] Verify "No A2A clients" message when empty
- [ ] Click "+ Add A2A Client" → Verify modal title
- [ ] Fill form → Verify all labels in English
- [ ] Delete client → Verify confirmation in English

### Node Name Editor
- [ ] Open Settings → Nodes tab
- [ ] Verify "Node List" title
- [ ] Verify instruction text in English

### Execution Settings
- [ ] Open Settings → Execution tab
- [ ] Verify "Execution Settings" title
- [ ] Verify checkbox labels in English

## Success Criteria

- [ ] All Japanese text in 14 settings files translated to English
- [ ] All form labels in English
- [ ] All modal titles in English
- [ ] All confirmation dialogs in English
- [ ] All validation errors in English
- [ ] All button labels in English
- [ ] No Japanese characters remain in settings components
- [ ] TypeScript compilation succeeds
- [ ] All forms work correctly
- [ ] No visual layout issues

## Implementation Steps

1. **Editors** (6 files): Translate list views and add buttons
2. **Form Modals** (5 files): Translate modal titles, labels, buttons
3. **Other Components** (3 files): Translate remaining settings UI
4. **Verify no Japanese remains** in all 14 files
5. **Compile**: `yarn compile && yarn build:webview`
6. **Test**: Follow testing checklist above
7. **Commit changes**

## Estimated Time Breakdown

- Annotation/Config/State editors: 1 hour
- Model/MCP/A2A editors: 1.5 hours
- Form modals: 1.5 hours
- Other components: 30 minutes
- Testing: 1 hour
- **Total**: 4-5 hours

## Common Patterns

**Add Buttons:**
- Pattern: `+ フィールド追加` → `+ Add Field`
- Similar for: Model, MCP Server, A2A Client, Parameter, Output, etc.

**Empty States:**
- Pattern: `フィールドがありません` → `No fields`
- Similar for: models, MCP servers, A2A clients, parameters, outputs

**Delete Confirmations:**
- Pattern: `"<strong>{item}</strong>" を削除しますか?` → `Delete "<strong>{item}</strong>"?`

**Modal Titles:**
- Pattern: `{isEditing ? '編集' : '追加'}` → `{isEditing ? 'Edit' : 'Add'}`

**Form Buttons:**
- Always: `キャンセル` → `Cancel`, `保存` → `Save`, `削除` → `Delete`

## Next Phase

After completing Phase 11D, proceed to [Phase 11E: Legacy Components](PHASE11E_LEGACY.md).
