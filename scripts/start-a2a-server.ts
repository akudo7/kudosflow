/**
 * start-a2a-server.ts
 *
 * CLI script to launch a WorkflowEngine as an A2A server.
 *
 * Usage:
 *   cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && \
 *   npx tsx scripts/start-a2a-server.ts \
 *     --config ./json/a2a/servers/task-creation.json \
 *     --port 3011 \
 *     [--name my_agent]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from the kudosflow root (where this script is meant to be run from)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded .env from: ${envPath}`);
}

// Parse CLI arguments
function parseArgs(argv: string[]): { config: string; port: number; name?: string } {
  const args = argv.slice(2);
  let config = '';
  let port = 0;
  let name: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      config = args[++i];
    } else if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[++i];
    }
  }

  if (!config) {
    console.error('Error: --config is required');
    process.exit(1);
  }
  if (!port || isNaN(port)) {
    console.error('Error: --port is required and must be a number');
    process.exit(1);
  }

  return { config, port, name };
}

async function main() {
  const { config: configArg, port, name } = parseArgs(process.argv);

  // Resolve config path (relative to cwd or absolute)
  const configPath = path.isAbsolute(configArg)
    ? configArg
    : path.resolve(process.cwd(), configArg);

  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file not found: ${configPath}`);
    process.exit(1);
  }

  // Load and parse workflow config
  let workflowConfig: any;
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    workflowConfig = JSON.parse(content);
  } catch (err: any) {
    console.error(`Error: Failed to parse config JSON: ${err.message}`);
    process.exit(1);
  }

  // Override name if provided
  if (name) {
    workflowConfig.name = name;
  }

  console.log(`\nStarting A2A Server...`);
  console.log(`  Config: ${configPath}`);
  console.log(`  Port:   ${port}`);
  console.log(`  Name:   ${workflowConfig.name || 'Unnamed Workflow'}\n`);

  // Import WorkflowEngine (requires @kudos/scene-graph-manager in node_modules)
  const { WorkflowEngine } = require('@kudos/scene-graph-manager');
  const express = require('express');

  // Task store
  class SimpleTaskStore {
    private tasks: Map<string, any> = new Map();
    async createTask(taskId: string, data: any) { this.tasks.set(taskId, { taskId, ...data }); }
    async getTask(taskId: string) { return this.tasks.get(taskId); }
    async updateTask(taskId: string, data: any) {
      const t = this.tasks.get(taskId);
      if (t) this.tasks.set(taskId, { ...t, ...data });
    }
    async getAllTasks() { return Array.from(this.tasks.values()); }
  }

  const taskStore = new SimpleTaskStore();

  // Build workflow engine
  const engine = new WorkflowEngine(workflowConfig);
  await engine.build();
  console.log('Workflow engine built successfully');

  // Agent executor
  class AgentExecutor {
    async execute(message: any, taskId: string, threadId?: string): Promise<any> {
      const effectiveThreadId = threadId || taskId;

      let input = '';
      if (typeof message === 'string') {
        input = message;
      } else if (message?.parts && Array.isArray(message.parts)) {
        const textPart = message.parts.find((p: any) => p.type === 'text' || p.kind === 'text');
        input = textPart?.text || '';
      } else if (message?.content) {
        input = typeof message.content === 'string' ? message.content : '';
      } else if (message?.text) {
        input = typeof message.text === 'string' ? message.text : '';
      } else {
        input = JSON.stringify(message);
      }

      if (!input.trim()) throw new Error('No valid input text found in message');

      await taskStore.updateTask(taskId, { status: 'running', updatedAt: new Date() });

      const result = await engine.invoke(
        { messages: [{ role: 'user', content: input }] },
        { recursionLimit: workflowConfig.recursionLimit || 100, configurable: { thread_id: effectiveThreadId } }
      );

      await taskStore.updateTask(taskId, { status: 'completed', result, updatedAt: new Date() });
      return { taskId, result, thread_id: effectiveThreadId };
    }

    async cancelTask(taskId: string) {
      await taskStore.updateTask(taskId, { status: 'cancelled', updatedAt: new Date() });
    }
  }

  const executor = new AgentExecutor();
  const app = express();
  app.use(express.json());

  // CORS
  app.use((req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') res.sendStatus(200); else next();
  });

  // Agent card
  app.get('/.well-known/agent.json', (_req: any, res: any) => {
    const configCard = workflowConfig.config?.a2aEndpoint?.agentCard;
    const agentCard = configCard
      ? {
          ...configCard,
          url: `http://localhost:${port}/`,
          endpoints: {
            messageSend: `http://localhost:${port}/message/send`,
            messageStream: `http://localhost:${port}/message/stream`,
            taskGet: `http://localhost:${port}/tasks/{taskId}`,
            taskCancel: `http://localhost:${port}/tasks/{taskId}/cancel`
          }
        }
      : {
          name: workflowConfig.name || 'WorkflowAgent',
          description: workflowConfig.description || 'A workflow execution agent',
          protocolVersion: '0.3.0',
          version: '1.0.0',
          url: `http://localhost:${port}/`,
          endpoints: {
            messageSend: `http://localhost:${port}/message/send`,
            messageStream: `http://localhost:${port}/message/stream`,
            taskGet: `http://localhost:${port}/tasks/{taskId}`,
            taskCancel: `http://localhost:${port}/tasks/{taskId}/cancel`
          },
          defaultInputModes: ['text/plain'],
          defaultOutputModes: ['text/plain'],
          capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: true },
          skills: workflowConfig.skills || []
        };
    res.json(agentCard);
  });

  // JSON-RPC endpoint
  app.post('/', async (req: any, res: any) => {
    const { id, method, params } = req.body;
    if (method === 'message/send') {
      try {
        const message = params?.message;
        const thread_id = params?.thread_id;
        if (!message) {
          return res.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'message is required' } });
        }
        const effectiveThreadId = thread_id || `thread-${Date.now()}`;
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const result = await executor.execute(message, taskId, effectiveThreadId);
        res.json({ jsonrpc: '2.0', id, result: { ...result, taskId, thread_id: effectiveThreadId } });
      } catch (err: any) {
        res.json({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
      }
    } else if (method === 'agent/getAuthenticatedExtendedCard') {
      res.json({ jsonrpc: '2.0', id, result: workflowConfig.config?.a2aEndpoint?.agentCard || {} });
    } else {
      res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  });

  // REST message/send
  app.post('/message/send', async (req: any, res: any) => {
    try {
      const { message, thread_id } = req.body;
      if (!message) return res.status(400).json({ error: 'message is required' });
      const effectiveThreadId = thread_id || `thread-${Date.now()}`;
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await taskStore.createTask(taskId, { status: 'running', input: req.body, createdAt: new Date() });
      const result = await executor.execute(message, taskId, effectiveThreadId);
      res.json({ ...result, taskId, thread_id: effectiveThreadId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check
  app.get('/health', (_req: any, res: any) => {
    res.json({ status: 'healthy', port, agentName: workflowConfig.name || 'Unnamed Workflow', uptime: process.uptime() });
  });

  // Task endpoints
  app.get('/tasks/:taskId', async (req: any, res: any) => {
    const task = await taskStore.getTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  app.get('/tasks', async (_req: any, res: any) => {
    const tasks = await taskStore.getAllTasks();
    res.json({ count: tasks.length, tasks });
  });

  app.post('/tasks/:taskId/cancel', async (req: any, res: any) => {
    const task = await taskStore.getTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await executor.cancelTask(req.params.taskId);
    res.json({ taskId: req.params.taskId, status: 'cancelled' });
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`\nA2A Server ready on port ${port}`);
    console.log(`  Agent Card:   http://localhost:${port}/.well-known/agent.json`);
    console.log(`  Message Send: http://localhost:${port}/message/send`);
    console.log(`  Health:       http://localhost:${port}/health`);
    console.log(`\nServer is ready to receive A2A requests`);
  });

  const shutdown = () => {
    server.close(() => { console.log('\nServer stopped'); process.exit(0); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
