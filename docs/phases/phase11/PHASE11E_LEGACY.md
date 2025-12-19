# Phase 11E: Legacy Components Translation

**Status**: ⬜ Not Started
**Estimated Time**: 2-3 hours
**Complexity**: Low (Older components, less Japanese expected)
**Priority**: Low - Complete remaining components

## Overview

Translate all remaining Japanese text in legacy canvas and utility components. These are older components that may have less Japanese text than the core workflow editor.

## Files to Check

### Canvas Components (~5 files)

1. `webview-ui/src/CanvasHeader.tsx`
2. `webview-ui/src/CanvasNode.tsx`
3. `webview-ui/src/AddNodes.tsx`
4. `webview-ui/src/NodeCardWrapper.tsx`

### Input/Output Handlers (~2 files)

5. `webview-ui/src/NodeInputHandler.tsx`
6. `webview-ui/src/NodeOutputHandler.tsx`

### Dialog Components (~1 file)

7. `webview-ui/src/AdditionalParamsDialog.tsx`

### UI Utilities (~8 files)

8. `webview-ui/src/SelectVariable.tsx`
9. `webview-ui/src/TooltipWithParser.tsx`
10. `webview-ui/src/NodeTooltip.tsx`
11. `webview-ui/src/Input.tsx`
12. `webview-ui/src/Transitions.tsx`

### Helper/Type Files (~3 files)

13. `webview-ui/src/genericHelper.ts`
14. `webview-ui/src/types.ts`
15. `webview-ui/src/utilities/vscode.ts`

## Implementation Strategy

Since these are legacy components, the approach will be:

1. **Search for Japanese text** in each file
2. **Translate any found** using consistent terminology
3. **Verify** no Japanese remains
4. **Test** if component is still in use

## Search Command

Use this command to find Japanese text in each file:

```bash
# Search all legacy component files for Japanese
grep -n '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' \
  webview-ui/src/CanvasHeader.tsx \
  webview-ui/src/CanvasNode.tsx \
  webview-ui/src/AddNodes.tsx \
  webview-ui/src/NodeCardWrapper.tsx \
  webview-ui/src/NodeInputHandler.tsx \
  webview-ui/src/NodeOutputHandler.tsx \
  webview-ui/src/AdditionalParamsDialog.tsx \
  webview-ui/src/SelectVariable.tsx \
  webview-ui/src/TooltipWithParser.tsx \
  webview-ui/src/NodeTooltip.tsx \
  webview-ui/src/Input.tsx \
  webview-ui/src/Transitions.tsx \
  webview-ui/src/genericHelper.ts \
  webview-ui/src/types.ts \
  webview-ui/src/utilities/vscode.ts \
  2>/dev/null || echo "No Japanese text found in these files"
```

## Expected Japanese Content

Based on exploration, these files may contain:

### Possible UI Labels

- Button labels (保存, 削除, キャンセル, etc.)
- Placeholder text (入力してください, etc.)
- Tooltip text (クリックして..., etc.)
- Error messages (エラー, 失敗しました, etc.)

### Possible Code Comments

- Implementation notes in Japanese
- TODO comments in Japanese
- Function descriptions in Japanese

## Translation Guidelines

### UI Text Translation

Use the same patterns as previous phases:

| Japanese | English |
|----------|---------|
| 保存 | Save |
| 削除 | Delete |
| キャンセル | Cancel |
| 編集 | Edit |
| 追加 | Add |
| 選択 | Select |
| 入力してください | Please enter |
| エラー | Error |
| 成功 | Success |
| 失敗 | Failed |
| 確認 | Confirm |
| 閉じる | Close |

### Code Comments Translation

Keep technical accuracy:

- Maintain technical terms (API, component, props, etc.)
- Use clear, professional English
- Preserve code examples and variable names
- Update TODO comments to English

## Testing Strategy

### Functional Testing

Since these are legacy components, focus on:

1. **Compilation**: Verify TypeScript compiles successfully
2. **Visual Check**: Open the application and verify no broken UI
3. **No Regressions**: Ensure existing functionality still works

### Specific Component Testing (if applicable)

#### CanvasHeader
- [ ] Verify header displays correctly
- [ ] Verify any buttons/controls have English labels

#### CanvasNode
- [ ] Verify node rendering
- [ ] Verify any tooltips in English

#### AddNodes
- [ ] Verify node addition UI
- [ ] Verify any labels/buttons in English

#### Input/Output Handlers
- [ ] Verify input/output connection handling
- [ ] Verify any error messages in English

#### Dialogs
- [ ] Open any dialogs
- [ ] Verify labels and buttons in English

## Verification Checklist

After translating all files:

- [ ] **Search for remaining Japanese** across entire webview-ui:
  ```bash
  grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' webview-ui/src/ \
    --exclude-dir=node_modules \
    --exclude="*.md" \
    --exclude="*.json" | \
    grep -v "Binary file"
  ```

- [ ] **No results** = All Japanese removed ✓

- [ ] **Compile TypeScript**: `yarn compile`

- [ ] **Build webview**: `yarn build:webview`

- [ ] **No compilation errors**

- [ ] **Test application**:
  - Open workflow editor
  - Test basic operations (open, edit, save)
  - Verify no visual regressions
  - Check console for errors

## Success Criteria

- [ ] All Japanese text in legacy components translated to English
- [ ] All code comments in English
- [ ] No Japanese characters remain in webview-ui/src/ (excluding documentation)
- [ ] TypeScript compilation succeeds
- [ ] Webview build succeeds
- [ ] No functional regressions
- [ ] Application runs without errors

## Implementation Steps

1. **Search Phase**
   ```bash
   # Find all files with Japanese text
   grep -r -l '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' webview-ui/src/ \
     --exclude-dir=node_modules \
     --exclude="*.md" \
     --exclude="*.json"
   ```

2. **Translation Phase**
   - Open each file with Japanese text
   - Translate all UI labels using consistent terminology
   - Translate all code comments
   - Save changes

3. **Verification Phase**
   ```bash
   # Verify no Japanese remains
   grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' webview-ui/src/ \
     --exclude-dir=node_modules \
     --exclude="*.md" \
     --exclude="*.json"
   ```

4. **Compilation Phase**
   ```bash
   yarn compile
   yarn build:webview
   ```

5. **Testing Phase**
   - Launch extension (F5)
   - Open workflow editor
   - Test basic functionality
   - Check console for errors

6. **Commit Phase**
   ```bash
   git add webview-ui/src/
   git commit -m "Phase 11E: Translate legacy components to English

- Translate remaining canvas components
- Translate input/output handlers
- Translate utility components
- Translate helper functions and types
- Update all code comments to English

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

## Estimated Time Breakdown

- Search for Japanese: 30 minutes
- Translation work: 1-1.5 hours
- Testing: 30-45 minutes
- Documentation: 15 minutes
- **Total**: 2-3 hours

## Notes

- These are older components, may have less Japanese
- Some components might be unused - still translate for completeness
- Focus on no regressions - these components may be critical
- If a component has no Japanese, mark it as verified

## Final Phase 11 Verification

After completing Phase 11E, perform comprehensive verification:

### 1. Search Entire Codebase

```bash
# Search all source files for Japanese
grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' \
  src/ webview-ui/src/ \
  --exclude-dir=node_modules \
  --exclude="*.md" \
  --exclude="*.json"
```

Expected result: **No matches** (all Japanese removed)

### 2. Compile Everything

```bash
yarn compile           # Extension side
yarn build:webview     # Webview side
yarn lint             # Linting
```

Expected result: **All succeed with no errors**

### 3. Full Application Test

- [ ] Launch extension (F5)
- [ ] Open workflow JSON file
- [ ] Verify all UI elements in English
- [ ] Test all major features:
  - [ ] Add/edit/delete nodes
  - [ ] Open settings panel
  - [ ] Add/edit models, MCP servers, A2A clients
  - [ ] Save workflow
  - [ ] Server controls
  - [ ] Chat panel
- [ ] Trigger validation errors → Verify English messages
- [ ] Check browser console → No errors

### 4. Update Documentation

- [ ] Update [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md):
  - Mark Phase 11 as ☑ Complete
  - Add Phase 11 entry with sub-phase links
- [ ] Create Phase 11 completion document
- [ ] Update [CLAUDE.md](../../CLAUDE.md) if needed

### 5. Create Phase 11 Summary

Create a summary document listing:
- Total files modified: 35
- Total lines translated: ~500+
- Key improvements: Full English UI, better accessibility
- No breaking changes: All functionality preserved

## Final Commit

After all sub-phases complete:

```bash
git add docs/
git commit -m "Phase 11: Complete internationalization documentation

- Add Phase 11A-E documentation files
- Update IMPLEMENTATION_PLAN.md with Phase 11
- All Japanese text converted to English across 35 files
- Complete validation testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

**Congratulations!** Phase 11 complete - the entire extension is now fully English!

## Next Steps

With Phase 11 complete, consider:

1. **Documentation Review**: Ensure all markdown docs are clear
2. **User Testing**: Get feedback from English-speaking users
3. **Future Phases**: Plan Phase 12+ if additional features needed
4. **Localization** (Optional): If multi-language support desired, implement proper i18n infrastructure
