# Phase 5: Migrate Existing JSON Workflow Files

## Overview

Manually update all existing workflow JSON files to use the new parameter format.

**Important**: KudosFlow can no longer auto-convert legacy files after Phase 0, so manual migration is required.

---

## Migration Steps

### Step 1: Identify All Workflow Files

```bash
# Find all JSON workflow files
find /path/to/workflows -name "*.json" -type f
```

Common locations:
- Project workflow directories
- Sample/example workflows
- Test fixtures
- User workspace folders

---

## Step 2: Conversion Patterns

### Pattern 1: State Parameter

**Find:**
```json
{
  "name": "state",
  "type": "typeof AgentState.State"
}
```

**Replace with:**
```json
{
  "name": "state",
  "parameterType": "state",
  "stateType": "typeof AgentState.State"
}
```

### Pattern 2: Model Parameter (with modelRef)

**Find:**
```json
{
  "name": "model",
  "type": "string",
  "modelRef": "gpt4"
}
```

**Replace with:**
```json
{
  "name": "model",
  "parameterType": "model",
  "modelRef": "gpt4"
}
```

### Pattern 3: Model Parameter (without explicit type)

**Find:**
```json
{
  "name": "llm",
  "modelRef": "claude"
}
```

**Replace with:**
```json
{
  "name": "llm",
  "parameterType": "model",
  "modelRef": "claude"
}
```

---

## Step 3: Locations to Update

### Node Handler Parameters

```json
{
  "nodes": [
    {
      "id": "agent",
      "handler": {
        "parameters": [
          // UPDATE PARAMETERS HERE
        ],
        "function": "..."
      }
    }
  ]
}
```

### Conditional Edge Parameters

```json
{
  "edges": [
    {
      "from": "router",
      "type": "conditional",
      "condition": {
        "name": "route",
        "handler": {
          "parameters": [
            // UPDATE PARAMETERS HERE
          ],
          "function": "..."
        }
      }
    }
  ]
}
```

---

## Verification Script (Optional)

Create a script to validate conversion:

```typescript
// validate-parameters.ts
import * as fs from 'fs';

interface Param {
  name: string;
  parameterType?: "state" | "model";
  stateType?: string;
  type?: string;
  modelRef?: string;
}

function validateParameter(param: Param, location: string): boolean {
  // Check for legacy format
  if (param.type !== undefined && param.parameterType === undefined) {
    console.error(`❌ Legacy format found at ${location}:`, param);
    return false;
  }

  // Check for new format
  if (param.parameterType === "state" && !param.stateType) {
    console.error(`❌ Missing stateType at ${location}:`, param);
    return false;
  }

  if (param.parameterType === "model" && !param.modelRef) {
    console.error(`❌ Missing modelRef at ${location}:`, param);
    return false;
  }

  return true;
}

function validateWorkflow(filePath: string): boolean {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let isValid = true;

  // Check node parameters
  content.nodes?.forEach((node: any, idx: number) => {
    node.handler?.parameters?.forEach((param: Param, pidx: number) => {
      if (!validateParameter(param, `${filePath} node[${idx}].handler.parameters[${pidx}]`)) {
        isValid = false;
      }
    });
  });

  // Check conditional edge parameters
  content.edges?.forEach((edge: any, idx: number) => {
    edge.condition?.handler?.parameters?.forEach((param: Param, pidx: number) => {
      if (!validateParameter(param, `${filePath} edge[${idx}].condition.handler.parameters[${pidx}]`)) {
        isValid = false;
      }
    });
  });

  return isValid;
}

// Usage: ts-node validate-parameters.ts workflow.json
const filePath = process.argv[2];
if (validateWorkflow(filePath)) {
  console.log(`✅ ${filePath} is valid`);
} else {
  console.error(`❌ ${filePath} has legacy parameters`);
  process.exit(1);
}
```

---

## Testing After Migration

### For Each Migrated File

1. **Load in KudosFlow**
   - Open the workflow JSON file in KudosFlow extension
   - Verify it loads without errors
   - Check that parameters display correctly in node editor

2. **Execute in SceneGraphManager**
   ```bash
   cd /Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager
   yarn build
   # Run workflow with migrated JSON
   ```

3. **Verify Functionality**
   - State parameters are passed correctly
   - Model parameters inject models correctly
   - Conditional edges evaluate properly

---

## Checklist

- [ ] Identify all workflow JSON files requiring migration
- [ ] Create backup copies of original files
- [ ] Convert state parameters (remove `type`, add `parameterType` and `stateType`)
- [ ] Convert model parameters (remove `type`, add `parameterType`, keep `modelRef`)
- [ ] Run validation script (if created) on all files
- [ ] Test each migrated file in KudosFlow
- [ ] Test each migrated file in SceneGraphManager
- [ ] Document any issues encountered
- [ ] Commit migrated JSON files
- [ ] Delete backup copies after verification

---

## Common Issues

### Issue 1: Missing parameterType
**Symptom**: File loads but parameters don't work
**Fix**: Ensure every parameter has `parameterType: "state"` or `"model"`

### Issue 2: Both type and stateType present
**Symptom**: Confusion about which to use
**Fix**: Remove `type` field, keep only `stateType`

### Issue 3: Model parameter missing modelRef
**Symptom**: Model injection fails
**Fix**: Ensure `parameterType: "model"` has corresponding `modelRef`

---

**Previous Phase**: [phase4-scenegraphmanager-docs.md](./phase4-scenegraphmanager-docs.md)
**Next Phase**: [phase6-release.md](./phase6-release.md)
**Related Main Plan**: [parameter-format-migration.md](./parameter-format-migration.md)
