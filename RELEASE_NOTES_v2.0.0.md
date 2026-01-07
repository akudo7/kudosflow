# KudosFlow v2.0.0 Release Notes

## 🚨 Breaking Changes

### New Parameter Format

This release introduces a breaking change to the workflow parameter format for improved type safety and clarity.

#### What Changed

**Before (Legacy):**
```json
{ "name": "state", "type": "typeof AgentState.State" }
{ "name": "model", "type": "string", "modelRef": "gpt4" }
```

**After (New):**
```json
{ "name": "state", "parameterType": "state", "stateType": "typeof AgentState.State" }
{ "name": "model", "parameterType": "model", "modelRef": "gpt4" }
```

#### Migration Required

All existing workflow JSON files must be migrated to the new format. See [Migration Guide](./docs/refactoring/parameter-format-migration/phase5-json-migration.md).

#### Why This Change

- Explicit parameter types eliminate ambiguity
- Improved TypeScript type safety with discriminated unions
- Better developer experience with clearer semantics
- Foundation for future parameter type extensions

## 📦 Installation

```bash
# Install from marketplace
code --install-extension kudosflow-2.0.0.vsix
```

## 🔗 Compatibility

- **SceneGraphManager**: Requires v2.0.0 or higher
- **VSCode**: 1.96.0 or higher

## 📚 Documentation

- [Parameter Format Migration Guide](./docs/refactoring/parameter-format-migration.md)
- [JSON Migration Instructions](./docs/refactoring/parameter-format-migration/phase5-json-migration.md)
- [Phase 6: Release Documentation](./docs/refactoring/parameter-format-migration/phase6-release.md)

## 🔄 What's Changed

- Removed legacy parameter format conversion from jsonToFlow converter
- Updated all type definitions to use discriminated unions
- Updated UI to enforce new parameter structure
- Updated dependency: @kudos/scene-graph-manager to v2.0.0

## 🐛 Known Issues

None at this time.

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the complete list of changes.
