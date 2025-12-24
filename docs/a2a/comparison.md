# A2A Server Architecture Comparison

**VSCode Extension vs CLI Server Implementation**

**Last Updated**: 2025-12-24 | **Phase**: 16C Documentation

---

## Executive Summary

This document compares the **ReactFlowTest VSCode Extension's A2A server** with the **standalone CLI server** implementation. Both implement the A2A Protocol v0.3.0 for agent-to-agent communication but differ in their deployment models, integration patterns, and use cases.

### Key Findings

1. **Deployment Model**: VSCode extension provides IDE-integrated workflow management, while CLI server offers standalone deployment flexibility
2. **Task Management**: Both implement full task lifecycle tracking with AgentExecutor pattern
3. **Protocol Compliance**: Both comply with A2A Protocol v0.3.0 with identical endpoint structures
4. **Environment Management**: Both support multi-location .env file loading
5. **Logging Format**: VSCode extension matches CLI server's verbose logging for easier debugging
6. **State Management**: Both use SimpleTaskStore/InMemoryTaskStore for task tracking
7. **Multi-Instance Support**: VSCode extension adds terminal-based instance management for multiple simultaneous servers

### Use Case Recommendations

**Use VSCode Extension When**:
- Working within VSCode IDE environment
- Need visual workflow editor with React Flow UI
- Want terminal-based server management with instance tracking
- Require webview integration for agent configuration

**Use CLI Server When**:
- Need standalone server deployment (Docker, cloud, etc.)
- Running in headless/CI environments
- Prefer command-line tools over IDE integration
- Deploying multiple agents as microservices

---

## Architecture Comparison

### VSCode Extension A2A Server

```text
User → VSCode Extension → WorkflowEditorPanel
                              ↓
                         A2AServerLauncher → TerminalManager
                              ↓
                         serverRunner.ts (Express + Task Store)
                              ↓
                         AgentExecutor → SimpleTaskStore
                              ↓
                         WorkflowEngine.invoke() → Tracked execution
                              ↓
                         Response → Webview / Client
```

**Key Components**:
- **A2AServerLauncher.ts** ([src/execution/A2AServerLauncher.ts](../../src/execution/A2AServerLauncher.ts)) - Launches Node.js processes via terminal
- **ServerInstanceManager.ts** ([src/execution/ServerInstanceManager.ts](../../src/execution/ServerInstanceManager.ts)) - Tracks multiple server instances
- **serverRunner.ts** ([src/execution/serverRunner.ts](../../src/execution/serverRunner.ts)) - Express server with AgentExecutor
- **TerminalManager.ts** ([src/execution/TerminalManager.ts](../../src/execution/TerminalManager.ts)) - Manages VSCode terminals for server processes

**Deployment**: Runs within VSCode extension host, launched via terminal commands

### CLI Server

```text
User → CLI Command → server.ts (Express + @a2a-js/sdk)
                         ↓
                    AgentExecutor → InMemoryTaskStore
                         ↓
                    WorkflowEngine.invoke() → Tracked execution
                         ↓
                    DefaultRequestHandler → Response → Client
```

**Key Components**:
- **server.ts** - Standalone Express server with SDK integration
- **@a2a-js/sdk** - Official SDK for request handling and protocol utilities
- **InMemoryTaskStore** - Task state management from SDK
- **DefaultRequestHandler** - SDK's request handler for protocol compliance

**Deployment**: Standalone Node.js process, can run anywhere Node.js is supported

---

## Feature Matrix

