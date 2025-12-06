# ReactFlow Visual Editor for SceneGraphManager - Implementation Plan

## Project Information

**Project Root:** `/Users/akirakudo/Desktop/MyWork/VSCode/test/hello-scene-graph-manager`

**SceneGraphManager Source:** `/Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager`

- Types definition: `src/types/index.ts`
- Workflow engine: `src/lib/workflow.ts`
- Graph implementation: `src/lib/graph.ts`

**Test Workflow File:** `json/test.json` (relative to project root)

**Current Status:**

- `package.json` has been partially updated with:
  - New command: `hello-scene-graph-manager.openWorkflowEditor`
  - Context menu entry for `.json` files
  - Build scripts: `compile:webview`, `compile:all`, `watch:webview`
  - All required dependencies added (React, ReactFlow, Monaco, dagre, etc.)

**Important Notes:**

- When implementing, always use absolute paths or paths relative to project root
- Read files with the Read tool before modifying them with Edit or Write tools
- The SceneGraphManager package is a local file dependency (not npm package)
- Context7 access is available for ReactFlow documentation lookups

## Overview
Add a ReactFlow-based visual editor to the VSCode extension that allows users to create and edit SceneGraphManager workflow JSON files through an intuitive drag-and-drop interface.

## User Requirements
- **Activation**: Right-click on JSON file → "Open Workflow Editor"
- **UI Language**: English
- **Code Editor**: Monaco Editor for `implementation` fields
- **Save Behavior**: Manual save via button (Ctrl+S)
- **Initial Target**: Edit existing `json/test.json` file

## Architecture: VSCode Webview Panel

### Why Webview Panel?
- Allows side-by-side view of JSON text editor and visual editor
- Native VSCode integration (file watching, save commands)
- Secure message-based communication between extension and UI
- Users can toggle between text and visual editing seamlessly

### Communication Flow
```
Extension Host (Node.js)          Webview (Browser)
├─ File I/O                   ←→  ├─ ReactFlow UI
├─ JSON Validation                ├─ React Components
├─ VSCode API Access              ├─ State Management
└─ Message Router                 └─ Message Handler
```

## Project Structure

### New Files to Create

```
src/
├── webview/
│   ├── WorkflowEditorPanel.ts       - Webview lifecycle manager
│   ├── types/
│   │   ├── workflow.ts              - Shared workflow types
│   │   └── messages.ts              - Message protocol types
│   └── utils/
│       ├── getNonce.ts              - Security nonce generator
│       └── validation.ts            - JSON schema validation
│
└── webview-ui/                      - React application (browser context)
    ├── src/
    │   ├── index.tsx                - React entry point
    │   ├── App.tsx                  - Main app component
    │   ├── components/
    │   │   ├── FlowEditor.tsx       - ReactFlow canvas container
    │   │   ├── Toolbar.tsx          - Top toolbar (save, layout, etc.)
    │   │   ├── nodes/
    │   │   │   ├── WorkflowNode.tsx     - Standard function node
    │   │   │   ├── StartNode.tsx        - Workflow start marker
    │   │   │   ├── EndNode.tsx          - Workflow end marker
    │   │   │   └── ToolNode.tsx         - Tool node type
    │   │   ├── edges/
    │   │   │   ├── DefaultEdge.tsx      - Normal edge
    │   │   │   └── ConditionalEdge.tsx  - Conditional routing edge
    │   │   └── panels/
    │   │       ├── NodePanel.tsx        - Node properties editor
    │   │       ├── EdgePanel.tsx        - Edge properties editor
    │   │       ├── WorkflowPanel.tsx    - Global workflow config
    │   │       └── CodeEditor.tsx       - Monaco editor wrapper
    │   ├── hooks/
    │   │   ├── useVSCodeAPI.ts      - VSCode message API
    │   │   ├── useWorkflow.ts       - Workflow state management
    │   │   └── useValidation.ts     - Real-time validation
    │   ├── utils/
    │   │   ├── converter.ts         - JSON ↔ ReactFlow conversion
    │   │   ├── layout.ts            - Auto-layout algorithm (dagre)
    │   │   └── idGenerator.ts       - Unique ID generation
    │   └── styles/
    │       ├── main.css             - Global styles
    │       └── vscode-theme.css     - VSCode theme integration
    ├── tsconfig.json                - Browser-specific TS config
    └── index.html                   - HTML template for dev

webpack.webview.config.js            - Webview bundle config
```

