---
name: faq_handling
description: Frequently Asked Questions handling with intelligent matching and responses
version: 1.0.0
author: SceneGraphManager Team
tags:
  - support
  - faq
  - questions
  - answers
requires:
  - semantic-search
  - nlp
---

# FAQ Handling Skill

## Overview

The FAQ Handling skill provides intelligent FAQ matching and response generation. It uses semantic search to find relevant FAQ entries even when questions are phrased differently.

## Usage

- Match user questions to FAQ entries
- Provide accurate answers from FAQ database
- Handle variations in question phrasing
- Track frequently asked questions
- Update FAQ based on usage patterns

## Examples

### Example 1: Simple FAQ Match

```javascript
const answer = await findFaqAnswer({
  question: "How long does shipping take?",
  category: "shipping"
});

// Returns best matching FAQ answer
```

### Example 2: Multi-FAQ Search

```javascript
const results = await searchFaqs({
  query: "return policy",
  maxResults: 5,
  minConfidence: 0.75
});

// Returns multiple related FAQs
```

## Parameters

### findFaqAnswer(options)
- `question` (string, required): User's question
- `category` (string, optional): FAQ category filter
- `minConfidence` (number, optional): Minimum match confidence (default: 0.8)

### searchFaqs(options)
- `query` (string, required): Search query
- `maxResults` (number, optional): Maximum results (default: 5)
- `minConfidence` (number, optional): Minimum confidence (default: 0.7)

## Returns

Returns FAQ results with:
- `question` (string): Matched FAQ question
- `answer` (string): FAQ answer
- `confidence` (number): Match confidence (0-1)
- `category` (string): FAQ category
- `relatedFaqs` (array): Related FAQ entries

## Best Practices

1. **Use semantic matching**: Don't rely on exact keyword matches
2. **Provide related FAQs**: Show similar questions for context
3. **Track confidence scores**: Flag low-confidence matches for review
4. **Update regularly**: Keep FAQ database current
5. **Handle no-matches gracefully**: Offer alternative search or escalation

## Version History

- **1.0.0** (2026-02-06): Initial release
