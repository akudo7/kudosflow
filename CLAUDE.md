# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension that integrates React Flow for visual workflow editing. The extension displays a webview panel with a drag-and-drop canvas interface for building node-based workflows, similar to Flowise.

## Build and Development Commands

### Extension Development
```bash
# Install all dependencies (extension + webview)
yarn install:all

# Compile TypeScript for extension
yarn compile

# Watch mode for extension development
yarn watch

# Lint the extension code
yarn lint

# Run tests
yarn pretest
```

### Webview Development
```bash
# Start webview development server (from root)
yarn start:webview

# Build webview for production
yarn build:webview

# Direct commands (from webview-ui directory)
cd webview-ui
yarn start    # Development server
yarn build    # Production build
```

### Packaging
```bash
# Package extension (includes obfuscation)
yarn package
```

## Architecture

### Two-Part System

The extension consists of two separate build systems:

1. **Extension Side** (Node.js context):
   - Entry: [src/extension.ts](src/extension.ts)
   - Build: TypeScript → `out/` directory (via `tsc`)
   - Manages VSCode extension lifecycle and webview panel creation
   - Handles message passing between VSCode and webview

2. **Webview Side** (Browser context):
   - Entry: [webview-ui/src/index.tsx](webview-ui/src/index.tsx)
   - Build: Vite + React → `webview-ui/build/` directory
   - Contains the React Flow canvas UI
   - Cannot directly access Node.js APIs or VSCode APIs

### Key Components

#### Extension Side
- [ComponentGalleryPanel.ts](src/panels/ComponentGalleryPanel.ts): Manages webview panel lifecycle, HTML injection, and message passing
- [extension.ts](src/extension.ts): Extension activation and command registration
- [utilities/getUri.ts](src/utilities/getUri.ts): Helper for converting file paths to webview URIs
- [utilities/getNonce.ts](src/utilities/getNonce.ts): Generates CSP nonces for security

#### Webview Side
- [App.tsx](webview-ui/src/App.tsx): Main React Flow canvas component with drag-and-drop support
- [ReactFlowContext.tsx](webview-ui/src/ReactFlowContext.tsx): Context provider managing React Flow instance and node/edge operations (delete, duplicate)
- [CanvasNode.tsx](webview-ui/src/CanvasNode.tsx): Custom node component for the canvas
- [AddNodes.tsx](webview-ui/src/AddNodes.tsx): Floating action button for adding nodes to canvas
- [CanvasHeader.tsx](webview-ui/src/CanvasHeader.tsx): Toolbar with save/load/delete flow operations

### Communication Pattern

Extension and webview communicate via message passing:

**Extension → Webview:**
```typescript
panel.webview.postMessage({ command: 'iconPath', filename: '...', path: '...' })
```

**Webview → Extension:**
```typescript
vscode.postMessage({ command: 'getIconPath', filename: '...' })
vscode.postMessage({ command: 'error', target: '...', value: '...' })
```

### Resource Loading

The webview has restricted access to resources. All file paths must be converted to webview URIs:
- Use `getUri()` utility to convert extension paths to webview-compatible URIs
- Resource roots are configured in `ComponentGalleryPanel.render()`: `out/`, `webview-ui/build/`, and `resources/`
- Icons and assets in `resources/` are accessed via message passing to get proper webview URIs

### Security

Content Security Policy (CSP) is enforced:
- Nonces are required for inline styles and scripts
- Font sources restricted to webview CSP source
- Default sources set to 'none'

## Node Data Structure

Nodes follow a specific schema with:
- `inputAnchors`: Connection points for incoming edges
- `outputAnchors`: Connection points for outgoing edges
- `inputParams`: Configuration parameters for the node
- `inputs`: Current values for inputs (can be strings or arrays for list inputs)

Node operations (duplicate, delete) handle updating all anchors, params, and connected edges.

## Development Workflow

1. **Running the extension**: Press F5 in VSCode to launch Extension Development Host
2. **Testing changes**:
   - Extension changes: Save file → `yarn compile` → Reload window (Ctrl+R in dev host)
   - Webview changes: `yarn start:webview` for hot reload during development
3. **Building for production**: Run `yarn build:webview` before packaging

## Important Notes

- The webview must be built before packaging the extension
- TypeScript compilation outputs to `out/`, but webpack is configured to output to `dist/` (currently unused)
- The extension uses `retainContextWhenHidden: true` to preserve webview state when hidden
- Symlink exists: `webview-ui/resources` → `../resources` for accessing shared icons
