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

「AIエージェントのワークフロー、結局スクリプトが散らかって再現できない…」
「試作は動いたのに、チームに渡すと動かない…」
「ノードで組みたいけど、最終的に“運用できる形”に落ちない…」

Kudosflowは、VSCode内のドラッグ&ドロップUIで**ノードベースのAIエージェント・ワークフローを設計し、そのまま実行**できる拡張機能です。設計したワークフローは**ポータブルなJSON**として保存され、**バージョン管理・共有・本番実行**まで一直線。

**あなたが得られること（ベネフィット）**
- 仕様が「コードの行間」ではなく、**全体図**として残る
- ワークフローがJSONなので、**レビュー・差分管理・再利用**がしやすい
- プロトタイプから本番まで、**同じ成果物**でつなげられる

**ミニCTA（今日やる1つ）**：まずはデモ動画を1分だけ見て、UIの感覚を掴んでください（上のサムネをクリック）。

### Why Kudosflow?

- **Visual First**: ワークフロー全体を一望。散らばるスクリプトから卒業
- **Production Ready**: 試作→本番を同じJSONで。作り直しを最小化
- **Portable**: AIロジックを標準JSONとしてGit管理・共有
- **Integrated**: VSCode内で完結。A2A / MCPプロトコルにも対応

**ミニCTA（今日やる1つ）**：いま使っている“散らかった手順”を1つ思い出し、Kudosflowならノードに分けるとしたら何ノードになるかだけメモしてみてください。設計の解像度が一気に上がります。

---

## Features

- 🎨 **Visual Workflow Editor**: Drag-and-drop interface powered by React Flow
- 🔌 **Node-Based Architecture**: Connect nodes to build complex AI agent workflows
- 💾 **JSON Storage**: Workflows stored as portable JSON files in your workspace
- 🔄 **A2A & MCP Integration**: Support for Agent-to-Agent and MCP communication protocols
- 🔧 **System Skills Integration**: Comprehensive support for System Skills with visual indicators and centralized management
- 🤖 **Advanced AI Models**: Powered by GPT-5.2 for enhanced performance
- 🎯 **Context Menu Integration**: Right-click any JSON file to open in workflow editor
- 🚀 **Live Execution**: Real-time workflow execution and testing
- 🧵 **State Management**: Thread-based conversation persistence across requests

**ミニCTA（今日やる1つ）**：この中で「いま一番困っていること」を1つ選び、下のQuick Startで“そこだけ”先に試してください（全部やろうとしないのがコツです）。

---

## Quick Start

### Prerequisites

- VSCode 1.96.0 or higher
- API keys for your AI providers (OpenAI, Anthropic, or Ollama)

### Installation

**ミニCTA（今日やる1つ）**：まずはVSIXでインストールして、VSCodeを再起動するところまでやり切ってください。ここまでできれば、次は“開いて動かすだけ”です。

#### Option 1: From VSIX (Current)

```bash
code --install-extension kudosflow2-1.3.0.vsix
```

#### Option 2: From VSCode Marketplace (Coming Soon)

Search for "Kudosflow2" in the VSCode extensions marketplace.

### Included Folders

The extension package includes the following folders that provide workflows, scripts, and skills:

|Folder|Description|
|------|-----------|
|`json/`|Sample workflow JSON files and agent configurations|
|`scripts/`|Utility scripts for A2A server and messaging|
|`skills/`|Agent skill definitions (e.g., Teams, Arxiv Search)|

These folders are located inside the installed extension directory:

```text
~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/
├── json/
├── scripts/
└── skills/
```

To use them in your project, copy or symlink them to your project root:

**Copy:**

```bash
cp -r ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/json ./json
cp -r ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/scripts ./scripts
cp -r ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/skills ./skills
```

**Symlink (macOS/Linux):**

```bash
ln -s ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/json ./json
ln -s ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/scripts ./scripts
ln -s ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/skills ./skills
```

### Setup

**ミニCTA（今日やる1つ）**：`.env`は“完璧に”埋めなくてOK。使うプロバイダ（OpenAI/Anthropic/Ollama）を1つだけ決めて、キーを1つ入れるところから始めましょう。

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
   ~/.vscode/extensions/akirakudo911.kudosflow2-1.3.0/json/
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

**ミニCTA（今日やる1つ）**：手元のJSON（サンプルでもOK）を1つ右クリックして「Open Workflow Editor」を開いてみてください。開けた時点で“導入の山”は越えています。

**Three ways to open:**

- **From Explorer**: Right-click any `.json` file → "Open Workflow Editor"
- **Command Palette**: `Ctrl+Shift+P` (or `Cmd+Shift+P`) → "Kudosflow: Open Workflow Editor"
- **Create New**: Right-click a folder → "Create New Workflow Here"

