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
  endpoints?: {
    messageSend?: string;
    messageStream?: string;
    taskGet?: string;
    taskCancel?: string;
  };
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
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
 * Agent executor for structured workflow execution
 * Follows CLI server pattern from /Users/akirakudo/Desktop/MyWork/CLI/server/src/server.ts
 */
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
    console.log(`[AgentExecutor] Raw message received:`, JSON.stringify(message, null, 2));

    // Extract message content - handle multiple formats
    let input = '';

    // Try direct string
    if (typeof message === 'string') {
      input = message;
    }
    // Try message.parts (SDK format)
    else if (message.parts && Array.isArray(message.parts)) {
      const textPart = message.parts.find((p: any) => p.type === 'text' || p.kind === 'text');
      input = textPart?.text || '';
    }
    // Try message.content (legacy format)
    else if (message.content) {
      input = typeof message.content === 'string' ? message.content : '';
    }
    // Try message.text (alternative format)
    else if (message.text) {
      input = typeof message.text === 'string' ? message.text : '';
    }
    // Fallback to JSON stringification
    else {
      input = JSON.stringify(message);
    }

    console.log(`[AgentExecutor] Extracted input (${input.length} chars):`, input.substring(0, 200));

    if (!input || input.trim().length === 0) {
      const error = new Error('No valid input text found in message');
      console.error(`[AgentExecutor] ${error.message}. Message structure:`, message);
      throw error;
    }

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
      taskId,
      result,
      thread_id: taskId
    };
  }
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

    // Build the workflow graph
    await engine.build();

    console.log('✅ Graph.compile: コンパイル完了');
    console.log('Workflow engine built successfully');

    // Initialize executor
    const executor = new AgentExecutor(engine, globalTaskStore!, workflowConfig);
    console.log('✅ AgentExecutor initialized');

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
      // Check if config has a2aEndpoint with agentCard
      let agentCard: AgentCard;

      if (workflowConfig.config?.a2aEndpoint?.agentCard) {
        // Use the agentCard from config.a2aEndpoint, but override port numbers
        const configCard = workflowConfig.config.a2aEndpoint.agentCard;
        agentCard = {
          ...configCard,
          // Override URL with the actual port
          url: `http://localhost:${port}/`,
          // Override endpoints with the actual port
          endpoints: {
            messageSend: `http://localhost:${port}/message/send`,
            messageStream: `http://localhost:${port}/message/stream`,
            taskGet: `http://localhost:${port}/tasks/{taskId}`,
            taskCancel: `http://localhost:${port}/tasks/{taskId}/cancel`
          }
        };
        console.log(`[Agent Card] Using configured agent card: ${agentCard.name} on port ${port}`);
      } else {
        // Fallback to default agent card
        agentCard = {
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
          capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: true
          },
          skills: workflowConfig.skills || []
        };
        console.log(`[Agent Card] Using default agent card: ${agentCard.name}`);
      }

      res.json(agentCard);
    });

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

    // A2A Protocol: List all tasks (optional, for debugging)
    app.get('/tasks', async (req: any, res: any) => {
      console.log(`[GET /tasks] Listing all tasks`);

      try {
        const tasks = await globalTaskStore!.getAllTasks();

        res.json({
          count: tasks.length,
          tasks: tasks.map(task => ({
            taskId: task.taskId,
            status: task.status,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }))
        });

      } catch (error: any) {
        console.error(`[GET /tasks] Error:`, error);
        res.status(500).json({ error: error.message });
      }
    });

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
