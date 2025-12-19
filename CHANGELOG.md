# Change Log

All notable changes to the "bolt-new" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Phase 12: Project Reduction and Optimization (減量化)

#### Removed

- Legacy `reactflowtest.helloworld` command and ComponentGalleryPanel (Phase 12A)
- 16+ legacy canvas components (~1,410 lines) (Phase 12B)
- Resources directory and associated symlinks (Phase 12B)
- 10 unused npm dependencies (~197MB node_modules) (Phase 12C)
- Unused webpack.config.js (Phase 12D)

#### Optimized

- .vscodeignore - Better exclusions, smaller .vsix package (~18% smaller)
- tsconfig.json - Incremental compilation enabled (~67% faster rebuilds)
- Build process - Streamlined configuration
- Webview bundle size reduced by 25%

#### Impact

- **Code**: ~1,728 lines removed
- **Dependencies**: 10 packages removed, ~197MB saved
- **Package size**: ~2.1MB smaller (.vsix, 18% reduction)
- **Build time**: ~67% faster incremental builds
- **Architecture**: Single editor implementation (WorkflowEditor only)

See [SIZE_COMPARISON.md](docs/SIZE_COMPARISON.md) for detailed metrics.

### Initial Features

- Initial release
- React Flow based workflow editor
- Drag-and-drop node canvas
- JSON workflow file support
