# Phase 2: Task Management Implementation

**Parent:** [A2A Refactoring Plan](a2a-refactoring-plan.md)

**Estimated Time:** 9-12 hours

**Dependencies:** [Phase 1: Infrastructure](a2a-phase1-infrastructure.md) must be completed

**Next Phase:** [Phase 3: Documentation](a2a-phase3-documentation.md)

---

## Overview

This phase implements full A2A task management capabilities:

1. AgentExecutor pattern for structured execution
2. Task query and cancellation endpoints
3. DefaultRequestHandler integration from @a2a-js/sdk

---

## Phase 2.1: AgentExecutor Pattern

**Priority:** High | **Time:** 4-5 hours

### Objectives

- Implement AgentExecutor class following CLI pattern
- Structure execution with task lifecycle management
- Add event handling if needed
- Replace direct engine.invoke() calls

### Files to Modify

1. `src/execution/serverRunner.ts`
2. `src/execution/types.ts`

### Implementation Steps

#### Step 2.1.1: Create AgentExecutor Class

**File:** `src/execution/serverRunner.ts`

Add before the `runServer` function:

```typescript
/**
 * Agent executor for structured workflow execution
 * Follows CLI server pattern
 */
class AgentExecutor implements IAgentExecutor {
  constructor(
    private engine: WorkflowEngine,
    private taskStore: InMemoryTaskStore,
    private config: any
  ) {}

  /**
   * Execute workflow with task tracking
   */
  async execute(message: any, taskId: string): Promise<any> {
    console.log(`[AgentExecutor] Executing task ${taskId}`);

    // Extract message parts
    const parts = message.parts || [];
    const textPart = parts.find((p: any) => p.type === 'text');
    const input = textPart?.text || '';

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
        ],
        // Add other state fields from config if needed
      };

      // Invoke workflow engine
      const recursionLimit = this.config.recursionLimit || 100;
      const result = await this.engine.invoke(inputState, {
        recursionLimit,
        configurable: {
          thread_id: taskId
        }
      });

      // Update task with result
      await this.taskStore.updateTask(taskId, {
        status: 'completed',
        result,
        updatedAt: new Date()
      });

      console.log(`[AgentExecutor] Task ${taskId} completed successfully`);

      // Format result for A2A protocol
      return this.formatResult(result, taskId);

    } catch (error) {
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

    // Get current task
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

    // TODO: Implement actual workflow cancellation if engine supports it
    console.log(`[AgentExecutor] Task ${taskId} marked as cancelled`);
  }

  /**
   * Format result according to A2A protocol
   */
  private formatResult(result: any, taskId: string): any {
    return {
      messageId: `msg-${Date.now()}`,
      parts: [
        {
          kind: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
}
```

---

#### Step 2.1.2: Instantiate Executor

In `runServer` function, after building workflow engine and task store:

```typescript
export async function runServer(configPath: string, port: number) {
  // ... existing code ...

  // Build workflow engine
  const engine = await buildWorkflowEngine(config);
  console.log('Workflow engine built successfully');

  // Initialize task store
  const taskStore = new InMemoryTaskStore();
  console.log('✅ Task store initialized (InMemoryTaskStore)');

  // Initialize executor
  const executor = new AgentExecutor(engine, taskStore, config);
  console.log('✅ AgentExecutor initialized');

  // ... rest of server setup ...
}
```

---

#### Step 2.1.3: Update /message/send Endpoint

Replace direct `engine.invoke()` with `executor.execute()`:

```typescript
app.post('/message/send', async (req, res) => {
  // Generate task ID
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[POST /message/send] Creating task ${taskId}`);

  // Create task in store
  await taskStore.createTask(taskId, {
    status: 'running',
    input: req.body.message,
    createdAt: new Date()
  });

  try {
    // Execute via AgentExecutor
    const result = await executor.execute(req.body.message, taskId);

    res.json(result);

  } catch (error) {
    console.error(`[POST /message/send] Error:`, error);
    res.status(500).json({
      error: error.message,
      taskId
    });
  }
});
```

---

### EventBus Integration (Optional)

If CLI server uses EventBus pattern, add event handling:

```typescript
class AgentExecutor implements IAgentExecutor {
  private eventBus: EventEmitter;

