# Phase 11: Internationalization (i18n) - Japanese to English Conversion

**Status**: ⬜ Not Started
**Estimated Time**: 2-3 days (14-20 hours)
**Complexity**: Low-Medium (High volume, low complexity)

## Overview

Phase 11 converts all Japanese text in the codebase to English, making the extension fully accessible to English-speaking developers and users. This comprehensive effort covers **35 files** across the extension and webview, including UI labels, validation messages, dialogs, tooltips, and code comments.

## Scope

- **Total Files**: 35 files containing Japanese text
  - **Extension side**: 2 files (src/)
  - **Webview side**: 33 files (webview-ui/src/)
- **Approach**: Direct string replacement (no i18n library)
- **Translation Strategy**: Clear, professional English with consistent terminology

## Sub-Phases

Phase 11 is divided into **5 sub-phases** for organized implementation and progress tracking:

### [Phase 11A: Validation Layer](phase11/PHASE11A_VALIDATION.md) ⬜

**Time**: 3-4 hours | **Complexity**: Low | **Priority**: Foundation

- **Files**: 1 file - `validation.ts`
- **Content**: ~30 systematic validation error messages
- **Focus**: Node name, field name, parameter, output, model, MCP server validation
- **Why First**: Most systematic work, foundation for all other components

### [Phase 11B: Extension Side](phase11/PHASE11B_EXTENSION.md) ⬜

**Time**: 1-2 hours | **Complexity**: Low | **Priority**: High

- **Files**: 2 files - Extension-side dialogs and comments
  - `src/panels/WorkflowEditorPanel.ts`
  - `src/extension.ts`
- **Content**: Critical save/error dialogs, success notifications
- **Focus**: User-facing extension notifications

### [Phase 11C: Core Workflow UI](phase11/PHASE11C_CORE_UI.md) ⬜

**Time**: 4-5 hours | **Complexity**: Medium | **Priority**: High

- **Files**: 5 files - Main workflow editor components
  - `WorkflowEditor.tsx`
  - `WorkflowToolbar.tsx`
  - `WorkflowNode.tsx`
  - `ToolNode.tsx`
  - `WorkflowSettingsPanel.tsx`
- **Content**: Toolbar buttons, editor labels, node UI, settings panel
- **Focus**: Most visible UI components users interact with constantly

### [Phase 11D: Settings Components](phase11/PHASE11D_SETTINGS.md) ⬜

**Time**: 4-5 hours | **Complexity**: Medium | **Priority**: Medium

- **Files**: 14 files - All settings forms and editors
  - Annotation, Config, State editors
  - Model, MCP Server, A2A Client editors and modals
  - Node name editor, badges, execution settings
- **Content**: Form labels, modal titles, confirmation dialogs
- **Focus**: Comprehensive settings UI

### [Phase 11E: Legacy Components](phase11/PHASE11E_LEGACY.md) ⬜

**Time**: 2-3 hours | **Complexity**: Low | **Priority**: Low

- **Files**: ~16 files - Older canvas and utility components
  - Canvas components (CanvasHeader, CanvasNode, AddNodes, etc.)
  - Input/Output handlers
  - Dialog components
  - UI utilities and helpers
- **Content**: Any remaining Japanese in older components
- **Focus**: Complete remaining components, final verification

## Key Translation Mappings

Consistent terminology across all components:

| Japanese | English | Context |
|----------|---------|---------|
| ノード | Node | Workflow nodes |
| ワークフロー | Workflow | Overall workflow |
| 保存 | Save | Save actions |
| 削除 | Delete | Delete actions |
| 複製 | Duplicate | Copy actions |
| 設定 | Settings | Configuration |
| 実装 | Implementation | Code implementation |
| パラメータ | Parameters | Function parameters |
| 出力 | Output | Function output |
| 条件 | Condition | Conditional logic |
| エッジ | Edge | Workflow connections |
| モデル | Model | AI models |
| サーバー | Server | A2A/MCP servers |
| タイムアウト | Timeout | Timeout settings |
| フィールド | Field | Annotation fields |
| 予約語 | Reserved word | JavaScript keywords |
| 有効な | Valid | Validation context |
| エラー | Error | Error messages |

