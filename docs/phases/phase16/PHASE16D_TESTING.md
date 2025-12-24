# A2A Testing Plan

This document outlines the testing strategy for validating the A2A server refactoring.

**Parent Document:** [A2A Refactoring Plan](a2a-refactoring-plan.md)

## Testing Objectives

1. Validate all A2A endpoints function correctly
2. Ensure task lifecycle works end-to-end
3. Verify no regressions in existing functionality
4. Confirm CLI server parity
5. Document approval gate issue

---

## Phase 4.1: Server Startup Testing

**Priority:** High | **Estimated Time:** 1-2 hours

### Test Environment Setup

**Prerequisites:**

- ReactFlowTest extension compiled
- Environment variables configured (.env file)
- Workflow configs available (json/a2a/servers/)

**Setup Steps:**

```bash
# Compile extension
cd /Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest
yarn compile

# Verify .env file exists
ls .env

# Check workflow configs
ls json/a2a/servers/
```

### Test Case 1.1: Launch Server with task-creation.json

**Objective:** Verify server starts successfully and logs correctly

**Steps:**

1. Open VSCode with ReactFlowTest extension
2. Open command palette (Cmd+Shift+P)
3. Run "Open Workflow Editor" command
4. Select `json/a2a/servers/task-creation.json`
5. Click "Launch A2A Server" button
6. Observe terminal output

**Expected Output:**

```text
=== Starting A2A Server with config: ./json/a2a/servers/task-creation.json ===
Loading configuration from: /Users/.../json/a2a/servers/task-creation.json
Configuration loaded successfully
Configured recursionLimit: 100 (from JSON: 100)

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

✅ Task store initialized (InMemoryTaskStore)
✅ AgentExecutor initialized

📡 Endpoints:
  Agent Card: http://localhost:3001/.well-known/agent.json
  Message Send: http://localhost:3001/message/send
  Task Query: http://localhost:3001/tasks/{taskId}
  Task Cancel: http://localhost:3001/tasks/{taskId}/cancel
  Health Check: http://localhost:3001/health

🚀 A2A Server started successfully!
Port: 3001
Agent Name: TaskCreationAgent
Protocol Version: 0.3.0

✅ Server is ready to receive A2A requests
```

**Success Criteria:**

- [ ] Server starts without errors
- [ ] All log stages present (model building, graph compilation, etc.)
- [ ] All 5 endpoints logged
- [ ] Port 3001 is listening
- [ ] Protocol version is 0.3.0

**Validation:**

Compare with CLI server logs:

```bash
# CLI server logs for comparison
npm run server:task
# ... observe output ...
```

---

### Test Case 1.2: Verify Agent Card Endpoint

**Objective:** Ensure /.well-known/agent.json returns valid AgentCard

**Command:**

```bash
curl http://localhost:3001/.well-known/agent.json | jq
```

**Expected Response:**

```json
{
  "name": "TaskCreationAgent",
  "description": "Creates and manages research tasks for market analysis...",
  "protocolVersion": "0.3.0",
  "url": "http://localhost:3001/",
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "skills": [
    {
      "id": "create_task_list",
      "name": "Create Task List",
      "description": "Break down complex research requests into actionable task lists",
      "inputModes": ["text"],
      "outputModes": ["text"]
    }
  ]
}
```

**Success Criteria:**

- [ ] HTTP 200 response
- [ ] Valid JSON structure
- [ ] protocolVersion is "0.3.0"
- [ ] defaultInputModes and defaultOutputModes present
- [ ] skills array populated

---

### Test Case 1.3: Verify Health Endpoint

**Objective:** Ensure /health endpoint responds

**Command:**

```bash
curl http://localhost:3001/health | jq
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-24T12:34:56.789Z",
  "mode": "sdk"
}
```

**Success Criteria:**

- [ ] HTTP 200 response
- [ ] status is "healthy"
- [ ] timestamp is ISO format
- [ ] mode indicates SDK or manual

---

### Test Case 1.4: Compare Log Output with CLI

**Objective:** Ensure log format matches CLI server

**Steps:**

1. Capture ReactFlowTest server logs
2. Capture CLI server logs
3. Compare side-by-side

**Comparison Points:**

| Log Element | ReactFlowTest | CLI Server | Match? |
|-------------|---------------|------------|--------|
| Model factory logs | ✓ | ✓ | ✓ |
| State annotation logs | ✓ | ✓ | ✓ |
| Graph compilation logs | ✓ | ✓ | ✓ |
| Endpoint listing | ✓ | ✓ | ✓ |
| Recursion limit | ✓ | ✓ | ✓ |

**Success Criteria:**

- [ ] Log format matches 90%+
- [ ] All major stages logged
- [ ] Emoji indicators present (✅, 🚀, 📡)

---

## Phase 4.2: Task Lifecycle Testing

