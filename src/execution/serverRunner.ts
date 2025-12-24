import * as fs from 'fs';
import * as path from 'path';
import { WorkflowEngine } from '@kudos/scene-graph-manager';
import type { WorkflowConfig } from '@kudos/scene-graph-manager';

// Load environment variables from .env file
import * as dotenv from 'dotenv';

// Use require for Express 5.x CommonJS compatibility
const express = require('express');

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

// Simple in-memory task store implementation
interface TaskData {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input?: any;
  result?: any;
  error?: any;
  createdAt: Date;
  updatedAt?: Date;
}

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

// Global task store instance
let globalTaskStore: SimpleTaskStore | null = null;

/**
 * Get the current task store instance
 * @returns Task store or null if server not started
 */
export function getTaskStore(): SimpleTaskStore | null {
  return globalTaskStore;
}

/**
 * Run A2A server for a workflow configuration
 * This function is executed in a separate Node.js process via terminal
 */
export async function runServer(configPath: string, port: number): Promise<void> {
  try {
    // Load .env file from multiple possible locations
    const possibleEnvPaths = [
      // 1. Extension root directory (3 levels up from out/execution/serverRunner.js)
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

    console.log(`\n🚀 Starting A2A Server...`);
    console.log(`   Config: ${configPath}`);
    console.log(`   Port: ${port}\n`);

    // Load workflow config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const workflowConfig: any = JSON.parse(configContent);

    console.log(`✓ Loaded workflow: ${workflowConfig.name || 'Unnamed Workflow'}`);

    // Initialize task store
    globalTaskStore = new SimpleTaskStore();
    console.log('✅ Task store initialized (SimpleTaskStore)');

    // Create workflow engine
    console.log('\n=== Building Workflow Engine ===');

    // Log model configuration
    if (workflowConfig.models) {
      for (const [modelId, modelConfig] of Object.entries(workflowConfig.models)) {
        const modelType = (modelConfig as any).type;
        console.log(`Getting factory for type: ${modelType}`);
        console.log(`Creating model with type: ${modelType}`);
        console.log(`Initialized model: ${modelId} (${modelType})`);
      }
    }

    // Log state annotation configuration
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

    // Log graph structure
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

    const engine = new WorkflowEngine(workflowConfig);

    console.log('✅ Graph.compile: コンパイル完了');
    console.log('Workflow engine built successfully');

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

    // A2A Protocol: Message Send endpoint
    app.post('/message/send', async (req: any, res: any) => {
      // Generate unique task ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        const { message, thread_id, session_id } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Create task in store
        console.log(`[TaskStore] Creating task ${taskId}`);
        await globalTaskStore!.createTask(taskId, {
          status: 'running',
          input: req.body,
          createdAt: new Date()
        });

        console.log(`\n🚀 Invoking workflow with recursionLimit: ${recursionLimit}`);

        const userMessage = message.parts?.[0]?.text || message;
        const preview = userMessage.substring(0, 100);
        console.log(`Processing ${workflowConfig.name || 'WorkflowAgent'} request: ${preview}${userMessage.length > 100 ? '...' : ''}`);

        // Execute workflow
        const result = await (engine as any).execute({
          input: message,
          thread_id: thread_id || undefined,
          session_id: session_id || undefined
        });

        console.log(`✓ Execution completed`);

        // Update task with result
        console.log(`[TaskStore] Task ${taskId} completed`);
        await globalTaskStore!.updateTask(taskId, {
          status: 'completed',
          result,
          updatedAt: new Date()
        });

        res.json({
          taskId,
          result,
          thread_id: thread_id || 'new'
        });
      } catch (error: any) {
        console.error(`✗ Execution error: ${error.message}`);

        // Update task with error
        console.error(`[TaskStore] Task ${taskId} failed:`, error);
        await globalTaskStore!.updateTask(taskId, {
          status: 'failed',
          error: error.message,
          updatedAt: new Date()
        });

        res.status(500).json({
          taskId,
          error: error.message,
          type: error.name
        });
      }
    });

    // A2A Protocol: Tasks endpoint (placeholder)
    app.get('/tasks', (req: any, res: any) => {
      res.json({
        tasks: [],
        message: 'Task management not yet implemented'
      });
    });

    // Health check endpoint
    app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        workflow: workflowConfig.name || 'Unnamed Workflow'
      });
    });

    // Start server
    const server = app.listen(port, () => {
      console.log(`\n✓ A2A Server is running on port ${port}`);
      console.log(`\n📡 Endpoints:`);
      console.log(`  Agent Card: http://localhost:${port}/.well-known/agent.json`);
      console.log(`  Message Send: http://localhost:${port}/message/send`);
      console.log(`  Task Query: http://localhost:${port}/tasks/{taskId}`);
      console.log(`  Task Cancel: http://localhost:${port}/tasks/{taskId}/cancel`);
      console.log(`\n⌨️  Press Ctrl+C to stop the server\n`);
    });

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

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error(`\n✗ Uncaught exception: ${error.message}`);
      console.error(error.stack);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(`\n✗ Unhandled rejection at:`, promise, `reason:`, reason);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error: any) {
    console.error(`\n✗ Failed to start server: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Allow running directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node serverRunner.js <config-path> [port]');
    process.exit(1);
  }

  const configPath = args[0];
  const port = args[1] ? parseInt(args[1], 10) : 3000;

  runServer(configPath, port);
}
