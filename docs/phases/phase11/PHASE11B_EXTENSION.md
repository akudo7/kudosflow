# Phase 11B: Extension Side Translation

**Status**: ⬜ Not Started
**Estimated Time**: 1-2 hours
**Complexity**: Low (Few files, critical dialogs)
**Priority**: High - User-facing notifications

## Overview

Translate all Japanese text on the extension side (Node.js context). This includes critical save/error dialogs and code comments.

## Files to Modify

### 1. `src/panels/WorkflowEditorPanel.ts`

**Lines**: 206-227
**Japanese Content**: Save confirmation dialog, success/error notifications

### 2. `src/extension.ts`

**Line**: 24
**Japanese Content**: Code comment

## Translation Mappings

### WorkflowEditorPanel.ts (Lines 206-227)

#### Save Confirmation Dialog

```typescript
// Before (Lines 207-210)
const answer = await window.showWarningMessage(
  "ワークフローを保存しますか？",
  "はい",
  "いいえ"
);

// After
const answer = await window.showWarningMessage(
  "Save workflow?",
  "Yes",
  "No"
);
```

#### Button Check

```typescript
// Before (Line 212)
if (answer === "はい") {

// After
if (answer === "Yes") {
```

#### Success Notification

```typescript
// Before (Line 221)
window.showInformationMessage("ワークフローを保存しました");

// After
window.showInformationMessage("Workflow saved successfully");
```

#### Error Notification

```typescript
// Before (Line 227)
window.showErrorMessage(`保存に失敗しました: ${error}`);

// After
window.showErrorMessage(`Failed to save: ${error}`);
```

### extension.ts (Line 24)

#### Code Comment

```typescript
// Before
// ComponentGalleryPanelのrenderメソッドを呼び出し

// After
// Call the render method of ComponentGalleryPanel
```

## Testing Checklist

### Save Workflow Dialog
- [ ] Open workflow editor
- [ ] Make changes to workflow
- [ ] Close the editor → Dialog appears with "Save workflow?" message
- [ ] Click "Yes" → Success notification appears: "Workflow saved successfully"
- [ ] Verify workflow is saved

### Save Workflow Error Handling
- [ ] Create a scenario that causes save error (e.g., invalid file path)
- [ ] Try to save → Error notification appears: "Failed to save: [error message]"
- [ ] Verify error message is clear and in English

### Save Workflow - No Changes
- [ ] Open workflow editor
- [ ] Make no changes
- [ ] Close the editor → No dialog appears (no changes to save)

### Save Workflow - Cancel
- [ ] Open workflow editor
- [ ] Make changes
- [ ] Close the editor → Dialog appears
- [ ] Click "No" → Editor closes without saving

## Success Criteria

- [ ] All Japanese text in extension side translated to English
- [ ] Save confirmation dialog displays English text
- [ ] Success notification displays "Workflow saved successfully"
- [ ] Error notification displays "Failed to save: [error]"
- [ ] Code comments are in English
- [ ] No Japanese characters remain in src/ directory
- [ ] TypeScript compilation succeeds
- [ ] All dialog interactions work correctly

## Implementation Steps

1. **Open WorkflowEditorPanel.ts**
   ```bash
   code src/panels/WorkflowEditorPanel.ts
   ```

2. **Translate dialog messages** (lines 207-210, 212, 221, 227)
   - Use exact English translations provided above
   - Maintain string formatting and variables

3. **Open extension.ts**
   ```bash
   code src/extension.ts
   ```

4. **Translate comment** (line 24)
   - Update to English comment

5. **Verify no Japanese remains**
   ```bash
   grep -r '[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]' src/ \
     --exclude-dir=node_modules
   ```

6. **Compile TypeScript**
   ```bash
   yarn compile
   ```

7. **Test save workflow functionality**
   - Follow testing checklist above

8. **Commit changes**
   ```bash
   git add src/
   git commit -m "Phase 11B: Translate extension-side dialogs to English

- Update save workflow confirmation dialog
- Update success/error notifications
- Translate code comments

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

## Common Issues

### Issue 1: Button text doesn't match condition

**Problem**: If you change "はい" to "Yes" in the dialog but forget to update the condition check

```typescript
// Wrong
const answer = await window.showWarningMessage("Save workflow?", "Yes", "No");
if (answer === "はい") {  // This will never be true!
```

**Solution**: Update both the button text AND the condition check
```typescript
const answer = await window.showWarningMessage("Save workflow?", "Yes", "No");
if (answer === "Yes") {  // Correct!
```

### Issue 2: String formatting

**Problem**: Error message loses variable interpolation

```typescript
// Wrong
window.showErrorMessage("Failed to save: error");

// Correct
window.showErrorMessage(`Failed to save: ${error}`);
```

## Estimated Time Breakdown

- Translation work: 30 minutes
- Testing: 30-45 minutes
- Compilation & verification: 15 minutes
- **Total**: 1-2 hours

## Notes

- These are critical user-facing dialogs - accuracy is essential
- Test thoroughly to ensure save functionality works correctly
- The extension side has minimal Japanese, making this phase quick
- These dialogs are shown to users frequently during normal workflow

## Next Phase

After completing Phase 11B, proceed to [Phase 11C: Core Workflow UI](PHASE11C_CORE_UI.md).
