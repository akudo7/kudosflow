# A2A Workflow Configuration Reference

**Complete JSON Schema Reference for A2A Server Workflows**

**Last Updated**: 2025-12-24 | **Phase**: 16C Documentation

---

## Table of Contents

1. [Configuration File Format](#configuration-file-format)
2. [Top-Level Structure](#top-level-structure)
3. [Config Section](#config-section)
4. [State Annotation](#state-annotation)
5. [Annotation Fields](#annotation-fields)
6. [Model Configuration](#model-configuration)
7. [Node Definitions](#node-definitions)
8. [Edge Types](#edge-types)
9. [State Graph Configuration](#state-graph-configuration)
10. [Complete Examples](#complete-examples)

---

## Configuration File Format

A2A workflow configuration files are JSON documents that define the structure, behavior, and execution flow of agent workflows. These files are compatible with both the VSCode extension and standalone CLI server.

### File Location

Workflow JSON files can be located anywhere, but common locations include:
- `json/a2a/servers/` - Server-side agent workflows
- `json/a2a/clients/` - Client orchestrator workflows
- Custom directories (specify path when launching)

### Compatibility

Workflow configurations are **fully compatible** between:
- VSCode Extension A2A Server
- CLI A2A Server
- Any A2A Protocol v0.3.0 compliant runtime

---

## Top-Level Structure

Every workflow configuration has these top-level fields:

```json
{
  "config": { ... },              // Server and execution configuration
  "stateAnnotation": { ... },     // State annotation type definition
  "annotation": { ... },          // State field definitions
  "models": [ ... ],              // LLM model configurations
  "nodes": [ ... ],               // Workflow node definitions
  "edges": [ ... ],               // Workflow edge definitions
  "stateGraph": { ... }           // Graph compilation settings
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `config` | object | Yes | Server and execution configuration including A2A endpoint settings |
| `stateAnnotation` | object | Yes | State annotation type definition (usually `Annotation.Root`) |
| `annotation` | object | Yes | State field definitions with types, reducers, and defaults |
| `models` | array | Yes | LLM model configurations for workflow nodes |
| `nodes` | array | Yes | Workflow node definitions (functions or tool nodes) |
| `edges` | array | Yes | Workflow edge definitions (regular or conditional) |
| `stateGraph` | object | Yes | Graph compilation settings including checkpointer |

---

## Config Section

The `config` section defines server behavior, execution limits, and A2A endpoint configuration.

### Structure

```json
{
  "config": {
    "recursionLimit": 100,
    "eventEmitter": {
      "defaultMaxListeners": 20
    },
    "a2aEndpoint": {
      "agentCard": { ... },
      "port": 3001,
      "executor": { ... }
    }
  }
}
```

### recursionLimit

**Type**: `number`
**Default**: `100`
**Description**: Maximum number of node executions allowed in a single workflow invocation. Prevents infinite loops.

**Example**:
```json
{
  "config": {
    "recursionLimit": 100
  }
}
```

### eventEmitter

**Type**: `object`
**Optional**: Yes
**Description**: Node.js EventEmitter configuration for internal event handling.

**Fields**:
- `defaultMaxListeners` (number): Maximum event listeners (default: 10, recommended: 20 for complex workflows)

### a2aEndpoint

**Type**: `object`
**Required**: Yes
**Description**: A2A Protocol v0.3.0 endpoint configuration including AgentCard metadata.

#### agentCard

**Type**: `object`
**Required**: Yes
**Description**: Agent metadata exposed via `/.well-known/agent.json` endpoint.

**Structure**:
```json
{
  "agentCard": {
    "name": "TaskCreationAgent",
    "description": "Creates and manages research tasks",
    "protocolVersion": "0.3.0",
    "version": "1.0.0",
    "url": "http://localhost:3001/",
    "capabilities": {
      "streaming": false,
      "pushNotifications": false,
      "stateTransitionHistory": true
    },
    "skills": [
      {
        "id": "task_decomposition",
        "name": "Task Decomposition",
        "description": "Breaking down complex requests",
        "tags": ["planning", "analysis"]
      }
    ]
  }
}
```

**Field Reference**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent display name |
| `description` | string | Yes | Agent purpose and capabilities |
| `protocolVersion` | string | Yes | A2A protocol version (must be "0.3.0") |
| `version` | string | Yes | Agent version (semantic versioning) |
| `url` | string | Yes | Base URL for agent endpoints |
| `capabilities` | object | Yes | Agent capability flags |
| `capabilities.streaming` | boolean | Yes | Supports streaming responses |
| `capabilities.pushNotifications` | boolean | Yes | Supports push notifications |
| `capabilities.stateTransitionHistory` | boolean | Yes | Tracks state transitions |
| `skills` | array | No | List of agent skills/capabilities |

**Skills Structure**:
```json
{
  "id": "skill_id",
  "name": "Skill Name",
  "description": "What this skill does",
  "tags": ["category1", "category2"]
}
```

#### port

**Type**: `number`
**Required**: Yes
**Description**: Port number for the A2A server. Each agent instance must use a unique port.

**Example Ports**:
- Task Creation Agent: `3001`
- Research Execution Agent: `3002`
- Quality Evaluation Agent: `3003`
- Client Orchestrator: `3000`

#### executor

**Type**: `object`
**Optional**: Yes
**Description**: Executor configuration for task management.

**Structure**:
```json
{
  "executor": {
    "type": "AgentExecutor",
    "config": {
      "taskLifecycle": true,
      "streaming": false,
      "errorHandling": "standard",
      "humanInTheLoop": false
    }
  }
}
```

**Fields**:
- `type`: Executor implementation type (usually "AgentExecutor")
- `config.taskLifecycle`: Enable task lifecycle tracking
- `config.streaming`: Enable streaming responses
- `config.errorHandling`: Error handling strategy ("standard" or "strict")
- `config.humanInTheLoop`: Enable human-in-the-loop features

---

## State Annotation

The `stateAnnotation` section defines the type system for workflow state.

### Structure

```json
{
  "stateAnnotation": {
    "name": "AgentState",
    "type": "Annotation.Root"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the state annotation (referenced throughout config) |
| `type` | string | Yes | Annotation type (always "Annotation.Root" for root state) |

**Note**: The `name` value is referenced in node parameters as `typeof AgentState.State`.

---

## Annotation Fields

The `annotation` section defines the structure of workflow state, including field types, reducers, and default values.

### Structure

```json
{
  "annotation": {
    "messages": {
      "type": "BaseMessage[]",
      "reducer": "(x, y) => x.concat(y)",
      "default": []
    },
    "taskList": {
      "type": "any[]",
      "reducer": "(x, y) => y || x",
      "default": []
    }
  }
}
```

### Field Definition

Each annotation field has three properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | Yes | TypeScript type definition for the field |
| `reducer` | string | Yes | JavaScript reducer function for state updates |
| `default` | any | Yes | Default value when state is initialized |

### Common Field Types

#### messages

**Type**: `BaseMessage[]`
**Reducer**: `(x, y) => x.concat(y)` (concatenates message arrays)
**Default**: `[]`
**Description**: Conversation history as an array of messages.

**Example**:
```json
{
  "messages": {
    "type": "BaseMessage[]",
    "reducer": "(x, y) => x.concat(y)",
    "default": []
  }
}
```

#### Custom Fields (taskList, approvalStatus, etc.)

**Pattern**: Last-write-wins reducer `(x, y) => y || x`
**Description**: Updates with new value or keeps existing if new value is falsy.

**Examples**:
```json
{
  "taskList": {
    "type": "any[]",
    "reducer": "(x, y) => y || x",
    "default": []
  },
  "approvalStatus": {
    "type": "string",
    "reducer": "(x, y) => y || x",
    "default": "pending"
  },
  "feedback": {
    "type": "string",
    "reducer": "(x, y) => y || x",
    "default": ""
  }
}
```

### Reducer Patterns

#### Concatenation Reducer

**Pattern**: `(x, y) => x.concat(y)`
**Use Case**: Appending to arrays (messages, events, logs)
**Behavior**: Combines existing and new arrays

#### Last-Write-Wins Reducer

**Pattern**: `(x, y) => y || x`
**Use Case**: Single-value fields (status, flags, IDs)
**Behavior**: Uses new value if truthy, otherwise keeps existing

#### Custom Merge Reducer

**Pattern**: `(x, y) => ({ ...x, ...y })`
**Use Case**: Object merging (configs, metadata)
**Behavior**: Shallow merge of objects

---

## Model Configuration

The `models` array defines LLM configurations used by workflow nodes.

### Structure

```json
{
  "models": [
    {
      "id": "taskModel",
      "type": "OpenAI",
      "config": {
        "model": "gpt-4o-mini",
        "temperature": 0.3
      },
      "systemPrompt": "You are a helpful assistant..."
    }
  ]
}
```

### Model Definition

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier referenced in node `modelRef` |
| `type` | string | Yes | Model provider type: "OpenAI", "Anthropic", or "Ollama" |
| `config` | object | Yes | Provider-specific model configuration |
| `systemPrompt` | string | No | System prompt for the model |

### OpenAI Configuration

**Type**: `"OpenAI"`
**Environment Variables**: `OPENAI_API_KEY`

**Config Fields**:
```json
{
  "type": "OpenAI",
  "config": {
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "max_tokens": 2000,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }
}
```

**Available Models**:
- `gpt-4o`: Most capable, higher cost
- `gpt-4o-mini`: Balanced performance and cost (recommended)
- `gpt-3.5-turbo`: Faster, lower cost

### Anthropic Configuration

**Type**: `"Anthropic"`
**Environment Variables**: `ANTHROPIC_API_KEY`

**Config Fields**:
```json
{
  "type": "Anthropic",
  "config": {
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.3,
    "max_tokens": 4096
  }
}
```

**Available Models**:
- `claude-3-5-sonnet-20241022`: Most capable Sonnet model
- `claude-3-5-haiku-20241022`: Fast and efficient

### Ollama Configuration

**Type**: `"Ollama"`
**Environment Variables**: `OLLAMA_BASE_URL` (default: `http://localhost:11434`)

**Config Fields**:
```json
{
  "type": "Ollama",
  "config": {
    "model": "llama3.1",
    "temperature": 0.3
  }
}
```

**Note**: Requires local Ollama installation.

### System Prompt Best Practices

System prompts define agent behavior and capabilities. Include:

1. **Role Definition**: What the agent does
2. **Responsibilities**: Specific tasks and capabilities
3. **Guidelines**: How to perform tasks
4. **Output Format**: Expected response structure
5. **Constraints**: Limitations and boundaries

**Example**:
```json
{
  "systemPrompt": "You are a Task Creation Agent specialized in breaking down market research requests into actionable tasks. Your responsibilities: 1. Analyze user research requests and decompose them into specific, measurable tasks 2. Create comprehensive task lists with clear objectives, methodologies, and success criteria 3. Prioritize tasks based on dependencies and importance. Task Creation Guidelines: - Each task should have: clear objective, specific methodology, expected deliverables, success criteria, estimated effort."
}
```

---

## Node Definitions

The `nodes` array defines workflow execution units (functions or tool nodes).

### Node Types

1. **Function Nodes**: Execute JavaScript functions with model access
2. **Tool Nodes**: Bind tools (including A2A client tools) for agent use

### Function Node Structure

```json
{
  "id": "task_creator",
  "function": {
    "parameters": [
      {
        "name": "state",
        "type": "typeof AgentState.State"
      },
      {
        "name": "model",
        "type": "ModelConfig",
        "modelRef": "taskModel"
      }
    ],
    "output": {
      "messages": "Message[]",
      "taskList": "any[]"
    },
    "implementation": "const response = await model.invoke(state.messages); return { messages: [response] };"
  }
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique node identifier referenced in edges |
| `function` | object | Yes | Function definition including parameters, output, and implementation |
| `function.parameters` | array | Yes | Function parameter definitions |
| `function.output` | object | Yes | Return value type definition |
| `function.implementation` | string | Yes | JavaScript function body |

### Parameter Types

#### State Parameter

**Required**: Yes (first parameter)
**Structure**:
```json
{
  "name": "state",
  "type": "typeof AgentState.State"
}
```

**Description**: Provides access to current workflow state with all annotation fields.

#### Model Parameter

**Optional**: Yes (if node uses LLM)
**Structure**:
```json
{
  "name": "model",
  "type": "ModelConfig",
  "modelRef": "taskModel"
}
```

**Description**: Provides access to configured LLM model via `modelRef`.

### Output Definition

The `output` field defines which state fields the node updates.

**Example**:
```json
{
  "output": {
    "messages": "Message[]",
    "taskList": "any[]"
  }
}
```

**Rules**:
- Field names must match annotation field names
- Types should match annotation types
- Only specified fields are updated in state

### Implementation

The `implementation` field contains the JavaScript function body executed by the node.

**Best Practices**:

1. **Access State**: Use `state.fieldName` to read state
2. **Invoke Model**: Use `await model.invoke(messages)` for LLM calls
3. **Return Object**: Return object with output fields matching `output` definition
4. **Logging**: Use `console.log()` for debugging (visible in server logs)
5. **Error Handling**: Use try-catch for robust error handling

**Example with Error Handling**:
```javascript
try {
  const response = await model.invoke(state.messages);
  return {
    messages: [response],
    status: 'completed'
  };
} catch (error) {
  console.error('Node execution failed:', error);
  return {
    messages: [{ role: 'assistant', content: 'Error occurred' }],
    status: 'failed'
  };
}
```

### Tool Node Structure

**Note**: Used for binding A2A client tools in orchestrator workflows.

```json
{
  "id": "agent_tools",
  "toolNode": {
    "bindA2AClients": [
      {
        "clientRef": "taskCreationClient",
        "toolName": "task_creation"
      }
    ]
  }
}
```

**See**: [Orchestration Guide](orchestration.md) for multi-agent tool binding.

---

## Edge Types

The `edges` array defines workflow execution flow between nodes.

### Edge Categories

1. **Regular Edges**: Direct node-to-node transitions
2. **Conditional Edges**: Dynamic routing based on state

### Regular Edge

**Structure**:
```json
{
  "from": "task_creator",
  "to": "approval_gate"
}
```

**Fields**:
- `from` (string, required): Source node ID or `"__start__"` for entry point
- `to` (string, required): Target node ID or `"__end__"` for exit point

**Special Node IDs**:
- `__start__`: Workflow entry point
- `__end__`: Workflow exit point

### Conditional Edge

**Structure**:
```json
{
  "type": "conditional",
  "from": "approval_gate",
  "condition": {
    "name": "shouldEnd",
    "function": {
      "parameters": [
        {
          "name": "state",
          "type": "typeof AgentState.State"
        }
      ],
      "output": "string",
      "implementation": "if (state.approvalStatus === 'approved') { return '__end__'; } else if (state.approvalStatus === 'rejected') { return 'task_refiner'; } else { return '__end__'; }",
      "possibleTargets": ["__end__", "task_refiner"]
    }
  }
}
```

**Fields**:
- `type`: Always `"conditional"` for conditional edges
- `from`: Source node ID
- `condition`: Condition definition object
- `condition.name`: Condition function name (for debugging)
- `condition.function`: Function definition
- `condition.function.parameters`: Always `[{ "name": "state", "type": "typeof AgentState.State" }]`
- `condition.function.output`: Always `"string"` (target node ID)
- `condition.function.implementation`: JavaScript returning target node ID
- `condition.function.possibleTargets`: Array of possible target node IDs

**Implementation Rules**:
- Must return a string (target node ID)
- Return value must be in `possibleTargets` array
- Can return `"__end__"` to terminate workflow

**Example Flow**:
```text
task_creator → approval_gate → conditional edge
                                    ↓
                    approved → __end__
                    rejected → task_refiner → approval_gate (loop)
                    pending → __end__
```

---

## State Graph Configuration

The `stateGraph` section defines graph compilation settings.

### Structure

```json
{
  "stateGraph": {
    "annotationRef": "AgentState",
    "config": {
      "checkpointer": {
        "type": "MemorySaver"
      }
    }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `annotationRef` | string | Yes | Reference to state annotation name |
| `config` | object | Yes | Graph configuration including checkpointer |
| `config.checkpointer` | object | No | State persistence configuration |

### Checkpointer

The checkpointer enables state persistence for multi-turn conversations.

**Type**: `"MemorySaver"` (in-memory persistence)

**Example**:
```json
{
  "checkpointer": {
    "type": "MemorySaver"
  }
}
```

**Behavior**:
- Stores state in memory per `thread_id`
- Enables conversation context across requests
- Supports interrupt/resume workflows
- Clears on server restart

**Alternative Options** (not yet implemented):
- `"PostgreSQL"`: Persistent database storage
- `"Redis"`: Distributed cache storage
- `"FileSystem"`: File-based persistence

---

## Complete Examples

### Example 1: Task Creation Agent

**File**: `/Users/akirakudo/Desktop/MyWork/test/json/a2a/servers/task-creation.json`

**Purpose**: Creates and manages research task lists with human approval workflow.

**Key Features**:
- OpenAI GPT-4o-mini model
- Task decomposition and prioritization
- Human approval gate with conditional routing
- Task refinement loop on rejection

**Workflow**:
```text
__start__ → task_creator → approval_gate → conditional
                                              ↓
                               approved → __end__
                               rejected → task_refiner → approval_gate (loop)
```

**State Fields**:
- `messages`: Conversation history
- `taskList`: Array of task objects
- `approvalStatus`: "pending" | "approved" | "rejected"
- `feedback`: User feedback string

**Nodes**:
1. `task_creator`: Decomposes request into structured tasks
2. `approval_gate`: Manages approval workflow
3. `task_refiner`: Refines tasks based on feedback

**See**: Full configuration at [task-creation.json](../../json/a2a/servers/task-creation.json) (if accessible)

### Example 2: Research Execution Agent

**File**: `/Users/akirakudo/Desktop/MyWork/test/json/a2a/servers/research-execution.json`

**Purpose**: Executes research tasks with web search and analysis.

**Key Features**:
- Anthropic Claude model for research
- Tool binding for web search
- Structured output formatting
- Quality validation

**Typical Use Case**:
```bash
# Receives task from orchestrator
{
  "message": {
    "parts": [{
      "type": "text",
      "text": "Research company X's market position"
    }]
  }
}

# Returns research findings
{
  "result": {
    "findings": [...],
    "sources": [...],
    "summary": "..."
  }
}
```

### Example 3: Client Orchestrator

**File**: `/Users/akirakudo/Desktop/MyWork/test/json/a2a/servers/client.json`

**Purpose**: Coordinates multiple agents for complex workflows.

**Key Features**:
- Binds multiple A2A clients as tools
- Sequential task execution
- Aggregates results from multiple agents

**Agent Coordination**:
```text
User Request → Client Orchestrator
                    ↓
         task_creation (Agent 1) → Task List
                    ↓
         research_execution (Agent 2) → Research Results
                    ↓
         quality_evaluation (Agent 3) → Quality Score
                    ↓
         → Final Report
```

**See**: [Orchestration Guide](orchestration.md) for multi-agent patterns.

---

## Configuration Validation

### Required Fields Checklist

- [ ] `config.recursionLimit` defined
- [ ] `config.a2aEndpoint.agentCard` complete
- [ ] `config.a2aEndpoint.port` specified
- [ ] `stateAnnotation.name` defined
- [ ] `annotation` has at least `messages` field
- [ ] `models` array has at least one model
- [ ] `nodes` array has at least one node
- [ ] `edges` array connects all nodes
- [ ] `stateGraph.annotationRef` matches `stateAnnotation.name`

### Common Configuration Errors

1. **Missing modelRef**: Node references non-existent model ID
2. **Invalid reducer**: Reducer syntax error in annotation
3. **Disconnected nodes**: Node not reachable from `__start__`
4. **Missing possibleTargets**: Conditional edge missing targets array
5. **Type mismatch**: Node output doesn't match annotation field type

**See**: [Troubleshooting Guide](troubleshooting.md) for error solutions.

---

## Summary

This reference covers the complete A2A workflow JSON configuration format. Key takeaways:

✅ **Structured State Management**
- State annotations define workflow state structure
- Reducers control state update behavior
- Fields support complex data types and arrays

✅ **Flexible Model Configuration**
- Support for OpenAI, Anthropic, and Ollama
- Per-node model binding via modelRef
- System prompts define agent behavior

✅ **Powerful Workflow Control**
- Regular edges for linear flow
- Conditional edges for dynamic routing
- Loop support for iterative refinement

✅ **A2A Protocol Compliance**
- AgentCard metadata for discovery
- Standardized endpoint configuration
- Skills definition for capability advertising

---

## Related Documentation

- [Implementation Guide](implementation-guide.md) - Step-by-step setup instructions
- [Architecture Comparison](comparison.md) - VSCode vs CLI implementation
- [Orchestration Guide](orchestration.md) - Multi-agent workflow patterns
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

**Ready to build workflows?** See [Implementation Guide](implementation-guide.md) to get started.
