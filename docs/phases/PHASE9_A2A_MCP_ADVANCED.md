# Phase 9: A2A Client/Server & Advanced Features Implementation Plan

## Overview

This plan adds support for **A2A (Agent-to-Agent) Clients/Servers**, **ToolNode**, **Conditional Edges**, and **MCP (Model Context Protocol) Servers** based on the research workflow JSON files in `json/research/`.

### Scope Analysis

Based on the implementation requirements, this is a **large feature set** that should be split into **multiple sub-phases** to manage complexity:

- **Phase 9A**: Type definitions and A2A Client configuration (Foundation)
- **Phase 9B**: ToolNode support and conditional edge enhancements (Node types)
- **Phase 9C**: Model configuration enhancements (Model binding)
- **Phase 9D**: MCP Server integration (Future-ready)
- **Phase 9E**: UI for A2A/MCP management (Settings panel)

---

## Phase 9A: Type Definitions and A2A Client Configuration

**Status**: ⬜ 未開始
**Estimated Time**: 2-3 days
**Complexity**: Medium

### Implementation Goals

1. Extend TypeScript type definitions to support A2A clients
2. Update JSON converters to preserve A2A client data
3. Add basic validation for A2A configurations

### Key Features

#### 1. A2A Client Type Definition

Add support for `a2aClients` in WorkflowConfig:

```json
"a2aClients": {
  "task_agent": {
    "cardUrl": "http://localhost:3001/.well-known/agent.json",
    "timeout": 30000
  },
  "research_agent": {
    "cardUrl": "http://localhost:3002/.well-known/agent.json",
    "timeout": 30000
  }
}
```

#### 2. Type Extensions Needed

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

```typescript
// New interface
export interface A2AClientConfig {
  cardUrl: string;      // Agent card endpoint URL
  timeout: number;       // Request timeout in milliseconds
  [key: string]: any;   // Allow additional properties
}

// Extend WorkflowConfig
export interface WorkflowConfig {
  config?: WorkflowConfigSettings;  // Enhanced type (see below)
  a2aClients?: Record<string, A2AClientConfig>;  // NEW
  stateAnnotation: {
    name: string;
    type: "Annotation.Root";
  };
  annotation: Record<string, AnnotationField>;
  models?: ModelConfig[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stateGraph: any;
}

// Enhanced config type
export interface WorkflowConfigSettings {
  recursionLimit?: number;
  eventEmitter?: {
    defaultMaxListeners?: number;
  };
  [key: string]: any;
}
```

### File Structure

#### New/Modified Files

```
webview-ui/src/workflow-editor/
├── types/
│   └── workflow.types.ts              # MODIFY: Add A2AClientConfig, enhance types
├── utils/
│   ├── jsonToFlow.ts                  # MODIFY: Preserve a2aClients in conversion
│   ├── flowToJson.ts                  # MODIFY: Include a2aClients in output
│   └── validation.ts                  # MODIFY: Add validateA2AClient()
```

### Implementation Tasks

- [ ] Define `A2AClientConfig` interface in `workflow.types.ts`
- [ ] Add `a2aClients?: Record<string, A2AClientConfig>` to `WorkflowConfig`
- [ ] Enhance `config` type to `WorkflowConfigSettings`
- [ ] Update `jsonToFlow.ts` to preserve a2aClients data
- [ ] Update `flowToJson.ts` to include a2aClients in output
- [ ] Add `validateA2AClient()` function in `validation.ts`
  - Check cardUrl format (valid URL)
  - Check timeout is positive number
- [ ] Test: Load research/main.json and verify a2aClients are preserved

---

## Phase 9B: ToolNode Support and Conditional Edge Enhancements

**Status**: ⬜ 未開始
**Estimated Time**: 3-4 days
**Complexity**: High

### Implementation Goals

1. Add support for `ToolNode` node type
2. Enhance conditional edge type definitions
3. Create UI components for ToolNode
4. Improve conditional edge visualization

### Key Features

#### 1. ToolNode Type Support

From `json/research/main.json` line 92-96:

```json
{
  "id": "tools",
  "type": "ToolNode",
  "useA2AClients": true
}
```

