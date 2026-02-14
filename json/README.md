# JSON Configuration Examples

This directory contains example workflow configuration files (JSON) for SceneGraphManager.

## 📁 Directory Structure

```text
json/
├── README.md                    # This file
├── interrupt.json               # Interrupt handling example
├── model.json                   # Basic model configuration
├── ollama.json                  # Ollama usage example
├── skillsWithShowResult.json    # Custum and System Skills + result display node example
└── a2a/                         # A2A (Agent-to-Agent) configuration
    ├── client.json              # A2A client configuration
    └── servers/                 # A2A server configurations
        ├── quality-evaluation.json
        ├── research-execution.json
        └── task-creation.json
```

## 📄 File Descriptions

### Root Level Files

#### interrupt.json

Workflow example demonstrating user interrupt handling.

**Features:**

- Interruption at points requiring human intervention
- State saving and restoration
- Interactive workflow execution

**Use Cases:**

- Implementing approval flows
- Processes requiring manual review
- Tasks with user confirmation steps

#### model.json

Basic model configuration example.

**Features:**

- Multiple AI model configurations
- Usage examples for Anthropic Claude, OpenAI GPT, and Ollama
- System prompt configuration
- Parameter tuning (temperature, maxTokens, etc.)

**Included Settings:**

- Model initialization
- Basic message flow
- Simple workflow structure

#### ollama.json

Example using Ollama for local LLM execution.

**Features:**

- Local LLM usage
- Privacy-focused implementation
- Custom model support

**Use Cases:**

- Offline environment execution
- When avoiding external data transmission
- Custom model testing

#### skillsWithShowResult.json

Workflow example integrating System Skills with a result display node.

**Features:**

- System Skills enabled with GPT-5.2 model (`bindSystemSkills: true`)
- Skills execution in ToolNode (`useSystemSkills: true`)
- Skill management via FilesystemBackend
- Conditional branching for tool_calls detection
- Dedicated result display node (showResult)

**Workflow Structure:**

1. **agent** - LLM processes user requests
2. **Conditional branch** - Detects presence of tool_calls
3. **tools** - Executes System Skills (ToolNode)
4. **showResult** - Formats and displays final results

**Use Cases:**

- Claude Code-style tool execution environment
- Workflows involving filesystem operations
- When explicit display of tool execution results is needed
- Reference implementation for Skills integration

**Example Prompts:**

1. **arXiv Search:**

   ```text
   Search arXiv for papers about 'transformers in natural language processing' and show me the top 3 results. Use the arxiv-search skill.
   ```

2. **LangGraph Documentation:**

   ```text
   Can you explain how to create a basic agent using LangGraph? Use the langgraph-docs skill to get the latest documentation.
   ```

3. **File Search with System Skills:**

   ```text
   Use glob_files to find all TypeScript files in the /Users/akirakudo/Desktop/MyWork/test/src directory, then use grep_search to find files containing 'greetAll'.
   ```

### a2a/ - Agent-to-Agent Protocol

#### client.json

A2A client configuration example. Client-side configuration for communicating with multiple agents.

**Features:**

- Connection to remote agents
- Agent card retrieval
- Task delegation and response handling

#### servers/ Subdirectory

Configuration examples for agents acting as A2A servers.

- **quality-evaluation.json** - Quality evaluation agent
- **research-execution.json** - Research execution agent
- **task-creation.json** - Task creation agent

### skills/ - Skills System

Workflow examples using the skills feature. See [skills/README.md](skills/README.md) for details.

**Main Content:**

- Progressive disclosure (gradual skill revelation)
- Local skill management
- Integration with remote skills
- Pattern implementation examples (handoffs, peer collaboration, subagents)
- Practical workflow examples (customer support, data analysis, web research, etc.)

## 🎨 Visual Workflow Editor

As a VSCode extension, you can edit workflows with an intuitive visual editor:

**Key Features:**

- **Drag & Drop** - Freely position nodes
- **Real-time Preview** - See changes immediately
- **Settings Panel** - Unified management of nodes, models, A2A, MCP, and Skills
- **Visual Indicators**
  - 🤖 ToolNode badge
  - 🔄 A2A enabled badge
  - 🔌 MCP enabled badge
  - 🔧 System Skills enabled badge

