---
name: product_knowledge
description: Product knowledge base for customer support with intelligent search and retrieval
version: 1.0.0
author: SceneGraphManager Team
tags:
  - support
  - knowledge-base
  - products
  - documentation
requires:
  - vector-db
  - embedding-model
---

# Product Knowledge Skill

## Overview

The Product Knowledge skill provides intelligent access to product information, documentation, and specifications. It enables customer support agents and automated systems to quickly retrieve accurate product information.

## Usage

This skill can be integrated into workflows that require:
- Quick product information retrieval
- Feature specification lookups
- Compatibility checks
- Product comparison
- Documentation search
- Technical specification retrieval

## Examples

### Example 1: Basic Product Search

```javascript
// Search for product information
const productInfo = await searchProductKnowledge({
  query: "wireless earbuds battery life",
  maxResults: 3,
  includeSpecs: true
});

// Returns:
// {
//   results: [
//     {
//       productId: "WE-2024",
//       name: "Premium Wireless Earbuds",
//       batteryLife: "8 hours playback, 24 hours with case",
//       relevanceScore: 0.95
//     },
//     ...
//   ]
// }
```

### Example 2: Product Comparison

```javascript
// Compare multiple products
const comparison = await compareProducts({
  productIds: ["WE-2024", "WE-2023", "WE-PRO"],
  attributes: ["battery_life", "price", "water_resistance", "bluetooth_version"]
});

// Returns comparison table
```

### Example 3: Compatibility Check

```javascript
// Check product compatibility
const compatibility = await checkCompatibility({
  primaryProduct: "WE-2024",
  accessories: ["CASE-001", "CABLE-USB-C"],
  deviceType: "iPhone 15"
});

// Returns:
// {
//   compatible: true,
//   accessories: {
//     "CASE-001": { compatible: true, notes: "" },
//     "CABLE-USB-C": { compatible: true, notes: "" }
//   },
//   device: { compatible: true, bluetoothVersion: "5.3" }
// }
```

### Example 4: Feature Documentation Retrieval

```javascript
// Get detailed feature documentation
const featureDocs = await getFeatureDocumentation({
  productId: "WE-2024",
  feature: "active_noise_cancellation",
  includeUsageInstructions: true
});
```

## Parameters

### searchProductKnowledge(options)

- `query` (string, required): Search query
- `maxResults` (number, optional): Maximum results (default: 5)
- `includeSpecs` (boolean, optional): Include technical specs (default: false)
- `category` (string, optional): Filter by product category
- `minRelevance` (number, optional): Minimum relevance score (0-1) (default: 0.7)

### compareProducts(options)

- `productIds` (array, required): Array of product IDs to compare
- `attributes` (array, required): Attributes to compare
- `format` (string, optional): "table" or "detailed" (default: "table")

### checkCompatibility(options)

- `primaryProduct` (string, required): Primary product ID
- `accessories` (array, optional): Accessory product IDs
- `deviceType` (string, optional): User's device type

### getFeatureDocumentation(options)

- `productId` (string, required): Product ID
- `feature` (string, required): Feature name
- `includeUsageInstructions` (boolean, optional): Include how-to instructions (default: false)

## Returns

All functions return structured data with:
- `success` (boolean): Operation status
- `data` (object/array): Retrieved information
- `confidence` (number): Confidence score (0-1)
- `sources` (array): Source documents referenced

## Error Handling

```javascript
try {
  const info = await searchProductKnowledge({
    query: "nonexistent product"
  });
} catch (error) {
  if (error.code === "NO_RESULTS_FOUND") {
    console.error("No matching products found");
  } else if (error.code === "INVALID_PRODUCT_ID") {
    console.error("Product ID not recognized");
  }
}
```

### Common Error Codes

- `NO_RESULTS_FOUND`: No matching products
- `INVALID_PRODUCT_ID`: Product ID not found
- `INSUFFICIENT_DATA`: Not enough data for comparison
- `DATABASE_ERROR`: Knowledge base connection error

## Best Practices

1. **Use semantic search**: Leverage natural language queries
2. **Cache frequent queries**: Store commonly accessed product info
3. **Keep knowledge base updated**: Regular synchronization with product database
4. **Verify information accuracy**: Cross-reference critical specifications
5. **Handle ambiguity**: Provide multiple results when query is unclear
6. **Include context**: Return related information alongside primary results

## Integration with Support Workflows

```javascript
// In customer support workflow
const supportWorkflow = {
  nodes: [
    {
      id: "understand_query",
      type: "model",
      modelRef: "support_agent",
      useSkills: ["product_knowledge"]
    },
    {
      id: "search_knowledge",
      type: "function",
      function: `async (state) => {
        const results = await searchProductKnowledge({
          query: state.userQuery,
          maxResults: 5
        });
        return { productInfo: results };
      }`
    }
  ]
};
```

## Version History

- **1.0.0** (2026-02-06): Initial release with core knowledge retrieval
