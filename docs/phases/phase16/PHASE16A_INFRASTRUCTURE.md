# Phase 1: Infrastructure Enhancement

**Parent:** [A2A Refactoring Plan](a2a-refactoring-plan.md)

**Estimated Time:** 9-13 hours

**Dependencies:** None (starting phase)

**Next Phase:** [Phase 2: Task Management](a2a-phase2-task-management.md)

---

## Overview

This phase establishes the foundation for CLI-aligned A2A server implementation by:

1. Integrating @a2a-js/sdk for A2A Protocol v0.3.0 compliance
2. Adding comprehensive logging matching CLI server format
3. Implementing task state tracking with InMemoryTaskStore

---

## Phase 1.1: A2A SDK Integration

**Priority:** High | **Time:** 4-6 hours

### Objectives

- Add `@a2a-js/sdk@0.3.5` dependency
- Import SDK components into serverRunner.ts
- Update AgentCard to Protocol v0.3.0 specification
- Add A2A-related type definitions

### Files to Modify

1. `package.json`
2. `src/execution/serverRunner.ts`
3. `src/execution/types.ts`

### Implementation Steps

#### Step 1.1.1: Add Dependency

**File:** `package.json`

```json
{
  "dependencies": {
    "@a2a-js/sdk": "^0.3.5",
    // ... existing dependencies
  }
}
```

**Command:**

```bash
yarn install
# or
npm install
```

---

#### Step 1.1.2: Import SDK Components

**File:** `src/execution/serverRunner.ts`

Add at the top of file:

```typescript
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  A2AExpressApp,
  AgentCard as A2AAgentCard
} from '@a2a-js/sdk';
```

---

#### Step 1.1.3: Update AgentCard Structure

**File:** `src/execution/serverRunner.ts`

Find AgentCard definition (around line 100-120) and update:

```typescript
const agentCard: A2AAgentCard = {
  name: config.name || "WorkflowAgent",
  description: config.description || "A workflow execution agent",
  protocolVersion: "0.3.0",  // ← Add this
  url: `http://localhost:${port}`,
  defaultInputModes: ["text"],  // ← Add this
  defaultOutputModes: ["text"], // ← Add this
  skills: config.skills || []
};
```

**Required Fields for v0.3.0:**

- `protocolVersion`: Must be "0.3.0"
- `defaultInputModes`: Array of supported input types
- `defaultOutputModes`: Array of supported output types

---

#### Step 1.1.4: Add Type Definitions

**File:** `src/execution/types.ts`

Add new interfaces:

```typescript
/**
 * Task context for tracking task state
 */