**How to Use:**

1. Right-click on a `.json` file
2. Select "Open with Kudosflow Editor"
3. Edit workflow in visual editor
4. Double-click to open node settings
5. Manage global settings in settings panel

## 🚀 Usage

### Basic Usage

```typescript
import { WorkflowEngine } from '@kudosflow/scene-graph-manager';
import fs from 'fs';

// Load JSON file
const config = JSON.parse(
  fs.readFileSync('./json/model.json', 'utf-8')
);

// Initialize WorkflowEngine
const engine = new WorkflowEngine(config);
await engine.build();

// Execute workflow
const result = await engine.invoke({
  messages: [
    { role: "user", content: "Hello" }
  ]
});

console.log(result.messages[result.messages.length - 1].content);
```

### Environment Variables

Set required environment variables before running workflows:

```bash
# Anthropic API Key
export ANTHROPIC_API_KEY="your-api-key"

# OpenAI API Key
export OPENAI_API_KEY="your-api-key"

# Azure OpenAI (if using)
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_ENDPOINT="https://your-endpoint.openai.azure.com"
```

### Streaming Execution

```typescript
// Get results in real-time with streaming
for await (const chunk of engine.stream(
  { messages: [{ role: "user", content: "Please provide a detailed explanation" }] },
  { streamMode: "values" }
)) {
  console.log("Update:", chunk);
}
```

### A2A Workflow Execution

```typescript
// Load A2A client configuration
const a2aConfig = JSON.parse(
  fs.readFileSync('./json/a2a/client.json', 'utf-8')
);

const engine = new WorkflowEngine(a2aConfig);
await engine.build();

// Execute using remote agents
const result = await engine.invoke({
  messages: [
    { role: "user", content: "Please evaluate the quality of this paper" }
  ]
});
```

## 🎯 Recommended Files by Use Case

### Simple Chatbot

→ [model.json](model.json)

### Tool Execution with System Skills

→ [skillsWithShowResult.json](skillsWithShowResult.json)

### Customer Support

→ [skills/workflows/practical/customer_support_workflow.json](skills/workflows/practical/customer_support_workflow.json)

### Data Analysis Automation

→ [skills/workflows/practical/data_analysis_workflow.json](skills/workflows/practical/data_analysis_workflow.json)

### Web Research

→ [skills/workflows/practical/web_research_workflow.json](skills/workflows/practical/web_research_workflow.json)

### Multi-Agent Collaboration

→ [skills/workflows/patterns/peer_collaboration_team.json](skills/workflows/patterns/peer_collaboration_team.json)

### Workflows with Approval Flow

→ [interrupt.json](interrupt.json)

### Local Execution (Ollama)

→ [ollama.json](ollama.json)

## 📚 Related Documentation

### Design Guides

- [CLAUDE.md](../CLAUDE.md) - Project-wide technical documentation
- [Workflow Design Guide](../docs/guides/WORKFLOW_DESIGN_GUIDE.md) - Workflow design guide
- [Skills Authoring Guide](../docs/guides/SKILLS_AUTHORING_GUIDE.md) - Skills creation guide

### Patterns and Best Practices

- [Patterns Comparison](../docs/guides/PATTERNS_COMPARISON.md) - Comparison of patterns
- [Performance Tuning Guide](../docs/guides/PERFORMANCE_TUNING_GUIDE.md) - Performance optimization
- [Troubleshooting Guide](../docs/guides/TROUBLESHOOTING_GUIDE.md) - Troubleshooting

### API Reference

- [README.md](../README.md) - Project README
- [LangGraph Skills Implementation](../docs/LANGGRAPH_SKILLS_IMPLEMENTATION/README.md) - Skills system implementation details

## 🔧 Customization Tips

### Changing Models

```json
{
  "models": [
    {
      "id": "my_model",
      "type": "openai",
      "config": {
        "model": "gpt-5.2",
        "temperature": 0.7,
        "maxTokens": 4096
      }
    }
  ]
}
```

**Supported Models:**

