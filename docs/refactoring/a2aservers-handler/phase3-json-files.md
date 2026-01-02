# Phase 3: JSON Workflow File Updates

**Target Directory**: `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json`

**Prerequisites**: Phases 1 and 2 must be completed

---

## Overview

Update all 6 JSON workflow files to use the new schema.

---

## 3.1 Files to Update

1. `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/model.json`
2. `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/interrupt.json`
3. `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/a2a/client.json`
4. `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/a2a/servers/task-creation.json`
5. `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/a2a/servers/research-execution.json`
6. `/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/json/a2a/servers/quality-evaluation.json`

---

## 3.2 Transformation Rules

### Rule 1: Rename top-level a2aClients → a2aServers

In `json/a2a/client.json`:

```json
// BEFORE
{
  "config": { ... },
  "a2aClients": {
    "task_agent": { ... },
    "research_agent": { ... },
    "quality_agent": { ... }
  }
}

// AFTER
{
  "config": { ... },
  "a2aServers": {
    "task_agent": { ... },
    "research_agent": { ... },
    "quality_agent": { ... }
  }
}
```

---

### Rule 2: Rename function → handler and implementation → function in all nodes

For every node with a function object:

```json
// BEFORE
{
  "id": "orchestrator",
  "function": {
    "parameters": [ ... ],
    "implementation": "const userInput = ..."
  }
}

// AFTER
{
  "id": "orchestrator",
  "handler": {  // Changed: function → handler
    "parameters": [ ... ],
    "function": "const userInput = ..."  // Changed: implementation → function
  }
}
```

---

### Rule 3: Rename condition.function → condition.handler in conditional edges

For every conditional edge:

```json
// BEFORE
{
  "from": "orchestrator",
  "type": "conditional",
  "condition": {
    "name": "route_phase",
    "function": {
      "parameters": [ ... ],
      "implementation": "if (state.currentPhase === 1) { ..."
    }
  }
}

// AFTER
{
  "from": "orchestrator",
  "type": "conditional",
  "condition": {
    "name": "route_phase",
    "handler": {  // Changed: function → handler
      "parameters": [ ... ],
      "function": "if (state.currentPhase === 1) { ..."  // Changed: implementation → function
    }
  }
}
```

---

## 3.3 Automated Migration Script

### Node.js Script

Create `scripts/migrate-json-schema.js`:

```javascript
const fs = require('fs');
const path = require('path');

function migrateWorkflowFile(filePath) {
  console.log(`Migrating: ${filePath}`);

  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  let json = JSON.parse(content);

  // 1. Rename a2aClients → a2aServers
  if (json.a2aClients) {
    json.a2aServers = json.a2aClients;
    delete json.a2aClients;
  }

  // 2. Rename function → handler and implementation → function in nodes
  if (json.nodes) {
    json.nodes.forEach(node => {
      if (node.function) {
        // Rename parent object: function → handler
        node.handler = node.function;
        delete node.function;

        // Rename child property: implementation → function
        if (node.handler.implementation !== undefined) {
          node.handler.function = node.handler.implementation;
          delete node.handler.implementation;
        }
      }
    });
  }

  // 3. Rename function → handler and implementation → function in conditional edges
  if (json.edges) {
    json.edges.forEach(edge => {
      if (edge.condition?.function) {
        // Rename parent object: function → handler
        edge.condition.handler = edge.condition.function;
        delete edge.condition.function;

        // Rename child property: implementation → function
        if (edge.condition.handler.implementation !== undefined) {
          edge.condition.handler.function = edge.condition.handler.implementation;
          delete edge.condition.handler.implementation;
        }
      }
    });
  }

  // Write back with formatting
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log(`✅ Migrated: ${filePath}`);
}

// Migrate all JSON files
const jsonDir = path.join(__dirname, '../json');
const files = [
  'model.json',
  'interrupt.json',
  'a2a/client.json',
  'a2a/servers/task-creation.json',
  'a2a/servers/research-execution.json',
  'a2a/servers/quality-evaluation.json'
];

files.forEach(file => {
  const filePath = path.join(jsonDir, file);
  if (fs.existsSync(filePath)) {
    migrateWorkflowFile(filePath);
  } else {
    console.warn(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✅ Migration complete!');
```

