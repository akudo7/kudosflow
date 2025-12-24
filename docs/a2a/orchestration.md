# A2A Multi-Agent Orchestration Guide

**Building Complex Workflows with Agent-to-Agent Communication**

**Last Updated**: 2025-12-24 | **Phase**: 16C Documentation

---

## Table of Contents

1. [Introduction](#introduction)
2. [Multi-Agent Architecture](#multi-agent-architecture)
3. [A2A Client Configuration](#a2a-client-configuration)
4. [Agent-to-Agent Communication](#agent-to-agent-communication)
5. [ToolNode with A2A Clients](#toolnode-with-a2a-clients)
6. [Orchestrator Design Patterns](#orchestrator-design-patterns)
7. [Port Management](#port-management)
8. [Testing Multi-Agent Workflows](#testing-multi-agent-workflows)

---

## Introduction

A2A (Agent-to-Agent) Protocol enables complex workflows by allowing agents to communicate and coordinate with each other. This guide explains how to build orchestrator agents that coordinate multiple specialized agents to accomplish complex tasks.

### What is Multi-Agent Orchestration?

Multi-agent orchestration is a pattern where a **coordinator agent** (orchestrator) delegates tasks to multiple **specialized agents**, each responsible for a specific domain or capability.

**Example Workflow**:
```text
User Request → Orchestrator Agent
                    ↓
         ┌──────────┴──────────┬──────────────┐
         ↓                     ↓              ↓
    Task Creation         Research       Quality
       Agent             Agent          Evaluation
         ↓                     ↓              ↓
    Task List           Research      Quality Score
         └──────────┬──────────┴──────────────┘
                    ↓
            Orchestrator Agent
                    ↓
            Final Report
```

### Benefits

1. **Separation of Concerns**: Each agent has a focused responsibility
2. **Reusability**: Specialized agents can be used in multiple workflows
3. **Scalability**: Agents can run on different machines/ports
4. **Maintainability**: Easier to update and debug individual agents
5. **Parallel Execution**: Multiple agents can work simultaneously (with proper workflow design)

---

## Multi-Agent Architecture

### Architecture Overview

```text
┌─────────────────────────────────────────────────────┐
│              Orchestrator Agent (Port 3000)         │
│                                                     │
│  - Coordinates workflow phases                      │
│  - Binds A2A clients as tools                       │
│  - Manages state transitions                        │
│  - Synthesizes final results                        │
└────────────┬───────────┬──────────────┬─────────────┘
             │           │              │
    ┌────────┘           │              └─────────┐
    ↓                    ↓                        ↓
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐
│  Task Agent │  │ Research    │  │  Quality Agent   │
│ (Port 3001) │  │   Agent     │  │   (Port 3003)    │
│             │  │ (Port 3002) │  │                  │
│ - Creates   │  │ - Executes  │  │ - Evaluates      │
│   tasks     │  │   research  │  │   quality        │
│ - Validates │  │ - Web search│  │ - Provides       │
│ - Approves  │  │ - Analysis  │  │   scores         │
└─────────────┘  └─────────────┘  └──────────────────┘
```

### Component Roles

#### Orchestrator Agent

**Responsibilities**:
- Receives initial user request
- Determines workflow phase (task creation → research → quality → synthesis)
- Delegates to specialized agents via A2A calls
- Manages approval workflows and human-in-the-loop
- Synthesizes final results from all agents

**Key Features**:
- Uses `a2aClients` configuration to connect to specialized agents
- Binds A2A clients as tools for LLM to use
- Maintains workflow state across phases

#### Specialized Agents

**Responsibilities**:
- Expose A2A Protocol v0.3.0 endpoints
- Provide AgentCard with skills/capabilities
- Execute domain-specific tasks
- Return structured results

**Examples**:
1. **Task Creation Agent**: Breaks down requests into actionable tasks
2. **Research Agent**: Executes research with web search
3. **Quality Agent**: Evaluates results and provides quality scores

---

## A2A Client Configuration

### Configuration Structure

A2A clients are defined in the orchestrator's JSON configuration under the `a2aClients` section.

**Example** from [client.json](../../json/a2a/client.json):
```json
{
  "a2aClients": {
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json",
      "timeout": 30000
    },
    "research_agent": {
      "cardUrl": "http://localhost:3002/.well-known/agent.json",
      "timeout": 30000
    },
    "quality_agent": {
      "cardUrl": "http://localhost:3003/.well-known/agent.json",
      "timeout": 30000
    }
  }
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Client Key | string | Yes | Unique identifier for the client (e.g., "task_agent") |
| `cardUrl` | string | Yes | URL to agent's AgentCard endpoint |
| `timeout` | number | No | Request timeout in milliseconds (default: 30000) |

### cardUrl Format

The `cardUrl` must point to the agent's AgentCard endpoint following A2A Protocol v0.3.0:

**Pattern**: `http://{host}:{port}/.well-known/agent.json`

**Examples**:
- Local agent: `http://localhost:3001/.well-known/agent.json`
- Remote agent: `https://api.example.com/.well-known/agent.json`
- Docker service: `http://task-agent:3001/.well-known/agent.json`

### Client Discovery

When the orchestrator starts, it:
1. Fetches each AgentCard from `cardUrl`
2. Reads agent capabilities, skills, and endpoints
3. Creates tool functions for LLM to call
4. Tool names follow pattern: `send_message_to_{client_key}`

**Example Tool Names**:
- `send_message_to_task_agent`
- `send_message_to_research_agent`
- `send_message_to_quality_agent`

---

## Agent-to-Agent Communication

### Message Flow

```text
1. User sends request to Orchestrator
   ↓
2. Orchestrator LLM decides to use A2A tool
   ↓
3. Tool calls send_message_to_task_agent
   ↓
4. HTTP POST to http://localhost:3001/message/send
   ↓
5. Task Agent processes request
   ↓
6. Task Agent returns result
   ↓
7. Result added to Orchestrator state as tool message
   ↓
8. Orchestrator continues workflow
```

### Request Format

When the orchestrator calls an A2A client tool, it sends an A2A Protocol v0.3.0 message:

**HTTP Request**:
```http
POST http://localhost:3001/message/send
Content-Type: application/json

{
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Create research tasks for company analysis"
      }
    ]
  }
}
```

**Response**:
```json
{
  "taskId": "task-1766585108489-ds74n3zkr",
  "result": {
    "messages": [...],
    "taskList": [...]
  },
  "thread_id": "task-1766585108489-ds74n3zkr"
}
```

### State Passing

The orchestrator maintains state across A2A calls:

```javascript
// State after Task Agent call
{
  "messages": [
    { "role": "user", "content": "Research company X" },
    { "role": "assistant", "content": "I'll create tasks", "tool_calls": [...] },
    { "role": "tool", "name": "send_message_to_task_agent", "content": "Created 6 tasks..." }
  ],
  "currentPhase": "awaiting_task_approval",
  "tasksApproved": false
}

// After user approval
{
  "messages": [...],
  "currentPhase": "research_execution",
  "tasksApproved": true
}

// After Research Agent call
{
  "messages": [
    ...,
    { "role": "tool", "name": "send_message_to_research_agent", "content": "Research findings..." }
  ],
  "currentPhase": "quality_evaluation",
  "researchCompleted": true
}
```

---

## ToolNode with A2A Clients

### ToolNode Configuration

The `ToolNode` is a special node type that binds A2A clients as tools for the LLM to use.

**Configuration** from [client.json](../../json/a2a/client.json):
```json
{
  "nodes": [
    {
      "id": "tools",
      "type": "ToolNode",
      "useA2AClients": true
    }
  ]
}
```

### How It Works

1. **Tool Binding**: When `useA2AClients: true`, the ToolNode automatically:
   - Reads all clients from `a2aClients` configuration
   - Creates tool functions for each client
   - Tool names: `send_message_to_{client_key}`

2. **LLM Access**: The LLM model can call these tools:
   ```javascript
   const response = await model.invoke([{
     role: 'system',
     content: 'Use send_message_to_task_agent to create tasks'
   }, {
     role: 'user',
     content: 'Research company X'
   }]);

   // Response includes tool_calls
   {
     role: 'assistant',
     content: 'I will create research tasks',
     tool_calls: [{
       name: 'send_message_to_task_agent',
       args: { message: 'Create tasks for company X research' }
     }]
   }
   ```

3. **Tool Execution**: The ToolNode executes tool calls:
   - Sends A2A protocol message to target agent
   - Waits for response
   - Returns result as tool message

### Model Configuration for A2A Tools

Enable tool binding in model configuration:

```json
{
  "models": [
    {
      "id": "mainModel",
      "type": "OpenAI",
      "config": {
        "model": "gpt-4o-mini",
        "temperature": 0.7
      },
      "bindA2AClients": true,
      "systemPrompt": "You are an orchestrator. Use send_message_to_task_agent, send_message_to_research_agent, and send_message_to_quality_agent tools to coordinate workflow."
    }
  ]
}
```

**Key Field**: `"bindA2AClients": true` enables tool binding for this model.

---

## Orchestrator Design Patterns

### Pattern 1: Sequential Workflow

**Use Case**: Tasks must complete in order (task creation → approval → research → quality → synthesis)

**Implementation**:
```json
{
  "annotation": {
    "currentPhase": {
      "type": "string",
      "default": "task_creation"
    },
    "tasksApproved": { "type": "boolean", "default": false },
    "researchCompleted": { "type": "boolean", "default": false },
    "qualityEvaluated": { "type": "boolean", "default": false }
  },
  "nodes": [
    {
      "id": "orchestrator",
      "function": {
        "implementation": "
          if (state.currentPhase === 'task_creation') {
            // Call task_agent
            const response = await model.invoke([...]);
            return { currentPhase: 'awaiting_approval' };
          } else if (state.currentPhase === 'research_execution' && state.tasksApproved) {
            // Call research_agent
            const response = await model.invoke([...]);
            return { currentPhase: 'quality_evaluation' };
          }
          // ... continue phases
        "
      }
    }
  ]
}
```

**Workflow Diagram**:
```text
__start__ → orchestrator → tools → approval_handler
                ↑                        ↓
                └────────────────────────┘
                     (loop until completed)

Phase Transitions:
task_creation → awaiting_approval → research_execution →
awaiting_research → quality_evaluation → final_synthesis → completed
```

### Pattern 2: Human-in-the-Loop

**Use Case**: Require human approval between phases

**Implementation**:
```json
{
  "nodes": [
    {
      "id": "approval_handler",
      "function": {
        "implementation": "
          // Check for approval request from agent
          const lastToolResult = state.messages.filter(msg => msg.role === 'tool').pop();
          if (lastToolResult.content.includes('approval required')) {
            // Set approval pending flag
            return {
              approvalPending: true,
              currentPhase: 'awaiting_task_approval'
            };
          }

          // Check for user approval response
          const lastUserMessage = state.messages.filter(msg => msg.role === 'user').pop();
          if (lastUserMessage.content.includes('approve')) {
            return {
              tasksApproved: true,
              approvalPending: false,
              currentPhase: 'research_execution'
            };
          }
        "
      }
    }
  ]
}
```

**Workflow**:
```text
orchestrator → task_agent → approval_handler (detects approval request)
                                    ↓
                            (sets approvalPending=true)
                                    ↓
                            User reviews and approves
                                    ↓
approval_handler (detects approval) → orchestrator (continues workflow)
```

### Pattern 3: Parallel Execution (Future)

**Use Case**: Multiple agents can work simultaneously

**Note**: Current implementation is sequential. Future versions may support:

```json
{
  "nodes": [
    {
      "id": "parallel_executor",
      "function": {
        "implementation": "
          // Execute multiple agents in parallel
          const [researchResult, competitorResult] = await Promise.all([
            sendMessageToAgent('research_agent', request),
            sendMessageToAgent('competitor_agent', request)
          ]);

          return {
            researchData: researchResult,
            competitorData: competitorResult
          };
        "
      }
    }
  ]
}
```

### Pattern 4: Conditional Routing

**Use Case**: Route to different agents based on request type

**Implementation**:
```json
{
  "edges": [
    {
      "type": "conditional",
      "from": "orchestrator",
      "condition": {
        "function": {
          "implementation": "
            if (state.requestType === 'research') {
              return 'research_agent_node';
            } else if (state.requestType === 'analysis') {
              return 'analysis_agent_node';
            }
            return 'general_agent_node';
          ",
          "possibleTargets": ["research_agent_node", "analysis_agent_node", "general_agent_node"]
        }
      }
    }
  ]
}
```

---

## Port Management

### Port Allocation Strategy

Each agent instance requires a unique port. Use a consistent allocation strategy:

| Agent | Port | Purpose |
|-------|------|---------|
| Client Orchestrator | 3000 | Coordinates multi-agent workflow |
| Task Creation Agent | 3001 | Creates and validates tasks |
| Research Execution Agent | 3002 | Executes research tasks |
| Quality Evaluation Agent | 3003 | Evaluates research quality |
| Custom Agent 1 | 3004+ | Additional specialized agents |

### Port Configuration

**In Orchestrator** ([client.json](../../json/a2a/client.json)):
```json
{
  "a2aClients": {
    "task_agent": {
      "cardUrl": "http://localhost:3001/.well-known/agent.json"
    },
    "research_agent": {
      "cardUrl": "http://localhost:3002/.well-known/agent.json"
    }
  }
}
```

**In Individual Agents**:
```json
{
  "config": {
    "a2aEndpoint": {
      "port": 3001,
      "agentCard": { ... }
    }
  }
}
```

### VSCode Extension Port Management

The VSCode extension automatically handles port conflicts:

1. Reads configured port from JSON
2. Checks if port is available
3. Auto-increments if port is in use
4. Updates configuration with actual port used
5. Tracks all running instances

**Example**:
```text
Configured port: 3001
Port 3001 in use → trying 3002
Port 3002 available → server starts on 3002
```

---

## Testing Multi-Agent Workflows

### Step 1: Start All Agents

Start each specialized agent first, then start the orchestrator.

**Terminal 1 - Task Agent**:
```bash
cd /Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest
node -e "require('./out/execution/serverRunner.js').runServer('/path/to/task-creation.json', 3001)"
```

**Terminal 2 - Research Agent**:
```bash
node -e "require('./out/execution/serverRunner.js').runServer('/path/to/research-execution.json', 3002)"
```

**Terminal 3 - Quality Agent**:
```bash
node -e "require('./out/execution/serverRunner.js').runServer('/path/to/quality-evaluation.json', 3003)"
```

**Terminal 4 - Orchestrator**:
```bash
node -e "require('./out/execution/serverRunner.js').runServer('/path/to/client.json', 3000)"
```

### Step 2: Verify Agent Discovery

Check that orchestrator can reach all agents:

```bash
# Test Task Agent
curl http://localhost:3001/.well-known/agent.json

# Test Research Agent
curl http://localhost:3002/.well-known/agent.json

# Test Quality Agent
curl http://localhost:3003/.well-known/agent.json

# Test Orchestrator
curl http://localhost:3000/.well-known/agent.json
```

### Step 3: Send Orchestration Request

```bash
curl -X POST http://localhost:3000/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Analyze company XYZ market position and competitive landscape"
        }
      ]
    }
  }'
```

### Step 4: Monitor Workflow Progress

Watch all terminal windows for coordinated workflow execution:

**Terminal 1 (Task Agent)**:
```text
[POST /message/send] Creating task task-1234...
[AgentExecutor] Executing task task-1234...
Processing task creation request: Analyze company XYZ...
Created 6 tasks for research
```

**Terminal 4 (Orchestrator)**:
```text
🎯 [orchestrator] Phase 1: Starting task creation
🔍 [approval_handler] Detected task approval request
⏸️ [approval_handler] Awaiting user approval
```

**After Approval** (Terminal 2 - Research Agent):
```text
[POST /message/send] Creating task task-5678...
[AgentExecutor] Executing research tasks...
```

### Step 5: Test Approval Workflow

Send approval to continue workflow:

```bash
curl -X POST http://localhost:3000/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "approve"
        }
      ]
    }
  }'
```

### Validation Checklist

- [ ] All agents start without errors
- [ ] Orchestrator successfully fetches all AgentCards
- [ ] Task Agent receives and processes orchestrator request
- [ ] Approval workflow triggers correctly
- [ ] Research Agent executes after approval
- [ ] Quality Agent evaluates research results
- [ ] Orchestrator synthesizes final report
- [ ] All phases complete successfully

---

## Troubleshooting

### Issue: Agent Not Reachable

**Symptom**: Orchestrator fails to connect to specialized agent

**Diagnosis**:
```bash
# Check if agent is running
curl http://localhost:3001/.well-known/agent.json

# Check if port is in use
lsof -i :3001
```

**Solutions**:
1. Ensure agent server is running
2. Verify port number in `cardUrl` matches agent's configured port
3. Check firewall/network settings if using remote agents

### Issue: Tool Not Available

**Symptom**: LLM doesn't use A2A client tools

**Diagnosis**: Check model configuration has `bindA2AClients: true`

**Solution**:
```json
{
  "models": [{
    "bindA2AClients": true,
    "systemPrompt": "Use send_message_to_task_agent tool..."
  }]
}
```

### Issue: Workflow Stuck

**Symptom**: Orchestrator doesn't progress to next phase

**Diagnosis**: Check phase transition logic in approval_handler

**Solution**: Ensure state flags are properly updated:
```javascript
if (state.tasksApproved) {
  return { currentPhase: 'research_execution' };
}
```

**See**: [Troubleshooting Guide](troubleshooting.md) for more issues.

---

## Best Practices

### 1. Design Focused Agents

Each agent should have a single, well-defined responsibility:
- ✅ Good: "Task Creation Agent" - creates and validates tasks
- ❌ Bad: "Task and Research Agent" - too broad, hard to maintain

### 2. Use Descriptive Client Keys

Client keys become tool names, so make them descriptive:
- ✅ Good: `task_agent`, `research_agent`, `quality_agent`
- ❌ Bad: `agent1`, `agent2`, `helper`

### 3. Provide Clear System Prompts

Tell the LLM when and how to use each tool:
```json
{
  "systemPrompt": "You are an orchestrator. Follow this workflow:
    1. Use send_message_to_task_agent to create tasks
    2. Wait for user approval
    3. Use send_message_to_research_agent to execute research
    4. Use send_message_to_quality_agent to evaluate quality
    5. Synthesize final report"
}
```

### 4. Track Workflow State

Use annotation fields to track workflow progress:
```json
{
  "annotation": {
    "currentPhase": { "type": "string", "default": "task_creation" },
    "tasksApproved": { "type": "boolean", "default": false },
    "researchCompleted": { "type": "boolean", "default": false }
  }
}
```

### 5. Handle Errors Gracefully

Add error handling in orchestrator nodes:
```javascript
try {
  const response = await model.invoke([...]);
  return { messages: [response], currentPhase: 'next_phase' };
} catch (error) {
  console.error('Phase failed:', error);
  return {
    messages: [{ role: 'assistant', content: 'Error occurred' }],
    currentPhase: 'error'
  };
}
```

---

## Summary

Multi-agent orchestration enables complex workflows by coordinating specialized agents. Key concepts:

✅ **Orchestrator Pattern**
- Coordinator agent delegates to specialized agents
- Each agent has focused responsibility
- A2A Protocol enables agent-to-agent communication

✅ **A2A Client Configuration**
- Define clients with cardUrl and timeout
- Clients automatically bound as tools
- Tool names follow pattern: `send_message_to_{client_key}`

✅ **Sequential Workflows**
- Track workflow phases with state fields
- Transition between phases based on completion flags
- Support human-in-the-loop approval workflows

✅ **Testing and Validation**
- Start all agents before orchestrator
- Verify agent discovery via AgentCard endpoints
- Monitor all terminals for coordinated execution

---

## Related Documentation

- [Implementation Guide](implementation-guide.md) - Server setup instructions
- [Configuration Reference](config-reference.md) - JSON configuration format
- [Architecture Comparison](comparison.md) - VSCode vs CLI implementation
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

**Ready to build multi-agent workflows?** Start with the [Implementation Guide](implementation-guide.md) to set up your first orchestrator.