### Files to Modify

- `src/extension.ts` - Register "Open Workflow Editor" command
- `package.json` - Add dependencies and commands
- `webpack.config.js` - Export array with both configs
- `tsconfig.json` - Add JSX support and shared types paths

## Data Schema Mapping

### SceneGraphManager JSON → ReactFlow

#### Nodes Conversion
```typescript
{
  id: "askName",                          → ReactFlow Node {
  function: {                                 id: "askName"
    parameters: [...],                        type: "workflowNode"
    output: {...},                            position: { x: auto, y: auto }
    implementation: "..."                     data: {
  }                                             label: "askName"
}                                               function: { ... }
                                                isToolNode: false
                                              }
                                            }
```

Special nodes:
- `__start__` edge source → ReactFlow node `{ id: "start", type: "startNode" }`
- `__end__` edge target → ReactFlow node `{ id: "end", type: "endNode" }`

#### Edges Conversion
```typescript
{
  from: "askName",                        → ReactFlow Edge {
  to: "askJob",                               id: "askName→askJob"
  type: "normal"                              source: "askName"
}                                             target: "askJob"
                                              type: "defaultEdge"
                                              data: {}
                                            }

{
  from: "agent",                          → ReactFlow Edge {
  type: "conditional",                        id: "agent→conditional"
  condition: {                                source: "agent"
    name: "shouldContinue",                   target: "tools" (or conditional targets)
    function: { ... }                         type: "conditionalEdge"
  }                                           data: {
}                                               condition: { ... }
                                              }
                                            }
```

### ReactFlow → SceneGraphManager JSON

Reverse conversion with validation:
1. Filter out `start` and `end` nodes
2. Convert node data back to `{ id, function }` format
3. Convert edges: `start` → `__start__`, `end` → `__end__`
4. Reconstruct conditional edges from edge data
5. Validate against schema before saving

## Message Protocol

### Extension → Webview
```typescript
type ExtensionMessage =
  | { type: 'init', data: {
      workflow: WorkflowConfig,
      filePath: string,
      theme: 'dark' | 'light'
    }}
  | { type: 'themeChanged', data: { theme: 'dark' | 'light' }}
  | { type: 'validationResult', data: ValidationError[] }
```

### Webview → Extension
```typescript
type WebviewMessage =
  | { type: 'ready' }
  | { type: 'save', data: { workflow: WorkflowConfig }}
  | { type: 'validate', data: { workflow: WorkflowConfig }}
  | { type: 'error', data: { message: string }}
```

## UI Components Design

### FlowEditor (Main Canvas)
- ReactFlow instance with custom node/edge types
- Background: dot grid pattern
- Controls: zoom in/out, fit view, lock/unlock
- MiniMap: bottom-right corner
- Connection validation: prevent invalid connections
- Node selection: single/multi-select support

### Toolbar (Top Bar)
- Save button (with keyboard shortcut indicator)
- Auto-layout button (re-arrange nodes)
- Zoom controls (fit view, zoom to selection)
- Validation status indicator (error count badge)
- Toggle panels visibility

### Node Panel (Right Sidebar)
Displayed when node is selected:

**For Function Nodes:**
- Node ID field (text input, validate uniqueness)
- Parameters section:
  - List of parameters with add/remove buttons
  - Each parameter: name (text), type (text), modelRef (optional text)
- Output section:
  - Output fields editor (key-value pairs)
- Implementation section:
  - Monaco editor with JavaScript syntax
  - Full-screen toggle button

**For Tool Nodes:**
- Node ID field
- Tool configuration (MCP servers, A2A clients)

### Edge Panel (Right Sidebar)
Displayed when edge is selected:

**For Normal Edges:**
- From node (read-only)
- To node (read-only)
- Delete edge button

**For Conditional Edges:**
- From node (read-only)
- Condition name (text input)
- Parameters section (same as node parameters)
- Output field (string type)
- Implementation section (Monaco editor)
- Possible targets list

### Workflow Panel (Left Sidebar)
Global workflow configuration:

- **State Annotation Section:**
  - Name field (text input)
  - Type dropdown (Annotation.Root | Annotation.Messages)

