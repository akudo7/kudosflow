# Phase 4: Update SceneGraphManager Documentation

## Overview

Update all documentation files to reflect the new parameter format with examples and type definitions.

## Files to Update

Location: `/Users/akirakudo/Desktop/MyWork/TypeScript/SceneGraphManager`

---

## File 1: CLAUDE.md

### Sections to Update

#### Configuration Reference (Line 100+)
Update any parameter examples showing the old `type` field.

#### Complete Configuration Schema (Lines 246-298)
Update the JSON schema documentation:

**Old:**
```json
"parameters": [
  { "name": "state", "type": "typeof AgentState.State" }
]
```

**New:**
```json
"parameters": [
  {
    "name": "state",
    "parameterType": "state",
    "stateType": "typeof AgentState.State"
  }
]
```

#### Node Configuration Examples (Lines 443-489)
Update function node examples:

**Old:**
```json
{
  "id": "process",
  "handler": {
    "parameters": [
      { "name": "state", "type": "typeof AgentState.State" },
      { "name": "model", "type": "string", "modelRef": "gpt4" }
    ],
    "function": "..."
  }
}
```

**New:**
```json
{
  "id": "process",
  "handler": {
    "parameters": [
      { "name": "state", "parameterType": "state", "stateType": "typeof AgentState.State" },
      { "name": "model", "parameterType": "model", "modelRef": "gpt4" }
    ],
    "function": "..."
  }
}
```

#### API Type Definitions (Line 1064+)
Update the type definition documentation:

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

---

## File 2: README.md

### Basic Workflow Example (Lines 120-150)

Update quick start examples to show new parameter format.

**Example:**

```json
{
  "nodes": [
    {
      "id": "agent",
      "handler": {
        "parameters": [
          {
            "name": "state",
            "parameterType": "state",
            "stateType": "typeof AgentState.State"
          }
        ],
        "function": "return state;"
      }
    }
  ]
}
```

---

## Add Migration Guide Section

Add a new section to CLAUDE.md or README.md:

### Migration from Legacy Format

If you have existing workflow JSON files using the old parameter format, update them as follows:

**State Parameters:**
```json
// Old
{ "name": "state", "type": "typeof AgentState.State" }

// New
{ "name": "state", "parameterType": "state", "stateType": "typeof AgentState.State" }
```

**Model Parameters:**
```json
// Old
{ "name": "model", "type": "string", "modelRef": "gpt4" }

// New
{ "name": "model", "parameterType": "model", "modelRef": "gpt4" }
```

---

## Update Code Comments

### In src/types/index.ts

Add JSDoc comments explaining the new structure:

```typescript
/**
 * Parameter for node functions and conditional edges.
 * Uses discriminated union for type safety.
 *
 * @example State parameter
 * { name: "state", parameterType: "state", stateType: "typeof AgentState.State" }
 *
 * @example Model parameter
 * { name: "model", parameterType: "model", modelRef: "gpt4" }
 */
export type NodeFunctionParameter = ...
```

---

## Checklist

- [ ] Update `CLAUDE.md` - Configuration Reference section
- [ ] Update `CLAUDE.md` - Complete Configuration Schema section
- [ ] Update `CLAUDE.md` - Node Configuration Examples section
- [ ] Update `CLAUDE.md` - API Type Definitions section
- [ ] Update `README.md` - Basic Workflow Example section
- [ ] Add migration guide section to appropriate doc file
- [ ] Update inline code comments in `src/types/index.ts`
- [ ] Update any other example files or documentation
- [ ] Review all documentation for consistency
- [ ] Commit changes

---

**Previous Phase**: [phase3-scenegraphmanager-tests.md](./phase3-scenegraphmanager-tests.md)
**Next Phase**: [phase5-json-migration.md](./phase5-json-migration.md)
**Related Main Plan**: [parameter-format-migration.md](../parameter-format-migration.md)