**Priority:** High | **Estimated Time:** 2-3 hours

### Test Case 2.1: Send Message and Create Task

**Objective:** Verify message send creates and executes task

**Command:**

```bash
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "矢崎総業の会社概要を調査し、タスクリストを作成してください。"
        }
      ]
    }
  }' | jq
```

**Expected Response:**

```json
{
  "messageId": "msg-1234567890123",
  "parts": [
    {
      "kind": "text",
      "text": "{\"messages\": [...], \"taskList\": [...]}"
    }
  ]
}
```

**Expected Terminal Logs:**

```text
🚀 Invoking workflow with recursionLimit: 100
Processing task creation request: 矢崎総業の会社概要を調査し...
[AgentExecutor] Executing task task-1234567890123
Created 6 tasks for the research request.
[AgentExecutor] Task task-1234567890123 completed
```

**Success Criteria:**

- [ ] HTTP 200 response
- [ ] messageId returned
- [ ] parts array contains result
- [ ] Task created in task store
- [ ] Task status transitions: running → completed

---

### Test Case 2.2: Query Task Status

**Objective:** Verify task query endpoint works

**Command:**

```bash
# Extract taskId from previous response
TASK_ID="task-1234567890123"

curl http://localhost:3001/tasks/${TASK_ID} | jq
```

**Expected Response:**

```json
{
  "taskId": "task-1234567890123",
  "status": "completed",
  "result": {
    "messages": [...],
    "taskList": [...]
  },
  "createdAt": "2025-12-24T12:34:56.789Z",
  "updatedAt": "2025-12-24T12:35:01.234Z"
}
```

**Success Criteria:**

- [ ] HTTP 200 response
- [ ] Task found
- [ ] Status is "completed"
- [ ] Result contains task data
- [ ] Timestamps present

---

### Test Case 2.3: Query Non-Existent Task

**Objective:** Verify 404 handling

**Command:**

```bash
curl -i http://localhost:3001/tasks/non-existent-task
```

**Expected Response:**

```text
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Task not found",
  "taskId": "non-existent-task"
}
```

**Success Criteria:**

- [ ] HTTP 404 response
- [ ] Error message clear
- [ ] taskId echoed back

---

### Test Case 2.4: Cancel Running Task

**Objective:** Verify task cancellation works

**Setup:**

Create a long-running task (or mock one):

```bash
# Send message for long task
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Long running task..."}]}}' &

# Quickly cancel it
TASK_ID="task-from-response"
curl -X POST http://localhost:3001/tasks/${TASK_ID}/cancel | jq
```

**Expected Response:**

```json
{
  "taskId": "task-1234567890124",
  "status": "cancelled",
  "message": "Task cancelled successfully"
}
```

**Success Criteria:**

- [ ] HTTP 200 response
- [ ] Task status updated to "cancelled"
- [ ] Workflow execution stops

---

### Test Case 2.5: Cancel Completed Task (Negative)

**Objective:** Verify cannot cancel completed task

**Command:**

```bash
# Use completed task ID from Test 2.2
curl -i -X POST http://localhost:3001/tasks/${COMPLETED_TASK_ID}/cancel
```

**Expected Response:**

```text
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Cannot cancel completed or failed task",
  "status": "completed"
}
```

**Success Criteria:**

- [ ] HTTP 400 response
- [ ] Clear error message
- [ ] Current status returned

---

## Phase 4.3: Multi-Instance Testing

**Priority:** Medium | **Estimated Time:** 2-3 hours

### Test Case 3.1: Launch Multiple Servers

**Objective:** Verify multiple workflow panels can launch independent servers

**Steps:**

1. Open VSCode with ReactFlowTest extension
2. Open workflow editor for task-creation.json (port 3001)
3. Open workflow editor for research-execution.json (port 3002)
4. Open workflow editor for quality-evaluation.json (port 3003)
5. Launch A2A Server for each
6. Verify all running

**Expected State:**

```text
ServerInstanceManager:
- task-creation.json → port 3001, status: running
- research-execution.json → port 3002, status: running
- quality-evaluation.json → port 3003, status: running
```

**Verification:**

```bash
# Check all ports listening
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

**Success Criteria:**

- [ ] All 3 servers start independently
- [ ] No port conflicts
- [ ] ServerInstanceManager tracks all instances
- [ ] Terminals visible in VSCode
- [ ] Each server responds on correct port

---

### Test Case 3.2: Verify Independent Operation

**Objective:** Ensure servers don't interfere with each other

**Command:**

```bash
# Send different messages to each server
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Task creation request"}]}}'

curl -X POST http://localhost:3002/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Research request"}]}}'

