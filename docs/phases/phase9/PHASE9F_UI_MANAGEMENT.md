# Phase 9E: UI for A2A/MCP Management (Settings Panel)

**Status**: ⬜ 未開始
**Estimated Time**: 3-4 days
**Complexity**: High

## Implementation Goals

1. Create comprehensive A2A client management UI
2. Integrate all Phase 9 features into settings panel
3. Add visual indicators for A2A/MCP usage
4. Improve node visualization for advanced features

## Key Features

### 1. A2A Client Editor UI

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

### 2. Enhanced Node Visualization

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

## File Structure

### New Files

```
webview-ui/src/workflow-editor/
├── settings/
│   ├── A2AClientEditor.tsx            # NEW: A2A client management
│   ├── ModelEditor.tsx                # From Phase 9C
│   ├── MCPServerEditor.tsx            # From Phase 9D
│   └── NodeBadges.tsx                 # NEW: Badge components
```

### Modified Files

```
webview-ui/src/workflow-editor/
├── WorkflowSettingsPanel.tsx          # MODIFY: Add A2A, Models, MCP tabs
├── WorkflowNode.tsx                   # MODIFY: Add badges for A2A/MCP
├── components/
│   └── ToolNode.tsx                   # MODIFY: Add badges
```

## Settings Panel Tab Structure

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

## Implementation Tasks

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

## Testing

### Phase 9E Tests

- [ ] A2A client CRUD operations work
- [ ] Badges display on nodes correctly
- [ ] Settings panel tabs navigate properly
- [ ] Full workflow load/save with all features

## Success Criteria

- ✓ A2A client management UI works
- ✓ All settings tabs functional
- ✓ Badges display correctly
- ✓ Complete workflow can be created and saved

## Key Files Reference

### Settings Components
- [WorkflowSettingsPanel.tsx](../../webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx)

### Node Components
- [WorkflowNode.tsx](../../webview-ui/src/workflow-editor/WorkflowNode.tsx)
- [ToolNode.tsx](../../webview-ui/src/workflow-editor/components/ToolNode.tsx)

### Example Data
- [research/main.json](../../json/research/main.json) - Full example with A2A, MCP, ToolNode
- [research/subagents/research-execution.json](../../json/research/subagents/research-execution.json) - MCP configuration example
