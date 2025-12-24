# A2A Server Implementation Guide

**Step-by-Step Guide for VSCode Extension A2A Server Integration**

**Last Updated**: 2025-12-24 | **Phase**: 16C Documentation

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [A2A Server Setup](#a2a-server-setup)
4. [Task Store Implementation](#task-store-implementation)
5. [AgentExecutor Pattern](#agentexecutor-pattern)
6. [Task Management Endpoints](#task-management-endpoints)
7. [Enhanced Logging](#enhanced-logging)
8. [Testing and Validation](#testing-and-validation)

---

## Introduction

This guide provides step-by-step instructions for implementing A2A Protocol v0.3.0 server functionality within the ReactFlowTest VSCode extension. The implementation enables workflow JSON files to be launched as standalone A2A-compliant servers that can communicate with other agents.

### What You'll Build

By following this guide, you'll implement:

- ✅ Express-based A2A server with protocol v0.3.0 compliance
- ✅ Task lifecycle management with in-memory task store
- ✅ AgentExecutor pattern for structured workflow execution
- ✅ Full A2A endpoint suite (AgentCard, message send, task query, task cancel)
- ✅ Terminal-based server management within VSCode
- ✅ Multi-instance support with automatic port management

### Architecture Overview

```text
VSCode Extension → A2AServerLauncher → Terminal (Node.js process)
                        ↓
                   serverRunner.ts (Express server)
                        ↓
                   AgentExecutor → SimpleTaskStore
                        ↓
                   WorkflowEngine.invoke() → Task tracking
                        ↓
                   A2A Protocol Endpoints → JSON responses
```

---

## Prerequisites

### Required Dependencies

Ensure these packages are installed in your VSCode extension project:

```json
{
  "dependencies": {
    "@kudos/scene-graph-manager": "^1.0.0",
    "express": "^5.0.0",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

Install dependencies:

```bash
yarn install
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...

# Ollama Configuration (if using local models)
OLLAMA_BASE_URL=http://localhost:11434
```

**Note**: The server will search for `.env` files in multiple locations:
1. Extension root directory
2. Same directory as workflow JSON file
3. Current working directory

---

## A2A Server Setup

### Step 1: Create serverRunner.ts

Create the main server file at [src/execution/serverRunner.ts](../../src/execution/serverRunner.ts).

#### Import Dependencies

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { WorkflowEngine } from '@kudos/scene-graph-manager';
import type { WorkflowConfig } from '@kudos/scene-graph-manager';
import * as dotenv from 'dotenv';

const express = require('express');
```

#### Define A2A Protocol Interfaces

```typescript
// A2A Protocol v0.3.0 Agent Card interface
interface AgentCard {
  name: string;
  description: string;
  protocolVersion: string;
  version: string;
  url: string;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  skills?: any[];
}
```

#### Implement runServer Function

```typescript
export async function runServer(configPath: string, port: number): Promise<void> {
  try {
    // Load environment variables
    const possibleEnvPaths = [
      path.resolve(__dirname, '..', '..', '.env'),
      path.join(path.dirname(configPath), '.env'),
      path.join(process.cwd(), '.env')
    ];

    let envLoaded = false;
    for (const envPath of possibleEnvPaths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`✓ Loaded environment variables from: ${envPath}`);
        envLoaded = true;
        break;
      }
    }

    console.log(`\n🚀 Starting A2A Server...`);
    console.log(`   Config: ${configPath}`);
    console.log(`   Port: ${port}\n`);

    // Load workflow config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const workflowConfig: any = JSON.parse(configContent);

    console.log(`✓ Loaded workflow: ${workflowConfig.name || 'Unnamed Workflow'}`);

    // Initialize task store (covered in next section)
    // Create workflow engine (covered in next section)
    // Setup Express app (covered in later sections)

  } catch (error: any) {
    console.error(`\n✗ Failed to start server: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}
```

---

## Task Store Implementation

### Step 2: Create SimpleTaskStore Class

The task store manages the lifecycle of all tasks processed by the A2A server.

#### Task Data Interface

```typescript
interface TaskData {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input?: any;
  result?: any;
  error?: any;
  createdAt: Date;
  updatedAt?: Date;
}
```

#### SimpleTaskStore Implementation

Implementation from [serverRunner.ts:40-69](../../src/execution/serverRunner.ts#L40-L69):

```typescript
class SimpleTaskStore {
  private tasks: Map<string, TaskData> = new Map();

  async createTask(taskId: string, data: Partial<TaskData>): Promise<void> {
    this.tasks.set(taskId, {
      taskId,
      status: data.status || 'running',
      input: data.input,
      result: data.result,
      error: data.error,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt
    });
  }

  async getTask(taskId: string): Promise<TaskData | undefined> {
    return this.tasks.get(taskId);
  }

  async updateTask(taskId: string, data: Partial<TaskData>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, { ...task, ...data });
    }
  }

  async getAllTasks(): Promise<TaskData[]> {
    return Array.from(this.tasks.values());
  }
}
```

#### Global Task Store Instance

```typescript
let globalTaskStore: SimpleTaskStore | null = null;

export function getTaskStore(): SimpleTaskStore | null {
  return globalTaskStore;
}
```

#### Initialize Task Store in runServer

Add to `runServer()` function:

```typescript
// Initialize task store
globalTaskStore = new SimpleTaskStore();
console.log('✅ Task store initialized (SimpleTaskStore)');
```

### Task Lifecycle

```text
Task Created (running)
    ↓
Workflow Execution
    ↓
    ├─→ Success → completed
    ├─→ Error → failed
    └─→ User Action → cancelled
```

---

## AgentExecutor Pattern

### Step 3: Implement AgentExecutor Class

The AgentExecutor wraps workflow execution with task tracking and error handling.

#### AgentExecutor Class Structure

Implementation from [serverRunner.ts:86-197](../../src/execution/serverRunner.ts#L86-L197):

```typescript
class AgentExecutor {
  constructor(
    private engine: WorkflowEngine,
    private taskStore: SimpleTaskStore,
    private config: any
  ) {}

  /**
   * Execute workflow with task tracking
   */
  async execute(message: any, taskId: string): Promise<any> {
    console.log(`[AgentExecutor] Executing task ${taskId}`);

    // Extract message parts
    const parts = message.parts || [];
    const textPart = parts.find((p: any) => p.type === 'text' || p.kind === 'text');
    const input = textPart?.text || (typeof message === 'string' ? message : '');

    // Update task status to running
    await this.taskStore.updateTask(taskId, {
      status: 'running',
      updatedAt: new Date()
    });

    try {
      // Build input state
      const inputState = {
        messages: [
          {
            role: 'user',
            content: input
          }
        ]
      };

      // Invoke workflow engine
      const recursionLimit = this.config.recursionLimit || 100;
      console.log(`🚀 Invoking workflow with recursionLimit: ${recursionLimit}`);

      const preview = input.substring(0, 100);
      console.log(`Processing ${this.config.name || 'WorkflowAgent'} request: ${preview}${input.length > 100 ? '...' : ''}`);

      const result = await this.engine.invoke(
        inputState,
        {
          recursionLimit,
          configurable: {
            thread_id: taskId
          }
        }
      );

      console.log(`✓ Execution completed`);

      // Update task with result
      console.log(`[AgentExecutor] Task ${taskId} completed successfully`);
      await this.taskStore.updateTask(taskId, {
        status: 'completed',
        result,
        updatedAt: new Date()
      });

      // Format result for A2A protocol
      return this.formatResult(result, taskId);

    } catch (error: any) {
      console.error(`[AgentExecutor] Task ${taskId} failed:`, error);

      // Update task with error
      await this.taskStore.updateTask(taskId, {
        status: 'failed',
        error: error.message,
        updatedAt: new Date()
      });

      throw error;
    }
  }

  /**
   * Cancel task execution
   */
  async cancelTask(taskId: string): Promise<void> {
    console.log(`[AgentExecutor] Cancelling task ${taskId}`);

    const task = await this.taskStore.getTask(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error(`Cannot cancel ${task.status} task`);
    }

    // Update status to cancelled
    await this.taskStore.updateTask(taskId, {
      status: 'cancelled',
      updatedAt: new Date()
    });

    console.log(`[AgentExecutor] Task ${taskId} marked as cancelled`);
  }

  /**
   * Format result according to A2A protocol
   */
  private formatResult(result: any, taskId: string): any {
    return {
      taskId,
      result,
      thread_id: taskId
    };
  }
}
```

#### Initialize Workflow Engine and Executor

Add to `runServer()` function after task store initialization:

```typescript
// Create workflow engine
console.log('\n=== Building Workflow Engine ===');

// Log model configuration
if (workflowConfig.models) {
  for (const [modelId, modelConfig] of Object.entries(workflowConfig.models)) {
    const modelType = (modelConfig as any).type;
    console.log(`Initialized model: ${modelId} (${modelType})`);
  }
}

const engine = new WorkflowEngine(workflowConfig);

// Build the workflow graph
await engine.build();

console.log('✅ Graph.compile: コンパイル完了');
console.log('Workflow engine built successfully');

// Initialize executor
const executor = new AgentExecutor(engine, globalTaskStore!, workflowConfig);
console.log('✅ AgentExecutor initialized');
```

---

## Task Management Endpoints

### Step 4: Implement Express Endpoints

Create the Express app and implement A2A Protocol v0.3.0 endpoints.

#### Setup Express App

```typescript
// Create Express app
const app = express();
app.use(express.json());

// Enable CORS for external access
app.use((req: any, res: any, next: any) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

#### AgentCard Endpoint

Implementation from [serverRunner.ts:312-329](../../src/execution/serverRunner.ts#L312-L329):

```typescript
// A2A Protocol: Agent Card endpoint
app.get('/.well-known/agent.json', (req: any, res: any) => {
  const agentCard: AgentCard = {
    name: workflowConfig.name || 'WorkflowAgent',
    description: workflowConfig.description || 'A workflow execution agent',
    protocolVersion: '0.3.0',
    version: '1.0.0',
    url: `http://localhost:${port}/`,
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true
    },
    skills: workflowConfig.skills || []
  };
  res.json(agentCard);
});
```

#### Message Send Endpoint

Implementation from [serverRunner.ts:332-363](../../src/execution/serverRunner.ts#L332-L363):

```typescript
// A2A Protocol: Message Send endpoint
app.post('/message/send', async (req: any, res: any) => {
  // Generate unique task ID
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[POST /message/send] Creating task ${taskId}`);

  try {
    const { message, thread_id, session_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create task in store
    await globalTaskStore!.createTask(taskId, {
      status: 'running',
      input: req.body,
      createdAt: new Date()
    });

    // Execute via AgentExecutor
    const result = await executor.execute(message, taskId);

    res.json(result);
  } catch (error: any) {
    console.error(`[POST /message/send] Error:`, error);
    res.status(500).json({
      error: error.message,
      taskId
    });
  }
});
```

#### Task Query Endpoint

Implementation from [serverRunner.ts:366-399](../../src/execution/serverRunner.ts#L366-L399):

```typescript
// A2A Protocol: Query specific task by ID
app.get('/tasks/:taskId', async (req: any, res: any) => {
  const { taskId } = req.params;

  console.log(`[GET /tasks/${taskId}] Querying task`);

  try {
    const task = await globalTaskStore!.getTask(taskId);

    if (!task) {
      console.log(`[GET /tasks/${taskId}] Task not found`);
      return res.status(404).json({
        error: 'Task not found',
        taskId
      });
    }

    console.log(`[GET /tasks/${taskId}] Task found, status: ${task.status}`);

    res.json({
      taskId,
      status: task.status,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    });

  } catch (error: any) {
    console.error(`[GET /tasks/${taskId}] Error:`, error);
    res.status(500).json({
      error: error.message
    });
  }
});
```

#### Task Cancel Endpoint

Implementation from [serverRunner.ts:425-464](../../src/execution/serverRunner.ts#L425-L464):

```typescript
// A2A Protocol: Cancel task execution
app.post('/tasks/:taskId/cancel', async (req: any, res: any) => {
  const { taskId } = req.params;

  console.log(`[POST /tasks/${taskId}/cancel] Cancelling task`);

  try {
    const task = await globalTaskStore!.getTask(taskId);

    if (!task) {
      console.log(`[POST /tasks/${taskId}/cancel] Task not found`);
      return res.status(404).json({
        error: 'Task not found',
        taskId
      });
    }

    if (task.status === 'completed' || task.status === 'failed') {
      console.log(`[POST /tasks/${taskId}/cancel] Cannot cancel ${task.status} task`);
      return res.status(400).json({
        error: `Cannot cancel ${task.status} task`,
        status: task.status
      });
    }

    // Cancel via executor
    await executor.cancelTask(taskId);

    console.log(`[POST /tasks/${taskId}/cancel] Task cancelled successfully`);

    res.json({
      taskId,
      status: 'cancelled',
      message: 'Task cancelled successfully'
    });

  } catch (error: any) {
    console.error(`[POST /tasks/${taskId}/cancel] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});
```

#### Health Check Endpoint (Optional)

```typescript
// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: 'manual',
    uptime: process.uptime(),
    port,
    agentName: workflowConfig.name || 'Unnamed Workflow'
  });
});
```

#### Start Server

```typescript
// Start server
const server = app.listen(port, () => {
  console.log(`\n✅ A2A Server is running on port ${port}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`  Agent Card: http://localhost:${port}/.well-known/agent.json`);
  console.log(`  Message Send: http://localhost:${port}/message/send`);
  console.log(`  Task Query: http://localhost:${port}/tasks/{taskId}`);
  console.log(`  Task Cancel: http://localhost:${port}/tasks/{taskId}/cancel`);
  console.log(`  Health Check: http://localhost:${port}/health`);
  console.log(`\n✅ Server is ready to receive A2A requests`);
  console.log(`\n⌨️  Press Ctrl+C to stop the server\n`);
});
```

#### Graceful Shutdown Handlers

```typescript
// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n🛑 Stopping A2A Server...`);
  server.close(() => {
    console.log(`✓ Server stopped gracefully\n`);
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log(`\n\n🛑 Stopping A2A Server...`);
  server.close(() => {
    console.log(`✓ Server stopped gracefully\n`);
    process.exit(0);
  });
});
```

---

## Enhanced Logging

### Step 5: Implement CLI-Compatible Logging

The VSCode extension matches the CLI server's logging format for easier debugging and comparison.

#### Model Configuration Logging

```typescript
console.log('\n=== Building Workflow Engine ===');

if (workflowConfig.models) {
  for (const [modelId, modelConfig] of Object.entries(workflowConfig.models)) {
    const modelType = (modelConfig as any).type;
    console.log(`Getting factory for type: ${modelType}`);
    console.log(`Creating model with type: ${modelType}`);
    console.log(`Initialized model: ${modelId} (${modelType})`);
  }
}
```

#### State Annotation Logging

```typescript
console.log('\n=== Building State Annotations ===');

if (workflowConfig.stateAnnotation?.fields) {
  for (const [fieldName, fieldConfig] of Object.entries(workflowConfig.stateAnnotation.fields)) {
    if ((fieldConfig as any).reducer) {
      console.log(`Creating reducer for ${fieldName}: ${(fieldConfig as any).reducer}`);
    }
    console.log(`Building annotation for ${fieldName} with type ${(fieldConfig as any).type}`);
  }
}

console.log('✅ MessagesAnnotation.spec added successfully');
```

#### Graph Structure Logging

```typescript
console.log('\n=== Building Graph Structure ===');

if (workflowConfig.edges) {
  for (const edge of workflowConfig.edges) {
    if (edge.type === 'conditional') {
      console.log(`Added conditional edge from ${edge.from}`);
    } else {
      console.log(`Added edge: ${edge.from} -> ${edge.to}`);
    }
  }
}

const recursionLimit = workflowConfig.recursionLimit || 100;
console.log(`Compiling graph with recursionLimit: ${recursionLimit}, useMemory: ${workflowConfig.checkpointer ? '[object Object]' : 'undefined'}`);
```

#### Execution Logging

```typescript
// In AgentExecutor.execute()
console.log(`🚀 Invoking workflow with recursionLimit: ${recursionLimit}`);

const preview = input.substring(0, 100);
console.log(`Processing ${this.config.name || 'WorkflowAgent'} request: ${preview}${input.length > 100 ? '...' : ''}`);

// After execution
console.log(`✓ Execution completed`);
```

### Example Log Output

```text
🚀 Starting A2A Server...
   Config: /path/to/task-creation.json
   Port: 3001

✓ Loaded workflow: TaskCreationAgent
✅ Task store initialized (SimpleTaskStore)

=== Building Workflow Engine ===
Getting factory for type: OpenAI
Creating model with type: OpenAI
Initialized model: taskModel (OpenAI)

=== Building State Annotations ===
Creating reducer for messages: (x, y) => x.concat(y)
Building annotation for messages with type BaseMessage[]
✅ MessagesAnnotation.spec added successfully

=== Building Graph Structure ===
Added edge: __start__ -> task_creator
Added edge: task_creator -> approval_gate
Added conditional edge from approval_gate
Compiling graph with recursionLimit: 100, useMemory: undefined
✅ Graph.compile: コンパイル完了
Workflow engine built successfully
✅ AgentExecutor initialized

✅ A2A Server is running on port 3001

📡 Endpoints:
  Agent Card: http://localhost:3001/.well-known/agent.json
  Message Send: http://localhost:3001/message/send
  Task Query: http://localhost:3001/tasks/{taskId}
  Task Cancel: http://localhost:3001/tasks/{taskId}/cancel
  Health Check: http://localhost:3001/health

✅ Server is ready to receive A2A requests

⌨️  Press Ctrl+C to stop the server

[POST /message/send] Creating task task-1766585108489-ds74n3zkr
[AgentExecutor] Executing task task-1766585108489-ds74n3zkr
🚀 Invoking workflow with recursionLimit: 100
Processing TaskCreationAgent request: Create tasks for research project
✓ Execution completed
[AgentExecutor] Task task-1766585108489-ds74n3zkr completed successfully
```

---

## Testing and Validation

### Step 6: Test A2A Server Functionality

#### Test AgentCard Endpoint

```bash
curl http://localhost:3001/.well-known/agent.json
```

**Expected Response**:
```json
{
  "name": "TaskCreationAgent",
  "description": "Creates and manages research tasks",
  "protocolVersion": "0.3.0",
  "version": "1.0.0",
  "url": "http://localhost:3001/",
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain"],
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "skills": [...]
}
```

#### Test Message Send Endpoint

```bash
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Create a simple test task"
        }
      ]
    }
  }'
