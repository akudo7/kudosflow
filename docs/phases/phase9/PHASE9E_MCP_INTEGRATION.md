# Phase 9E: MCP Server Integration (Future-Ready)

**Status**: ☑ 完了
**Estimated Time**: 2-3 days
**Complexity**: Medium
**Completed**: 2025-12-16

## Implementation Goals

1. Add MCP server configuration support
2. Support model binding to MCP servers
3. Prepare for future MCP features

## Key Features

### MCP Server Structure

From `json/research/subagents/research-execution.json` lines 102-108:

```json
"mcpServers": {
  "web-search": {
    "transport": "stdio",
    "command": "node",
    "args": ["/Users/akirakudo/Desktop/MyWork/MPC/web-search/build/index.js"]
  }
}
```

### MCP Configuration in Config

From `json/research/subagents/research-execution.json` lines 56-62:

```json
"config": {
  "mcpServers": {
    "config": {
      "throwOnLoadError": false,
      "prefixToolNameWithServerName": true,
      "additionalToolNamePrefix": "mcp"
    }
  }
}
```

## Type Extensions

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

```typescript
export interface MCPServerConfig {
  transport: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;  // For SSE transport
  [key: string]: any;
}

export interface WorkflowConfigSettings {
  recursionLimit?: number;
  eventEmitter?: {
    defaultMaxListeners?: number;
  };
  mcpServers?: {
    config?: {
      throwOnLoadError?: boolean;
      prefixToolNameWithServerName?: boolean;
      additionalToolNamePrefix?: string;
    };
  };
  [key: string]: any;
}

export interface WorkflowConfig {
  config?: WorkflowConfigSettings;
  a2aClients?: Record<string, A2AClientConfig>;
  mcpServers?: Record<string, MCPServerConfig>;  // NEW
  // ... rest
}
```

## File Structure

### Modified Files

```
webview-ui/src/workflow-editor/
├── types/
│   └── workflow.types.ts              # MODIFY: Add MCPServerConfig
├── settings/
│   └── MCPServerEditor.tsx            # NEW: MCP server editor
├── WorkflowSettingsPanel.tsx          # MODIFY: Add MCP tab
├── utils/
│   ├── jsonToFlow.ts                  # MODIFY: Preserve mcpServers
│   ├── flowToJson.ts                  # MODIFY: Include mcpServers
│   └── validation.ts                  # MODIFY: Add validateMCPServer()
```

## UI Design

**New Tab: "MCP Servers"**

```
┌──────────────────────────────────────────────┐
│ MCP Servers                                  │
├──────────────────────────────────────────────┤
│ Server ID   | Transport | Command   | Actions│
├──────────────────────────────────────────────┤
│ web-search  | stdio     | node      | [✏️][🗑️]│
└──────────────────────────────────────────────┘
[+ Add MCP Server]

┌─────────────────────────────────────────────┐
│ Edit MCP Server: web-search                 │
├─────────────────────────────────────────────┤
│ Server ID:    [web-search______________]    │
│ Transport:    [stdio ▼]                     │
│               Options: stdio, sse           │
│                                             │
│ Command:      [node____________________]    │
│ Arguments:    [/path/to/index.js_______]    │
│               [+ Add Argument]              │
│                                             │
│          [Cancel]  [Save]                   │
└─────────────────────────────────────────────┘

Configuration:
☐ Throw on load error
☑ Prefix tool name with server name
Prefix: [mcp_______________]
```

## Implementation Tasks

- [ ] Define `MCPServerConfig` interface
- [ ] Add `mcpServers` to `WorkflowConfig`
- [ ] Extend `WorkflowConfigSettings` with mcpServers config
- [ ] Create `MCPServerEditor.tsx`
  - Server list table
  - Add/Edit/Delete functionality
  - Transport dropdown (stdio, sse)
  - Command and args fields
  - Configuration options
- [ ] Add "MCP Servers" tab to settings panel
- [ ] Add `validateMCPServer()` in validation.ts
  - Check transport is valid
  - For stdio: check command exists
  - For sse: check URL format
- [ ] Update converters for MCP data
- [ ] Test: Configure MCP server in UI

## Validation Strategy

### MCP Server Validation

```typescript
validateMCPServer(server: MCPServerConfig): ValidationResult {
  // Check transport is "stdio" or "sse"
  // If stdio: check command is not empty
  // If sse: check URL is valid
  // Check args is array if provided
}
```

## Testing

### Phase 9D Tests

- [ ] Load workflow with MCP servers - verify preserved
- [ ] Add MCP server in UI - verify saved
- [ ] Edit MCP config - verify updated
- [ ] Model with bindMcpServers displays correctly

## Success Criteria

- ✓ MCP servers load/save correctly
- ✓ MCP config preserved
- ✓ bindMcpServers flag works
- ✓ MCP editor UI functional

## Key Files Reference

### Type Definitions
- [workflow.types.ts](../../webview-ui/src/workflow-editor/types/workflow.types.ts)

### Settings Components
- [WorkflowSettingsPanel.tsx](../../webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx)

### Validation
- [validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts)

### Example Data
- [research/subagents/research-execution.json](../../json/research/subagents/research-execution.json) - MCP Server example
