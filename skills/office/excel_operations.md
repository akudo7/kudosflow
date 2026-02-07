---
name: excel_operations
description: Excel file operations including reading, writing, and data manipulation
version: 1.0.0
author: SceneGraphManager Team
tags:
  - office
  - excel
  - spreadsheet
  - data
requires:
  - xlsx
  - exceljs
---

# Excel Operations Skill

## Overview

The Excel Operations skill provides comprehensive functionality for working with Excel files (.xlsx, .xls). It enables reading, writing, formatting, and manipulating spreadsheet data programmatically.

## Usage

This skill can be integrated into workflows that require:
- Reading data from Excel files
- Writing data to new or existing Excel files
- Formatting cells, rows, and columns
- Creating charts and pivot tables
- Data validation and formula management

## Examples

### Example 1: Read Excel Data

```javascript
// Read data from Excel file
const data = await readExcelFile({
  filepath: "./data/sales.xlsx",
  sheet: "Q1 Sales",
  range: "A1:D100"
});

// Returns:
// [
//   ["Date", "Product", "Quantity", "Revenue"],
//   ["2024-01-01", "Product A", 10, 1000],
//   ...
// ]
```

### Example 2: Write Excel Data

```javascript
// Write data to Excel file
await writeExcelFile({
  filepath: "./output/report.xlsx",
  sheet: "Summary",
  data: [
    ["Month", "Sales", "Profit"],
    ["January", 50000, 10000],
    ["February", 55000, 11000]
  ],
  formatting: {
    headerRow: true,
    autoFilter: true,
    columnWidths: [15, 12, 12]
  }
});
```

### Example 3: Advanced Formatting

```javascript
// Apply advanced formatting
await formatExcelSheet({
  filepath: "./data/report.xlsx",
  sheet: "Results",
  operations: [
    {
      type: "format_cells",
      range: "A1:C1",
      format: {
        bold: true,
        backgroundColor: "#4472C4",
        fontColor: "#FFFFFF"
      }
    },
    {
      type: "add_chart",
      chartType: "column",
      dataRange: "A2:C10",
      position: "E2"
    }
  ]
});
```

## Parameters

### readExcelFile(options)

- `filepath` (string, required): Path to the Excel file
- `sheet` (string, optional): Sheet name (default: first sheet)
- `range` (string, optional): Cell range to read (default: all data)
- `header` (boolean, optional): Whether to treat first row as header (default: true)
- `raw` (boolean, optional): Return raw values without formatting (default: false)

### writeExcelFile(options)

- `filepath` (string, required): Output file path
- `sheet` (string, optional): Sheet name (default: "Sheet1")
- `data` (array, required): 2D array of data to write
- `formatting` (object, optional): Formatting options
  - `headerRow` (boolean): Format first row as header
  - `autoFilter` (boolean): Enable auto-filter
  - `columnWidths` (array): Column width values
  - `freezePane` (string): Freeze pane position (e.g., "A2")
- `overwrite` (boolean, optional): Overwrite existing file (default: false)

### formatExcelSheet(options)

- `filepath` (string, required): Path to Excel file
- `sheet` (string, required): Sheet name
- `operations` (array, required): Array of formatting operations
  - `type` (string): Operation type ("format_cells", "add_chart", "merge_cells", etc.)
  - Additional parameters depend on operation type

## Returns

### readExcelFile
Returns a 2D array of cell values or an object with headers and data if `header: true`.

### writeExcelFile
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `filepath` (string): Path to created file
- `rowCount` (number): Number of rows written

### formatExcelSheet
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `operationsCompleted` (number): Number of operations applied

## Error Handling

The skill handles common errors gracefully:

```javascript
try {
  const data = await readExcelFile({ filepath: "./missing.xlsx" });
} catch (error) {
  if (error.code === "FILE_NOT_FOUND") {
    console.error("Excel file not found:", error.filepath);
  } else if (error.code === "INVALID_SHEET") {
    console.error("Sheet does not exist:", error.sheet);
  } else if (error.code === "INVALID_RANGE") {
    console.error("Invalid cell range:", error.range);
  }
}
```

### Common Error Codes

- `FILE_NOT_FOUND`: File does not exist
- `INVALID_SHEET`: Sheet name not found in workbook
- `INVALID_RANGE`: Invalid cell range format
- `PERMISSION_DENIED`: No permission to read/write file
- `CORRUPTED_FILE`: Excel file is corrupted
- `UNSUPPORTED_FORMAT`: File format not supported

## Best Practices

1. **Always validate input data**: Check data structure before writing to Excel
2. **Use appropriate data types**: Ensure numbers are numbers, dates are Date objects
3. **Handle large files carefully**: For files with >10,000 rows, use streaming APIs
4. **Set reasonable column widths**: Auto-width can be slow for large datasets
5. **Clean up temporary files**: Always delete temporary Excel files after processing
6. **Use appropriate error handling**: Wrap Excel operations in try-catch blocks
7. **Consider memory usage**: Large Excel files can consume significant memory
8. **Validate formulas**: Test Excel formulas before writing them to files

## Integration with MCP Servers

This skill works seamlessly with MCP servers:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    }
  },
  "models": [
    {
      "id": "excel_agent",
      "type": "anthropic",
      "config": {
        "model": "claude-3-5-sonnet-20241022"
      },
      "bindMcpServers": ["filesystem"]
    }
  ]
}
```

## Performance Considerations

- **Small files (<1MB)**: Load entire file into memory - fastest
- **Medium files (1-10MB)**: Use row-by-row processing
- **Large files (>10MB)**: Use streaming APIs with batching
- **Very large files (>100MB)**: Consider splitting into multiple files

## Dependencies

Required npm packages:
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "exceljs": "^4.3.0"
  }
}
```

## Version History

- **1.0.0** (2026-02-06): Initial release with basic Excel operations