curl -X POST http://localhost:3003/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {"role": "user", "parts": [{"type": "text", "text": "Quality check request"}]}}'
```

**Success Criteria:**

- [ ] All requests succeed
- [ ] Each server processes independently
- [ ] No cross-contamination of state
- [ ] Task stores separate per server

---

### Test Case 3.3: Restart Single Server

**Objective:** Verify can restart one server without affecting others

**Steps:**

1. With all 3 servers running
2. Stop task-creation server (port 3001)
3. Verify other servers still running
4. Restart task-creation server
5. Verify all operational

**Verification:**

```bash
# Before stop
curl http://localhost:3001/health  # 200
curl http://localhost:3002/health  # 200
curl http://localhost:3003/health  # 200

# After stop (3001)
curl http://localhost:3001/health  # Error
curl http://localhost:3002/health  # 200
curl http://localhost:3003/health  # 200

# After restart
curl http://localhost:3001/health  # 200
curl http://localhost:3002/health  # 200
curl http://localhost:3003/health  # 200
```

**Success Criteria:**

- [ ] Stop affects only target server
- [ ] Other servers continue running
- [ ] Restart succeeds
- [ ] ServerInstanceManager updated correctly

---

## Phase 4.4: Approval Gate Testing (Documentation Only)

**Priority:** Medium | **Estimated Time:** 1-2 hours

**Note:** This phase focuses on documenting the approval gate issue, NOT fixing it.

### Test Case 4.1: Reproduce Approval Gate Issue

**Objective:** Reproduce and document the auto-approval bug

**Command:**

```bash
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エクゼクティブサマリーにまとめてください。"
        }
      ]
    }
  }' | jq > approval-gate-response.json
```

**Expected Terminal Logs:**

```text
Created 6 tasks for the research request.

=== APPROVAL_GATE NODE EXECUTION ===
Current state: { taskListLength: 6, approvalStatus: '', hasTaskList: true }
No tasks to approve - either no taskList or empty taskList
```

**Expected Response:**

```json
{
  "messageId": "msg-1234567890125",
  "parts": [
    {
      "kind": "text",
      "text": "{\"messages\": [...], \"taskList\": [...], \"approvalStatus\": \"approved\", \"feedback\": \"No tasks to process\"}"
    }
  ]
}
```

**Documentation Points:**

- [ ] Terminal logs captured
- [ ] Response JSON saved
- [ ] State values documented
- [ ] taskList confirmed present (6 tasks)
- [ ] approvalStatus auto-set to "approved"

---

### Test Case 4.2: Add Diagnostic Logging

**Objective:** Add logging to approval_gate implementation to trace issue

**Steps:**

1. Edit `json/a2a/servers/task-creation.json`
2. Find approval_gate node implementation
3. Add console.log statements:

```javascript
// At start of approval_gate implementation
console.log('=== APPROVAL_GATE NODE EXECUTION ===');
console.log('Full state:', JSON.stringify(state, null, 2));
console.log('taskList type:', typeof state.taskList);
console.log('taskList value:', state.taskList);
console.log('taskList length:', state.taskList?.length);
console.log('Condition check:');
console.log('  !taskList:', !state.taskList);
console.log('  taskList.length === 0:', state.taskList?.length === 0);
```

4. Restart server
5. Re-run Test 4.1
6. Analyze logs

**Expected Diagnostic Output:**

```text
=== APPROVAL_GATE NODE EXECUTION ===
Full state: {
  "messages": [...],
  "taskList": [
    { "objective": "Gather company overview...", ...},
    { "objective": "Research product offerings...", ...},
    ...
  ],
  "approvalStatus": "",
  "feedback": ""
}
taskList type: object
taskList value: [Array(6)]
taskList length: 6
Condition check:
  !taskList: false
  taskList.length === 0: false
```

**Documentation Points:**

- [ ] State structure confirmed
- [ ] taskList exists and populated
- [ ] Condition check values logged
- [ ] Issue identified (why condition passes despite data)

---

### Test Case 4.3: Document Proposed Fix

**Objective:** Document the fix (DO NOT implement)

**Proposed Solution:**

```javascript
// Current (buggy) implementation
const taskList = state.taskList;
if (!taskList || taskList.length === 0) {
  return {
    messages: [new HumanMessage("No tasks available for approval.")],
    approvalStatus: "approved",
    feedback: "No tasks to process"
  };
}

// Proposed fix
const taskList = state.taskList;

console.log('=== APPROVAL_GATE NODE EXECUTION ===');
console.log('Current state:', {
  taskListLength: taskList?.length,
  approvalStatus: state.approvalStatus,
  hasTaskList: !!taskList
});

// Check if already approved (to avoid re-approval)
if (state.approvalStatus === 'approved') {
  return {};
}

// No tasks case
if (!taskList || taskList.length === 0) {
  return {
    messages: [new HumanMessage("No tasks available for approval.")],
    approvalStatus: "approved",
    feedback: "No tasks to process"
  };
}

