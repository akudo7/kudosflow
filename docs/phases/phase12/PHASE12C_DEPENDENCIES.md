# Phase 12C: Unused Dependencies Cleanup

**Status**: ⬜ Not Started
**Estimated Time**: 2-3 hours
**Complexity**: Low (Systematic removal)
**Priority**: Medium

## Overview

Remove unused npm dependencies from both the extension and webview package.json files. This reduces node_modules size (~200-300MB), speeds up `yarn install`, and simplifies dependency management.

## Goal

Clean up package dependencies by:
- Removing unused packages from extension side (package.json)
- Removing unused packages from webview side (webview-ui/package.json)
- Verifying with depcheck tool
- Updating yarn.lock files
- Testing that all features still work

## Dependencies to Remove

### Extension Side (package.json)

1. **webpack** + **webpack-cli** - Build system not used (project uses `tsc` directly)
2. **dotenv** - Not imported or used anywhere
3. **@a2a-js/sdk** - Not imported anywhere
4. **moment** - Only used in one place for date formatting (can use native Date)
5. **lodash** - Duplicate (also in webview), minimal usage

### Webview Side (webview-ui/package.json)

1. **reactflow@^11.11.4** - Legacy package (removed in Phase 12B), replaced by @xyflow/react
2. **@mui/lab** - Not used in any components
3. **react-redux** - Commented out import found, not actually used
4. **react-perfect-scrollbar** - Referenced in SCSS but not in React components

## Implementation Tasks

### Task 1: Analyze Dependencies with depcheck

Run depcheck to identify unused dependencies:

```bash
# Extension side
npx depcheck

# Webview side
cd webview-ui
npx depcheck
cd ..
```

**Expected Output**: List of unused dependencies matching those above

### Task 2: Remove Extension Dependencies

```bash
# Remove unused packages
yarn remove webpack webpack-cli dotenv @a2a-js/sdk moment lodash

# Verify package.json no longer lists them
cat package.json | grep -E "webpack|dotenv|@a2a-js/sdk|moment|lodash"
```

### Task 3: Replace moment with Native Date (if needed)

If `moment` is used in `serverRunner.ts`:

**Before**:
```typescript
import moment from 'moment';

const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
```

**After**:
```typescript
const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
// Or
const timestamp = new Date().toLocaleString('ja-JP', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false
});
```

### Task 4: Remove Webview Dependencies

```bash
cd webview-ui

# Remove unused packages (reactflow was removed in Phase 12B)
yarn remove @mui/lab react-redux react-perfect-scrollbar

cd ..
```

### Task 5: Clean and Reinstall

```bash
# Remove lock files
rm yarn.lock
rm webview-ui/yarn.lock

# Remove node_modules
rm -rf node_modules
rm -rf webview-ui/node_modules

# Fresh install
yarn install:all
```

### Task 6: Verify No Missing Dependencies

```bash
# Compile extension
yarn compile

# Build webview
yarn build:webview

# If successful, all required dependencies are present
```

## Testing Checklist

### Build Tests
- [ ] Run `yarn install:all` - Completes successfully
- [ ] Run `yarn compile` - Extension compiles without errors
- [ ] Run `yarn build:webview` - Webview builds without errors
- [ ] Check for missing dependency errors in output

### Extension Tests
- [ ] Press F5 to launch Extension Development Host
- [ ] Extension activates without errors
- [ ] No runtime errors in Debug Console about missing modules
- [ ] Workflow editor command works

### Webview Tests
- [ ] Workflow editor opens correctly
- [ ] Canvas renders properly
- [ ] All UI components display correctly
- [ ] No console errors about missing modules
- [ ] MUI components still work (Button, TextField, etc.)
- [ ] React Flow still functions (@xyflow/react)

### Size Verification Tests
- [ ] Check node_modules size: `du -sh node_modules`
- [ ] Check webview node_modules size: `du -sh webview-ui/node_modules`
- [ ] Compare with pre-Phase 12C sizes
- [ ] Expected: ~200-300MB total reduction

## Success Criteria

- ✅ All unused dependencies removed from package.json files
- ✅ Extension compiles without errors
- ✅ Webview builds without errors
- ✅ All features function correctly
- ✅ No missing dependency errors
- ✅ node_modules size reduced by ~200-300MB
- ✅ `yarn install` is faster
- ✅ depcheck shows no critical missing dependencies

## Git Commit Message