  constructor(engine, taskStore, config) {
    // ... existing ...
    this.eventBus = new EventEmitter();
  }

  async execute(message, taskId) {
    this.eventBus.emit('task:started', { taskId });

    try {
      // ... execution ...
      this.eventBus.emit('task:completed', { taskId, result });
    } catch (error) {
      this.eventBus.emit('task:failed', { taskId, error });
    }
  }

  on(event: string, handler: Function) {
    this.eventBus.on(event, handler);
  }
}
```

---

### Validation

Test executor pattern:

```bash
# Send message
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Test task"}]}}'
```

**Expected logs:**

```text
[POST /message/send] Creating task task-1234567890123-abc123
[AgentExecutor] Executing task task-1234567890123-abc123
🚀 Invoking workflow with recursionLimit: 100
Processing TaskCreationWorkflow request: Test task
[AgentExecutor] Task task-1234567890123-abc123 completed successfully
```

**Checklist:**

- [ ] AgentExecutor class compiles
- [ ] execute() method invokes workflow
- [ ] Task status updated (running → completed/failed)
- [ ] cancelTask() method implemented
- [ ] Results formatted for A2A protocol
- [ ] Error handling works

---

### Success Criteria

- Structured execution pattern implemented
- Task lifecycle properly managed
- Error handling robust
- Logs show executor activity
- CLI pattern followed

---

## Phase 2.2: Task Endpoints

**Priority:** High | **Time:** 3-4 hours

### Objectives

- Implement GET `/tasks/:taskId` for querying
- Implement POST `/tasks/:taskId/cancel` for cancellation
- Replace placeholder `/tasks` endpoint
- Add proper error handling

### Files to Modify

1. `src/execution/serverRunner.ts`

### Implementation Steps

#### Step 2.2.1: Implement Task Query Endpoint

**File:** `src/execution/serverRunner.ts`

Replace or add after existing endpoints:

```typescript
/**
 * Query specific task by ID
 */
app.get('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;

  console.log(`[GET /tasks/${taskId}] Querying task`);

  try {
    const task = await taskStore.getTask(taskId);

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

  } catch (error) {
    console.error(`[GET /tasks/${taskId}] Error:`, error);
    res.status(500).json({
      error: error.message
    });
  }
});
```

---

#### Step 2.2.2: Implement List Tasks Endpoint (Optional)

```typescript
/**
 * List all tasks (optional, for debugging)
 */
