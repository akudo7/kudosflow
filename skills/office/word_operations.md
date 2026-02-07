---
name: word_operations
description: Microsoft Word document operations including creation, editing, and formatting
version: 1.0.0
author: SceneGraphManager Team
tags:
  - office
  - word
  - document
  - docx
requires:
  - docx
  - mammoth
---

# Word Operations Skill

## Overview

The Word Operations skill provides comprehensive functionality for working with Microsoft Word documents (.docx). It enables creating, reading, editing, and formatting Word documents programmatically.

## Usage

This skill can be integrated into workflows that require:
- Creating new Word documents from scratch
- Reading and extracting content from existing documents
- Modifying document content and structure
- Applying formatting and styles
- Converting between formats (DOCX to HTML, etc.)

## Examples

### Example 1: Create Simple Document

```javascript
// Create a new Word document
await createWordDocument({
  filepath: "./output/report.docx",
  content: [
    {
      type: "heading",
      level: 1,
      text: "Annual Report 2024"
    },
    {
      type: "paragraph",
      text: "This report summarizes our key achievements..."
    },
    {
      type: "heading",
      level: 2,
      text: "Executive Summary"
    },
    {
      type: "paragraph",
      text: "Our revenue increased by 25% this year..."
    }
  ]
});
```

### Example 2: Read Document Content

```javascript
// Read content from Word document
const content = await readWordDocument({
  filepath: "./documents/contract.docx",
  extractImages: true,
  preserveFormatting: true
});

// Returns:
// {
//   text: "Full document text...",
//   paragraphs: [...],
//   images: [...],
//   tables: [...]
// }
```

### Example 3: Advanced Formatting

```javascript
// Create document with advanced formatting
await createWordDocument({
  filepath: "./output/formatted_report.docx",
  content: [
    {
      type: "heading",
      level: 1,
      text: "Quarterly Results",
      formatting: {
        color: "#2E75B6",
        bold: true,
        alignment: "center"
      }
    },
    {
      type: "table",
      rows: [
        ["Quarter", "Revenue", "Profit"],
        ["Q1", "$50,000", "$10,000"],
        ["Q2", "$55,000", "$11,000"]
      ],
      formatting: {
        headerRow: true,
        borders: "all",
        shading: {
          headerColor: "#4472C4",
          alternateRows: "#D9E2F3"
        }
      }
    },
    {
      type: "image",
      path: "./charts/revenue_chart.png",
      width: 600,
      height: 400
    }
  ]
});
```

### Example 4: Modify Existing Document

```javascript
// Modify existing document
await modifyWordDocument({
  filepath: "./documents/template.docx",
  outputPath: "./output/personalized.docx",
  replacements: {
    "{{NAME}}": "John Doe",
    "{{DATE}}": "2024-02-06",
    "{{AMOUNT}}": "$10,000"
  },
  additions: [
    {
      after: "Executive Summary",
      content: {
        type: "paragraph",
        text: "Additional notes..."
      }
    }
  ]
});
```

## Parameters

### createWordDocument(options)

- `filepath` (string, required): Output file path
- `content` (array, required): Array of content items
- `pageSetup` (object, optional): Page setup options
  - `orientation` (string): "portrait" or "landscape"
  - `margins` (object): { top, bottom, left, right } in inches
  - `size` (string): "letter", "a4", etc.
- `styles` (object, optional): Custom styles definition

### readWordDocument(options)

- `filepath` (string, required): Path to Word document
- `extractImages` (boolean, optional): Extract embedded images (default: false)
- `preserveFormatting` (boolean, optional): Preserve text formatting (default: true)
- `includeMetadata` (boolean, optional): Include document metadata (default: false)

### modifyWordDocument(options)

- `filepath` (string, required): Input file path
- `outputPath` (string, required): Output file path
- `replacements` (object, optional): Text replacements
- `additions` (array, optional): Content to add
- `deletions` (array, optional): Content to remove

### Content Item Types

- `heading`: Document heading (level 1-9)
- `paragraph`: Text paragraph
- `table`: Data table
- `image`: Embedded image
- `bulletList`: Bulleted list
- `numberedList`: Numbered list
- `pageBreak`: Page break
- `sectionBreak`: Section break

## Returns

### createWordDocument
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `filepath` (string): Path to created document
- `pageCount` (number): Number of pages

### readWordDocument
Returns an object with:
- `text` (string): Full document text
- `paragraphs` (array): Array of paragraph objects
- `images` (array, optional): Extracted images
- `tables` (array): Extracted tables
- `metadata` (object, optional): Document metadata

### modifyWordDocument
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `outputPath` (string): Path to modified document
- `changesCount` (number): Number of modifications made

## Error Handling

The skill handles common errors gracefully:

```javascript
try {
  const content = await readWordDocument({
    filepath: "./missing.docx"
  });
} catch (error) {
  if (error.code === "FILE_NOT_FOUND") {
    console.error("Document not found:", error.filepath);
  } else if (error.code === "CORRUPTED_FILE") {
    console.error("Document is corrupted or invalid");
  } else if (error.code === "UNSUPPORTED_VERSION") {
    console.error("Document version not supported");
  }
}
```

### Common Error Codes

- `FILE_NOT_FOUND`: Document does not exist
- `PERMISSION_DENIED`: No permission to read/write file
- `CORRUPTED_FILE`: Document is corrupted
- `UNSUPPORTED_VERSION`: Document version not supported (e.g., .doc instead of .docx)
- `INVALID_CONTENT`: Invalid content structure
- `IMAGE_NOT_FOUND`: Referenced image file not found

## Best Practices

1. **Use .docx format**: Always use modern .docx format, not legacy .doc
2. **Validate content structure**: Ensure content array follows proper format
3. **Optimize images**: Compress images before embedding to reduce file size
4. **Use styles consistently**: Define and reuse styles for consistent formatting
5. **Handle templates carefully**: Always create copies when modifying templates
6. **Set appropriate margins**: Consider printer requirements when setting margins
7. **Test compatibility**: Test generated documents in different Word versions
8. **Clean up resources**: Always close document handles after operations

## Integration with Workflows

Example workflow combining Excel and Word:

```javascript
// Read data from Excel
const salesData = await readExcelFile({
  filepath: "./data/sales.xlsx"
});

// Create Word report from Excel data
await createWordDocument({
  filepath: "./output/sales_report.docx",
  content: [
    {
      type: "heading",
      level: 1,
      text: "Sales Report"
    },
    {
      type: "table",
      rows: salesData
    }
  ]
});
```

## Performance Considerations

- **Small documents (<10 pages)**: Load entire document - fastest
- **Medium documents (10-100 pages)**: Process section by section
- **Large documents (>100 pages)**: Use streaming APIs
- **Image-heavy documents**: Compress images before embedding

## Dependencies

Required npm packages:
```json
{
  "dependencies": {
    "docx": "^8.5.0",
    "mammoth": "^1.6.0"
  }
}
```

## Common Use Cases

### 1. Template-Based Document Generation
Replace placeholders in templates with actual data.

### 2. Report Generation
Generate formatted reports from structured data.

### 3. Contract Automation
Create personalized contracts from templates.

### 4. Document Conversion
Convert Word documents to other formats (HTML, PDF via intermediate tools).

### 5. Content Extraction
Extract text and data from existing documents for processing.

## Version History

- **1.0.0** (2026-02-06): Initial release with core Word operations
