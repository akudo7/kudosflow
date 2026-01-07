# Parameter Format Migration Plan

## Overview

This document outlines the refactoring plan to migrate from the legacy parameter format to the new parameter format across both KudosFlow (VSCode Extension) and SceneGraphManager (TypeScript Runtime).

**Migration Date**: TBD
**Impact**: Breaking change - requires coordinated updates to both projects
**Backward Compatibility**: No - New format only

---

## Format Comparison

### Legacy Format (Deprecated)

```json
// State parameter
{ "name": "state", "type": "typeof AgentState.State" }

// Model parameter
{ "name": "model", "type": "string", "modelRef": "gpt4" }
```

**Issues**: `type` field is ambiguous, no explicit distinction between parameter categories

### New Format (Current)

```json
// State parameter
{ "name": "state", "parameterType": "state", "stateType": "typeof AgentState.State" }

// Model parameter
{ "name": "model", "parameterType": "model", "modelRef": "gpt4" }
```

**Benefits**: Explicit `parameterType`, dedicated fields, clear semantics, better extensibility

---

## Implementation Phases

### Phase 0: KudosFlow - Remove Legacy Support
**Status**: ⏳ Pending (after /clear)
**Details**: [phase0-kudosflow-legacy-removal.md](./phase0-kudosflow-legacy-removal.md)

Remove legacy format conversion logic from `jsonToFlow.ts` converter.

**Key Changes**:
- Lines 61-86: Node handler parameters
- Lines 141-165: Conditional edge parameters

---

### Phase 1: SceneGraphManager - Update Type Definitions
**Status**: ⏳ Pending
**Details**: [phase1-scenegraphmanager-types.md](./phase1-scenegraphmanager-types.md)

Update `NodeFunctionParameter` from interface to discriminated union type.

**File**: `src/types/index.ts` (lines 82-86)

---

### Phase 2: SceneGraphManager - Update Workflow Engine
**Status**: ⏳ Pending
**Details**: [phase2-scenegraphmanager-workflow.md](./phase2-scenegraphmanager-workflow.md)

Update model detection and parameter processing logic.

**File**: `src/lib/workflow.ts` (line 501, 621)

---

### Phase 3: SceneGraphManager - Update Tests
**Status**: ⏳ Pending
**Details**: [phase3-scenegraphmanager-tests.md](./phase3-scenegraphmanager-tests.md)

Update existing tests and add new parameter validation tests.

**Location**: `src/__tests__/` (if exists)

---

### Phase 4: SceneGraphManager - Update Documentation
**Status**: ⏳ Pending
**Details**: [phase4-scenegraphmanager-docs.md](./phase4-scenegraphmanager-docs.md)

Update CLAUDE.md, README.md, and code comments.

**Files**: `CLAUDE.md`, `README.md`

---

### Phase 5: Migrate JSON Workflow Files
**Status**: ⏳ Pending
**Details**: [phase5-json-migration.md](./phase5-json-migration.md)

Manually convert all existing workflow JSON files to new format.

**Action Required**: Manual migration of all workflow files

---

### Phase 6: Release and Version Management
**Status**: ⏳ Pending
**Details**: [phase6-release.md](./phase6-release.md)

Coordinate v2.0.0 releases for both projects with proper documentation.

**Version Bump**: Major version (breaking change)

---

## Project Status

### KudosFlow (VSCode Extension)

**Completed** (commits c00d536, 24f1fb1):
- ✅ Type definitions updated
- ✅ UI updated with dropdown selector
- ✅ JSON output uses new format exclusively
- ✅ Validation for new format

**Pending** (Phase 0):
- ⏳ Remove legacy format support from `jsonToFlow.ts`

### SceneGraphManager (TypeScript Runtime)

**Location**: `/Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager`

**Pending** (Phases 1-6):
- ⏳ Update type definitions
- ⏳ Update workflow engine
- ⏳ Update tests
- ⏳ Update documentation
- ⏳ Migrate JSON files
- ⏳ Release v2.0.0

---

## Code Locations

### KudosFlow Files

```
webview-ui/src/workflow-editor/
├── types/workflow.types.ts (✅ updated)
├── NodeEditorDialog.tsx (✅ updated)
├── WorkflowEditor.tsx (✅ updated)
├── settings/ConditionalEdgeFormModal.tsx (✅ updated)
├── converters/
│   ├── flowToJson.ts (✅ updated - exports new format only)
│   └── jsonToFlow.ts (⏳ pending - remove legacy support)
└── utils/validation.ts (✅ updated)
```

### SceneGraphManager Files

```
SceneGraphManager/
├── src/
│   ├── types/index.ts (⏳ lines 82-86, 89-93, 198-203)
│   └── lib/
│       └── workflow.ts (⏳ lines 501, 621, 311-570, 616-659)
├── CLAUDE.md (⏳ multiple sections)
├── README.md (⏳ lines 120-150)
└── dist/types/index.d.ts (auto-generated after build)
```

---

## Quick Reference

### Type Definition (Final)

```typescript
export type NodeFunctionParameter =
  | {
      name: string;
      parameterType: "state";
      stateType: string;
    }
  | {
      name: string;
      parameterType: "model";
      modelRef: string;
    };
```

### Migration Examples

```json
// State parameter: OLD → NEW
{ "name": "state", "type": "typeof AgentState.State" }
→
{ "name": "state", "parameterType": "state", "stateType": "typeof AgentState.State" }

// Model parameter: OLD → NEW
{ "name": "model", "type": "string", "modelRef": "gpt4" }
→
{ "name": "model", "parameterType": "model", "modelRef": "gpt4" }
```

---

## Next Actions

1. **Review this plan** and all phase documents
2. **Execute Phase 0** - Remove KudosFlow legacy support (after /clear)
3. **Execute Phases 1-4** - Update SceneGraphManager
4. **Execute Phase 5** - Migrate all JSON files
5. **Execute Phase 6** - Release v2.0.0 for both projects

---

## Related Commits

### KudosFlow
- `c00d536` - Improve parameter type system with state and model distinction
- `24f1fb1` - Update JSON format to use new parameter structure
- TBD - Remove legacy format support (Phase 0, pending after /clear)

### SceneGraphManager
- TBD - All phases pending implementation

---

**Document Version**: 3.0
**Last Updated**: 2026-01-07
**Author**: Claude Sonnet 4.5 (via KudosFlow)
