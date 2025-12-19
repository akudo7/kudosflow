import * as fs from 'fs';
import { WorkflowEngine } from '@kudos/scene-graph-manager';
import type { WorkflowConfig } from '@kudos/scene-graph-manager';

// Use require for Express 5.x CommonJS compatibility
const express = require('express');

/**
 * Run A2A server for a workflow configuration
 * This function is executed in a separate Node.js process via terminal
 */
export async function runServer(configPath: string, port: number): Promise<void> {
  try {
    console.log(`\n🚀 Starting A2A Server...`);
    console.log(`   Config: ${configPath}`);
    console.log(`   Port: ${port}\n`);

    // Load workflow config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const workflowConfig: any = JSON.parse(configContent);

    console.log(`✓ Loaded workflow: ${workflowConfig.name || 'Unnamed Workflow'}`);

    // Create workflow engine
    const engine = new WorkflowEngine(workflowConfig);
    console.log(`✓ Workflow engine initialized`);

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
      const agentCard = {
        name: workflowConfig.name || 'Workflow Agent',
        description: workflowConfig.description || 'A workflow-based agent powered by SceneGraphManager',
        version: '1.0.0',
        capabilities: {
          endpoints: ['message/send', 'tasks'],
          streaming: false,
          interrupts: true
        },
        created: new Date().toISOString()
      };
      res.json(agentCard);
    });

    // A2A Protocol: Message Send endpoint
    app.post('/message/send', async (req: any, res: any) => {
      try {
        const { message, thread_id, session_id } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`\n📨 Received message (thread: ${thread_id || 'new'})`);
        console.log(`   Input: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

        // Execute workflow
        const result = await (engine as any).execute({
          input: message,
          thread_id: thread_id || undefined,
          session_id: session_id || undefined
        });

        console.log(`✓ Execution completed`);

        res.json({
          result,
          thread_id: thread_id || 'new'
        });
      } catch (error: any) {
        console.error(`✗ Execution error: ${error.message}`);
        res.status(500).json({
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
      console.log(`\n📍 Endpoints:`);
      console.log(`   Agent Card:   http://localhost:${port}/.well-known/agent.json`);
      console.log(`   Message Send: http://localhost:${port}/message/send`);
      console.log(`   Tasks:        http://localhost:${port}/tasks`);
      console.log(`   Health:       http://localhost:${port}/health`);
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