### Building Workflows

**ミニCTA（今日やる1つ）**：ノードは最初から増やさず、**「入力 → 1処理 → 出力」**の3ノードだけで1回保存・実行してみてください。成功体験が最短で作れます。

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

**ミニCTA（今日やる1つ）**：まずは`thread_id`なしで1回投げて、次に同じ`thread_id`で「Approved」だけ送ってみてください。“状態が続く”感覚が一発で分かります。

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

## Agent Teams: Fan-out/Fan-in Parallel Execution

The Agent Teams feature dynamically assembles a team of specialist agents at runtime based on any user prompt. Workers run **in parallel** as native LangGraph nodes (fan-out/fan-in) — no external processes, no port management.

### How to Use

1. **Open** `json/teams/leader.json` in the Workflow Editor (right-click → "Open Workflow Editor")
2. **Run** the workflow and enter your prompt (any domain — research, writing, analysis, etc.)
3. Workers execute in parallel and results are integrated automatically
4. When complete, you will be prompted to confirm the final report

### How it Works

```text
User Prompt
    │
    ▼
┌───────────────┐
│ planner_node  │  Analyzes task → outputs JSON array of worker definitions
└──────┬────────┘
       │ Send(worker_A), Send(worker_B), Send(worker_C)  ← fan-out
       ├──────────────────────┬─────────────────────────┐
       ▼                      ▼                         ▼
┌─────────────┐       ┌─────────────┐           ┌─────────────┐
│ worker_node │       │ worker_node │    ...     │ worker_node │  (parallel)
└──────┬──────┘       └──────┬──────┘           └──────┬──────┘
       └──────────────────────┴─────────────────────────┘
                              │ fan-in
                              ▼
                   ┌──────────────────┐
                   │ aggregator_node  │  Merges all worker results → final report
                   └────────┬─────────┘
                            ▼
                   ┌──────────────────┐
                   │  finalize_node   │  Presents report + confirmation prompt
                   └──────────────────┘
```

| Node | Role |
| ---- | ---- |
| `planner_node` | Analyzes the prompt and outputs a `workerPlans` array (name, role, task) |
| `worker_node` | Executes each worker's task independently and in parallel via LangGraph `Send` |
| `aggregator_node` | Collects all `workerResults` and synthesizes an integrated `finalReport` |
| `finalize_node` | Presents the final report and prompts user for confirmation |

### Key Files

| File | Role |
| ---- | ---- |
| `json/teams/leader.json` | Workflow definition (planner → worker×N → aggregator → finalize) |

---

## Testing Agent Teams

To verify that Agent Teams works correctly across different domains, the following test prompts are provided.

### Verification Criteria

Each test case checks the following:

| Item | How to Verify |
| ---- | ------------- |
| Correct number of workers planned | Check `workerPlans` count in execution logs |
| Role names are domain-appropriate | Review `name` field in planner output |
| Workers executed in parallel | Confirm multiple `worker_node` entries appear concurrently in logs |
| Each worker produced a result | Check `workerResults` array in aggregator input |
| Final report includes all worker outputs | Review `finalReport` content |

### Test Cases

| ID | Domain | Prompt Summary | Expected Workers |
| -- | ------ | -------------- | ---------------- |
| T-01 | Marketing Research | Survey Japan's streaming video market (players, pricing, users, forecast) | `market_researcher`, `competitor_analyst`, `user_analyst` |
| T-02 | Academic Survey | Summarize LLM fine-tuning trends since 2023 (LoRA, QLoRA, DPO) | `literature_reviewer`, `technique_comparator`, `application_analyst` |
| T-03 | Travel Planning | 5-day Tokyo → Kyoto/Osaka itinerary with transport, lodging, food | `sightseeing_planner`, `logistics_coordinator`, `food_curator` |
| T-04 | Content Creation | Blog post: "10 ways to boost remote work productivity" with SEO | `seo_researcher`, `content_writer`, `editor` |
| T-05 | Data Analysis | Design an e-commerce analytics framework (RFM, churn prediction) | `data_architect`, `segmentation_specialist`, `ml_engineer` |
| T-06 | Legal / Compliance | Explain key components of a SaaS Terms of Service | `legal_analyst` (1 worker expected — simple task) |
| T-07 | Code Generation | Implement `formatDateJP(date: Date): string` in TypeScript with Jest tests | `implementer`, `tester` |

> **T-07 pass/fail criterion:** `yarn jest src/formatDateJP.test.ts` — all tests must pass.

### Running a Test

```bash
# 1. Open leader.json in the Workflow Editor
# 2. Enter the test prompt and run
# 3. Review the final report presented by finalize_node
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
