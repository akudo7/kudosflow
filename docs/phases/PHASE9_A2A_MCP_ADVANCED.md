# Phase 9: A2A Client/Server & Advanced Features Implementation Plan

## Overview

This plan adds support for **A2A (Agent-to-Agent) Clients/Servers**, **ToolNode**, **Conditional Edges**, and **MCP (Model Context Protocol) Servers** based on the research workflow JSON files in `json/research/`.

### Scope Analysis

Based on the implementation requirements, this is a **large feature set** that has been split into **six sub-phases** to manage complexity and reduce context usage:

- **[Phase 9A](phase9/PHASE9A_EDITABLE_PARAMS_OUTPUT.md)**: Editable node Parameters and Output (Foundation UI)
- **[Phase 9B](phase9/PHASE9B_A2A_CLIENT.md)**: Type definitions and A2A Client configuration (Data structures)
- **[Phase 9C](phase9/PHASE9C_TOOLNODE_CONDITIONAL.md)**: ToolNode support and conditional edge enhancements (Node types)
- **[Phase 9D](phase9/PHASE9D_MODEL_CONFIG.md)**: Model configuration enhancements (Model binding)
- **[Phase 9E](phase9/PHASE9E_MCP_INTEGRATION.md)**: MCP Server integration (Future-ready)
- **[Phase 9F](phase9/PHASE9F_UI_MANAGEMENT.md)**: UI for A2A/MCP management (Settings panel)

---

## Sub-Phases Overview

### [Phase 9A: Editable Node Parameters and Output](phase9/PHASE9A_EDITABLE_PARAMS_OUTPUT.md)

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium
**Priority**: ⭐ Foundation for all Phase 9 features

Make node Parameters and Output editable in WorkflowNode component.

**Key Tasks:**
- Add validation functions for parameter names and output keys
- Implement inline parameter editor with add/remove functionality
- Implement inline output editor with add/remove functionality
- Handle empty parameters/output cases gracefully
- Match Implementation section UI/UX pattern

**Benefits:**
- Provides UI foundation for Phase 9B-9F
- Enables modelRef field editing (needed for Phase 9B)
- Consistent editing experience across all node properties

---

### [Phase 9B: Type Definitions and A2A Client Configuration](phase9/PHASE9B_A2A_CLIENT.md)

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium

Establish foundation types for A2A client configuration.

**Key Tasks:**
- Define `A2AClientConfig` interface
- Update `WorkflowConfig` to support `a2aClients`
- Implement JSON converters for A2A data
- Add validation for A2A clients

**Dependencies:** Phase 9A (parameter editor supports modelRef field)

---

### [Phase 9C: ToolNode Support and Conditional Edge Enhancements](phase9/PHASE9C_TOOLNODE_CONDITIONAL.md)

**Status**: ⬜ 未開始
**Time**: 3-4 days
**Complexity**: High

Add support for ToolNode type and enhanced conditional edges.

**Key Tasks:**
- Implement `ToolNode` type with `useA2AClients` flag
- Enhance `ConditionalEdge` with `possibleTargets`
- Create ToolNode visualization component
- Update converters for ToolNode

**Dependencies:** Phase 9A (editable parameters), Phase 9B (A2A client types)

---

### [Phase 9D: Model Configuration Enhancements](phase9/PHASE9D_MODEL_CONFIG.md)

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium

Extend model configuration to support A2A binding and system prompts.

**Key Tasks:**
- Add `bindA2AClients` flag to ModelConfig
- Add `systemPrompt` field to ModelConfig
- Create Model Editor UI component
- Add Models tab to settings panel

**Dependencies:** Phase 9B (A2A client types)

---

### [Phase 9E: MCP Server Integration](phase9/PHASE9E_MCP_INTEGRATION.md)

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium

Add MCP server configuration support and model binding.

**Key Tasks:**
- Define `MCPServerConfig` interface
- Add `mcpServers` to WorkflowConfig
- Create MCP Server Editor UI
- Add MCP Servers tab to settings panel

**Dependencies:** Phase 9B (A2A client pattern)

---

### [Phase 9F: UI for A2A/MCP Management](phase9/PHASE9F_UI_MANAGEMENT.md)

**Status**: ⬜ 未開始
**Time**: 3-4 days
**Complexity**: High

Create comprehensive UI for managing all Phase 9 features.

**Key Tasks:**
- Create A2A Client Editor component
- Add visual badges for A2A/MCP/ToolNode
- Integrate all settings tabs
- Complete end-to-end testing

**Dependencies:** All previous Phase 9 sub-phases

---

## Estimated Total Time

- **Phase 9A**: 2-3 days (Editable Parameters/Output)
- **Phase 9B**: 2-3 days (A2A Client Configuration)
- **Phase 9C**: 3-4 days (ToolNode & Conditional Edges)
- **Phase 9D**: 2-3 days (Model Configuration)
- **Phase 9E**: 2-3 days (MCP Server Integration)
- **Phase 9F**: 3-4 days (UI Management)

**Total**: 14-20 days (approximately 3-4 weeks)

---

## Implementation Order

**Recommended sequence:**

1. **Phase 9A** (Foundation UI) - Editable Parameters and Output
2. **Phase 9B** (Data Structures) - Type definitions and basic A2A support
3. **Phase 9C** (Node Types) - ToolNode and conditional edges
4. **Phase 9D** (Model Binding) - Model configuration enhancements
5. **Phase 9E** (MCP Integration) - MCP server support
6. **Phase 9F** (UI Completion) - Comprehensive settings UI

Each phase builds on the previous one and can be tested independently.

**Why Phase 9A comes first:**
- Provides consistent editing UI foundation
- Enables modelRef field editing needed for Phase 9B
- Establishes UI patterns that Phase 9F will follow
- Can be implemented and tested independently
- Low risk, high value foundation work

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

### Overall Phase 9 Success

- ✓ All sub-phases completed successfully
- ✓ A2A clients fully functional (load/save/edit)
- ✓ ToolNode displays and functions correctly
- ✓ Model binding to A2A/MCP works
- ✓ MCP servers can be configured
- ✓ Comprehensive settings UI operational
- ✓ Badges display on nodes correctly
- ✓ Full workflow with all features can be created and saved
- ✓ Backward compatibility maintained

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
- [research/main.json](../json/research/main.json) - A2A Client and ToolNode example
- [research/subagents/research-execution.json](../json/research/subagents/research-execution.json) - MCP Server example

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

---

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
