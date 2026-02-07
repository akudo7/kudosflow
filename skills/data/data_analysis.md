---
skill_id: data_analysis
name: Data Analysis
category: data
version: 1.0.0
description: Comprehensive data analysis capabilities including statistical analysis, data cleaning, and transformation
author: SceneGraphManager Team
created: 2026-02-06
updated: 2026-02-06
tags:
  - data
  - analysis
  - statistics
  - insights
  - cleaning
  - transformation
requires:
  - papaparse
  - lodash
  - mathjs
dependencies: []
complexity: medium
estimated_tokens: 500-2000
---

# Data Analysis Skill

## Overview

The Data Analysis skill provides comprehensive capabilities for loading, cleaning, analyzing, and transforming data. It supports multiple data formats (CSV, JSON, TSV) and offers a wide range of analysis operations including descriptive statistics, data cleaning, filtering, grouping, and transformation.

This skill is designed to work with tabular data and provides the foundation for data-driven decision making and insights generation.

## Usage

### Basic Syntax

```typescript
{
  id: "analyze_data",
  type: "model",
  modelRef: "claude",
  handler: {
    parameters: [
      {
        name: "state",
        parameterType: "state",
        stateType: "typeof AnalysisState.State"
      }
    ],
    function: `
      async (state) => {
        // Data analysis logic
        const data = loadCSV(state.filePath);
        const cleaned = cleanData(data);
        const insights = analyzeData(cleaned, state.analysisType);
        return { analysis: insights };
      }
    `
  }
}
```

## Examples

### Example 1: Load and Analyze CSV Data

```typescript
{
  nodes: [
    {
      id: "load_csv",
      type: "function",
      function: `
        async (state) => {
          const Papa = require('papaparse');
          const fs = require('fs');

          const csvContent = fs.readFileSync(state.filePath, 'utf8');
          const parsed = Papa.parse(csvContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
          });

          return {
            data: parsed.data,
            columns: parsed.meta.fields,
            rowCount: parsed.data.length
          };
        }
      `
    },
    {
      id: "analyze_trends",
      type: "function",
      function: `
        async (state) => {
          const _ = require('lodash');

          // Calculate summary statistics
          const numericColumns = state.columns.filter(col =>
            typeof state.data[0][col] === 'number'
          );

          const statistics = {};
          numericColumns.forEach(col => {
            const values = state.data.map(row => row[col]).filter(v => v != null);
            statistics[col] = {
              mean: _.mean(values),
              median: _.sortBy(values)[Math.floor(values.length / 2)],
              min: _.min(values),
              max: _.max(values),
              stdDev: Math.sqrt(_.mean(values.map(v => Math.pow(v - _.mean(values), 2))))
            };
          });

          return {
            statistics,
            insights: generateInsights(statistics)
          };
        }
      `
    }
  ],
  edges: [
    { from: "__start__", to: "load_csv" },
    { from: "load_csv", to: "analyze_trends" },
    { from: "analyze_trends", to: "__end__" }
  ]
}
```

### Example 2: Clean and Transform Data

```typescript
{
  nodes: [
    {
      id: "clean_data",
      type: "function",
      function: `
        async (state) => {
          const _ = require('lodash');

          // Remove duplicates
          const uniqueData = _.uniqBy(state.data, row =>
            JSON.stringify(_.pick(row, state.uniqueKeys))
          );

          // Handle missing values
          const cleaned = uniqueData.map(row => {
            const newRow = { ...row };
            Object.keys(newRow).forEach(key => {
              if (newRow[key] == null || newRow[key] === '') {
                if (state.fillStrategy === 'mean' && typeof newRow[key] === 'number') {
                  const values = state.data.map(r => r[key]).filter(v => v != null);
                  newRow[key] = _.mean(values);
                } else if (state.fillStrategy === 'mode') {
                  const values = state.data.map(r => r[key]).filter(v => v != null);
                  newRow[key] = _.head(_(values).countBy().entries().maxBy(1));
                } else if (state.fillStrategy === 'zero') {
                  newRow[key] = 0;
                } else if (state.fillStrategy === 'drop') {
                  return null;
                }
              }
            });
            return newRow;
          }).filter(row => row != null);

          return {
            cleanedData: cleaned,
            removedRows: state.data.length - cleaned.length,
            cleaningSummary: {
              originalRows: state.data.length,
              finalRows: cleaned.length,
              duplicatesRemoved: state.data.length - uniqueData.length
            }
          };
        }
      `
    }
  ]
}
```

### Example 3: Group and Aggregate Data