### Usage

```bash
# Create scripts directory
mkdir -p scripts

# Copy the script above into scripts/migrate-json-schema.js

# Run migration
node scripts/migrate-json-schema.js
```

---

## 3.4 Manual Migration Steps

If you prefer manual editing:

1. **Create backups**:
   ```bash
   cd /Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest
   cp -r json json.backup
   ```

2. **Search and Replace in Order**:
   - Step 1: `"a2aClients":` → `"a2aServers":`
   - Step 2: In nodes array: `"function": {` → `"handler": {`
   - Step 3: In handler objects: `"implementation":` → `"function":`
   - Step 4: In edges conditions: `"function": {` → `"handler": {`
   - Step 5: In condition.handler: `"implementation":` → `"function":`

3. **Validate each file**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('json/model.json'))"
   node -e "JSON.parse(require('fs').readFileSync('json/interrupt.json'))"
   node -e "JSON.parse(require('fs').readFileSync('json/a2a/client.json'))"
   # ... etc
   ```

**IMPORTANT**: Perform replacements in order. Replace parent object (`function` → `handler`) before child property (`implementation` → `function`) to avoid confusion.

---

## 3.5 Validation

After migration, validate all files:

```bash
# Run the migration script with validation
node scripts/validate-json-schema.js
```

Create `scripts/validate-json-schema.js`:

```javascript
const fs = require('fs');
const path = require('path');

function validateWorkflowFile(filePath) {
  console.log(`Validating: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Check for old schema
    if (json.a2aClients) {
      console.error(`❌ ${filePath}: Still uses 'a2aClients' (should be 'a2aServers')`);
      return false;
    }

    // Check nodes
    if (json.nodes) {
      for (const node of json.nodes) {
        if (node.function) {
          console.error(`❌ ${filePath}: Node '${node.id}' still uses 'function' (should be 'handler')`);
          return false;
        }
        if (node.handler?.implementation) {
          console.error(`❌ ${filePath}: Node '${node.id}' still uses 'implementation' (should be 'function')`);
          return false;
        }
      }
    }

    // Check edges
    if (json.edges) {
      for (let i = 0; i < json.edges.length; i++) {
        const edge = json.edges[i];
        if (edge.condition?.function) {
          console.error(`❌ ${filePath}: Edge ${i} condition still uses 'function' (should be 'handler')`);
          return false;
        }
        if (edge.condition?.handler?.implementation) {
          console.error(`❌ ${filePath}: Edge ${i} condition still uses 'implementation' (should be 'function')`);
          return false;
        }
      }
    }

    console.log(`✅ ${filePath}: Valid`);
    return true;

  } catch (error) {
    console.error(`❌ ${filePath}: ${error.message}`);
    return false;
  }
}

// Validate all JSON files
const jsonDir = path.join(__dirname, '../json');
const files = [
  'model.json',
  'interrupt.json',
  'a2a/client.json',
  'a2a/servers/task-creation.json',
  'a2a/servers/research-execution.json',
  'a2a/servers/quality-evaluation.json'
];

let allValid = true;
files.forEach(file => {
  const filePath = path.join(jsonDir, file);
  if (fs.existsSync(filePath)) {
    if (!validateWorkflowFile(filePath)) {
      allValid = false;
    }
  } else {
    console.warn(`⚠️  File not found: ${filePath}`);
  }
});

if (allValid) {
  console.log('\n✅ All files valid!');
  process.exit(0);
} else {
  console.log('\n❌ Some files have errors');
  process.exit(1);
}
```

---

## Testing Checklist

- [ ] All 6 JSON files pass syntax validation
- [ ] All files pass schema validation (no old properties)
- [ ] Load each file in VSCode extension (verify rendering)
- [ ] Execute workflows via serverRunner
- [ ] Verify A2A client connections work (for client.json)
- [ ] Test save operations produce correct schema

---

## Rollback Plan

If issues occur:

```bash
# Restore from backup
cd /Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest
rm -rf json
cp -r json.backup json
```

---

## Notes

- Keep backups until all testing is complete
- This is a one-way migration - no backward compatibility
- Consider version tagging in Git before migration