- **Annotation Fields Section:**
  - Add/remove fields
  - For each field:
    - Key (text)
    - Type (text, e.g., "string[]", "boolean | null")
    - Reducer (code editor)
    - Default value (JSON editor)

- **Configuration Section:**
  - Recursion limit (number input)
  - Event emitter config (JSON editor)

- **State Graph Section:**
  - Annotation reference (dropdown of defined annotations)
  - Checkpointer type (text input, e.g., "MemorySaver")

### Node Palette (Left Sidebar - Bottom)
- Add Node section with buttons:
  - Add Function Node
  - Add Tool Node
- Visual indicators for node types

## Build Configuration

### Dependencies to Add

```json
{
  "dependencies": {
    "@xyflow/react": "^12.0.0",
    "@monaco-editor/react": "^4.6.0"
  },
  "devDependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "css-loader": "^6.8.0",
    "style-loader": "^3.3.0",
    "html-webpack-plugin": "^5.6.0",
    "dagre": "^0.8.5",
    "@types/dagre": "^0.7.52"
  }
}
```

### webpack.webview.config.js (New File)

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'none',
  entry: './src/webview-ui/src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist', 'webview'),
    filename: 'webview.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/webview-ui/index.html',
    }),
  ],
  devtool: 'source-map',
};
```

### Modified webpack.config.js

```javascript
const extensionConfig = { /* existing config */ };
const webviewConfig = require('./webpack.webview.config.js');

module.exports = [extensionConfig, webviewConfig];
```

### Modified tsconfig.json

```json
{
  "compilerOptions": {
    "module": "Node16",
    "target": "ES2022",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "paths": {
      "@shared/*": ["./src/webview/types/*"]
    }
  },
  "exclude": ["node_modules", "src/webview-ui"]
}
```

### New src/webview-ui/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@shared/*": ["../../webview/types/*"]
    }
  },
  "include": ["src/**/*"]
}
```

## Implementation Phases

**Status Legend:**

- ⏳ In Progress
- ✅ Completed
- ⬜ Not Started

**Instructions for Claude:**

When the user requests to implement a phase:
1. **Start Phase:** Change the phase header icon from ⬜ to ⏳
2. **Complete Tasks:** As each task is completed, change `- [ ]` to `- [x]`
3. **Finish Phase:** When all tasks in a phase are complete, change the phase header icon from ⏳ to ✅
4. **Move to Next Phase:** Automatically start the next phase by changing its icon to ⏳

The user will only say "implement Phase N" or similar - Claude must handle all status updates automatically.

### Phase 1: Foundation Setup (Priority: Critical) ✅

**Goal:** Build system and basic webview infrastructure

**Tasks:**

- [x] 1. Install all dependencies via `yarn add`
- [x] 2. Create `webpack.webview.config.js` with React + CSS support
- [x] 3. Modify `webpack.config.js` to export array
- [x] 4. Update `tsconfig.json` with JSX support
- [x] 5. Create `src/webview-ui/tsconfig.json`
- [x] 6. Test dual-bundle build: `yarn compile` should output both bundles

**Success Criteria:** Both `dist/extension.js` and `dist/webview/webview.js` are generated

### Phase 2: Webview Panel Infrastructure (Priority: Critical) ✅

**Goal:** Create working webview that communicates with extension

**Tasks:**

- [x] 1. Create `src/webview/utils/getNonce.ts` (security nonce generator)
- [x] 2. Create `src/webview/types/messages.ts` (message protocol types)
- [x] 3. Create `src/webview/types/workflow.ts` (shared workflow types)
- [x] 4. Create `src/webview/WorkflowEditorPanel.ts`:
   - Static method `createOrShow()` for singleton pattern
   - HTML generation with proper CSP
   - Message passing setup (extension ↔ webview)
   - File path tracking
- [x] 5. Modify `src/extension.ts`:
   - Register `hello-scene-graph-manager.openWorkflowEditor` command
   - Command should accept `vscode.Uri` parameter (from context menu)
   - Load JSON file and pass to WorkflowEditorPanel
- [x] 6. Modify `package.json`:
   - Add command to `contributes.commands`
   - Add `menus` section:
     ```json
     "menus": {
       "explorer/context": [{
         "when": "resourceExtname == .json",
         "command": "hello-scene-graph-manager.openWorkflowEditor",
         "group": "navigation"
       }]
     }
     ```