**Characteristics:**
- No `function` property (unlike regular nodes)
- Has `type: "ToolNode"` field
- Has `useA2AClients: boolean` flag
- Represents tool execution orchestration node

#### 2. Conditional Edge Enhancement

From `json/research/main.json` line 132-148:

```json
{
  "type": "conditional",
  "from": "orchestrator",
  "condition": {
    "name": "shouldContinue",
    "function": {
      "parameters": [...],
      "output": "string",
      "implementation": "..."
    },
    "possibleTargets": ["tools", "orchestrator", "__end__"]
  }
}
```

### Type Extensions

**File**: `webview-ui/src/workflow-editor/types/workflow.types.ts`

```typescript
// Enhanced WorkflowNode to support ToolNode
export interface WorkflowNode {
  id: string;
  type?: string;  // NEW: "ToolNode" or undefined (function node)
  useA2AClients?: boolean;  // NEW: For ToolNode
  function?: {
    parameters: Array<{
      name: string;
      type: string;
      modelRef?: string;
    }>;
    output: Record<string, string> | string;  // Can be string for conditional
    implementation: string;
  };
  ends?: string[];
}

// Enhanced ConditionalEdge support
export interface ConditionalEdgeCondition {
  name: string;
  function: {
    parameters: Array<{ name: string; type: string }>;
    output: string;  // Target node ID
    implementation: string;
  };
  possibleTargets?: string[];
}

export interface WorkflowEdge {
  from: string;
  to?: string;
  type?: 'conditional' | 'normal';
  condition?: ConditionalEdgeCondition;  // Enhanced type
}
```

### File Structure

#### New Files

```
webview-ui/src/workflow-editor/
├── components/
│   └── ToolNode.tsx                   # NEW: ToolNode visualization component
```

#### Modified Files

```
webview-ui/src/workflow-editor/
├── types/
│   └── workflow.types.ts              # MODIFY: Add ToolNode types, ConditionalEdgeCondition
├── WorkflowEditor.tsx                 # MODIFY: Register ToolNode component
├── utils/
│   ├── jsonToFlow.ts                  # MODIFY: Handle ToolNode conversion
│   ├── flowToJson.ts                  # MODIFY: Handle ToolNode serialization
│   └── validation.ts                  # MODIFY: Add validateToolNode(), validateConditionalEdge()
```

### UI Design for ToolNode

```
┌─────────────────────────────────┐
│ 🛠️ tools (ToolNode)              │
├─────────────────────────────────┤
│ Type: ToolNode                  │
│ A2A Clients: ✓ Enabled          │
│                                 │
│ [このノードはツールコールを      │
│  オーケストレートします]         │
└─────────────────────────────────┘
```

### Implementation Tasks

- [ ] Add `type?: string` and `useA2AClients?: boolean` to `WorkflowNode`
- [ ] Define `ConditionalEdgeCondition` interface
- [ ] Update `WorkflowEdge.condition` to use `ConditionalEdgeCondition`
- [ ] Create `ToolNode.tsx` component
  - Display ToolNode badge
  - Show useA2AClients status
  - Different styling from function nodes
- [ ] Update `WorkflowEditor.tsx` to register ToolNode component
- [ ] Update `jsonToFlow.ts`:
  - Detect `type: "ToolNode"` and create ToolNode
  - Preserve `useA2AClients` in node data
  - Handle conditional edge with possibleTargets
- [ ] Update `flowToJson.ts`:
  - Serialize ToolNode with type and useA2AClients
  - Include possibleTargets in conditional edges
- [ ] Add `validateToolNode()` in validation.ts
- [ ] Add `validateConditionalEdge()` in validation.ts
- [ ] Test: Load research/main.json and verify ToolNode displays correctly

---

## Phase 9C: Model Configuration Enhancements

**Status**: ⬜ 未開始
**Estimated Time**: 2-3 days
**Complexity**: Medium

### Implementation Goals

1. Extend ModelConfig to support A2A client binding
2. Add systemPrompt support
3. Update model configuration UI

### Key Features

