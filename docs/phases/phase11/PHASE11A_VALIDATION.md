# Phase 11A: Validation Layer Translation

**Status**: ⬜ Not Started
**Estimated Time**: 3-4 hours
**Complexity**: Low (Systematic, repetitive work)
**Priority**: Foundation - Start here first

## Overview

Translate all validation error messages in `validation.ts` from Japanese to English. This file contains ~30 systematic validation messages covering all workflow components.

## Files to Modify

### 1. `webview-ui/src/workflow-editor/utils/validation.ts`

**Total Lines**: 567
**Japanese Messages**: ~30 error messages
**Lines**: 27-561

## Translation Mappings

### Node Name Validation (Lines 27-48)

```typescript
// Before
error: 'ノード名を入力してください'
error: `予約語 "${trimmedName}" は使用できません`
error: `ノード名 "${trimmedName}" は既に使用されています`

// After
error: 'Please enter a node name'
error: `Reserved word "${trimmedName}" cannot be used`
error: `Node name "${trimmedName}" is already in use`
```

### State Annotation Validation (Line 69)

```typescript
// Before
error: `annotationRef "${annotationRef}" は stateAnnotation.name "${stateAnnotationName}" と一致する必要があります`

// After
error: `annotationRef "${annotationRef}" must match stateAnnotation.name "${stateAnnotationName}"`
```

### Field Name Validation (Lines 123-150)

```typescript
// Before
error: 'フィールド名を入力してください'
error: '有効なJavaScript識別子である必要があります（英字、数字、$、_ のみ使用可能）'
error: `予約語 "${trimmedName}" は使用できません`
error: `フィールド名 "${trimmedName}" は既に使用されています`

// After
error: 'Please enter a field name'
error: 'Must be a valid JavaScript identifier (letters, numbers, $, _ only)'
error: `Reserved word "${trimmedName}" cannot be used`
error: `Field name "${trimmedName}" is already in use`
```

### Parameter Validation (Lines 173-203)

```typescript
// Before
error: 'パラメータ名を入力してください'
error: '有効なJavaScript識別子である必要があります（英字、数字、$、_ のみ使用可能）'
error: `予約語 "${trimmedName}" は使用できません`
error: 'パラメータ名が重複しています'

// After
error: 'Please enter a parameter name'
error: 'Must be a valid JavaScript identifier (letters, numbers, $, _ only)'
error: `Reserved word "${trimmedName}" cannot be used`
error: 'Parameter name is duplicated'
```

### Output Validation (Lines 226-254)

```typescript
// Before
error: '出力キーを入力してください'
error: '有効なJavaScript識別子である必要があります（英字、数字、$、_ のみ使用可能）'
error: `予約語 "${trimmedKey}" は使用できません`
error: '出力キーが重複しています'

// After
error: 'Please enter an output key'
error: 'Must be a valid JavaScript identifier (letters, numbers, $, _ only)'
error: `Reserved word "${trimmedKey}" cannot be used`
error: 'Output key is duplicated'
```

### A2A Client URL Validation (Lines 271-305)

```typescript
// Before
error: 'cardURLを入力してください'
error: 'cardURLは http または https で始まる必要があります'
error: 'cardURLは agent.json エンドポイントを含む必要があります'
error: '有効なURL形式ではありません'
error: 'タイムアウトは正の数値である必要があります'

// After
error: 'Please enter a card URL'
error: 'Card URL must start with http or https'
error: 'Card URL must include an agent.json endpoint'
error: 'Invalid URL format'
error: 'Timeout must be a positive number'
```

### ToolNode Validation (Lines 323-419)

```typescript
// Before
error: 'ノードタイプが "ToolNode" ではありません'
error: 'useA2AClientsはboolean型である必要があります'
error: 'ToolNodeはfunctionプロパティを持つことができません'
error: 'useA2AClientsがtrueですが、ワークフローにA2Aクライアントが定義されていません'
error: '条件名を入力してください'
error: '条件関数が定義されていません'
error: 'パラメータは配列である必要があります'
error: '出力は文字列型である必要があります'
error: '実装コードを入力してください'
error: 'possibleTargetsは配列である必要があります'
error: `無効なターゲット: "${target}" はワークフロー内に存在しません`

// After
error: 'Node type is not "ToolNode"'
error: 'useA2AClients must be a boolean'
error: 'ToolNode cannot have a function property'
error: 'useA2AClients is true, but no A2A clients are defined in the workflow'
error: 'Please enter a condition name'
error: 'Condition function is not defined'
error: 'Parameters must be an array'
error: 'Output must be a string'
error: 'Please enter implementation code'
error: 'possibleTargets must be an array'
error: `Invalid target: "${target}" does not exist in the workflow`
```