**Success Criteria:** Right-click on `.json` file shows "Open Workflow Editor" command; clicking opens webview panel with "Loading..." message

### Phase 3: React App Bootstrap (Priority: Critical) ✅
**Goal:** Display "Hello World" React app in webview

**Tasks:**

- [x] 1. Create `src/webview-ui/index.html` template
- [x] 2. Create `src/webview-ui/src/index.tsx` (React 18 createRoot)
- [x] 3. Create `src/webview-ui/src/App.tsx`:
   - Acquire VSCode API via `acquireVsCodeApi()`
   - Display simple "React is working" message
   - Set up message listener
   - Send `{ type: 'ready' }` message on mount
- [x] 4. Create `src/webview-ui/src/hooks/useVSCodeAPI.ts`:
   - Wrap `acquireVsCodeApi()`
   - Provide `postMessage()` helper
   - Provide `onMessage()` event listener hook
- [x] 5. Test message round-trip:
   - Extension sends init message
   - React receives and displays workflow name

**Success Criteria:** Opening workflow editor displays React app with workflow file path

### Phase 4: Basic ReactFlow Integration (Priority: Critical) ✅
**Goal:** Display workflow as static ReactFlow graph

**Tasks:**

- [x] 1. Install ReactFlow: `yarn add @xyflow/react`
- [x] 2. Create `src/webview-ui/src/utils/converter.ts`:
   - `workflowToReactFlow(config)` function
   - Create start/end nodes
   - Convert workflow nodes to ReactFlow nodes (no layout yet)
   - Convert workflow edges to ReactFlow edges
- [x] 3. Create `src/webview-ui/src/components/FlowEditor.tsx`:
   - Import ReactFlow and required CSS
   - Set up `useNodesState` and `useEdgesState`
   - Render ReactFlow with background and controls
   - Register custom node types (initially use default nodes)
- [x] 4. Create `src/webview-ui/src/hooks/useWorkflow.ts`:
   - Store workflow state
   - Handle init message from extension
   - Convert to ReactFlow on load
- [x] 5. Update `App.tsx` to render `FlowEditor`

**Success Criteria:** Opening `json/test.json` displays nodes and edges as ReactFlow graph (manual positioning)

### Phase 5: Auto-Layout Algorithm (Priority: High) ✅
**Goal:** Automatically position nodes in hierarchical layout

**Tasks:**

- [x] 1. Install dagre: `yarn add dagre @types/dagre`
- [x] 2. Create `src/webview-ui/src/utils/layout.ts`:
   - `getLayoutedElements(nodes, edges)` function
   - Use dagre for hierarchical layout
   - Configure node spacing, direction (TB = top-to-bottom)
   - Return nodes with `position` set
- [x] 3. Integrate into converter.ts:
   - Call layout function after node/edge conversion
   - Apply positions to nodes
- [x] 4. Add "Auto Layout" button to toolbar (creates placeholder for now)

**Success Criteria:** Workflow displays with clean hierarchical layout; nodes don't overlap

### Phase 6: Custom Node Components (Priority: High) ✅
**Goal:** Rich visual representation of workflow nodes

**Tasks:**

- [x] 1. Create `src/webview-ui/src/components/nodes/WorkflowNode.tsx`:
   - Display node ID as header
   - Show parameter count badge
   - Show implementation preview (first 50 chars)
   - Connection handles (top = target, bottom = source)
   - Selected state styling
- [x] 2. Create `src/webview-ui/src/components/nodes/StartNode.tsx`:
   - Green circle with "Start" label
   - Single source handle (bottom)
- [x] 3. Create `src/webview-ui/src/components/nodes/EndNode.tsx`:
   - Red circle with "End" label
   - Single target handle (top)
- [x] 4. Create `src/webview-ui/src/components/nodes/ToolNode.tsx`:
   - Different visual style (tool icon)
   - Show "Tool Node" label
- [x] 5. Register node types in FlowEditor:
   ```tsx
   const nodeTypes = {
     workflowNode: WorkflowNode,
     startNode: StartNode,
     endNode: EndNode,
     toolNode: ToolNode,
   };
   ```
- [x] 6. Update converter to set correct node types

**Success Criteria:** Each node type displays with unique styling; implementation preview is visible