| Feature | VSCode Extension | CLI Server | Notes |
|---------|-----------------|------------|-------|
| **A2A Protocol v0.3.0** | ✅ | ✅ | Both fully compliant |
| **AgentCard Endpoint** | ✅ `/.well-known/agent.json` | ✅ `/.well-known/agent.json` | Identical structure |
| **Message Send** | ✅ `POST /message/send` | ✅ `POST /message/send` | Same request/response format |
| **Task Query** | ✅ `GET /tasks/:taskId` | ✅ `GET /tasks/:taskId` | Full task lifecycle info |
| **Task Cancel** | ✅ `POST /tasks/:taskId/cancel` | ✅ `POST /tasks/:taskId/cancel` | Cancellation support |
| **Task List** | ✅ `GET /tasks` | ❌ Not included | VSCode adds for debugging |
| **Health Check** | ✅ `GET /health` | ❌ Not included | VSCode adds for monitoring |
| **@a2a-js/sdk** | ❌ Custom implementation | ✅ Full SDK integration | VSCode uses simplified version |
| **Task Store** | ✅ SimpleTaskStore | ✅ InMemoryTaskStore | Different implementations, same interface |
| **AgentExecutor** | ✅ Custom class | ✅ Custom class | Both follow same pattern |
| **Verbose Logging** | ✅ CLI-compatible format | ✅ Comprehensive logs | Formats match for comparison |
| **Environment Loading** | ✅ Multi-location search | ✅ Standard .env | VSCode searches 3 locations |
| **CORS Support** | ✅ Enabled for external clients | ✅ Enabled | Both allow cross-origin requests |
| **Graceful Shutdown** | ✅ SIGINT/SIGTERM handlers | ✅ SIGINT/SIGTERM handlers | Proper cleanup on exit |
| **Error Handling** | ✅ Try-catch with task updates | ✅ Try-catch with task updates | Consistent error responses |
| **Terminal Management** | ✅ VSCode integrated terminals | ❌ Not applicable | VSCode-specific feature |
| **Multi-Instance Tracking** | ✅ ServerInstanceManager | ❌ Manual management | VSCode tracks all instances |
| **Visual Workflow Editor** | ✅ React Flow UI | ❌ Not applicable | VSCode-specific feature |
| **Port Management** | ✅ Auto-increment on conflict | ✅ Manual configuration | VSCode ensures no conflicts |

---

## Implementation Differences

### 1. Task Store Implementation

