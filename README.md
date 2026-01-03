<h1 align="center">Kudosflow</h1>

<h4 align="center">
  <a href="#features">Features</a>
  ·
  <a href="#getting-started">Getting Started</a>
  ·
  <a href="#development">Development</a>
  ·
  <a href="https://github.com/akudo7/kudos-gpt/issues">Support</a>
</h4>

<p align="center">
A VSCode extension that integrates React Flow for visual workflow editing. Build node-based workflows with a drag-and-drop canvas interface, right inside VSCode.
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=-54GrId1jDc">
    <img src="https://img.youtube.com/vi/-54GrId1jDc/maxresdefault.jpg" alt="Kudosflow Demo" width="600">
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
- 🎯 **Context Menu Integration**: Right-click JSON files to open in workflow editor
- 🚀 **Live Preview**: Real-time workflow execution and testing

&nbsp;

## Getting Started

### Installation

1. Install the extension from the VSCode marketplace (coming soon) or build from source
2. Create a `.env` file in your project root with required API keys (see [.env.example](.env.example))

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

See [CLAUDE.md](CLAUDE.md) for detailed development documentation.

&nbsp;

**Samples:**

```text
Task Creation → Approval → Research Execution → Approval
  → Report Generation → Report Approval → Quality Evaluation → Complete
```

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