### Phase 7: Custom Edge Components (Priority: Medium) ✅
**Goal:** Visual distinction between normal and conditional edges

**Tasks:**

- [x] 1. Create `src/webview-ui/src/components/edges/DefaultEdge.tsx`:
   - Smooth bezier curve
   - Animated flow indicator (optional)
   - Edge label (if needed)
- [x] 2. Create `src/webview-ui/src/components/edges/ConditionalEdge.tsx`:
   - Different color (orange/yellow)
   - Show condition name as label
   - Dashed line style
- [x] 3. Register edge types in FlowEditor:
   ```tsx
   const edgeTypes = {
     defaultEdge: DefaultEdge,
     conditionalEdge: ConditionalEdge,
   };
   ```
- [x] 4. Update converter to set correct edge types based on workflow edge type

**Success Criteria:** Conditional edges are visually distinct from normal edges

### Phase 8: Node Selection & Properties Panel (Priority: Critical) ✅
**Goal:** Display and edit node properties when selected

**Tasks:**

- [x] 1. Create `src/webview-ui/src/components/panels/NodePanel.tsx`:
   - Conditional rendering: only show when node selected
   - Layout: right sidebar with sections
   - **Node ID Section:**
     - Text input for node ID
     - Validation: must be unique, no special chars
     - Update node data on change
   - **Parameters Section:**
     - List of parameters
     - Add button (adds empty parameter)
     - Each parameter row:
       - Name input, Type input, ModelRef input (optional)
       - Delete button
   - **Output Section:**
     - Key-value editor for output fields
     - Add/remove output fields
   - **Implementation Section:**
     - Placeholder for Monaco editor (Phase 9)
     - For now: textarea with monospace font
- [x] 2. Wire up to FlowEditor:
   - Track selected node in state
   - Pass selected node data to NodePanel
   - Handle updates from NodePanel
   - Update ReactFlow nodes state
   - Mark workflow as "dirty" (unsaved changes)
- [x] 3. Add VSCode-themed styling for panels

**Success Criteria:** Clicking a node shows its properties in right panel; editing updates the node (not yet saved to file)

### Phase 9: Monaco Editor Integration (Priority: High) ✅
**Goal:** Syntax-highlighted code editor for implementation fields

**Tasks:**

- [x] 1. Install Monaco: `yarn add @monaco-editor/react`
- [x] 2. Create `src/webview-ui/src/components/panels/CodeEditor.tsx`:
   - Wrap `@monaco-editor/react` Editor component
   - Props: value, onChange, language (javascript)
   - Configure theme: use VSCode theme (dark/light detection)
   - Configure editor options:
     - minimap: disabled
     - lineNumbers: on
     - scrollBeyondLastLine: false
     - fontSize: 13
     - wordWrap: on
- [x] 3. Replace textarea in NodePanel with CodeEditor
- [x] 4. Add theme detection:
   - Listen for `themeChanged` message from extension
   - Switch Monaco theme accordingly
- [x] 5. Handle theme in extension:
   - Detect VSCode theme: `vscode.window.activeColorTheme.kind`
   - Send theme message to webview on init and theme change

**Success Criteria:** Implementation code displays with JavaScript syntax highlighting; theme matches VSCode

### Phase 10: Edge Selection & Properties Panel (Priority: High) ✅
**Goal:** Display and edit edge properties when selected

**Tasks:**

- [x] 1. Create `src/webview-ui/src/components/panels/EdgePanel.tsx`:
   - Conditional rendering: only show when edge selected
   - Display from/to nodes (read-only labels)
   - **For Normal Edges:**
     - Delete button
   - **For Conditional Edges:**
     - Condition name input
     - Parameters section (reuse component from NodePanel)
     - Output field (text input)
     - Implementation (CodeEditor)
     - Delete button
- [x] 2. Wire up to FlowEditor:
   - Track selected edge in state
   - Pass selected edge data to EdgePanel
   - Handle updates from EdgePanel
   - Update ReactFlow edges state
- [x] 3. Handle edge deletion:
   - Remove from ReactFlow edges
   - Mark workflow as dirty

**Success Criteria:** Clicking an edge shows its properties in right panel; editing conditional edge updates its configuration

### Phase 11: Workflow Configuration Panel (Priority: High) ✅
**Goal:** Edit global workflow settings

