# Phase 9C: Model Configuration Enhancements

**Status**: ⬜ 未開始
**Estimated Time**: 2-3 days
**Complexity**: Medium

## Implementation Goals

1. Extend ModelConfig to support A2A client binding
2. Add systemPrompt support
3. Update model configuration UI

## Key Features

### Model Configuration Structure

From `json/research/main.json` lines 58-68:

```json
{
  "id": "mainModel",
  "type": "OpenAI",
  "config": {
    "model": "gpt-4o-mini",
    "temperature": 0.7
  },
  "bindA2AClients": true,
  "systemPrompt": "You are a BizDev Market Analysis Orchestrator..."
}
```

**New Fields:**
- `type`: Model provider ("OpenAI", "Anthropic", "Ollama")
- `config`: Provider-specific configuration object
- `bindA2AClients`: Whether to bind A2A clients to this model
- `systemPrompt`: System prompt for the model

## Type Extensions

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

```typescript
export interface ModelConfig {
  id: string;
  type: string;  // "OpenAI" | "Anthropic" | "Ollama"
  config: {
    model: string;
    temperature?: number;
    [key: string]: any;
  };
  bindA2AClients?: boolean;
  bindMcpServers?: boolean;  // For Phase 9D
  systemPrompt?: string;
}
```

## File Structure

### Modified Files

```
webview-ui/src/workflow-editor/
├── types/
│   └── workflow.types.ts              # MODIFY: Enhance ModelConfig
├── settings/
│   └── ModelEditor.tsx                # NEW: Model configuration editor
├── WorkflowSettingsPanel.tsx          # MODIFY: Add Models tab
├── utils/
│   ├── jsonToFlow.ts                  # MODIFY: Preserve model configs
│   ├── flowToJson.ts                  # MODIFY: Include model configs
│   └── validation.ts                  # MODIFY: Add validateModelConfig()
```

## UI Design

**New Tab in WorkflowSettingsPanel: "Models"**

```
┌───────────────────────────────────────────────┐
│ Models                                        │
├───────────────────────────────────────────────┤
│ Model ID    | Type     | A2A | MCP | Actions │
├───────────────────────────────────────────────┤
│ mainModel   | OpenAI   | ✓   | -   | [✏️][🗑️] │
│ research... | OpenAI   | -   | ✓   | [✏️][🗑️] │
└───────────────────────────────────────────────┘
[+ Add Model]

┌─────────────────────────────────────────────┐
│ Edit Model: mainModel                       │
├─────────────────────────────────────────────┤
│ ID:              [mainModel____________]    │
│ Type:            [OpenAI ▼]                 │
│                  Options: OpenAI, Anthropic,│
│                           Ollama            │
│                                             │
│ Model Name:      [gpt-4o-mini__________]    │
│ Temperature:     [0.7_________________]     │
│                                             │
│ ☑ Bind A2A Clients                          │
│ ☐ Bind MCP Servers                          │
│                                             │
│ System Prompt:                              │
│ ┌─────────────────────────────────────────┐ │
│ │ You are a...                            │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│          [Cancel]  [Save]                   │
└─────────────────────────────────────────────┘
```

## Implementation Tasks

- [ ] Enhance `ModelConfig` interface with type, config, bindA2AClients, systemPrompt
- [ ] Create `ModelEditor.tsx` component
  - Model list table
  - Add/Edit/Delete model functionality
  - Model type dropdown (OpenAI, Anthropic, Ollama)
  - Config fields editor
  - Bind checkboxes (A2A, MCP)
  - System prompt text area
- [ ] Add "Models" tab to `WorkflowSettingsPanel.tsx`
- [ ] Add `validateModelConfig()` in validation.ts
  - Check ID uniqueness
  - Validate model type
  - Check config.model is not empty
- [ ] Update converters to preserve model data
- [ ] Test: Create, edit, delete models in UI

## Validation Strategy

### Model Config Validation

```typescript
validateModelConfig(model: ModelConfig, a2aClients?, mcpServers?): ValidationResult {
  // Check ID is unique
  // Check type is valid ("OpenAI" | "Anthropic" | "Ollama")
  // Check config.model exists
  // If bindA2AClients, check a2aClients exist
  // If bindMcpServers, check mcpServers exist
}
```

## Testing

### Phase 9C Tests

- [ ] Add model with bindA2AClients - verify saved
- [ ] Edit model systemPrompt - verify saved
- [ ] Delete model - verify removed from config
- [ ] Model validation with missing A2A clients

## Success Criteria

- ✓ Models with bindA2AClients work
- ✓ System prompts save/load
- ✓ Model editor UI functional
- ✓ Model validation prevents errors

## Key Files Reference

### Type Definitions
- [workflow.types.ts](../../webview-ui/src/workflow-editor/types/workflow.types.ts)

### Settings Components
- [WorkflowSettingsPanel.tsx](../../webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx)

### Validation
- [validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts)

### Example Data
- [research/main.json](../../json/research/main.json) - Model configuration example
