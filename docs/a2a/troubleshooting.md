# A2A Server Troubleshooting Guide

**Common Issues and Solutions for A2A Protocol Implementation**

**Last Updated**: 2025-12-24 | **Phase**: 16C Documentation

---

## Table of Contents

1. [Approval Gate Issue](#approval-gate-issue) ⚠️ **PRIORITY**
2. [Common Configuration Errors](#common-configuration-errors)
3. [State Management Issues](#state-management-issues)
4. [Model Factory Errors](#model-factory-errors)
5. [A2A Protocol Compliance Issues](#a2a-protocol-compliance-issues)
6. [Task Store Issues](#task-store-issues)
7. [Multi-Instance Problems](#multi-instance-problems)
8. [Debugging Techniques](#debugging-techniques)

---

## Approval Gate Issue

### ⚠️ CRITICAL ISSUE: Auto-Approval Without User Interaction

**STATUS**: Documented for investigation (NOT YET FIXED)

**Severity**: High - Affects human-in-the-loop workflows

---

### Problem Statement

The `approval_gate` node in task-creation.json automatically approves tasks without user interaction, despite 6 tasks being created and requiring approval.

**Expected Behavior**:
```text
task_creator creates 6 tasks
    ↓
approval_gate detects taskList with 6 items
    ↓
Returns interrupt() or approval request to user
    ↓
User reviews and responds: "approve", "reject", or "modify"
    ↓
Workflow continues based on user response
```

**Actual Behavior**:
```text
task_creator creates 6 tasks
    ↓
approval_gate incorrectly detects NO tasks
    ↓
Auto-approves with "No tasks to process"
    ↓
Workflow proceeds without user interaction ❌
```

---

### Evidence from Logs

From user's actual test run:

```text
=== APPROVAL_GATE NODE EXECUTION ===
Current state: {
  taskListLength: 6,
  approvalStatus: '',
  hasTaskList: true
}
No tasks to approve - either no taskList or empty taskList

Response:
"approvalStatus": "approved",
"feedback": "No tasks to process"
```

**Analysis**: State shows `taskListLength: 6` and `hasTaskList: true`, yet the condition `!taskList || taskList.length === 0` evaluates to true, causing auto-approval.

---

### Root Cause Analysis

#### Suspected Issue 1: State Access Problem

The approval_gate implementation accesses `state.taskList`:

```javascript
const taskList = state.taskList;

if (!taskList || taskList.length === 0) {
  // This condition incorrectly passes despite 6 tasks
  return {
    messages: [new HumanMessage("No tasks available for approval.")],
    approvalStatus: "approved",
    feedback: "No tasks to process"
  };
}
```

**Hypothesis**: The `taskList` variable may be:
1. Undefined despite state showing `hasTaskList: true`
2. Not properly passed from task_creator node to approval_gate
3. Cleared or overwritten during state transition

#### Suspected Issue 2: Reducer Behavior

The taskList reducer is defined as:

```json
{
  "taskList": {
    "type": "any[]",
    "reducer": "(x, y) => y || x",
    "default": []
  }
}
```

**Hypothesis**: The reducer may not properly merge the taskList when:
1. Node returns `{ taskList: [...] }`
2. State update occurs between nodes
3. Last-write-wins pattern doesn't preserve array

#### Suspected Issue 3: Conditional Logic Flaw

Current implementation from [task-creation.json:131](../../json/a2a/servers/task-creation.json#L131):

```javascript
const taskList = state.taskList;

if (!taskList || taskList.length === 0) {
  console.log('No tasks to approve - either no taskList or empty taskList');
  return {
    messages: [new HumanMessage("No tasks available for approval.")],
    approvalStatus: "approved",
    feedback: "No tasks to process"
  };
}
```

**Problem**: This logic auto-approves when taskList is falsy, **before** checking if approval is needed.

---

### Proposed Fix (Documentation Only)

**⚠️ IMPORTANT**: This fix is **NOT IMPLEMENTED** - it is documented here for future investigation.

#### Option 1: Improved State Detection

```javascript
// approval_gate implementation (PROPOSED - NOT IMPLEMENTED)

console.log('=== APPROVAL_GATE NODE EXECUTION ===');
console.log('Current state:', {
  taskListLength: state.taskList?.length ?? 'undefined',
  taskListExists: !!state.taskList,
  taskListType: typeof state.taskList,
  taskListIsArray: Array.isArray(state.taskList),
  approvalStatus: state.approvalStatus,
  stateKeys: Object.keys(state)
});

const taskList = state.taskList;

// Check if already approved/rejected
if (state.approvalStatus === 'approved') {
  console.log('Tasks already approved, skipping approval gate');
  return {
    messages: [new HumanMessage("Tasks already approved.")],
    approvalStatus: 'approved',
    feedback: state.feedback || 'Previously approved'
  };
}

if (state.approvalStatus === 'rejected') {
  console.log('Tasks rejected, routing to refinement');
  return {
    messages: [new HumanMessage("Tasks rejected, refining...")],
    approvalStatus: 'rejected',
    feedback: state.feedback || 'Rejected by user'
  };
}

// Verify taskList exists and has items
if (!taskList) {
  console.error('ERROR: taskList is undefined or null');
  console.error('Full state:', JSON.stringify(state, null, 2));
  return {
    messages: [new HumanMessage("Error: No task list found in state.")],
    approvalStatus: 'approved',
    feedback: 'Error - no taskList'
  };
}

if (!Array.isArray(taskList)) {
  console.error('ERROR: taskList is not an array:', typeof taskList);
  return {
    messages: [new HumanMessage("Error: Task list is not an array.")],
    approvalStatus: 'approved',
    feedback: 'Error - taskList not array'
  };
}

if (taskList.length === 0) {
  console.log('No tasks in list, auto-approving empty list');
  return {
    messages: [new HumanMessage("No tasks to approve.")],
    approvalStatus: 'approved',
    feedback: 'Empty task list'
  };
}

// Has tasks - trigger interrupt for human approval
console.log(`Requesting approval for ${taskList.length} tasks`);

const taskSummary = taskList.map((task, index) =>
  `${index + 1}. ${task.objective} (${task.estimated_effort || 'N/A'})`
).join('\\n');

const totalHours = taskList.reduce((total, task) => {
  const hours = parseInt((task.estimated_effort || '0 hours').replace(/[^0-9]/g, '')) || 0;
  return total + hours;
}, 0);

// Return interrupt request (Note: interrupt() function may not be available)
return {
  messages: [new HumanMessage(
    `Created ${taskList.length} tasks. Please review and approve.\\n\\n` +
    `${taskSummary}\\n\\n` +
    `Total: ${taskList.length} tasks, ${totalHours} hours\\n\\n` +
    `Please respond with: approve, reject, or modify`
  )],
  approvalStatus: 'pending',
  feedback: 'Awaiting user approval'
};
```

#### Option 2: Explicit State Validation

Add state validation node before approval_gate:

```json
{
  "nodes": [
    {
      "id": "validate_state",
      "function": {
        "parameters": [{ "name": "state", "type": "typeof AgentState.State" }],
        "output": { "messages": "Message[]" },
        "implementation": "
          console.log('=== STATE VALIDATION ===');
          console.log('State keys:', Object.keys(state));
          console.log('taskList:', state.taskList);
          console.log('taskList type:', typeof state.taskList);
          console.log('taskList isArray:', Array.isArray(state.taskList));
          console.log('taskList length:', state.taskList?.length);

          if (!state.taskList || !Array.isArray(state.taskList) || state.taskList.length === 0) {
            console.error('VALIDATION FAILED: Invalid taskList');
            return {
              messages: [{
                role: 'assistant',
                content: 'Error: Task list validation failed'
              }]
            };
          }

          console.log('VALIDATION PASSED: taskList is valid array with', state.taskList.length, 'items');
          return { messages: [] };
        "
      }
    }
  ],
  "edges": [
    { "from": "task_creator", "to": "validate_state" },
    { "from": "validate_state", "to": "approval_gate" }
  ]
}
```

#### Option 3: Alternative Reducer

Change taskList reducer to explicitly handle arrays:

```json
{
  "taskList": {
    "type": "any[]",
    "reducer": "(x, y) => {
      console.log('taskList reducer: x=', x, 'y=', y);
      if (y !== undefined && Array.isArray(y)) {
        return y;
      }
      return x || [];
    }",
    "default": []
  }
}
```

---

### Workarounds

Until the root cause is fixed, use these workarounds:

#### Workaround 1: Skip Approval Gate

Remove approval workflow entirely:

```json
{
  "edges": [
    { "from": "task_creator", "to": "__end__" }
    // Remove approval_gate edges
  ]
}
```

**Pros**: Workflow completes without blocking
**Cons**: No human approval, defeats purpose of approval gate

#### Workaround 2: External Approval API

Implement approval via separate endpoint:

```bash
# After task creation, manually approve via API
curl -X POST http://localhost:3001/tasks/{taskId}/approve \
  -H "Content-Type: application/json" \
  -d '{"approved": true, "feedback": "Looks good"}'
```

**Pros**: Full control over approval
**Cons**: Requires manual intervention, not automated

#### Workaround 3: Pre-Approve in Config

Set default approvalStatus to "approved":

```json
{
  "annotation": {
    "approvalStatus": {
      "type": "string",
      "reducer": "(x, y) => y || x",
      "default": "approved"  // Pre-approve by default
    }
  }
}
```

**Pros**: Workflow completes automatically
**Cons**: No user review, defeats approval purpose

---

### Testing Approach

To diagnose and verify fix:

#### Test 1: State Inspection

Add extensive logging to approval_gate:

```javascript
console.log('=== FULL STATE DUMP ===');
console.log(JSON.stringify(state, null, 2));

console.log('=== TASK LIST INSPECTION ===');
console.log('state.taskList:', state.taskList);
console.log('typeof state.taskList:', typeof state.taskList);
console.log('Array.isArray(state.taskList):', Array.isArray(state.taskList));
console.log('state.taskList?.length:', state.taskList?.length);

if (state.taskList) {
  console.log('First task:', state.taskList[0]);
  console.log('Task list:', state.taskList.map(t => t.objective));
}
```

#### Test 2: Reducer Verification

Add logging to reducer:

```json
{
  "taskList": {
    "reducer": "(x, y) => {
      console.log('[REDUCER] taskList: x=', x, 'y=', y);
      const result = y || x;
      console.log('[REDUCER] taskList result:', result);
      return result;
    }"
  }
}
```

#### Test 3: Node Output Verification

Log task_creator output:

```javascript
// In task_creator implementation
const taskList = [/* created tasks */];
console.log('task_creator returning taskList:', taskList);
console.log('task_creator taskList length:', taskList.length);

return {
  messages: [response],
  taskList: taskList
};
```

#### Test 4: End-to-End Test

```bash
# Start server with test config
node -e "require('./out/execution/serverRunner.js').runServer('/path/to/task-creation-test.json', 3001)"

# Send test request
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "Create 3 simple test tasks"
      }]
    }
  }'

# Check logs for:
# 1. task_creator creates tasks
# 2. State shows taskList with items
# 3. approval_gate correctly detects tasks
# 4. Approval request returned (not auto-approved)
```

---

### Next Steps for Investigation

1. **Add Debug Logging**: Implement comprehensive logging as shown in Test 1-3
2. **Compare with CLI Server**: Check if CLI server has same issue
3. **Test Reducer Behavior**: Verify taskList reducer works correctly
4. **Review WorkflowEngine**: Check how state updates are applied between nodes
5. **Implement Proposed Fix**: Try Option 1 (Improved State Detection) first

**DO NOT IMPLEMENT FIX YET** - This issue requires thorough investigation before making changes to the codebase.

---

## Common Configuration Errors

### Error: Missing Required Field

**Symptom**:
```text
Error: config.a2aEndpoint.agentCard.name is required
```

**Cause**: Required field missing from configuration

**Solution**: Add all required AgentCard fields:
```json
{
  "config": {
    "a2aEndpoint": {
      "agentCard": {
        "name": "MyAgent",
        "description": "Agent description",
        "protocolVersion": "0.3.0",
        "version": "1.0.0",
        "url": "http://localhost:3000/",
        "capabilities": {
          "streaming": false,
          "pushNotifications": false,
          "stateTransitionHistory": true
        }
      }
    }
  }
}
```

### Error: Invalid Reducer Syntax

**Symptom**:
```text
SyntaxError: Unexpected token '=>'
```

**Cause**: Reducer function has syntax error

**Solution**: Verify reducer syntax is valid JavaScript:
```json
{
  "annotation": {
    "messages": {
      "reducer": "(x, y) => x.concat(y)"  // Valid arrow function
    }
  }
}
```

**Common Mistakes**:
- Missing parentheses: `x, y => x.concat(y)` ❌
- Wrong operator: `(x, y) -> x.concat(y)` ❌
- Invalid JavaScript: `(x, y) => x + y` (for arrays) ❌

### Error: modelRef Not Found

**Symptom**:
```text
Error: Model 'taskModel' not found in models configuration
```

**Cause**: Node references non-existent model ID

**Solution**: Ensure model ID exists in models array:
```json
{
  "models": [
    {
      "id": "taskModel",  // Must match modelRef
      "type": "OpenAI",
      "config": { ... }
    }
  ],
  "nodes": [
    {
      "function": {
        "parameters": [
          {
            "name": "model",
            "modelRef": "taskModel"  // Must match model ID
          }
        ]
      }
    }
  ]
}
```

### Error: Disconnected Node

**Symptom**: Node never executes, no logs appear

**Cause**: Node not connected in edges array

**Solution**: Ensure all nodes have incoming edge:
```json
{
  "nodes": [
    { "id": "node_a" },
    { "id": "node_b" },
    { "id": "node_c" }
  ],
  "edges": [
    { "from": "__start__", "to": "node_a" },  // node_a has incoming edge
    { "from": "node_a", "to": "node_b" },     // node_b has incoming edge
    // node_c is disconnected! ❌
  ]
}
```

**Fix**: Add edge to node_c:
```json
{
  "edges": [
    { "from": "__start__", "to": "node_a" },
    { "from": "node_a", "to": "node_b" },
    { "from": "node_b", "to": "node_c" }  // Now connected ✅
  ]
}
```

---

## State Management Issues

### Issue: State Not Persisting

**Symptom**: Previous conversation context lost between requests

**Cause**: Missing checkpointer or incorrect thread_id

**Solution 1**: Add MemorySaver checkpointer:
```json
{
  "stateGraph": {
    "config": {
      "checkpointer": {
        "type": "MemorySaver"
      }
    }
  }
}
```

**Solution 2**: Ensure consistent thread_id:
```bash
# First request - creates thread
curl -X POST http://localhost:3001/message/send \
  -d '{"message": {...}, "thread_id": "thread-123"}'

# Second request - MUST use same thread_id
curl -X POST http://localhost:3001/message/send \
  -d '{"message": {...}, "thread_id": "thread-123"}'  # Same ID ✅
```

### Issue: State Overwrite

**Symptom**: Node output overwrites previous state instead of merging

**Cause**: Incorrect reducer pattern

**Solution**: Use appropriate reducer for field type:

**For Arrays (append)**:
```json
{
  "messages": {
    "type": "BaseMessage[]",
    "reducer": "(x, y) => x.concat(y)"  // Concatenate arrays
  }
}
```

**For Single Values (last-write-wins)**:
```json
{
  "status": {
    "type": "string",
    "reducer": "(x, y) => y || x"  // Use new value if truthy
  }
}
```

**For Objects (merge)**:
```json
{
  "metadata": {
    "type": "object",
    "reducer": "(x, y) => ({ ...x, ...y })"  // Shallow merge
  }
}
```

### Issue: Reducer Not Working

**Symptom**: State updates ignored or produce unexpected results

**Diagnosis**: Add logging to reducer:
```json
{
  "taskList": {
    "reducer": "(x, y) => {
      console.log('[REDUCER] Input x:', x);
      console.log('[REDUCER] Input y:', y);
      const result = y || x;
      console.log('[REDUCER] Output:', result);
      return result;
    }"
  }
}
```

**Common Issues**:
1. Reducer returns undefined (falls back to default)
2. Reducer syntax error (silently fails)
3. Type mismatch (returns wrong type)

---

## Model Factory Errors

### Error: API Key Missing

**Symptom**:
```text
Error: OpenAI API key not found in environment
```

**Cause**: Missing or incorrect environment variable

**Solution**: Add API key to .env file:
```bash
# Create or edit .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434
```

**Verify loading**:
```bash
# Check server logs for this line:
✓ Loaded environment variables from: /path/to/.env
```

### Error: Model Not Found

**Symptom**:
```text
Error: Model 'gpt-5-ultra' not found
```

**Cause**: Invalid model name

**Solution**: Use valid model names:

**OpenAI**:
- `gpt-4o` - Most capable
- `gpt-4o-mini` - Recommended for most use cases
- `gpt-3.5-turbo` - Fastest, lower cost

**Anthropic**:
- `claude-3-5-sonnet-20241022` - Most capable Sonnet
- `claude-3-5-haiku-20241022` - Fast and efficient

**Ollama**:
- `llama3.1` - Local model
- Must be installed via: `ollama pull llama3.1`

### Error: Rate Limiting

**Symptom**:
```text
Error: Rate limit exceeded for API key
```

**Cause**: Too many API requests

**Solutions**:
1. **Add Delays**: Implement retry logic with exponential backoff
2. **Use Different Model**: Switch to faster/cheaper model
3. **Upgrade Tier**: Increase API rate limits
4. **Local Model**: Use Ollama for unlimited requests

---

## A2A Protocol Compliance Issues

### Issue: Invalid Message Format

**Symptom**: Agent rejects message with 400 error

**Cause**: Incorrect A2A message structure

**Correct Format**:
```json
{
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Your message here"
      }
    ]
  }
}
```

**Common Mistakes**:
```json
// Wrong: Missing 'message' wrapper ❌
{
  "role": "user",
  "content": "text"
}

// Wrong: Using 'content' instead of 'parts' ❌
{
  "message": {
    "role": "user",
    "content": "text"
  }
}

// Wrong: No 'type' field in parts ❌
{
  "message": {
    "role": "user",
    "parts": ["text"]
  }
}
```

### Issue: AgentCard Missing Fields

**Symptom**: Client can't connect to agent

**Cause**: AgentCard missing required protocol fields

**Required Fields**:
```json
{
  "name": "MyAgent",
  "description": "Agent description",
  "protocolVersion": "0.3.0",  // Must be "0.3.0"
  "version": "1.0.0",
  "url": "http://localhost:3000/",
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain"],
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true
  }
}
```

---

## Task Store Issues

### Issue: Task Not Found

**Symptom**:
```json
{
  "error": "Task not found",
  "taskId": "task-123"
}
```

**Cause**: Task ID doesn't exist or was cleared

**Diagnosis**:
```bash
# List all tasks
curl http://localhost:3001/tasks

# Check specific task
curl http://localhost:3001/tasks/task-123
```

**Solutions**:
1. Verify task ID is correct
2. Check if server restarted (clears in-memory store)
3. Use correct server port

### Issue: Memory Leak

**Symptom**: Server memory usage grows over time

**Cause**: Tasks never cleared from in-memory store

**Solution**: Implement task cleanup (future enhancement):
```typescript
// Periodic cleanup of completed tasks
setInterval(() => {
  const tasks = await taskStore.getAllTasks();
  const now = Date.now();

  for (const task of tasks) {
    // Delete completed tasks older than 1 hour
    if (task.status === 'completed' && now - task.updatedAt > 3600000) {
      await taskStore.deleteTask(task.taskId);
    }
  }
}, 600000);  // Run every 10 minutes
```

---

## Multi-Instance Problems

### Issue: Port Conflict

**Symptom**:
```text
Error: Port 3001 already in use
```

**Cause**: Another process using the port

**Diagnosis**:
```bash
# Find process using port
lsof -i :3001

# Kill process if needed
kill <PID>
```

**Solution**: Use different port:
```bash
node -e "require('./out/execution/serverRunner.js').runServer('config.json', 3002)"
```

**VSCode Extension**: Automatically increments port if unavailable

### Issue: Lost Track of Servers

**Symptom**: Multiple servers running, don't know which is which

**Solution**: Use health check endpoint:
```bash
# Check server on each port
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Response shows agent name:
{
  "status": "healthy",
  "agentName": "TaskCreationAgent",
  "port": 3001
}
```

---

## Debugging Techniques

### Technique 1: Verbose Logging

Add comprehensive logging to node implementations:

```javascript
// At start of node
console.log('=== NODE EXECUTION: node_name ===');
console.log('Input state:', JSON.stringify(state, null, 2));

// During processing
console.log('Processing step 1: ...');
const result = await someOperation();
console.log('Step 1 result:', result);

// At end of node
console.log('Output:', JSON.stringify(output, null, 2));
console.log('=== NODE COMPLETE: node_name ===');
```

### Technique 2: State Inspection

Log full state at key points:

```javascript
console.log('=== FULL STATE DUMP ===');
console.log('State keys:', Object.keys(state));

for (const [key, value] of Object.entries(state)) {
  console.log(`  ${key}:`, typeof value, Array.isArray(value) ? `[${value.length} items]` : value);
}
```

### Technique 3: Endpoint Testing

Test endpoints independently:

```bash
# Test AgentCard
curl http://localhost:3001/.well-known/agent.json | jq

# Test message send
curl -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {...}}' | jq

# Test task query
curl http://localhost:3001/tasks/task-123 | jq

# Test health
curl http://localhost:3001/health | jq
```

### Technique 4: Log Analysis

Monitor server logs in real-time:

```bash
# Run server with output to file
node -e "require('./out/execution/serverRunner.js').runServer('config.json', 3001)" 2>&1 | tee server.log

# In another terminal, watch logs
tail -f server.log | grep "ERROR"
tail -f server.log | grep "approval_gate"
```

### Technique 5: Network Inspection

Debug A2A communication:

```bash
# Use curl with verbose output
curl -v -X POST http://localhost:3001/message/send \
  -H "Content-Type: application/json" \
  -d '{"message": {...}}'

# Use network monitoring tools
# (tcpdump, Wireshark, etc.)
```

---

## Summary

This troubleshooting guide covers the most common issues encountered when implementing A2A Protocol v0.3.0 servers. Key takeaways:

⚠️ **Approval Gate Issue**
- Critical bug requiring investigation
- Multiple proposed fixes documented
- Workarounds available for immediate use
- DO NOT IMPLEMENT FIX without thorough testing

✅ **Configuration Errors**
- Verify all required fields present
- Check reducer syntax is valid JavaScript
- Ensure nodes connected in edges array
- Match modelRef to actual model IDs

✅ **State Management**
- Use appropriate reducer for each field type
- Add MemorySaver checkpointer for persistence
- Maintain consistent thread_id across requests

✅ **Debugging**
- Add verbose logging at key points
- Inspect full state dumps
- Test endpoints independently
- Monitor logs in real-time

---

## Related Documentation

- [Implementation Guide](implementation-guide.md) - Server setup instructions
- [Configuration Reference](config-reference.md) - JSON configuration format
- [Architecture Comparison](comparison.md) - VSCode vs CLI implementation
- [Orchestration Guide](orchestration.md) - Multi-agent workflow patterns

---

**Need More Help?**

1. Check server logs for detailed error messages
2. Enable verbose logging in node implementations
3. Test endpoints independently with curl
4. Review configuration against [Config Reference](config-reference.md)
5. Compare with working examples in `json/a2a/servers/`

**Found a Bug?** Document it following the Approval Gate Issue template above.