```bash
git add package.json webview-ui/package.json yarn.lock webview-ui/yarn.lock
git commit -m "$(cat <<'EOF'
Phase 12C: Remove unused dependencies

Extension side removals:
- webpack, webpack-cli (build system not used)
- dotenv (not imported)
- @a2a-js/sdk (not imported)
- moment (replaced with native Date)
- lodash (duplicate, minimal usage)

Webview side removals:
- @mui/lab (not used in components)
- react-redux (not actually used)
- react-perfect-scrollbar (not used in React)

Impact:
- ~200-300MB node_modules reduction
- Faster yarn install
- Simpler dependency management
- All features still functional

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

## Common Issues & Solutions

### Issue 1: Extension won't compile after removing dependencies

**Cause**: Removed a package that was actually used
**Solution**:
```bash
# Check the error message for the missing package
yarn add <package-name>
```

### Issue 2: Webview shows errors about missing modules

**Cause**: Removed a package that a component depends on
**Solution**:
```bash
cd webview-ui
yarn add <package-name>
cd ..
```

### Issue 3: yarn.lock conflicts

**Cause**: Lock file references removed packages
**Solution**: Already handled in Task 5 (remove and regenerate)

### Issue 4: depcheck shows false positives

**Cause**: Some dependencies are used but not detected
**Solution**: Manually verify before removing:
```bash
# Search for imports
grep -r "from '@mui/lab'" webview-ui/src/
grep -r "import.*react-redux" webview-ui/src/
```

### Issue 5: Build size didn't decrease as expected

**Cause**: Caching or other dependencies pulled in removed packages transitively
**Solution**:
```bash
# Clean everything
rm -rf node_modules webview-ui/node_modules
rm yarn.lock webview-ui/yarn.lock
yarn install:all
```

## Development Commands

```bash
# Analyze dependencies
npx depcheck
cd webview-ui && npx depcheck && cd ..

# Remove extension dependencies
yarn remove webpack webpack-cli dotenv @a2a-js/sdk moment lodash

# Remove webview dependencies
cd webview-ui
yarn remove @mui/lab react-redux react-perfect-scrollbar
cd ..

# Clean install
rm -rf node_modules webview-ui/node_modules yarn.lock webview-ui/yarn.lock
yarn install:all

# Test build
yarn compile && yarn build:webview

# Check sizes
du -sh node_modules
du -sh webview-ui/node_modules
```

## Size Comparison

### Before Phase 12C:
- Extension node_modules: ~450MB
- Webview node_modules: ~611MB
- **Total**: ~1,061MB (1.06GB)

### After Phase 12C (Expected):
- Extension node_modules: ~300-350MB (~100-150MB reduction)
- Webview node_modules: ~450-500MB (~111-161MB reduction)
- **Total**: ~750-850MB (~211-311MB reduction)

### yarn install Time:
- **Before**: ~2-3 minutes
- **After**: ~1.5-2 minutes (~25-33% faster)

## Dependencies Analysis

### Why Each Package is Safe to Remove:

**webpack/webpack-cli**:
- Project uses `tsc` for extension compilation
- Vite for webview bundling
- webpack.config.js exists but is not used

**dotenv**:
- No `.env` file in project
- No `require('dotenv')` or `import 'dotenv'` found

**@a2a-js/sdk**:
- Listed in package.json but never imported
- A2A functionality uses custom implementation

**moment**:
- Only used for simple date formatting
- Can be replaced with native Date methods
- Modern browsers support Intl.DateTimeFormat

**lodash**:
- Listed in both package.json files
- Minimal usage, can be replaced with native methods
- Modern JavaScript has most lodash functionality built-in

**@mui/lab**:
- Material-UI lab components not used
- All MUI components come from @mui/material

**react-redux**:
- Found commented out in ReactFlowContext.tsx (to be deleted in Phase 12B)
- No Redux store setup anywhere

**react-perfect-scrollbar**:
- CSS reference found but component not used
- Native scrolling works fine

## Next Steps

After completing Phase 12C:

1. ✅ Mark Phase 12C as completed (☑)
2. → Proceed to [Phase 12D: Build System Optimization](PHASE12D_BUILD_OPTIMIZATION.md)
3. Update CHANGELOG.md with dependency removals
4. Document size savings in SIZE_COMPARISON.md

## File Reference

**Files Modified**:
- `package.json` (remove 5-6 dependencies)
- `webview-ui/package.json` (remove 3-4 dependencies)
- `yarn.lock` (regenerated)
- `webview-ui/yarn.lock` (regenerated)
- `src/serverRunner.ts` (if moment is replaced)

**Estimated Impact**:
- **node_modules size**: ~200-300MB reduction
- **Install time**: ~25-33% faster
- **Package count**: ~8-10 fewer dependencies
- **Maintenance**: Simpler dependency tree