```

**Expected Response**:
```json
{
  "taskId": "task-1766585108489-ds74n3zkr",
  "result": {...},
  "thread_id": "task-1766585108489-ds74n3zkr"
}
```

#### Test Task Query Endpoint

```bash
curl http://localhost:3001/tasks/task-1766585108489-ds74n3zkr
```

**Expected Response**:
```json
{
  "taskId": "task-1766585108489-ds74n3zkr",
  "status": "completed",
  "result": {...},
  "createdAt": "2025-12-24T12:00:00.000Z",
  "updatedAt": "2025-12-24T12:00:05.000Z"
}
```

#### Test Task Cancel Endpoint

```bash
curl -X POST http://localhost:3001/tasks/task-1766585108489-ds74n3zkr/cancel
```

**Expected Response** (if task already completed):
```json
{
  "error": "Cannot cancel completed task",
  "status": "completed"
}
```

#### Test Health Check Endpoint

```bash
curl http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-24T12:00:00.000Z",
  "mode": "manual",
  "uptime": 123.456,
  "port": 3001,
  "agentName": "TaskCreationAgent"
}
```

### Validation Checklist

- [ ] Server starts without errors
- [ ] AgentCard endpoint returns valid JSON
- [ ] Message send creates task and returns result
- [ ] Task query returns task status
- [ ] Task cancel works for running tasks
- [ ] Health check returns server status
- [ ] Logs match CLI server format
- [ ] Environment variables loaded correctly
- [ ] Workflow engine builds successfully
- [ ] Tasks tracked throughout lifecycle

---

## Summary

You've successfully implemented an A2A Protocol v0.3.0 compliant server within the VSCode extension. The server provides:

✅ **Full A2A Protocol Compliance**
- AgentCard metadata endpoint
- Message send with task tracking
- Task query and cancellation
- Proper error handling

✅ **Robust Task Management**
- In-memory task store
- Complete lifecycle tracking
- Status transitions (running → completed/failed/cancelled)

✅ **AgentExecutor Pattern**
- Structured workflow execution
- Error handling with task updates
- Result formatting for A2A protocol

✅ **Production-Ready Features**
- CORS support for external clients
- Graceful shutdown handling
- Comprehensive logging
- Multi-location .env file support

---

## Next Steps

- **Configuration**: See [Configuration Reference](config-reference.md) for JSON workflow format
- **Multi-Agent**: See [Orchestration Guide](orchestration.md) for agent-to-agent communication
- **Troubleshooting**: See [Troubleshooting](troubleshooting.md) for common issues

---

## Related Documentation

- [Architecture Comparison](comparison.md) - VSCode vs CLI implementation differences
- [Configuration Reference](config-reference.md) - Complete JSON schema reference
- [Orchestration Guide](orchestration.md) - Multi-agent workflow patterns
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

**Implementation Complete!** Your VSCode extension now supports A2A Protocol v0.3.0 server functionality.
