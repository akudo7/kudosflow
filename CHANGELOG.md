# Change Log

All notable changes to the "kudosflow2" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.2.0] - 2026-03-14

### Changed

- **Teams finalize_node**: Included report content in interrupt message so results can be reviewed before the yes/no prompt
- **Teams finalize_node**: Changed final assistant message to show only cleanup result, eliminating duplicate report display
- **Teams / SKILL.md**: Translated all Japanese text in JSON configs, skill files, and scripts to English
- **Rename**: Renamed `swarms` → `teams` (folders, files, and all references) to align with Claude Code official terminology

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