- OpenAI GPT-5.2 (Latest & Recommended)
- Anthropic Claude 3.5 Sonnet
- Ollama Local Models

### Customizing System Prompts

```json
{
  "models": [
    {
      "id": "custom_assistant",
      "type": "anthropic",
      "config": { ... },
      "systemPrompt": "You are a professional technical support agent. Always strive to provide courteous and accurate responses."
    }
  ]
}
```

### Adding Tools

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./workspace"]
    }
  },
  "models": [
    {
      "id": "assistant_with_tools",
      "bindMcpServers": ["filesystem"]
    }
  ]
}
```

### Enabling System Skills

The Skills system provides automatic discovery of skill definitions via `SKILL.md` files and integrates System Skills (Claude Code-style tools) for enhanced AI capabilities.

**Node-level Skills Activation:**

```json
{
  "nodes": [
    {
      "id": "agent_node",
      "type": "ToolNode",
      "useSystemSkills": true,
      "handler": {
        "function": "agent_handler",
        "parameters": [...]
      }
    }
  ]
}
```

**Model-level Skills Activation:**

```json
{
  "models": [
    {
      "id": "skilled_model",
      "type": "openai",
      "config": {
        "model": "gpt-5.2"
      },
      "bindSystemSkills": true,
      "systemPrompt": "You are an AI assistant with access to various skills and tools."
    }
  ]
}
```

**Managing Skills Configuration:**

The Skills system supports automatic skill discovery through `SKILL.md` files and provides integration with System Skills.

```json
{
  "config": {
    "skills": {
      "enabled": true,
      "skillsPath": "skills",
      "backend": {
        "virtualMode": true,
        "rootDir": "."
      }
    }
  }
}
```

**Available System Skills:**

When `bindSystemSkills` or `useSystemSkills` is enabled, the following System Skills are automatically available:

- `read_file` - Read file contents with line numbers
- `write_file` - Write new files or overwrite existing ones
- `edit_file` - Make precise edits using string replacement
- `glob_files` - Search for files using glob patterns
- `grep_search` - Search file contents using regex
- `bash_command` - Execute bash commands
- `web_fetch` - Fetch and process web content

**Skills Discovery:**

Skills are automatically discovered from `SKILL.md` files in the skills directory:

```text
skills/
├── SKILL.md              # Skill definition with name, description, instructions
├── my-custom-skill/
│   └── SKILL.md          # Another skill definition
└── data-processing/
    └── SKILL.md          # Data processing skill
```

Each `SKILL.md` file should contain:

- **name**: Skill identifier
- **description**: Brief explanation of the skill's purpose
- **instructions**: Detailed usage instructions and examples

**Skills Prompt Injection:**

When skills are enabled, their definitions are automatically injected into the system prompt, allowing the AI to understand and use available skills contextually.

## 💡 Frequently Asked Questions

### Q: Which file should I start with?

A: We recommend starting with simple examples:

1. [model.json](model.json) - Basic workflow

### Q: How do I create my own workflow?

A: Copy an existing example and modify the following:

1. Model configuration (API keys, model names)
2. System prompts
3. Node and edge composition
4. Skills and tools to use

### Q: What should I do if I encounter an error?

A: Please refer to the [Troubleshooting Guide](../docs/guides/TROUBLESHOOTING_GUIDE.md).

## 📝 License

MIT License - See [LICENSE](../LICENSE) for details.

## 🤝 Contributing

We welcome additions of new workflow examples and improvements!
See [README.md](../README.md) for details.

---

**Last Updated:** 2026-02-14
**Version:** 1.0.1 (unreleased)

## 🆕 Latest Updates (v1.0.1)

### System Skills Integration

- Node-level and model-level Skills activation
- Intuitive configuration management with SkillsConfigEditor
- Visual indicator (🔧 icon) to display Skills enabled state
- Direct access to skills folder from VSCode File Explorer

### UI/UX Improvements

- Dedicated ToolNode editor dialog (Skills, MCP, A2A unified configuration)
- Quick node settings editing with double-click
- Improved badge system visualizing enabled state of each feature

### Model Upgrades

- GPT-5.2 support (latest OpenAI model)
- Enhanced performance and accuracy
