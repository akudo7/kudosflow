<h1 align="center">Kudosflow</h1>

<p align="center">
  <strong>Visual, production-ready AI workflows — portable as JSON</strong>
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

---

**[Features](#features)** · **[Quick Start](#quick-start)** · **[Usage](#usage)** · **[Development](#development)** · **[Support](https://github.com/akudo7/kudosflow/issues)**

<p align="center">
  <a href="https://www.youtube.com/watch?v=usKzPu8Fxkg">
    <img src="https://img.youtube.com/vi/usKzPu8Fxkg/maxresdefault.jpg" alt="Kudosflow Demo" width="600">
  </a>
  <br>
  <em>Click to watch the demo video</em>
</p>

---

## What is Kudosflow?

Build and execute node-based AI agent workflows with a drag-and-drop interface inside VSCode. Design once, run anywhere—your workflows are portable JSON files that can be version-controlled, shared, and executed in production.

### Why Kudosflow?

- **Visual First**: See your entire AI workflow at a glance—no more scattered scripts
- **Production Ready**: From prototype to production with the same JSON workflow
- **Portable**: Version control your AI logic as standard JSON files
- **Integrated**: Works inside VSCode with A2A and MCP protocol support

---

## Features

- 🎨 **Visual Workflow Editor**: Drag-and-drop interface powered by React Flow
- 🔌 **Node-Based Architecture**: Connect nodes to build complex AI agent workflows
- 💾 **JSON Storage**: Workflows stored as portable JSON files in your workspace
- 🔄 **A2A & MCP Integration**: Support for Agent-to-Agent and MCP communication protocols
- 🎯 **Context Menu Integration**: Right-click any JSON file to open in workflow editor
- 🚀 **Live Execution**: Real-time workflow execution and testing
- 🧵 **State Management**: Thread-based conversation persistence across requests

---

## Quick Start

### Prerequisites

- VSCode 1.96.0 or higher
- API keys for your AI providers (OpenAI, Anthropic, or Ollama)

### Installation

#### Option 1: From VSIX (Current)

```bash
code --install-extension kudosflow2-1.0.0.vsix
```

#### Option 2: From VSCode Marketplace (Coming Soon)

Search for "Kudosflow2" in the VSCode extensions marketplace.

### Setup

1. **Configure API Keys**

   Create a `.env` file in your project root:

   ```bash
   # OpenAI (optional)
   OPENAI_API_KEY=your_openai_api_key_here

   # Anthropic (optional)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # Ollama (optional, local)
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   ```

2. **Explore Sample Workflows**

   Sample workflows are automatically installed to:

   ```text
   ~/.vscode/extensions/akirakudo911.kudosflow2-1.0.0/json/
   ```

   **Basic Examples:**

   - `interrupt.json` - Interactive workflow with user interrupts
   - `model.json` - Career counselor with OpenAI integration

   **A2A Examples:**

   - `a2a/client.json` - A2A client workflow
   - `a2a/servers/task-creation.json` - Task creation server
   - `a2a/servers/research-execution.json` - Research execution server
   - `a2a/servers/quality-evaluation.json` - Quality evaluation server

---

## Usage

### Opening Workflow Editor

**Three ways to open:**

- **From Explorer**: Right-click any `.json` file → "Open Workflow Editor"
- **Command Palette**: `Ctrl+Shift+P` (or `Cmd+Shift+P`) → "Kudosflow: Open Workflow Editor"
- **Create New**: Right-click a folder → "Create New Workflow Here"

### Building Workflows

1. Click the **+** button to add nodes to the canvas
2. Drag nodes to position them on the canvas
3. Connect nodes by dragging from output anchors (right) to input anchors (left)
4. Configure each node by clicking it and editing parameters
5. Save your workflow using the **Save** button in the toolbar
6. Execute your workflow using the **Run** button

### Example: A2A Workflow Pattern

```text
Task Creation → Approval → Research Execution → Approval
  → Report Generation → Report Approval → Quality Evaluation → Complete
```

Each step can be an independent agent workflow, communicating via A2A protocol.

---

## State Management & Thread Persistence

Kudosflow supports stateful conversations using thread IDs:

- **thread_id**: Optional parameter for maintaining conversation state
- **State Persistence**: Same thread_id retrieves previous context
- **Fresh Start**: Omit thread_id to start a new conversation

### Example: API Usage with Thread Persistence

```bash
# Start new conversation (no thread_id)
curl -X POST http://localhost:3000/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {"parts": [{"type": "text", "text": "Research the AI market"}]}
  }'
# Response includes: thread_id: "thread-1234567890-abc123"

# Continue conversation (with thread_id)
curl -X POST http://localhost:3000/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": {"parts": [{"type": "text", "text": "Approved"}]},
    "thread_id": "thread-1234567890-abc123"
  }'
# State is preserved, context maintained
```

---

## Development

### Build Prerequisites

- Node.js 20.x or higher
- **Yarn package manager** (not npm)
- VSCode 1.96.0 or higher

### Project Setup

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

# Run linter
yarn lint

# Run tests
yarn pretest
```

### Development Workflow

1. Press `F5` in VSCode to launch the Extension Development Host
2. Make changes to extension code → `yarn compile` → Reload window (`Ctrl+R`)
3. For webview changes, run `yarn start:webview` for hot reload

### Architecture Overview

The extension uses a two-part architecture:

**1. Extension Side** (Node.js context)

- Entry: [src/extension.ts](src/extension.ts)
- Build: TypeScript → `out/` directory
- Manages VSCode extension lifecycle and webview panel

**2. Webview Side** (Browser context)

- Entry: [webview-ui/src/index.tsx](webview-ui/src/index.tsx)
- Build: Vite + React → `webview-ui/build/` directory
- Contains the React Flow canvas UI

Communication between extension and webview uses message passing via `postMessage` API.

---

## Related Projects

- **[OpenAgentJson](https://github.com/akudo7/OpenAgentJson)** - JSON schema definitions for agent workflows
- **[a2a-server](https://github.com/akudo7/a2a-server)** - Agent-to-Agent communication server
- **[SceneGraphManager](https://github.com/akudo7/SceneGraphManager)** - Scene graph management library (Private repository)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Author

**Hand-crafted by [Akira Kudo](https://www.linkedin.com/in/akira-kudo-4b04163/) in Tokyo, Japan**

<p align="center">Copyright &copy; 2023-present Akira Kudo</p>