### Model Config Validation (Lines 444-500)

```typescript
// Before
error: 'モデルIDを入力してください'
error: 'モデルタイプを選択してください'
error: 'モデル設定が必要です'
error: 'モデル名を入力してください'
error: 'Temperatureは数値である必要があります'
error: 'Temperatureは0から2の範囲である必要があります'
error: 'bindA2AClientsがtrueですが、ワークフローにA2Aクライアントが定義されていません'
error: 'bindMcpServersがtrueですが、ワークフローにMCPサーバーが定義されていません'

// After
error: 'Please enter a model ID'
error: 'Please select a model type'
error: 'Model configuration is required'
error: 'Please enter a model name'
error: 'Temperature must be a number'
error: 'Temperature must be between 0 and 2'
error: 'bindA2AClients is true, but no A2A clients are defined in the workflow'
error: 'bindMcpServers is true, but no MCP servers are defined in the workflow'
```

### MCP Server Validation (Lines 517-561)

```typescript
// Before
error: 'Transportは "stdio" または "sse" である必要があります'
error: 'Commandを入力してください'
error: 'Argsは配列である必要があります'
error: 'URLを入力してください'
error: 'URLは http または https で始まる必要があります'
error: '有効なURL形式ではありません'

// After
error: 'Transport must be "stdio" or "sse"'
error: 'Please enter a command'
error: 'Args must be an array'
error: 'Please enter a URL'
error: 'URL must start with http or https'
error: 'Invalid URL format'
```

## Testing Checklist

After completing translations, test all validation scenarios:

### Node Name Validation
- [ ] Try to create node with empty name → English error
- [ ] Try to create node with reserved word (`__start__`, `__end__`) → English error
- [ ] Try to create duplicate node name → English error

### Field Name Validation
- [ ] Try to create field with empty name → English error
- [ ] Try to create field with invalid identifier (e.g., `123abc`) → English error
- [ ] Try to create field with reserved word (e.g., `class`) → English error
- [ ] Try to create duplicate field name → English error

### Parameter Validation
- [ ] Try to add parameter with empty name → English error
- [ ] Try to add parameter with invalid identifier → English error
- [ ] Try to add duplicate parameter → English error

### Output Validation
- [ ] Try to add output with empty key → English error
- [ ] Try to add output with invalid identifier → English error
- [ ] Try to add duplicate output key → English error

### A2A Client Validation
- [ ] Try to add A2A client with empty URL → English error
- [ ] Try to add A2A client with invalid URL (no http/https) → English error
- [ ] Try to add A2A client without agent.json endpoint → English error
- [ ] Try to add A2A client with negative timeout → English error

### ToolNode Validation
- [ ] Try to create ToolNode with invalid configuration → English error
- [ ] Try to set useA2AClients=true with no A2A clients → English error
- [ ] Try to add condition with empty name → English error
- [ ] Try to add invalid target in possibleTargets → English error

### Model Validation
- [ ] Try to add model with empty ID → English error
- [ ] Try to add model with missing type → English error
- [ ] Try to add model with invalid temperature (< 0 or > 2) → English error
- [ ] Try to set bindA2AClients=true with no A2A clients → English error
- [ ] Try to set bindMcpServers=true with no MCP servers → English error

### MCP Server Validation
- [ ] Try to add MCP server with invalid transport → English error
- [ ] Try to add stdio MCP server with empty command → English error
- [ ] Try to add sse MCP server with empty URL → English error
- [ ] Try to add sse MCP server with invalid URL → English error

## Success Criteria

- [ ] All 30+ validation messages translated to English
- [ ] No Japanese characters remain in validation.ts
- [ ] All error messages are clear and actionable
- [ ] All validation tests pass with English messages
- [ ] TypeScript compilation succeeds
- [ ] No regressions in validation logic

## Implementation Steps

1. Open `webview-ui/src/workflow-editor/utils/validation.ts`
2. Use Find & Replace to systematically translate each message
3. Verify no Japanese characters remain (use regex search: `[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]`)
4. Run TypeScript compiler: `yarn compile`
5. Test all validation scenarios listed above
6. Commit changes with clear message

## Estimated Time Breakdown

- Translation work: 2 hours
- Testing: 1-1.5 hours
- Documentation: 0.5 hours
- **Total**: 3-4 hours

## Next Phase

After completing Phase 11A, proceed to [Phase 11B: Extension Side](PHASE11B_EXTENSION.md).