**Tasks:**

- [x] 1. Create `src/webview-ui/src/components/panels/WorkflowPanel.tsx`:
   - Left sidebar layout
   - Collapsible sections (use details/summary or custom accordion)
   - **State Annotation Section:**
     - Name input (text)
     - Type dropdown (Annotation.Root | Annotation.Messages)
   - **Annotation Fields Section:**
     - List of fields with add/remove buttons
     - Each field:
       - Key input
       - Type input (e.g., "string[]", "boolean | null")
       - Reducer code editor (small Monaco instance)
       - Default value input (JSON text area)
   - **Config Section:**
     - Recursion limit (number input)
     - Event emitter settings (JSON editor)
   - **State Graph Section:**
     - Annotation ref (text input, should match state annotation name)
     - Checkpointer type (text input)
- [x] 2. Wire up to App.tsx:
   - Pass workflow config to WorkflowPanel
   - Handle updates
   - Update workflow state
   - Mark as dirty
- [x] 3. Add toggle button in Toolbar to show/hide WorkflowPanel

**Success Criteria:** Can edit all global workflow configuration; changes update workflow state

### Phase 12: Add/Delete Nodes (Priority: Critical) ✅
**Goal:** CRUD operations for nodes

**Tasks:**

- [x] 1. Create `src/webview-ui/src/utils/idGenerator.ts`:
   - `generateNodeId()` function
   - Generate unique IDs: "node_1", "node_2", etc.
   - Check existing nodes to avoid duplicates
- [x] 2. Add "Add Node" button to Toolbar:
   - Click opens dropdown menu:
     - "Add Function Node"
     - "Add Tool Node"
   - On select:
     - Generate unique ID
     - Create new node with default properties
     - Position: center of current viewport
     - Add to ReactFlow nodes
     - Auto-select new node
- [x] 3. Add delete functionality:
   - Delete key handler on FlowEditor
   - If node selected: remove node and connected edges
   - If edge selected: remove edge
   - Alternatively: delete button in property panels
- [x] 4. Update converter to handle new nodes when saving

**Success Criteria:** Can add new nodes via toolbar; can delete nodes and edges via keyboard or button

### Phase 13: Add/Delete Edges (Priority: Critical) ✅
**Goal:** CRUD operations for edges

**Tasks:**

- [x] 1. Enable edge creation in FlowEditor:
   - Set `onConnect` handler
   - Validate connection:
     - Prevent self-loops
     - Prevent duplicate edges
     - Allow only one outgoing edge from start node
   - Create default edge (normal type)
   - Add to ReactFlow edges
- [x] 2. Add edge type toggle in EdgePanel:
   - Dropdown: "Normal" | "Conditional"
   - On change: update edge type and data structure
- [x] 3. Ensure edge deletion works (already implemented in Phase 10)

**Success Criteria:** Can create edges by dragging from node handles; can delete edges; can toggle edge type

### Phase 14: Save Functionality (Priority: Critical) ✅
**Goal:** Persist changes to JSON file

**Tasks:**

- [x] 1. Create `src/webview-ui/src/utils/converter.ts`:
   - `reactFlowToWorkflow(nodes, edges, baseConfig)` function
   - Filter out start/end nodes
   - Convert ReactFlow nodes back to workflow nodes
   - Convert ReactFlow edges back to workflow edges
   - Merge with base config (preserve non-visual data)
- [x] 2. Create save handler in App.tsx:
   - Convert current ReactFlow state to workflow JSON
   - Send `{ type: 'save', data: workflow }` message to extension
   - Show saving indicator
- [x] 3. Update WorkflowEditorPanel.ts:
   - Handle 'save' message
   - Write JSON to file using `vscode.workspace.fs.writeFile()`
   - Show success message: `vscode.window.showInformationMessage()`
   - Update dirty state
- [x] 4. Add keyboard shortcut:
   - In webview: listen for Ctrl+S / Cmd+S
   - Trigger save handler
- [x] 5. Add unsaved changes tracking:
   - Track dirty state
   - Show indicator in UI (e.g., dot in toolbar)
   - Warn on panel close if unsaved changes

**Success Criteria:** Clicking Save button writes changes to JSON file; file can be reopened and changes are persisted

### Phase 15: Validation (Priority: High) ✅
**Goal:** Validate workflow before saving and show errors