// Has tasks - trigger interrupt
return interrupt({
  message: `Created ${taskList.length} tasks. Please review and approve.`,
  state: { taskList }
});
```

**Documentation Points:**

- [ ] Current implementation documented
- [ ] Issue explained
- [ ] Proposed fix documented
- [ ] interrupt() usage explained
- [ ] Testing approach outlined

---

### Test Case 4.4: Document Workaround

**Objective:** Document temporary workaround until fix is implemented

**Workaround Options:**

**Option 1: Pre-Approve in Config**

```json
"stateAnnotation": {
  "fields": {
    "approvalStatus": {
      "type": "string",
      "default": "pending",  // Set default value
      "reducer": "(x, y) => y || x"
    }
  }
}
```

**Option 2: Skip Approval Gate**

```json
// Remove conditional edge
"edges": [
  {"from": "task_creator", "to": "__end__"}  // Skip approval_gate
]
```

**Option 3: External Approval**

Call approval endpoint manually after task creation.

**Documentation Points:**

- [ ] All workarounds documented
- [ ] Pros/cons of each listed
- [ ] Implementation steps provided
- [ ] Migration path to fix noted

---

## Test Environment Cleanup

After all tests:

```bash
# Stop all servers
# Via VSCode: Click "Stop Server" in each workflow panel

# Verify all stopped
curl http://localhost:3001/health  # Should fail
curl http://localhost:3002/health  # Should fail
curl http://localhost:3003/health  # Should fail

# Clear terminal history if needed
```

---

## Test Results Documentation

### Results Template

For each test case, document:

```markdown
## Test Case X.X: [Name]

**Status:** ✅ Pass | ❌ Fail | ⚠️ Partial

**Execution Date:** YYYY-MM-DD

**Tester:** [Name]

**Results:**
- [Result point 1]
- [Result point 2]

**Issues Found:**
- [Issue description]
- [Severity: High/Medium/Low]

**Screenshots/Logs:**
[Attach relevant evidence]

**Notes:**
[Additional observations]
```

### Summary Report

Create summary after all tests:

```markdown
# A2A Server Testing Summary

**Test Date:** YYYY-MM-DD
**Total Test Cases:** 15
**Passed:** 14
**Failed:** 0
**Partial:** 1 (Approval Gate - documented, not fixed)

## Key Findings

1. All A2A endpoints functional
2. Task lifecycle works correctly
3. Multi-instance management preserved
4. Logs match CLI format
5. Approval gate issue documented

## Recommendations

1. Proceed with documentation phase
2. Plan approval gate fix for Phase 5
3. Add integration tests for orchestrator
4. Monitor production deployment

## Next Steps

- Complete Phase 3 (Documentation)
- Review with stakeholders
- Plan Phase 5 (Approval Gate Fix)
```

---

## Automated Testing (Future)

### Unit Tests

```typescript
// Example: Task store tests
describe('InMemoryTaskStore', () => {
  test('creates task with correct status', async () => {
    const store = new InMemoryTaskStore();
    await store.createTask('task-1', { status: 'running' });
    const task = await store.getTask('task-1');
    expect(task.status).toBe('running');
  });
});
```

### Integration Tests

```typescript
// Example: Endpoint tests
describe('A2A Endpoints', () => {
  test('GET /health returns 200', async () => {
    const response = await fetch('http://localhost:3001/health');
    expect(response.status).toBe(200);
  });
});
```

### End-to-End Tests

```typescript
// Example: Full workflow test
describe('Task Creation Workflow', () => {
  test('creates task list from user request', async () => {
    const response = await sendMessage('矢崎総業の調査');
    const result = await response.json();
    expect(result.taskList).toHaveLength(6);
  });
});
```

---

## References

- [Implementation Details](a2a-implementation-details.md) for code changes
- [Troubleshooting Guide](a2a-documentation-plan.md#phase-36-troubleshootingmd) for common issues
- CLI server logs for comparison
- A2A Protocol specification

---

## Appendix: Test Data

### Sample Request Messages

**Japanese (Original):**

```json
{
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "矢崎総業の会社概要、製品サービス(特にデジタコとドラレコ、車載メーター)、強み弱み、中期戦略、AIの取り組みを調査し、エクゼクティブサマリーにまとめてください。"
      }
    ]
  }
}
```

**English (For testing):**

```json
{
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Research the company overview, product offerings (especially digital tachographs, dashcams, and vehicle meters), strengths/weaknesses, mid-term strategy, and AI initiatives for Yazaki Corporation, and create an executive summary."
      }
    ]
  }
}
```

**Short Test:**

```json
{
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Create a task list for researching Tesla's electric vehicle technology."
      }
    ]
  }
}
```

### Sample Expected Responses

See `approval-gate-response.json` for full example.