#### Model Configuration Structure

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

### Type Extensions

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

### File Structure

#### Modified Files

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

### UI Design

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

### Implementation Tasks

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

---

## Phase 9D: MCP Server Integration (Future-Ready)

**Status**: ⬜ 未開始
**Estimated Time**: 2-3 days
**Complexity**: Medium

### Implementation Goals

1. Add MCP server configuration support
2. Support model binding to MCP servers
3. Prepare for future MCP features

### Key Features

#### MCP Server Structure

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

#### MCP Configuration in Config

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

### Type Extensions

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

### File Structure

#### Modified Files

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

### UI Design

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

Configuration:
☐ Throw on load error
☑ Prefix tool name with server name
Prefix: [mcp_______________]
```

### Implementation Tasks

- [ ] Define `MCPServerConfig` interface
- [ ] Add `mcpServers` to `WorkflowConfig`
- [ ] Extend `WorkflowConfigSettings` with mcpServers config
- [ ] Create `MCPServerEditor.tsx`
- [ ] Add "MCP Servers" tab to settings panel
- [ ] Add `validateMCPServer()` in validation.ts
- [ ] Update converters for MCP data
- [ ] Test: Configure MCP server in UI

---

## Phase 9E: UI for A2A/MCP Management (Settings Panel)

**Status**: ⬜ 未開始
**Estimated Time**: 3-4 days
**Complexity**: High

### Implementation Goals

1. Create comprehensive A2A client management UI
2. Integrate all Phase 9 features into settings panel
3. Add visual indicators for A2A/MCP usage
4. Improve node visualization for advanced features

### Key Features

#### 1. A2A Client Editor UI

```
┌──────────────────────────────────────────────┐
│ A2A Clients                                  │
├──────────────────────────────────────────────┤
│ Client ID     | URL                  | Actions│
├──────────────────────────────────────────────┤
│ task_agent    | localhost:3001       | [✏️][🗑️]│
│ research_ag.. | localhost:3002       | [✏️][🗑️]│
│ quality_age.. | localhost:3003       | [✏️][🗑️]│
└──────────────────────────────────────────────┘
[+ Add A2A Client]