```typescript
{
  nodes: [
    {
      id: "group_aggregate",
      type: "function",
      function: `
        async (state) => {
          const _ = require('lodash');

          // Group by specified columns
          const grouped = _.groupBy(state.data, row => {
            return state.groupBy.map(col => row[col]).join('|');
          });

          // Aggregate each group
          const aggregated = Object.entries(grouped).map(([key, rows]) => {
            const groupKeys = key.split('|');
            const result = {};

            // Add group keys
            state.groupBy.forEach((col, i) => {
              result[col] = groupKeys[i];
            });

            // Apply aggregation functions
            state.aggregations.forEach(agg => {
              const values = rows.map(row => row[agg.column]).filter(v => v != null);

              switch (agg.function) {
                case 'sum':
                  result[\`\${agg.column}_sum\`] = _.sum(values);
                  break;
                case 'mean':
                  result[\`\${agg.column}_mean\`] = _.mean(values);
                  break;
                case 'count':
                  result[\`\${agg.column}_count\`] = values.length;
                  break;
                case 'min':
                  result[\`\${agg.column}_min\`] = _.min(values);
                  break;
                case 'max':
                  result[\`\${agg.column}_max\`] = _.max(values);
                  break;
              }
            });

            return result;
          });

          return {
            aggregatedData: aggregated,
            groupCount: aggregated.length
          };
        }
      `
    }
  ]
}
```

### Example 4: Filter and Sort Data

```typescript
{
  nodes: [
    {
      id: "filter_sort",
      type: "function",
      function: `
        async (state) => {
          const _ = require('lodash');

          // Apply filters
          let filtered = state.data;
          state.filters.forEach(filter => {
            filtered = filtered.filter(row => {
              const value = row[filter.column];
              switch (filter.operator) {
                case 'equals':
                  return value === filter.value;
                case 'notEquals':
                  return value !== filter.value;
                case 'greaterThan':
                  return value > filter.value;
                case 'lessThan':
                  return value < filter.value;
                case 'contains':
                  return String(value).includes(filter.value);
                case 'startsWith':
                  return String(value).startsWith(filter.value);
                case 'endsWith':
                  return String(value).endsWith(filter.value);
                default:
                  return true;
              }
            });
          });

          // Sort data
          const sorted = _.orderBy(
            filtered,
            state.sortBy.map(s => s.column),
            state.sortBy.map(s => s.direction)
          );

          return {
            filteredData: sorted,
            matchedRows: sorted.length,
            filteredOut: state.data.length - sorted.length
          };
        }
      `
    }
  ]
}
```

## Parameters

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | Yes (for loading) | Path to the data file to analyze |
| `data` | array | Yes (if no file) | Array of data objects to analyze |
| `analysisType` | string | No | Type of analysis: 'descriptive', 'trend', 'correlation', 'outlier' |
| `columns` | string[] | No | Specific columns to analyze (default: all) |
| `groupBy` | string[] | No | Columns to group by for aggregation |
| `aggregations` | object[] | No | Aggregation functions to apply |
| `filters` | object[] | No | Filter conditions to apply |
| `sortBy` | object[] | No | Sort specifications |
| `fillStrategy` | string | No | Strategy for missing values: 'mean', 'mode', 'zero', 'drop' |
| `uniqueKeys` | string[] | No | Columns to use for duplicate detection |
| `outputFormat` | string | No | Output format: 'json', 'csv', 'summary' |

### Aggregation Object

```typescript
{
  column: string,      // Column to aggregate
  function: string     // 'sum', 'mean', 'count', 'min', 'max'
}
```

### Filter Object

```typescript
{
  column: string,      // Column to filter
  operator: string,    // 'equals', 'notEquals', 'greaterThan', 'lessThan', 'contains', etc.
  value: any          // Value to compare against
}
```

### Sort Object

```typescript
{
  column: string,      // Column to sort by
  direction: string    // 'asc' or 'desc'
}
```

## Returns

### Success Response

```typescript
{
  data?: array,              // Processed data array
  statistics?: object,       // Statistical summary
  insights?: array,          // Generated insights
  cleaningSummary?: object,  // Data cleaning summary
  aggregatedData?: array,    // Aggregated results
  filteredData?: array,      // Filtered results
  columns?: string[],        // Column names
  rowCount?: number,         // Number of rows
  groupCount?: number,       // Number of groups
  removedRows?: number,      // Rows removed during cleaning
  matchedRows?: number,      // Rows matching filters
  filteredOut?: number       // Rows filtered out
}
```

### Error Response

```typescript
{
  error: string,        // Error message
  errorType: string,    // 'FILE_ERROR', 'PARSE_ERROR', 'ANALYSIS_ERROR'
  details?: any        // Additional error details
}
```

## Error Handling

### Common Errors

1. **File Not Found**
   - Error: File path does not exist
   - Solution: Verify file path is correct and accessible

2. **Parse Error**
   - Error: Unable to parse data format
   - Solution: Check file format matches expected structure (CSV, JSON, TSV)

3. **Invalid Column**
   - Error: Specified column does not exist
   - Solution: Verify column names match data structure

4. **Type Mismatch**
   - Error: Operation requires numeric data but found string
   - Solution: Ensure data types match analysis requirements

5. **Empty Dataset**
   - Error: No data available for analysis
   - Solution: Check filters and data source

### Error Handling Example

```typescript
{
  id: "safe_analysis",
  type: "function",
  function: `
    async (state) => {
      try {
        // Validate input
        if (!state.data || state.data.length === 0) {
          throw new Error('No data available for analysis');
        }

        // Validate columns exist
        const columns = Object.keys(state.data[0]);
        state.groupBy?.forEach(col => {
          if (!columns.includes(col)) {
            throw new Error(\`Column '\${col}' not found in data\`);
          }
        });

        // Perform analysis
        const result = analyzeData(state.data, state.analysisType);

        return {
          success: true,
          ...result
        };
      } catch (error) {
        return {
          error: error.message,
          errorType: 'ANALYSIS_ERROR',
          details: error.stack
        };
      }
    }
  `
}
```

## Best Practices

### 1. Data Validation

Always validate data structure and types before analysis:

```typescript
const validateData = (data) => {
  if (!Array.isArray(data)) throw new Error('Data must be an array');
  if (data.length === 0) throw new Error('Data cannot be empty');

  const columns = Object.keys(data[0]);
  data.forEach((row, i) => {
    const rowColumns = Object.keys(row);
    if (!_.isEqual(columns.sort(), rowColumns.sort())) {
      throw new Error(`Row ${i} has inconsistent columns`);
    }
  });
};
```

### 2. Memory Management

For large datasets, process data in chunks:

```typescript
const processInChunks = (data, chunkSize = 1000) => {
  const chunks = _.chunk(data, chunkSize);
  return chunks.map(chunk => processChunk(chunk));
};
```

### 3. Type Coercion

Handle type inconsistencies gracefully:

```typescript
const coerceType = (value, targetType) => {
  if (targetType === 'number') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  if (targetType === 'string') {
    return String(value);
  }
  return value;
};
```

### 4. Missing Value Handling

Implement consistent missing value strategies:

```typescript
const fillMissing = (data, strategy = 'mean') => {
  const strategies = {
    mean: (values) => _.mean(values.filter(v => v != null)),
    median: (values) => _.sortBy(values.filter(v => v != null))[Math.floor(values.length / 2)],
    mode: (values) => _.head(_(values).countBy().entries().maxBy(1)),
    zero: () => 0,
    drop: () => null
  };

  return strategies[strategy];
};
```

### 5. Output Formatting

Provide multiple output format options:

```typescript
const formatOutput = (data, format) => {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return Papa.unparse(data);
    case 'summary':
      return generateSummary(data);
    default:
      return data;
  }
};
```

## Integration Examples

### With Visualization Skill

```typescript
{
  nodes: [
    {
      id: "analyze",
      type: "function",
      function: "/* data analysis logic */"
    },
    {
      id: "visualize",
      type: "function",
      function: `
        async (state) => {
          // Create visualization from analysis results
          const chart = createChart({
            type: 'bar',
            data: state.aggregatedData,
            x: state.groupBy[0],
            y: state.aggregations[0].column + '_sum'
          });
          return { chart };
        }
      `
    }
  ],
  edges: [
    { from: "__start__", to: "analyze" },
    { from: "analyze", to: "visualize" },
    { from: "visualize", to: "__end__" }
  ]
}
```

### With Statistical Analysis Skill

```typescript
{
  nodes: [
    {
      id: "load_clean",
      type: "function",
      function: "/* load and clean data */"
    },
    {
      id: "statistical_tests",
      type: "function",
      function: `
        async (state) => {
          // Perform statistical tests on cleaned data
          const results = {
            correlation: calculateCorrelation(state.cleanedData),
            regression: performRegression(state.cleanedData),
            hypothesis: testHypothesis(state.cleanedData)
          };
          return { statisticalResults: results };
        }
      `
    }
  ]
}
```

## Version History

### Version 1.0.0 (2026-02-06)
- Initial release
- Support for CSV, JSON, TSV formats
- Descriptive statistics
- Data cleaning and transformation
- Filtering and sorting
- Grouping and aggregation
- Missing value handling
- Duplicate detection and removal