**Tasks:**

- [x] 1. Create `src/webview/utils/validation.ts`:
   - `validateWorkflow(config)` function
   - Validation checks:
     - Required fields present (stateAnnotation, annotation, nodes, edges, stateGraph)
     - Node IDs are unique
     - Edge references valid node IDs
     - Conditional edges have condition configuration
     - State graph annotationRef matches stateAnnotation.name
     - No orphaned nodes (except start/end)
   - Return array of validation errors with location info
- [x] 2. Create `src/webview-ui/src/hooks/useValidation.ts`:
   - Debounced validation (500ms after edit)
   - Send validation request to extension
   - Store validation results in state
- [x] 3. Update WorkflowEditorPanel.ts:
   - Handle 'validate' message
   - Run validation.ts
   - Send results back to webview
- [x] 4. Display validation errors in UI:
   - Toolbar: error count badge
   - Node/edge visual indicators: red border if error
   - Panel: show error messages
   - Tooltip on hover: show specific error
- [x] 5. Prevent save if validation fails

**Success Criteria:** Invalid workflows show error indicators; cannot save invalid workflows; errors guide user to fix issues

### Phase 16: Toolbar & UI Polish (Priority: Medium) ✅
**Goal:** Professional user experience

**Tasks:**

- [x] 1. Create `src/webview-ui/src/components/Toolbar.tsx`:
   - Save button with keyboard shortcut hint (Ctrl+S)
   - Auto-layout button (re-run layout algorithm)
   - Zoom controls:
     - Fit view (zoom to fit all nodes)
     - Zoom in / out buttons
   - Validation status indicator (error count badge)
   - Toggle panels buttons (show/hide side panels)
   - Dirty indicator (unsaved changes dot)
- [x] 2. Implement zoom controls:
   - Use ReactFlow `useReactFlow()` hook
   - Call `fitView()`, `zoomIn()`, `zoomOut()` methods
- [x] 3. Implement panel toggles:
   - Store panel visibility in state
   - Animate transitions (slide in/out)
- [x] 4. Add keyboard shortcuts:
   - Ctrl+S / Cmd+S: Save
   - Delete / Backspace: Delete selected element
   - Ctrl+A / Cmd+A: Select all nodes
   - Ctrl+Z / Cmd+Z: Undo (if implemented)
- [x] 5. Create `src/webview-ui/src/styles/main.css`:
   - VSCode theme variables integration
   - Layout styles (flex, grid)
   - Component styles
- [x] 6. Create `src/webview-ui/src/styles/vscode-theme.css`:
   - CSS variables from VSCode theme
   - Map to ReactFlow colors
   - Panel backgrounds, borders, text colors

**Success Criteria:** UI feels responsive and polished; keyboard shortcuts work; theme matches VSCode

### Phase 17: Testing & Bug Fixes (Priority: High) ✅
**Goal:** Ensure reliability and fix edge cases

**Tasks:**

- [x] 1. Manual testing scenarios:
   - Load `json/test.json` (existing workflow)
   - Edit node properties, verify save, reopen
   - Add new nodes, connect edges, save, reopen
   - Delete nodes/edges, save, reopen
   - Edit workflow config, save, reopen
   - Create conditional edges, edit conditions, save, reopen
   - Test with invalid JSON (should show error)
   - Test with large workflows (performance)
- [x] 2. Fix bugs found during testing
- [x] 3. Add error boundaries:
   - Create React ErrorBoundary component
   - Wrap App in ErrorBoundary
   - Show friendly error message if crash
- [x] 4. Add loading states:
   - Show spinner while loading workflow
   - Disable UI while saving
- [x] 5. Handle file watch (external changes):
   - WorkflowEditorPanel listens to file changes
   - If file changed externally, prompt user to reload
   - If unsaved changes, offer merge or discard

**Success Criteria:** All core workflows tested and working; no crashes; graceful error handling

### Phase 18: Documentation (Priority: Medium) ✅
**Goal:** Help users understand the editor

**Tasks:**

- [x] 1. Update CLAUDE.md:
   - Add section on Workflow Editor feature
   - Explain how to open editor
   - Describe UI components
   - List keyboard shortcuts
- [x] 2. Add inline tooltips:
   - Toolbar buttons have hover tooltips
   - Panel fields have help icons with explanations
