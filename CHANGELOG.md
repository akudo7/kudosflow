# Change Log

All notable changes to the "kudosflow2" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.3.0] - 2026-03-21

### Added

- **Agent Teams Fan-out/Fan-in**: Replaced sequential A2A worker execution with LangGraph-native parallel execution
  - New `planner_node`: Analyzes user task and outputs a JSON array of worker definitions (name, role, task)
  - New `worker_node`: Executes each worker as an independent LangGraph node in the same process
  - New `aggregator_node`: Collects all worker results and generates an integrated report
  - New `finalize_node`: Presents final report with confirmation prompt before cleanup
  - Workers now run in parallel via LangGraph `Send` API (fan-out), results merged via fan-in

### Changed

- **Teams leader.json**: Fully redesigned graph structure from single leader+tools nodes to planner→worker×N→aggregator→finalize pipeline (version 1.0.0 → 2.2.0)
- **Teams leader.json state**: Replaced `teamPlan: string` with `workerPlans: {name, role, task}[]`, `currentPlan`, `workerResults`, `finalReport` for fan-out/fan-in state management
- **WorkflowExecutor**: Output resolution now prefers `finalReport` state field when present, falling back to last assistant message — supports fan-out/fan-in workflows that store results outside the message list
- **extractPossibleTargets**: Added `new Send('nodeName', ...)` pattern detection alongside existing `return 'string'` pattern to support LangGraph fan-out edge declarations

### Removed

- **Teams leader.json**: Removed `tools_node` (ToolNode) — worker tasks are now executed as LangGraph nodes, not via bash/A2A tool calls
- **Teams leader systemPrompt**: Removed embedded 8-step A2A orchestration instructions (worker JSON write → launch → healthcheck → send → read results)

## [1.2.0] - 2026-03-14

### Added

- **README**: Added "Testing Agent Teams" section with verification criteria and 7 test cases (T-01 through T-07) covering marketing research, academic survey, travel planning, content creation, data analysis, legal/compliance, and code generation domains

### Changed

- **Packaging**: Added `scripts` folder to the extension package (removed from `.vscodeignore`)

- **Teams leader.json systemPrompt**: Replaced SKILL.md delegation with fully embedded step-by-step orchestration instructions (Step 1–8) including worker kill, template load, JSON write, launch, healthcheck, parallel task send, and result integration
- **Teams leader.json leader_node**: Added `injectSkillsPrompt: false` to prevent skills prompt injection; added debug logging for message count, types, tool_calls, and response content preview
- **Teams leader.json tools_node**: Added `"teams"` to `excludeTools` to prevent recursive self-invocation
- **Teams finalize_node**: Included report content in interrupt message so results can be reviewed before the yes/no prompt
- **Teams finalize_node**: Changed final assistant message to show only cleanup result, eliminating duplicate report display
- **Teams / SKILL.md**: Translated all Japanese text in JSON configs, skill files, and scripts to English
- **Rename**: Renamed `swarms` → `teams` (folders, files, and all references) to align with Claude Code official terminology
- **Teams leader systemPrompt**: Embedded full step-by-step orchestration instructions directly in the system prompt (previously delegated to `read_file("skills/teams/SKILL.md")`) for more reliable execution
- **Removed**: `skills/teams/SKILL.md` — no longer needed as instructions are now embedded in the system prompt
- **task-creation.json**: Translated Japanese regex patterns and string literals to English

## [1.1.0] - 2026-03-14

### Added

- **System Skills Integration**: Comprehensive support for System Skills across the workflow editor
  - New ToolNodeEditorDialog for dedicated ToolNode configuration (Skills, MCP, A2A)
  - SkillsConfigEditor component with folder path management and skill toggle controls
  - SystemSkillsToggle component for consistent UI across node and model levels
  - Skills folder reveal functionality in VSCode File Explorer
  - Visual indicators (🔧 icon) for skills-enabled nodes via NodeBadges
  - Skills tab in WorkflowSettingsPanel for centralized management
- **Model Configuration**: Added `bindSystemSkills` flag support in ModelFormModal
- **Workflow Types**: Extended type definitions with SkillsConfig and bindSystemSkills properties
- **Converters**: Updated flowToJson and jsonToFlow to persist useSystemSkills and useMcpServers flags

### Changed

- **AI Models**: Upgraded to GPT-5.2 for enhanced performance
- **Skills System**: Refactored skills architecture for better integration
- **Node Detection**: Enhanced WorkflowNode and ToolNode to detect and display system skills bindings from models
- **A2A Configuration**: Updated Agent-to-Agent server configuration
- **Marketplace**: Changed search name to Kudosflow2

### Fixed

- Improved node-level and model-level skill binding detection logic
- Enhanced double-click handling for ToolNode editor dialog

## [1.0.0] - 2026-01-10

### Initial Features

- Initial release
- React Flow based workflow editor
- Drag-and-drop node canvas
- JSON workflow file support
- A2A (Agent-to-Agent) integration
- MCP (Model Context Protocol) integration
- Context menu integration for JSON files
- Live workflow execution and testing