app.get('/tasks', async (req, res) => {
  console.log(`[GET /tasks] Listing all tasks`);

  try {
    const tasks = await taskStore.getAllTasks();

    res.json({
      count: tasks.length,
      tasks: tasks.map(task => ({
        taskId: task.taskId,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    });

  } catch (error) {
    console.error(`[GET /tasks] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});
```

---

#### Step 2.2.3: Implement Task Cancellation Endpoint

```typescript
/**
 * Cancel task execution
 */
app.post('/tasks/:taskId/cancel', async (req, res) => {
  const { taskId } = req.params;

  console.log(`[POST /tasks/${taskId}/cancel] Cancelling task`);

  try {
    const task = await taskStore.getTask(taskId);

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

  } catch (error) {
    console.error(`[POST /tasks/${taskId}/cancel] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});
```

---

#### Step 2.2.4: Update Endpoint Logging

Update server startup logs:

```typescript
app.listen(port, () => {
  console.log(`\n📡 Endpoints:`);
  console.log(`  Agent Card: http://localhost:${port}/.well-known/agent.json`);
  console.log(`  Message Send: http://localhost:${port}/message/send`);
  console.log(`  Task Query: http://localhost:${port}/tasks/{taskId}`);
  console.log(`  Task Cancel: http://localhost:${port}/tasks/{taskId}/cancel`);
  console.log(`  Health Check: http://localhost:${port}/health`);
  console.log(`\n✅ Server is ready to receive A2A requests\n`);
});
```

---

### Validation

#### Test Task Query:

```bash
# Create task first
RESPONSE=$(curl -s -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Query test"}]}}')

# Extract taskId (assuming jq is available)
TASK_ID=$(echo $RESPONSE | jq -r '.messageId' | sed 's/msg-/task-/')

# Query task
curl http://localhost:3001/tasks/${TASK_ID} | jq
```

**Expected response:**

```json
{
  "taskId": "task-1234567890123-abc123",
  "status": "completed",
  "result": {...},
  "createdAt": "2025-12-24T12:34:56.789Z",
  "updatedAt": "2025-12-24T12:35:01.234Z"
}
```

#### Test Task Not Found:

```bash
curl -i http://localhost:3001/tasks/non-existent-task
```

**Expected:**

```text
HTTP/1.1 404 Not Found
{"error":"Task not found","taskId":"non-existent-task"}
```

#### Test Task Cancellation:

```bash
# Cancel completed task (should fail)
curl -i -X POST http://localhost:3001/tasks/${COMPLETED_TASK_ID}/cancel
```

**Expected:**

```text
HTTP/1.1 400 Bad Request
{"error":"Cannot cancel completed task","status":"completed"}
```

**Checklist:**

- [ ] GET `/tasks/:taskId` returns task details
- [ ] GET `/tasks/:taskId` returns 404 for non-existent tasks
- [ ] POST `/tasks/:taskId/cancel` cancels running tasks
- [ ] POST `/tasks/:taskId/cancel` rejects completed/failed tasks
- [ ] All endpoints logged at startup
- [ ] Error handling works for all cases

---

### Success Criteria

- All task management endpoints functional
- Proper HTTP status codes (200, 400, 404, 500)
- Clear error messages
- Logs show endpoint activity
- CLI server parity achieved

---

## Phase 2.3: Request Handler Integration

**Priority:** Medium | **Time:** 2-3 hours

**Can run in parallel with Phase 1.2**

### Objectives

- Use DefaultRequestHandler from @a2a-js/sdk
- Use A2AExpressApp.setupRoutes() for automatic registration
- Add fallback for manual endpoints
- Log route registration status

### Files to Modify

1. `src/execution/serverRunner.ts`

### Implementation Steps

#### Step 2.3.1: Try SDK Request Handler

**File:** `src/execution/serverRunner.ts`

After creating executor, before manual endpoint registration:

```typescript
export async function runServer(configPath: string, port: number) {
  // ... existing code ...

  // Initialize executor
  const executor = new AgentExecutor(engine, taskStore, config);
  console.log('✅ AgentExecutor initialized');

  // Try to use A2A SDK request handler
  let sdkRoutesRegistered = false;

  try {
    console.log('⚠️  Attempting to use A2A SDK request handler...');

    const requestHandler = new DefaultRequestHandler({
      agentCard,
      executor,
      taskStore
    });

    // Setup routes automatically
    A2AExpressApp.setupRoutes(app, requestHandler);

    sdkRoutesRegistered = true;
    console.log('✅ A2A SDK routes registered successfully');

  } catch (error) {
    console.warn('⚠️  A2A SDK routes not available, using manual endpoints');
    console.warn(`Error: ${error.message}`);

    // Continue with manual endpoint registration
    sdkRoutesRegistered = false;
  }

  // ... manual endpoint registration ...
}
```

---

#### Step 2.3.2: Keep Manual Endpoints as Fallback

Wrap manual endpoints in conditional:

```typescript
if (!sdkRoutesRegistered) {
  console.log('📡 Registering manual A2A endpoints...');

  // Agent Card
  app.get('/.well-known/agent.json', (req, res) => {
    res.json(agentCard);
  });

  // Message Send
  app.post('/message/send', async (req, res) => {
    // ... existing implementation ...
  });

  // Task Query
  app.get('/tasks/:taskId', async (req, res) => {
    // ... existing implementation ...
  });

  // Task Cancel
  app.post('/tasks/:taskId/cancel', async (req, res) => {
    // ... existing implementation ...
  });

  console.log('✅ Manual endpoints registered');
}
```

---

#### Step 2.3.3: Add Health Endpoint (Always)

Health endpoint is not part of SDK, always add:

```typescript
// Health check (always registered)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: sdkRoutesRegistered ? 'sdk' : 'manual',
    port,
    agentName: config.name
  });
});
```

---

#### Step 2.3.4: Update Route Logging

```typescript
console.log('\n📡 Registered routes:');

if (sdkRoutesRegistered) {
  console.log('✅ A2A SDK routes:');
  console.log('  - GET /.well-known/agent.json (SDK)');
  console.log('  - POST /message/send (SDK)');
  console.log('  - GET /tasks/:taskId (SDK)');
  console.log('  - POST /tasks/:taskId/cancel (SDK)');
} else {
  console.log('⚠️  Manual endpoint registration:');
  console.log('  - GET /.well-known/agent.json');
  console.log('  - POST /message/send');
  console.log('  - GET /tasks/:taskId');
  console.log('  - POST /tasks/:taskId/cancel');
}

console.log('  - GET /health (always manual)');
```

---

### Validation

Check which mode is active:

```bash
curl http://localhost:3001/health | jq
```

**Expected response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-24T12:34:56.789Z",
  "mode": "sdk",  // or "manual"
  "port": 3001,
  "agentName": "TaskCreationAgent"
}
```

**Check logs:**

```text
⚠️  Attempting to use A2A SDK request handler...
✅ A2A SDK routes registered successfully

📡 Registered routes:
✅ A2A SDK routes:
  - GET /.well-known/agent.json (SDK)
  - POST /message/send (SDK)
  - GET /tasks/:taskId (SDK)
  - POST /tasks/:taskId/cancel (SDK)
  - GET /health (always manual)
```

**Checklist:**

- [ ] SDK request handler attempted
- [ ] Falls back to manual if SDK unavailable
- [ ] Health endpoint always available
- [ ] Clear logging of mode (SDK vs manual)
- [ ] All endpoints functional in both modes

---

### Success Criteria

- DefaultRequestHandler used if available
- Manual endpoints work as fallback
- Health endpoint always responds
- Route registration status logged clearly
- No breaking changes to existing functionality

---

## Phase 2 Summary

After completing Phase 2, you will have:

✅ **AgentExecutor Pattern:**

- Structured execution with task lifecycle
- Event handling (if applicable)
- Proper error handling
- CLI pattern compliance

✅ **Task Management Endpoints:**

- GET `/tasks/:taskId` - Query task status
- POST `/tasks/:taskId}/cancel` - Cancel task
- GET `/tasks` - List all tasks (optional)
- Proper HTTP status codes and error messages

✅ **Request Handler Integration:**

- DefaultRequestHandler from @a2a-js/sdk
- Automatic route registration
- Manual fallback endpoints
- Health check always available

---

## Next Steps

Proceed to [Phase 3: Documentation](a2a-phase3-documentation.md) to:

- Create comprehensive documentation in `docs/a2a/`
- Document approval gate issue
- Provide implementation examples
- Create troubleshooting guide

**All Implementation Complete:**

- Infrastructure ✓ (Phase 1)
- Task Management ✓ (Phase 2)
- Ready for documentation ✓

---

## Troubleshooting

### Issue: DefaultRequestHandler not found

SDK may not export it. Use manual endpoints:

```typescript
// Skip SDK setup
const sdkRoutesRegistered = false;
// Use manual endpoints
```

### Issue: Task cancellation doesn't stop workflow

WorkflowEngine may not support mid-execution cancellation. Current implementation marks task as cancelled but doesn't stop running workflow. This is acceptable for Phase 2.

### Issue: Executor format different from CLI

Compare with CLI server's AgentExecutor:

```bash
# Check CLI implementation
cat /Users/akirakudo/Desktop/MyWork/CLI/server/src/server.ts | grep -A 50 "class AgentExecutor"
```

---

## References

- [Phase 1: Infrastructure](a2a-phase1-infrastructure.md) - Prerequisites
- [Implementation Details](a2a-implementation-details.md) - Code examples
- [Testing Plan](a2a-testing-plan.md) - Test cases for Phase 2
- CLI Server: `/Users/akirakudo/Desktop/MyWork/CLI/server/src/server.ts`