**VSCode Extension** ([serverRunner.ts:40-69](../../src/execution/serverRunner.ts#L40-L69)):
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

**CLI Server**:
```typescript
import { InMemoryTaskStore } from '@a2a-js/sdk';

const taskStore = new InMemoryTaskStore();
```

**Analysis**: VSCode uses custom implementation for fine-grained control, CLI uses SDK's built-in store.

### 2. Request Handler

**VSCode Extension** ([serverRunner.ts:332-363](../../src/execution/serverRunner.ts#L332-L363)):
```typescript
app.post('/message/send', async (req: any, res: any) => {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[POST /message/send] Creating task ${taskId}`);

  try {
    const { message, thread_id, session_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    await globalTaskStore!.createTask(taskId, {
      status: 'running',
      input: req.body,
      createdAt: new Date()
    });

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

**CLI Server**:
```typescript
import { DefaultRequestHandler } from '@a2a-js/sdk';

const requestHandler = new DefaultRequestHandler(executor);

app.post('/message/send', requestHandler.handle.bind(requestHandler));
```

**Analysis**: VSCode uses custom handler for flexibility, CLI uses SDK's standardized handler.

### 3. Environment Variable Loading

**VSCode Extension** ([serverRunner.ts:205-229](../../src/execution/serverRunner.ts#L205-L229)):
```typescript
const possibleEnvPaths = [
  // 1. Extension root directory
  path.resolve(__dirname, '..', '..', '.env'),
  // 2. Same directory as the workflow config file
  path.join(path.dirname(configPath), '.env'),
  // 3. Current working directory
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

if (!envLoaded) {
  console.log(`⚠️  No .env file found in any of these locations:`);
  possibleEnvPaths.forEach(p => console.log(`   - ${p}`));
  console.log(`   Continuing without .env file...`);
}
```

**CLI Server**:
```typescript
import * as dotenv from 'dotenv';

dotenv.config(); // Uses .env in current directory
```

**Analysis**: VSCode searches multiple locations to support different project structures.

### 4. Logging Format

Both implementations produce similar verbose logs:

**Example Output** (both servers):
```text
=== Building Workflow Engine ===
Getting factory for type: OpenAI
Creating model with type: OpenAI
Initialized model: taskModel (OpenAI)

=== Building State Annotations ===
Creating reducer for messages: (x, y) => x.concat(y)
Building annotation for messages with type BaseMessage[]
✅ MessagesAnnotation.spec added successfully

=== Building Graph Structure ===
Added edge: START -> task_creator
Added conditional edge from approval_gate
Compiling graph with recursionLimit: 100
✅ Graph.compile: コンパイル完了

🚀 Invoking workflow with recursionLimit: 100

📡 Endpoints:
  Agent Card: http://localhost:3001/.well-known/agent.json
  Message Send: http://localhost:3001/message/send
  Task Query: http://localhost:3001/tasks/{taskId}
  Task Cancel: http://localhost:3001/tasks/{taskId}/cancel
```

**Analysis**: VSCode deliberately matches CLI format for easier debugging and comparison.

---

## Protocol Compliance

Both implementations comply with **A2A Protocol v0.3.0** specification:

### AgentCard Structure

**Example from VSCode Extension** ([serverRunner.ts:312-329](../../src/execution/serverRunner.ts#L312-L329)):
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
  "skills": [
    {
      "id": "task_decomposition",
      "name": "Task Decomposition",
      "description": "Breaking down complex requests into actionable tasks",
      "tags": ["planning", "analysis"]
    }
  ]
}
```

**Analysis**: Both implementations produce identical AgentCard structures complying with protocol requirements.

### Endpoint Compliance

| Endpoint | Method | Protocol Requirement | VSCode | CLI | Compliant |
|----------|--------|---------------------|--------|-----|-----------|
| `/.well-known/agent.json` | GET | AgentCard metadata | ✅ | ✅ | ✅ |
| `/message/send` | POST | Message handling | ✅ | ✅ | ✅ |
| `/tasks/:taskId` | GET | Task state query | ✅ | ✅ | ✅ |
| `/tasks/:taskId/cancel` | POST | Task cancellation | ✅ | ✅ | ✅ |

---

## Use Cases and Recommendations

### When to Use VSCode Extension

**Ideal For**:
1. **Visual Workflow Development**: Need drag-and-drop UI for building workflows
2. **IDE Integration**: Want tight integration with VSCode editor and extensions
3. **Multi-Agent Testing**: Testing multiple agents simultaneously with instance management
4. **Terminal Visibility**: Prefer seeing server logs in integrated terminals
5. **Rapid Prototyping**: Quick workflow creation and testing within IDE

**Example Scenario**:
```text
Developer creates workflow in React Flow UI → Saves JSON config →
Launches A2A server via command palette → Tests with Postman/client →
Views logs in terminal → Iterates on workflow
```

### When to Use CLI Server

**Ideal For**:
1. **Production Deployment**: Deploying agents as standalone services
2. **Docker/Kubernetes**: Containerized deployments
3. **CI/CD Integration**: Automated testing and deployment pipelines
4. **Headless Environments**: Running without GUI (servers, cloud instances)
5. **Microservices Architecture**: Multiple independent agent services

**Example Scenario**:
```bash
# Dockerfile
FROM node:18
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "dist/server.js", "config/agent.json", "3000"]
```

### Migration Path

**From VSCode to CLI**:
1. Export workflow JSON from VSCode extension
2. Copy to CLI server's config directory
3. Ensure .env file has required API keys
4. Run CLI server: `node server.js config/workflow.json 3000`
5. No JSON modification needed - configs are compatible

**From CLI to VSCode**:
1. Copy workflow JSON to VSCode project's `json/` directory
2. Open in VSCode with ReactFlowTest extension installed
3. Right-click JSON file → "Open Workflow Editor" (if using webview)
4. Or use command: "Launch A2A Server for Workflow"
5. Server launches in VSCode terminal with same functionality

---

## Performance Considerations

### VSCode Extension

**Advantages**:
- Terminal-based process isolation prevents extension crashes
- Multi-instance manager prevents port conflicts automatically
- Webview provides real-time workflow visualization

**Limitations**:
- Requires VSCode running (no headless mode)
- Additional overhead from extension host and webview
- Terminal management adds slight initialization delay

### CLI Server

**Advantages**:
- Lower resource footprint (no IDE/webview overhead)
- Faster startup time
- Better for high-throughput scenarios

**Limitations**:
- Manual port management required
- No built-in workflow visualization
- Requires external tools for testing/debugging

---

## Summary

Both implementations provide robust A2A Protocol v0.3.0 compliance with full task lifecycle management. The choice between them depends primarily on deployment requirements:

- **Development**: VSCode extension for visual workflow creation and IDE integration
- **Production**: CLI server for deployment flexibility and lower resource usage

The workflow JSON configs are **fully compatible** between both implementations, enabling seamless migration as projects move from development to production.

---

## Related Documentation

- [Implementation Guide](implementation-guide.md) - Step-by-step setup instructions
- [Configuration Reference](config-reference.md) - JSON workflow config format
- [Orchestration Guide](orchestration.md) - Multi-agent workflow patterns
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

**Next Steps**: See [Implementation Guide](implementation-guide.md) for detailed setup instructions.
