<h1 align="center">Kudosflow2</h1>

<p align="center">
  <strong>Visual Workflow Editor for AI Agent Orchestration</strong>
</p>

<p align="center">
  <a href="https://github.com/akudo7/kudosflow">
    <img src="https://img.shields.io/github/v/release/akudo7/kudosflow?style=flat-square" alt="Release">
  </a>
  <a href="https://github.com/akudo7/kudosflow/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/akudo7/kudosflow?style=flat-square" alt="License">
  </a>
  <a href="https://github.com/akudo7/kudosflow/stargazers">
    <img src="https://img.shields.io/github/stars/akudo7/kudosflow?style=flat-square" alt="Stars">
  </a>
  <a href="https://github.com/akudo7/kudosflow/issues">
    <img src="https://img.shields.io/github/issues/akudo7/kudosflow?style=flat-square" alt="Issues">
  </a>
</p>

<h4 align="center">
  <a href="#features">Features</a>
  ·
  <a href="#getting-started">Getting Started</a>
  ·
  <a href="#development">Development</a>
  ·
  <a href="https://github.com/akudo7/kudosflow/issues">Support</a>
</h4>

<p align="center">
Build and execute node-based AI agent workflows with drag-and-drop interface, A2A integration, and real-time execution - all inside VSCode.
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=usKzPu8Fxkg">
    <img src="https://img.youtube.com/vi/usKzPu8Fxkg/maxresdefault.jpg" alt="Kudosflow Demo" width="600">
  </a>
  <br>
  <em>Click to watch the demo video</em>
</p>

&nbsp;

## Features

- 🎨 **Visual Workflow Editor**: Drag-and-drop interface powered by React Flow
- 🔌 **Node-Based Architecture**: Connect nodes to build complex workflows
- 💾 **JSON Storage**: Workflows are stored as JSON files in your workspace
- 🔄 **A2A Integration**: Support for Agent-to-Agent communication workflows
- 🔄 **MCP Integration**: Support for MCP communication workflows
- 🎯 **Context Menu Integration**: Right-click JSON files to open in workflow editor
- 🚀 **Live Preview**: Real-time workflow execution and testing

&nbsp;

## Getting Started

### Installation

```bash
# Install from marketplace
code --install-extension kudosflow2-2.0.0.vsix
```

Or install from the VSCode marketplace (coming soon) or build from source.

**Requirements:**
- VSCode 1.96.0 or higher

**Setup:**

1. Create a `.env` file in your project root with required API keys:

   ```bash
   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Anthropic API Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # Ollama Configuration
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   ```

1. Sample workflow files are automatically installed to `~/.vscode/extensions/akirakudo911.kudosflow2-1.0.0/json/`

#### Sample Workflows

The extension includes several example workflows to help you get started:

**Basic Workflows:**
- `interrupt.json` - Interactive workflow demonstrating user interrupts and state management
- `model.json` - Career counselor workflow showing OpenAI model integration

**A2A (Agent-to-Agent) Workflows:**
- `a2a/client.json` - A2A client workflow for agent-to-agent communication
- `a2a/servers/task-creation.json` - Task creation server workflow
- `a2a/servers/research-execution.json` - Research execution server workflow
- `a2a/servers/quality-evaluation.json` - Quality evaluation server workflow

These samples demonstrate key features including:
- User interaction with interrupt nodes
- AI model integration (OpenAI)
- State management and persistence
- Agent-to-agent communication patterns
- Multi-step workflow orchestration

### Usage

#### Opening Workflow Editor

- **From Explorer**: Right-click any `.json` file → "Open Workflow Editor"
- **Command Palette**: `Ctrl+Shift+P` → "Kudosflow: Open Workflow Editor"
- **Create New**: Right-click a folder → "Create New Workflow Here"

#### Building Workflows

1. Use the **+** button to add nodes to the canvas
2. Drag nodes to position them
3. Connect nodes by dragging from output anchors to input anchors
4. Configure node parameters in the node panel
5. Save your workflow using the save button in the toolbar

&nbsp;

## Development

### Prerequisites

- Node.js 20.x or higher
- Yarn package manager
- VSCode 1.96.0 or higher

### Setup

```bash
# Install all dependencies (extension + webview)
yarn install:all

# Copy environment example
cp .env.example .env
# Edit .env with your API keys
```

### Build Commands

```bash
# Compile TypeScript for extension
yarn compile

# Watch mode for extension development
yarn watch

# Start webview development server with hot reload
yarn start:webview

# Build webview for production
yarn build:webview

# Package extension
yarn package
```

### Testing

```bash
# Run linter
yarn lint

# Run tests
yarn pretest
```

Press `F5` in VSCode to launch the Extension Development Host for testing.

### Architecture

The extension consists of two separate build systems:

1. **Extension Side** (Node.js context):
   - Entry: [src/extension.ts](src/extension.ts)
   - Build: TypeScript → `out/` directory
   - Manages VSCode extension lifecycle and webview panel

2. **Webview Side** (Browser context):
   - Entry: [webview-ui/src/index.tsx](webview-ui/src/index.tsx)
   - Build: Vite + React → `webview-ui/build/` directory
   - Contains the React Flow canvas UI

&nbsp;

&nbsp;

## State Management and Thread Persistence

The A2A server supports stateful conversations using thread IDs:

- **thread_id**: Optional parameter for maintaining conversation state across requests
- **State Persistence**: Same thread_id retrieves previous conversation context
- **Fresh Start**: Omit thread_id to start new conversation with clean state

### Example Usage

```bash
# Start new conversation (no thread_id)
curl -X POST http://localhost:3000/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {"parts": [{"type": "text", "text": "Please research the AI market"}]}
  }'
# Response includes thread_id: "thread-1234567890-abc123"

# Continue conversation (with thread_id)
curl -X POST http://localhost:3000/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {"parts": [{"type": "text", "text": "Approved"}]},
    "thread_id": "thread-1234567890-abc123"
  }'
# Response uses same thread_id, state is preserved
```

### Documentation

- [A2A Server API Documentation](docs/api/a2a-server.md)
- [Thread Management Guide](docs/guides/thread-management.md)

&nbsp;

**Samples:**

```text
Task Creation → Approval → Research Execution → Approval
  → Report Generation → Report Approval → Quality Evaluation → Complete
```

&nbsp;

## Related Projects

- **[OpenAgentJson](https://github.com/akudo7/OpenAgentJson)** - JSON schema and definitions for agent workflows
- **[a2a-server](https://github.com/akudo7/a2a-server)** - Agent-to-Agent communication server
- **[SceneGraphManager](https://github.com/akudo7/SceneGraphManager)** - Scene graph management library (Private repository, separate license - see [LICENSE](LICENSE) for details.)

&nbsp;

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

&nbsp;

## License

MIT License - see [LICENSE](LICENSE) for details.

&nbsp;

## Author

**Hand-crafted by [Akira Kudo](https://www.linkedin.com/in/akira-kudo-4b04163/) in Tokyo, Japan**

<p align="center">Copyright &copy; 2023-present Akira Kudo</p>