┌─────────────────────────────────────────────┐
│ Edit A2A Client                             │
├─────────────────────────────────────────────┤
│ Client ID:    [task_agent______________]    │
│                                             │
│ Card URL:                                   │
│ [http://localhost:3001/.well-known/agent.j] │
│                                             │
│ Timeout (ms): [30000__________________]     │
│                                             │
│          [Cancel]  [Save]                   │
└─────────────────────────────────────────────┘
```

#### 2. Enhanced Node Visualization

Add badges to nodes to show:
- 🔗 A2A Client binding
- 🔌 MCP Server binding
- 🛠️ ToolNode type

```
┌─────────────────────────────────────┐
│ orchestrator 🔗                     │  ← A2A badge
├─────────────────────────────────────┤
│ Model: mainModel                    │
│ [Implementation code...]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🛠️ tools (ToolNode) 🔗              │  ← ToolNode + A2A
├─────────────────────────────────────┤
│ Type: ToolNode                      │
│ A2A Clients: Enabled                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ research_executor 🔌                │  ← MCP badge
├─────────────────────────────────────┤
│ Model: researchModel                │
│ MCP Servers: web-search             │
└─────────────────────────────────────┘
```

### File Structure

#### New Files

```
webview-ui/src/workflow-editor/
├── settings/
│   ├── A2AClientEditor.tsx            # NEW: A2A client management
│   ├── ModelEditor.tsx                # From Phase 9C
│   ├── MCPServerEditor.tsx            # From Phase 9D
│   └── NodeBadges.tsx                 # NEW: Badge components
```

#### Modified Files

```
webview-ui/src/workflow-editor/
├── WorkflowSettingsPanel.tsx          # MODIFY: Add A2A, Models, MCP tabs
├── WorkflowNode.tsx                   # MODIFY: Add badges for A2A/MCP
├── components/
│   └── ToolNode.tsx                   # MODIFY: Add badges
```

### Settings Panel Tab Structure

```
┌────────────────────────────────────────────┐
│ [Nodes] [Config] [State Graph] [Annotation]│
│ [A2A Clients] [Models] [MCP Servers]       │
├────────────────────────────────────────────┤
│                                            │
│  [Tab content based on selection]          │
│                                            │
└────────────────────────────────────────────┘
```

### Implementation Tasks

- [ ] Create `A2AClientEditor.tsx`
  - Client list table
  - Add/Edit/Delete functionality
  - URL validation
  - Timeout validation
- [ ] Create `NodeBadges.tsx` component
  - A2A badge (🔗)
  - MCP badge (🔌)
  - ToolNode badge (🛠️)
- [ ] Add "A2A Clients" tab to `WorkflowSettingsPanel.tsx`
- [ ] Update `WorkflowNode.tsx` to display badges
  - Check if model has bindA2AClients
  - Check if model has bindMcpServers
  - Display appropriate badges
- [ ] Update `ToolNode.tsx` to display badges
- [ ] Add validation for all A2A/MCP configurations
- [ ] Test: Full workflow with A2A clients and MCP servers
- [ ] Test: Badges display correctly on nodes
- [ ] Test: Settings panel tabs work correctly

---

## Data Flow Architecture

### Loading Workflow with A2A/MCP

```
JSON File (research/main.json)
    ↓
Extension reads file
    ↓
postMessage({ command: 'load', data: workflowJSON })
    ↓
Webview receives message
    ↓
jsonToFlow(workflowJSON)
    ↓
Extracts: nodes, edges, a2aClients, mcpServers, models
    ↓
React Flow state (nodes, edges)
+ workflowConfig state (a2aClients, models, mcpServers)
    ↓
Render: Canvas + Settings Panel
```

### Saving Workflow with A2A/MCP

```
User clicks Save (Ctrl+S)
    ↓
flowToJson(nodes, edges, workflowConfig)
    ↓
Includes: a2aClients, models, mcpServers, config
    ↓
postMessage({ command: 'save', data: fullJSON })
    ↓
Extension writes to file
```

---

## Validation Strategy

### A2A Client Validation

```typescript
validateA2AClient(client: A2AClientConfig): ValidationResult {
  // Check cardUrl is valid URL
  // Check timeout is positive number
  // Check URL format matches agent.json pattern
}
```

### ToolNode Validation

```typescript
validateToolNode(node: WorkflowNode): ValidationResult {
  // Check type === "ToolNode"
  // Check useA2AClients is boolean
  // Check no function property exists
  // Warn if useA2AClients is true but no a2aClients defined
}
```

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

---

## Testing Strategy

### Phase 9A Tests
- [ ] Load research/main.json - verify a2aClients preserved
- [ ] Save workflow - verify a2aClients included
- [ ] Validate A2A client with invalid URL - verify error

### Phase 9B Tests
- [ ] Load workflow with ToolNode - verify displays correctly
- [ ] Save workflow with ToolNode - verify type preserved
- [ ] Load conditional edge - verify possibleTargets preserved
- [ ] Create workflow with ToolNode in UI

### Phase 9C Tests
- [ ] Add model with bindA2AClients - verify saved
- [ ] Edit model systemPrompt - verify saved
- [ ] Delete model - verify removed from config
- [ ] Model validation with missing A2A clients

### Phase 9D Tests
- [ ] Load workflow with MCP servers - verify preserved
- [ ] Add MCP server in UI - verify saved
- [ ] Edit MCP config - verify updated
- [ ] Model with bindMcpServers displays correctly

### Phase 9E Tests
- [ ] A2A client CRUD operations work
- [ ] Badges display on nodes correctly
- [ ] Settings panel tabs navigate properly
- [ ] Full workflow load/save with all features

---

## Migration Considerations

### Backward Compatibility

Existing workflows without A2A/MCP should continue to work:

```typescript
// In jsonToFlow.ts
const a2aClients = workflowConfig.a2aClients || {};
const mcpServers = workflowConfig.mcpServers || {};
const models = workflowConfig.models || [];

// Handle nodes without type field
const nodeType = node.type || 'function';
```

### Forward Compatibility

New fields should be optional and gracefully degraded:

```typescript
export interface WorkflowConfig {
  // ... existing required fields
  a2aClients?: Record<string, A2AClientConfig>;  // Optional
  mcpServers?: Record<string, MCPServerConfig>;  // Optional
}
```

---

## Success Criteria

### Phase 9A Success
- ✓ A2A clients load from JSON
- ✓ A2A clients save to JSON
- ✓ Type definitions complete
- ✓ Validation functions work

### Phase 9B Success
- ✓ ToolNode displays in canvas
- ✓ ToolNode saves with correct structure
- ✓ Conditional edges with possibleTargets work
- ✓ useA2AClients flag preserved

### Phase 9C Success
- ✓ Models with bindA2AClients work
- ✓ System prompts save/load
- ✓ Model editor UI functional
- ✓ Model validation prevents errors

### Phase 9D Success
- ✓ MCP servers load/save correctly
- ✓ MCP config preserved
- ✓ bindMcpServers flag works
- ✓ MCP editor UI functional

### Phase 9E Success
- ✓ A2A client management UI works
- ✓ All settings tabs functional
- ✓ Badges display correctly
- ✓ Complete workflow can be created and saved

---

## Implementation Order

**Recommended sequence:**

1. **Phase 9A** (Foundation) - Type definitions and basic A2A support
2. **Phase 9B** (Node Types) - ToolNode and conditional edges
3. **Phase 9C** (Model Binding) - Model configuration enhancements
4. **Phase 9D** (MCP Integration) - MCP server support
5. **Phase 9E** (UI Completion) - Comprehensive settings UI

Each phase builds on the previous one and can be tested independently.

---

## Key Files Reference

### Type Definitions
- [workflow.types.ts](../webview-ui/src/workflow-editor/types/workflow.types.ts)

### Converters
- [jsonToFlow.ts](../webview-ui/src/workflow-editor/utils/jsonToFlow.ts)
- [flowToJson.ts](../webview-ui/src/workflow-editor/utils/flowToJson.ts)

### Settings Components
- [WorkflowSettingsPanel.tsx](../webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx)
- [validation.ts](../webview-ui/src/workflow-editor/utils/validation.ts)

### Example Data
- [research/main.json](../json/research/main.json) - A2A Client example
- [research/subagents/research-execution.json](../json/research/subagents/research-execution.json) - MCP Server example

---

## Estimated Total Time

- **Phase 9A**: 2-3 days
- **Phase 9B**: 3-4 days
- **Phase 9C**: 2-3 days
- **Phase 9D**: 2-3 days
- **Phase 9E**: 3-4 days

**Total**: 12-17 days (approximately 2-3 weeks)

---

## Integration with Main Implementation Plan

This phase should be added to [IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) after Phase 8:

```markdown
#### [Phase 9: A2A Client/Server & Advanced Features](phases/PHASE9_A2A_MCP_ADVANCED.md) ⬜

Agent-to-Agent communication and advanced workflow features

**Sub-phases:**
- Phase 9A: Type definitions and A2A Client configuration (Foundation)
- Phase 9B: ToolNode support and conditional edge enhancements (Node types)
- Phase 9C: Model configuration enhancements (Model binding)
- Phase 9D: MCP Server integration (Future-ready)
- Phase 9E: UI for A2A/MCP management (Settings panel)

**Main Tasks:**
- A2A client configuration support
- ToolNode type implementation
- Conditional edge with possibleTargets
- Model binding to A2A clients
- MCP server integration
- Comprehensive settings UI
```

## Next Steps

After Phase 9 completion, the workflow editor will support:
- ✓ Basic workflow editing (Phases 1-7)
- ✓ Workflow settings (Phase 8)
- ✓ A2A Client/Server integration (Phase 9A-E)
- ✓ MCP Server integration (Phase 9D)
- ✓ Advanced node types (ToolNode)
- ✓ Advanced edge types (Conditional with targets)
- ✓ Model binding to external services

The editor will be feature-complete for SceneGraphManager workflows with agent-to-agent communication and external tool integration.
