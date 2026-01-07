# Phase 6: Release and Version Management

## Overview

Prepare coordinated releases for both KudosFlow and SceneGraphManager with proper version bumps and documentation.

---

## Version Bump Strategy

### Semantic Versioning

This is a **breaking change**, requiring major version bumps:

- **KudosFlow**: Current version → Next major (e.g., 1.x.x → 2.0.0)
- **SceneGraphManager**: Current version → Next major (e.g., 1.x.x → 2.0.0)

---

## KudosFlow Release

### Step 1: Update package.json

```json
{
  "name": "kudosflow",
  "version": "2.0.0",
  ...
}
```

### Step 2: Update CHANGELOG.md

```markdown
# Changelog

## [2.0.0] - 2026-01-XX

### Breaking Changes

- **Parameter Format**: Migrated to new parameter format with explicit `parameterType` field
  - State parameters now require: `{ name, parameterType: "state", stateType }`
  - Model parameters now require: `{ name, parameterType: "model", modelRef }`
  - Legacy format support removed - old JSON files will fail to load
  - See migration guide in docs/refactoring/parameter-format-migration.md

### Changed

- Removed legacy parameter format conversion from jsonToFlow converter
- Updated all type definitions to use discriminated unions
- Updated UI to enforce new parameter structure

### Migration Guide

Existing workflow JSON files must be manually updated. See [phase5-json-migration.md](./docs/refactoring/phase5-json-migration.md) for detailed instructions.

## [1.x.x] - Previous version
...
```

### Step 3: Create Release Notes

Create `RELEASE_NOTES_v2.0.0.md`:

```markdown
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

All existing workflow JSON files must be migrated to the new format. See [Migration Guide](./docs/refactoring/phase5-json-migration.md).

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
- **VSCode**: 1.85.0 or higher

## 📚 Documentation

- [Parameter Format Migration Guide](./docs/refactoring/parameter-format-migration.md)
- [JSON Migration Instructions](./docs/refactoring/phase5-json-migration.md)
```

### Step 4: Build and Package

```bash
cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow
yarn build:webview
yarn package
```

### Step 5: Git Tag

```bash
git tag -a v2.0.0 -m "Release v2.0.0 - New parameter format"
git push origin v2.0.0
```

---

## SceneGraphManager Release

### Step 1: Update package.json

```json
{
  "name": "scene-graph-manager",
  "version": "2.0.0",
  ...
}
```

### Step 2: Update CHANGELOG.md

```markdown
# Changelog

## [2.0.0] - 2026-01-XX

### Breaking Changes

- **Parameter Format**: Migrated to new parameter format with explicit `parameterType` field
  - `NodeFunctionParameter` changed from interface to discriminated union type
  - State parameters now require: `{ name, parameterType: "state", stateType }`
  - Model parameters now require: `{ name, parameterType: "model", modelRef }`
  - Workflow engine updated to use `parameterType` for model detection

### Changed

- Updated type definitions in `src/types/index.ts`
- Updated workflow engine model detection logic
- Updated all documentation and examples

### Migration Guide

Existing workflow JSON files must be manually updated. See documentation for details.

## [1.x.x] - Previous version
...
```

### Step 3: Build and Verify

```bash
cd /Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager
yarn build
yarn test  # If tests exist
```

### Step 4: Git Tag

```bash
git tag -a v2.0.0 -m "Release v2.0.0 - New parameter format"
git push origin v2.0.0
```

---

## Coordinated Release Communication

### Internal Announcement Template

```markdown
## 🚀 KudosFlow & SceneGraphManager v2.0.0 Released

We've released major version updates for both projects with a coordinated breaking change to improve parameter handling.

### What's New
- Explicit parameter type system with `parameterType` field
- Improved type safety with TypeScript discriminated unions
- Clearer semantics for state vs. model parameters

### Action Required
All users must migrate existing workflow JSON files to the new parameter format.

### Resources
- Migration Guide: [docs/refactoring/parameter-format-migration.md]
- JSON Migration: [docs/refactoring/phase5-json-migration.md]
- Release Notes: [RELEASE_NOTES_v2.0.0.md]

### Timeline
- ✅ Phase 0: KudosFlow legacy support removed
- ✅ Phase 1-4: SceneGraphManager updated
- ✅ Phase 5: JSON migration complete
- ✅ Phase 6: Released v2.0.0

### Support
For migration assistance, please refer to the documentation or open an issue.
```

---

## Post-Release Checklist

### Both Projects

- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Release notes created
- [ ] Build successful
- [ ] Git tagged
- [ ] Tags pushed to remote

### KudosFlow Specific

- [ ] Extension packaged (.vsix)
- [ ] Marketplace listing updated (if applicable)
- [ ] Documentation site updated

### SceneGraphManager Specific

- [ ] NPM package published (if applicable)
- [ ] Documentation site updated
- [ ] Type definitions verified in dist/

### Communication

- [ ] Internal team notified
- [ ] Users notified of breaking change
- [ ] Migration guide shared
- [ ] Support channels prepared

---

## Rollback Plan

If critical issues are discovered post-release:

### Immediate Actions

1. **Document the issue** - Create detailed bug report
2. **Assess severity** - Determine if rollback is necessary
3. **Notify users** - Communicate the issue and status

### Rollback Steps

```bash
# Revert to previous version
git revert <commit-sha>
git tag -d v2.0.0
git push --delete origin v2.0.0

# Re-release as v2.0.1 with fixes or revert to v1.x.x
```

---

## Success Criteria

- ✅ Both projects build without errors
- ✅ All tests pass (if applicable)
- ✅ Documentation is complete and accurate
- ✅ Migration guide is clear and tested
- ✅ Version tags are created and pushed
- ✅ Users can successfully migrate existing workflows
- ✅ New parameter format works in both projects

---

**Previous Phase**: [phase5-json-migration.md](./phase5-json-migration.md)
**Related Main Plan**: [parameter-format-migration.md](../parameter-format-migration.md)