- [x] 3. Create example workflows:
   - Add more JSON examples to json/ folder
   - Showcase different patterns (conditional routing, tool nodes, etc.)
- [x] 4. Code comments:
   - Document complex functions (converter, layout, validation)
   - Add TSDoc comments to key types and interfaces

**Success Criteria:** Users can understand and use the editor without additional guidance

## Critical Files

### Files to Create (Priority Order)

1. **src/webview/WorkflowEditorPanel.ts** (Phase 2)
   - Core infrastructure: webview lifecycle, message routing, HTML generation

2. **src/webview-ui/src/utils/converter.ts** (Phase 4 & 14)
   - Bidirectional conversion: SceneGraphManager JSON ↔ ReactFlow
   - Must preserve all schema properties

3. **src/webview-ui/src/components/FlowEditor.tsx** (Phase 4)
   - Main ReactFlow container
   - Handles user interactions (drag, select, connect)

4. **src/webview-ui/src/components/panels/NodePanel.tsx** (Phase 8)
   - Most complex UI: edit all node properties
   - Integrates CodeEditor

5. **webpack.webview.config.js** (Phase 1)
   - Build configuration for React app
   - Bundles for browser context

### Files to Modify (Priority Order)

1. **src/extension.ts** (Phase 2)
   - Register "Open Workflow Editor" command
   - Load JSON and create WorkflowEditorPanel

2. **package.json** (Phase 1)
   - Add all dependencies
   - Add commands and menus configuration
   - Add build scripts

3. **webpack.config.js** (Phase 1)
   - Export array with both extension and webview configs

4. **tsconfig.json** (Phase 1)
   - Add JSX support
   - Add paths for shared types

## Technical Considerations

### Security (CSP)
- Content Security Policy with nonces for inline scripts
- No `eval()` usage (Monaco editor uses web workers)
- Validate all messages between extension and webview

### Performance
- Debounce validation and auto-save (500ms)
- Virtualize large workflows (ReactFlow handles this)
- Lazy load Monaco editor (code-split)

### State Management
- Workflow state: useState in App.tsx
- ReactFlow nodes/edges: useNodesState, useEdgesState hooks
- Dirty state: track changes for save indicator
- No need for Redux/Zustand (simple state is sufficient)

### Theme Integration
- Detect VSCode theme changes
- Apply to ReactFlow background, nodes, edges
- Apply to Monaco editor
- Use CSS variables for dynamic theming

### Error Handling
- React ErrorBoundary for UI crashes
- Try-catch in message handlers
- Validation before save (prevent invalid JSON)
- User-friendly error messages

## Success Metrics

1. ✅ Can open `json/test.json` in visual editor
2. ✅ Workflow displays as graph with correct layout
3. ✅ Can edit node properties (ID, parameters, output, implementation)
4. ✅ Can edit edge properties (type, conditions)
5. ✅ Can add/delete nodes and edges
6. ✅ Can edit global workflow configuration
7. ✅ Can save changes to JSON file
8. ✅ Saved JSON is valid and can be loaded by WorkflowEngine
9. ✅ UI matches VSCode theme (dark/light)
10. ✅ Monaco editor provides syntax highlighting for implementation code

## Future Enhancements (Post-MVP)

- **Undo/Redo:** Command history with Ctrl+Z / Ctrl+Shift+Z
- **Node Templates:** Pre-configured node patterns (drag from palette)
- **Multi-file Support:** Manage multiple workflows in one editor
- **Workflow Execution View:** Real-time visualization of running workflows
- **Export to PNG:** Generate workflow diagrams
- **Search:** Find nodes by ID or implementation content
- **Minimap Navigation:** Click to jump to workflow areas
- **Copy/Paste Nodes:** Duplicate node configurations
- **Validation Rules Config:** Customizable validation rules
- **Type Generation:** Auto-generate TypeScript types from workflow

## Resources

- **ReactFlow Documentation:** https://reactflow.dev/learn
- **VSCode Webview API:** https://code.visualstudio.com/api/extension-guides/webview
- **Monaco Editor React:** https://github.com/suren-atoyan/monaco-react
- **SceneGraphManager Types:** /Users/akirakudo/Desktop/MyWork/CLI/kudos-cli/src/SceneGraphManager/src/types/index.ts
