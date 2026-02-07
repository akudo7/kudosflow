---
name: troubleshooting
description: Systematic troubleshooting and problem resolution for customer support
version: 1.0.0
author: SceneGraphManager Team
tags:
  - support
  - troubleshooting
  - diagnostics
  - problem-solving
requires:
  - decision-tree-engine
---

# Troubleshooting Skill

## Overview

The Troubleshooting skill provides systematic problem diagnosis and resolution guidance. It uses decision trees and diagnostic workflows to identify issues and suggest solutions.

## Usage

- Diagnose technical problems
- Guide users through resolution steps
- Escalate complex issues
- Track problem patterns
- Suggest preventive measures

## Examples

### Example 1: Basic Troubleshooting

```javascript
const diagnosis = await diagnoseProblem({
  productId: "WE-2024",
  issue: "Earbuds won't connect to phone",
  symptoms: ["no bluetooth connection", "not appearing in device list"]
});

// Returns step-by-step resolution
```

### Example 2: Interactive Diagnostic

```javascript
const session = await startTroubleshootingSession({
  productId: "WE-2024",
  issueCategory: "connectivity"
});

// Ask diagnostic questions
const question = await session.nextQuestion();
// User provides answer
await session.provideAnswer("yes");
// Get resolution or next question
const result = await session.getStatus();
```

## Parameters

### diagnoseProblem(options)
- `productId` (string, required): Product identifier
- `issue` (string, required): Problem description
- `symptoms` (array, optional): List of symptoms
- `previousAttempts` (array, optional): Previous resolution attempts

### startTroubleshootingSession(options)
- `productId` (string, required): Product identifier
- `issueCategory` (string, required): Issue category
- `interactive` (boolean, optional): Enable interactive mode (default: true)

## Returns

Returns diagnostic results with:
- `diagnosis` (string): Identified problem
- `solutions` (array): Ordered resolution steps
- `confidence` (number): Confidence level (0-1)
- `escalate` (boolean): Whether to escalate to human

## Best Practices

1. **Start with simple solutions**: Try basic fixes first
2. **Gather sufficient information**: Ask clarifying questions
3. **Document attempts**: Track what has been tried
4. **Know when to escalate**: Recognize complex issues
5. **Learn from patterns**: Update decision trees based on outcomes

## Version History

- **1.0.0** (2026-02-06): Initial release