export interface TaskContext {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AgentExecutor interface for structured execution
 */
export interface IAgentExecutor {
  execute(message: any, taskId: string): Promise<any>;
  cancelTask(taskId: string): Promise<void>;
}

/**
 * Request context for A2A protocol
 */
export interface RequestContext {
  taskId: string;
  timestamp: Date;
  input: any;
}
```

---

### Validation

Run these checks:

```bash
# Compile TypeScript
yarn compile

# Check for errors
# Should output: "Compilation complete. Watching for file changes."
```

**Checklist:**

- [ ] `yarn install` succeeds
- [ ] No TypeScript compilation errors
- [ ] AgentCard includes all required v0.3.0 fields
- [ ] Type definitions added to types.ts
- [ ] Imports resolve correctly

---

### Success Criteria

- @a2a-js/sdk dependency installed
- SDK components imported without errors
- AgentCard complies with Protocol v0.3.0
- Type definitions available for Phase 2

---

## Phase 1.2: Enhanced Logging

**Priority:** Medium | **Time:** 2-3 hours

**Can run in parallel with Phase 2.3**

### Objectives

- Add model building logs
- Add state annotation logs
- Add graph compilation logs
- Add execution logs
- Match CLI server log format

### Files to Modify

1. `src/execution/serverRunner.ts`

### Implementation Steps

#### Step 1.2.1: Add Model Building Logs

**File:** `src/execution/serverRunner.ts`

Find where WorkflowEngine is instantiated (around line 150-200):

```typescript
console.log('=== Building Workflow Engine ===');

// Before model creation
if (config.models) {
  for (const [modelId, modelConfig] of Object.entries(config.models)) {
    console.log(`Getting factory for type: ${modelConfig.type}`);
    console.log(`Creating model with type: ${modelConfig.type}`);

    // Model creation code...

    console.log(`Initialized model: ${modelId} (${modelConfig.type})`);
  }
}
```

---

#### Step 1.2.2: Add State Annotation Logs

Add after state annotation building:

```typescript
console.log('=== Building State Annotations ===');

if (config.stateAnnotation?.fields) {
  for (const [fieldName, fieldConfig] of Object.entries(config.stateAnnotation.fields)) {
    if (fieldConfig.reducer) {
      console.log(`Creating reducer for ${fieldName}: ${fieldConfig.reducer}`);
    }
    console.log(`Building annotation for ${fieldName} with type ${fieldConfig.type}`);
  }
}

console.log('✅ MessagesAnnotation.spec added successfully');
```

---

#### Step 1.2.3: Add Graph Compilation Logs

Add before graph compilation:

```typescript
console.log('=== Building Graph Structure ===');

// For edges
config.edges?.forEach(edge => {
  if (edge.type === 'conditional') {
    console.log(`Added conditional edge from ${edge.from}`);
  } else {
    console.log(`Added edge: ${edge.from} -> ${edge.to}`);
  }
});

const recursionLimit = config.recursionLimit || 100;
console.log(`Compiling graph with recursionLimit: ${recursionLimit}, useMemory: ${config.checkpointer}`);
console.log('✅ Graph.compile: コンパイル完了');
console.log('Workflow engine built successfully');
```

---

#### Step 1.2.4: Add Execution Logs

Update `/message/send` endpoint:

```typescript
app.post('/message/send', async (req, res) => {
  const recursionLimit = config.recursionLimit || 100;
  console.log(`🚀 Invoking workflow with recursionLimit: ${recursionLimit}`);

  const userMessage = req.body.message?.parts?.[0]?.text || '';
  const preview = userMessage.substring(0, 100);
  console.log(`Processing ${config.name} request: ${preview}${userMessage.length > 100 ? '...' : ''}`);

  // Execution code...
});
```

---

### Log Format Reference

Compare with CLI server output:

```text
=== Building Workflow Engine ===
Getting factory for type: OpenAI
Creating model with type: OpenAI
Initialized model: taskModel (OpenAI)

=== Building State Annotations ===
Creating reducer for messages: (x, y) => x.concat(y)
Building annotation for messages with type BaseMessage[]
Creating reducer for taskList: (x, y) => y || x
Building annotation for taskList with type any[]
✅ MessagesAnnotation.spec added successfully

=== Building Graph Structure ===
Added edge: START -> task_creator
Added edge: task_creator -> approval_gate
Added conditional edge from approval_gate
Compiling graph with recursionLimit: 100, useMemory: [object Object]
✅ Graph.compile: コンパイル完了
Workflow engine built successfully

🚀 Invoking workflow with recursionLimit: 100
Processing TaskCreationWorkflow request: 矢崎総業の会社概要...
```

---

### Validation

```bash
# Start server and check logs
# In VSCode: Open workflow editor → Launch A2A Server
# Observe terminal output

# Compare with CLI server
cd /Users/akirakudo/Desktop/MyWork/CLI/server
npm run server:task
# Compare output format
```

**Checklist:**

- [ ] Model building logs present
- [ ] State annotation logs present
- [ ] Graph compilation logs present
- [ ] Execution logs present
- [ ] Log format matches CLI (90%+ similarity)
- [ ] Emoji indicators present (✅, 🚀, 📡)

---

### Success Criteria

- Console output matches CLI server verbosity
- All major stages logged
- Debugging information available
- recursionLimit logged correctly
- Model types, edge types visible in logs

---

## Phase 1.3: Task Store Integration

**Priority:** High | **Time:** 3-4 hours

**Required before Phase 2**

### Objectives

- Initialize InMemoryTaskStore
- Integrate with request handling
- Track task state transitions
- Enable task querying

### Files to Modify

1. `src/execution/serverRunner.ts`
2. `src/execution/types.ts`

### Implementation Steps

#### Step 1.3.1: Initialize Task Store

**File:** `src/execution/serverRunner.ts`

In the `runServer` function (around line 50-80):

```typescript
export async function runServer(configPath: string, port: number) {
  console.log(`\n=== Starting A2A Server with config: ${configPath} ===`);

  // ... existing config loading ...

  // Initialize task store
  const taskStore = new InMemoryTaskStore();
  console.log('✅ Task store initialized (InMemoryTaskStore)');

  // ... rest of server setup ...
}
```

---

#### Step 1.3.2: Integrate with Message Handling

Update `/message/send` endpoint to use task store:

```typescript
app.post('/message/send', async (req, res) => {
  // Generate unique task ID
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[TaskStore] Creating task ${taskId}`);

  // Create task in store
  await taskStore.createTask(taskId, {
    status: 'running',
    input: req.body.message,
    createdAt: new Date()
  });

  try {
    const recursionLimit = config.recursionLimit || 100;
    console.log(`🚀 Invoking workflow with recursionLimit: ${recursionLimit}`);

    const result = await engine.invoke(
      // ... input ...
    );

    // Update task with result
    console.log(`[TaskStore] Task ${taskId} completed`);
    await taskStore.updateTask(taskId, {
      status: 'completed',
      result,
      updatedAt: new Date()
    });

    // Include taskId in response
    res.json({
      taskId,
      ...result
    });

  } catch (error) {
    // Update task with error
    console.error(`[TaskStore] Task ${taskId} failed:`, error);
    await taskStore.updateTask(taskId, {
      status: 'failed',
      error: error.message,
      updatedAt: new Date()
    });

    res.status(500).json({
      taskId,
      error: error.message
    });
  }
});
```

---

#### Step 1.3.3: Export Task Store

Make task store accessible globally:

```typescript
// At top of file
let globalTaskStore: InMemoryTaskStore | null = null;

export async function runServer(configPath: string, port: number) {
  // ... existing code ...

  globalTaskStore = new InMemoryTaskStore();
  console.log('✅ Task store initialized (InMemoryTaskStore)');

  // ... rest of server setup ...
}

/**
 * Get the current task store instance
 * @returns Task store or null if server not started
 */
export function getTaskStore(): InMemoryTaskStore | null {
  return globalTaskStore;
}
```

---

### Task State Lifecycle

```text
[created] → [running] → [completed]
                     ↘
                       [failed]
                     ↘
                       [cancelled]
```

**State Transitions:**

1. **created**: Task initialized in store
2. **running**: Workflow execution started
3. **completed**: Workflow finished successfully
4. **failed**: Workflow encountered error
5. **cancelled**: Task cancelled by user (Phase 2)

---

### Validation

Test task creation and state tracking:

```bash
# Send message
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Test request"}]}}'

# Response should include taskId:
# {"taskId": "task-1234567890123-abc123", ...}
```

**Check logs:**

```text
[TaskStore] Creating task task-1234567890123-abc123
🚀 Invoking workflow with recursionLimit: 100
[TaskStore] Task task-1234567890123-abc123 completed
```

**Checklist:**

- [ ] Task store initialized successfully
- [ ] Tasks created with unique IDs
- [ ] Task status transitions correctly (running → completed/failed)
- [ ] Task store accessible via getTaskStore()
- [ ] taskId returned in responses

---

### Success Criteria

- InMemoryTaskStore initialized without errors
- Task state tracked throughout lifecycle
- Unique task IDs generated
- Task store available for Phase 2 (query/cancel endpoints)

---

## Phase 1 Summary

After completing Phase 1, you will have:

✅ **A2A SDK Integration:**

- @a2a-js/sdk dependency installed
- SDK components imported and used
- AgentCard complies with Protocol v0.3.0
- Type definitions for task management

✅ **Enhanced Logging:**

- Model building logs
- State annotation logs
- Graph compilation logs
- Execution logs
- CLI-matching format

✅ **Task Store:**

- InMemoryTaskStore initialized
- Task creation and tracking
- State lifecycle management
- Foundation for task endpoints (Phase 2)

---

## Next Steps

Proceed to [Phase 2: Task Management](a2a-phase2-task-management.md) to:

- Implement AgentExecutor pattern
- Add full task management endpoints
- Integrate DefaultRequestHandler

**Dependencies Met:**

- A2A SDK available ✓
- Task store initialized ✓
- Logging infrastructure in place ✓

---

## Troubleshooting

### Issue: @a2a-js/sdk types not found

**Solution:**

```typescript
// Add to src/execution/types.ts
declare module '@a2a-js/sdk' {
  export class InMemoryTaskStore {
    createTask(id: string, data: any): Promise<void>;
    getTask(id: string): Promise<any>;
    updateTask(id: string, data: any): Promise<void>;
    getAllTasks(): Promise<any[]>;
  }
  // ... other declarations
}
```

### Issue: Task store not persisting

InMemoryTaskStore is volatile (lost on restart). This is expected for development. For production, consider:

- FileTaskStore for disk persistence
- DatabaseTaskStore for PostgreSQL/MongoDB
- RedisTaskStore for distributed cache

### Issue: Compilation errors after adding imports

Check TypeScript version compatibility:

```bash
yarn list typescript
# Should be compatible with @a2a-js/sdk
```

---

## References

- [Implementation Details](a2a-implementation-details.md) - Detailed code examples
- [Testing Plan](a2a-testing-plan.md) - Validation procedures
- CLI Server: `/Users/akirakudo/Desktop/MyWork/CLI/server/src/server.ts`