## Implementation Sequence

### Day 1 (6-8 hours)

**Morning**: Phase 11A (Validation) + Phase 11B (Extension)
- Translate validation.ts (~30 messages)
- Translate extension-side dialogs
- Test validation and dialog interactions

**Afternoon**: Phase 11C (Core UI) - Part 1
- Translate WorkflowEditor.tsx
- Translate WorkflowToolbar.tsx
- Test toolbar and editor UI

### Day 2 (6-8 hours)

**Morning**: Phase 11C (Core UI) - Part 2
- Translate WorkflowNode.tsx
- Translate ToolNode.tsx
- Translate WorkflowSettingsPanel.tsx
- Test node and settings UI

**Afternoon**: Phase 11D (Settings)
- Translate all 14 settings component files
- Test all settings forms and modals

### Day 3 (4-6 hours)

**Morning**: Phase 11E (Legacy)
- Search for Japanese in legacy components
- Translate any found Japanese text
- Final verification across all files

**Afternoon**: Testing & Documentation
- Comprehensive application testing
- Update IMPLEMENTATION_PLAN.md
- Create Phase 11 completion summary
- Final commit

## Testing Strategy

### Automated Verification

After each sub-phase, search for remaining Japanese:

```bash
# Validation layer (11A)
grep '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' \
  webview-ui/src/workflow-editor/utils/validation.ts

# Extension side (11B)
grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' src/ \
  --exclude-dir=node_modules

# Core UI (11C)
grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' \
  webview-ui/src/workflow-editor/Workflow*.tsx \
  webview-ui/src/workflow-editor/ToolNode.tsx

# Settings (11D)
grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' \
  webview-ui/src/workflow-editor/settings/

# All source files (11E)
grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' \
  src/ webview-ui/src/ \
  --exclude-dir=node_modules \
  --exclude="*.md" \
  --exclude="*.json"
```

### Manual Testing

After completing all sub-phases:

- [ ] Open workflow editor → All UI in English
- [ ] Test toolbar buttons → All labels/tooltips in English
- [ ] Open settings panel → All tabs/forms in English
- [ ] Trigger validation errors → All messages in English
- [ ] Add/edit/delete nodes → All confirmations in English
- [ ] Save workflow → All notifications in English
- [ ] Test server controls → All status messages in English
- [ ] Test all form modals → All labels/buttons in English

## Success Criteria

Phase 11 is complete when:

### Translation Quality
- [ ] All Japanese text replaced with professional English
- [ ] Consistent terminology across all 35 files
- [ ] Error messages are clear and actionable
- [ ] UI labels are concise and descriptive

### Functional Verification
- [ ] No regressions in existing functionality
- [ ] All validation messages display correctly
- [ ] All UI elements render correctly
- [ ] All dialogs and confirmations work correctly

### Code Quality
- [ ] No Japanese characters remain in source code
- [ ] Code formatting maintained
- [ ] TypeScript compilation succeeds: `yarn compile`
- [ ] Webview build succeeds: `yarn build:webview`
- [ ] No console errors

### Documentation
- [ ] IMPLEMENTATION_PLAN.md updated with Phase 11 ☑
- [ ] All 5 sub-phase documents created
- [ ] Phase 11 completion summary created

## Git Workflow

### Commit Strategy

**Option 1: Single Commit (Recommended)**
Complete all sub-phases, then commit once:

```bash
git add .
git commit -m "Phase 11: Convert Japanese to English (i18n)

- Translate validation messages (11A)
- Translate extension-side dialogs (11B)
- Translate core workflow UI (11C)
- Translate settings components (11D)
- Translate legacy components (11E)

Complete internationalization:
- 35 files translated
- ~500+ lines of Japanese → English
- Consistent terminology throughout
- All functionality preserved

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Option 2: Staged Commits**
Commit after each sub-phase for granular history:

```bash
# After 11A
git commit -m "Phase 11A: Translate validation layer to English"

# After 11B
git commit -m "Phase 11B: Translate extension-side dialogs to English"

# After 11C
git commit -m "Phase 11C: Translate core workflow UI to English"

# After 11D
git commit -m "Phase 11D: Translate settings components to English"

# After 11E
git commit -m "Phase 11E: Translate legacy components to English"
```

## Common Issues & Solutions

### Issue 1: Button text doesn't match condition

**Problem**: Changed button text but forgot to update condition check

```typescript
// Wrong
const answer = await window.showWarningMessage("Save workflow?", "Yes", "No");
if (answer === "はい") {  // Never true!

// Correct
if (answer === "Yes") {
```

### Issue 2: String interpolation lost

**Problem**: Changed template literals to regular strings

```typescript
// Wrong
error: "Failed to save: error"

// Correct
error: `Failed to save: ${error}`
```

### Issue 3: Translation inconsistency

**Problem**: Same concept translated differently across files

**Solution**: Use the key translation mappings table consistently

## Development Commands

```bash
# Compile extension
yarn compile

# Build webview
yarn build:webview

# Watch mode for development
yarn watch                # Extension
yarn start:webview        # Webview

# Lint code
yarn lint

# Run in development
# Press F5 in VSCode

# Package extension
yarn package
```

## Critical Files Reference

The 5 most critical files for Phase 11:

1. **[validation.ts](../../webview-ui/src/workflow-editor/utils/validation.ts)** - ~30 validation messages (Phase 11A)
2. **[WorkflowToolbar.tsx](../../webview-ui/src/workflow-editor/WorkflowToolbar.tsx)** - ~20 UI labels (Phase 11C)
3. **[WorkflowEditor.tsx](../../webview-ui/src/workflow-editor/WorkflowEditor.tsx)** - Notifications and labels (Phase 11C)
4. **[MCPServerFormModal.tsx](../../webview-ui/src/workflow-editor/settings/MCPServerFormModal.tsx)** - Complex form pattern (Phase 11D)
5. **[WorkflowEditorPanel.ts](../../src/panels/WorkflowEditorPanel.ts)** - Critical save dialogs (Phase 11B)

## Benefits of English Translation

### For Users
- **Accessibility**: English-speaking developers can use the extension
- **Clarity**: Professional English error messages and labels
- **Consistency**: Uniform terminology throughout the UI

### For Development
- **Maintainability**: Easier for international contributors
- **Documentation**: Aligns with English technical documentation
- **Standards**: Follows VSCode extension best practices

### For Future
- **Foundation**: Ready for proper i18n if multi-language support needed
- **Quality**: Professional presentation for English-speaking users
- **Growth**: Opens extension to wider user base

## Next Steps After Phase 11

1. **User Testing**: Get feedback from English-speaking users
2. **Documentation**: Consider translating Japanese docs to English
3. **Localization** (Optional): If multi-language support desired:
   - Implement proper i18n infrastructure (i18next, react-i18next)
   - Create translation files for Japanese, English, etc.
   - Add language switching functionality
4. **Phase 12+**: Plan additional features or improvements

---

## Quick Start

To begin Phase 11 implementation:

```bash
# Start with Phase 11A
"Phase 11Aを実装してください"
```

Or to create all documentation first:

```bash
# Documentation is already created in docs/phases/phase11/
ls docs/phases/phase11/
# PHASE11A_VALIDATION.md
# PHASE11B_EXTENSION.md
# PHASE11C_CORE_UI.md
# PHASE11D_SETTINGS.md
# PHASE11E_LEGACY.md
```

---

**Ready to begin!** This phase will transform the extension into a fully English application for international accessibility.
