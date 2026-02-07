---
name: pdf_processing
description: PDF document processing including reading, writing, and manipulation
version: 1.0.0
author: SceneGraphManager Team
tags:
  - office
  - pdf
  - document
  - conversion
requires:
  - pdf-lib
  - pdf-parse
  - pdfkit
---

# PDF Processing Skill

## Overview

The PDF Processing skill provides comprehensive functionality for working with PDF documents. It enables reading, creating, modifying, and converting PDF files programmatically.

## Usage

This skill can be integrated into workflows that require:
- Extracting text and data from PDF files
- Creating new PDF documents
- Merging and splitting PDF files
- Adding annotations and form fields
- Converting documents to PDF format
- Password protection and encryption

## Examples

### Example 1: Extract Text from PDF

```javascript
// Extract text from PDF
const content = await extractPdfText({
  filepath: "./documents/report.pdf",
  pages: [1, 2, 3], // Optional: specific pages
  preserveLayout: true
});

// Returns:
// {
//   text: "Full document text...",
//   pages: [
//     { page: 1, text: "Page 1 content..." },
//     { page: 2, text: "Page 2 content..." }
//   ],
//   metadata: {
//     pageCount: 10,
//     author: "John Doe",
//     title: "Annual Report"
//   }
// }
```

### Example 2: Create PDF from Scratch

```javascript
// Create a new PDF document
await createPdfDocument({
  filepath: "./output/report.pdf",
  content: [
    {
      type: "text",
      text: "Annual Report 2024",
      fontSize: 24,
      font: "Helvetica-Bold",
      x: 50,
      y: 750
    },
    {
      type: "text",
      text: "This report summarizes our key achievements...",
      fontSize: 12,
      font: "Helvetica",
      x: 50,
      y: 700,
      maxWidth: 500
    },
    {
      type: "image",
      path: "./images/chart.png",
      x: 50,
      y: 400,
      width: 500,
      height: 300
    },
    {
      type: "line",
      from: [50, 390],
      to: [550, 390],
      thickness: 1
    }
  ],
  pageSize: "A4"
});
```

### Example 3: Merge Multiple PDFs

```javascript
// Merge multiple PDF files
await mergePdfFiles({
  inputFiles: [
    "./documents/cover.pdf",
    "./documents/chapter1.pdf",
    "./documents/chapter2.pdf",
    "./documents/appendix.pdf"
  ],
  outputFile: "./output/complete_book.pdf"
});
```

### Example 4: Split PDF

```javascript
// Split PDF into individual pages or ranges
await splitPdfFile({
  inputFile: "./documents/book.pdf",
  outputDir: "./output/chapters/",
  splitBy: "range",
  ranges: [
    { pages: [1, 5], filename: "introduction.pdf" },
    { pages: [6, 50], filename: "chapter1.pdf" },
    { pages: [51, 100], filename: "chapter2.pdf" }
  ]
});
```

### Example 5: Add Watermark

```javascript
// Add watermark to PDF
await addPdfWatermark({
  inputFile: "./documents/report.pdf",
  outputFile: "./output/report_watermarked.pdf",
  watermark: {
    type: "text",
    text: "CONFIDENTIAL",
    fontSize: 48,
    color: "#FF0000",
    opacity: 0.3,
    rotation: 45,
    position: "center"
  }
});
```

### Example 6: Password Protection

```javascript
// Protect PDF with password
await protectPdfFile({
  inputFile: "./documents/sensitive.pdf",
  outputFile: "./output/sensitive_protected.pdf",
  password: {
    user: "user123",
    owner: "admin456"
  },
  permissions: {
    printing: "lowResolution",
    modifying: false,
    copying: false,
    annotating: true
  }
});
```

## Parameters

### extractPdfText(options)

- `filepath` (string, required): Path to PDF file
- `pages` (array, optional): Specific pages to extract (default: all)
- `preserveLayout` (boolean, optional): Preserve text layout (default: false)
- `includeMetadata` (boolean, optional): Include document metadata (default: true)

### createPdfDocument(options)

- `filepath` (string, required): Output file path
- `content` (array, required): Array of content items
- `pageSize` (string, optional): Page size (A4, Letter, etc.) (default: "A4")
- `margins` (object, optional): { top, bottom, left, right } in points
- `metadata` (object, optional): Document metadata

### mergePdfFiles(options)

- `inputFiles` (array, required): Array of PDF file paths to merge
- `outputFile` (string, required): Output file path
- `addBlankPages` (boolean, optional): Add blank pages between documents (default: false)

### splitPdfFile(options)

- `inputFile` (string, required): Input PDF file path
- `outputDir` (string, required): Output directory for split files
- `splitBy` (string, required): "page" or "range"
- `ranges` (array, required for range): Array of page ranges

### addPdfWatermark(options)

- `inputFile` (string, required): Input PDF file path
- `outputFile` (string, required): Output file path
- `watermark` (object, required): Watermark configuration
  - `type` (string): "text" or "image"
  - `text` (string): Watermark text (for type: "text")
  - `imagePath` (string): Image path (for type: "image")
  - `fontSize` (number): Font size (for text)
  - `color` (string): Color in hex format
  - `opacity` (number): Opacity (0-1)
  - `rotation` (number): Rotation angle in degrees
  - `position` (string): "center", "top-left", etc.

### protectPdfFile(options)

- `inputFile` (string, required): Input PDF file path
- `outputFile` (string, required): Output file path
- `password` (object, required): Password configuration
  - `user` (string): User password (for opening)
  - `owner` (string): Owner password (for permissions)
- `permissions` (object, optional): Permission settings

## Returns

### extractPdfText
Returns an object with:
- `text` (string): Full document text
- `pages` (array): Array of page objects
- `metadata` (object): Document metadata

### createPdfDocument
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `filepath` (string): Path to created PDF
- `pageCount` (number): Number of pages

### mergePdfFiles
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `outputFile` (string): Path to merged PDF
- `totalPages` (number): Total page count

### splitPdfFile
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `files` (array): Array of created file paths
- `filesCount` (number): Number of files created

## Error Handling

The skill handles common errors gracefully:

```javascript
try {
  const content = await extractPdfText({
    filepath: "./missing.pdf"
  });
} catch (error) {
  if (error.code === "FILE_NOT_FOUND") {
    console.error("PDF not found:", error.filepath);
  } else if (error.code === "CORRUPTED_FILE") {
    console.error("PDF is corrupted or invalid");
  } else if (error.code === "PASSWORD_REQUIRED") {
    console.error("PDF is password protected");
  } else if (error.code === "INVALID_PAGE_RANGE") {
    console.error("Invalid page range specified");
  }
}
```

### Common Error Codes

- `FILE_NOT_FOUND`: PDF file does not exist
- `CORRUPTED_FILE`: PDF is corrupted or invalid
- `PASSWORD_REQUIRED`: PDF requires password
- `INVALID_PASSWORD`: Incorrect password provided
- `INVALID_PAGE_RANGE`: Page range exceeds document length
- `PERMISSION_DENIED`: No permission to read/write file
- `UNSUPPORTED_FEATURE`: PDF feature not supported
- `ENCRYPTION_ERROR`: Error during encryption/decryption

## Best Practices

1. **Validate PDF files**: Always check if file exists and is valid before processing
2. **Handle large PDFs carefully**: Use streaming for files >50MB
3. **Preserve original files**: Always create copies when modifying PDFs
4. **Compress images**: Optimize images before embedding to reduce PDF size
5. **Set appropriate permissions**: Use restrictive permissions for sensitive documents
6. **Use strong passwords**: Generate secure passwords for protected PDFs
7. **Test compatibility**: Ensure PDFs work across different viewers
8. **Clean up temporary files**: Delete temporary PDFs after processing

## Advanced Features

### Form Field Manipulation

```javascript
// Fill PDF form fields
await fillPdfForm({
  inputFile: "./forms/application.pdf",
  outputFile: "./output/filled_application.pdf",
  fields: {
    "name": "John Doe",
    "email": "john@example.com",
    "date": "2024-02-06"
  },
  flatten: true // Flatten form after filling
});
```

### PDF Annotation

```javascript
// Add annotations to PDF
await annotatePdf({
  inputFile: "./documents/review.pdf",
  outputFile: "./output/review_annotated.pdf",
  annotations: [
    {
      type: "highlight",
      page: 1,
      rect: [100, 500, 300, 520],
      color: "#FFFF00"
    },
    {
      type: "text",
      page: 1,
      x: 400,
      y: 500,
      content: "Please review this section"
    }
  ]
});
```

### PDF to Image Conversion

```javascript
// Convert PDF pages to images
await pdfToImages({
  inputFile: "./documents/slides.pdf",
  outputDir: "./output/images/",
  format: "png",
  dpi: 300,
  pages: [1, 2, 3] // Optional: specific pages
});
```

## Performance Considerations

- **Small PDFs (<5MB)**: Load entire file - fastest
- **Medium PDFs (5-50MB)**: Process page by page
- **Large PDFs (>50MB)**: Use streaming APIs
- **Image-heavy PDFs**: Consider reducing image quality/size

## Dependencies

Required npm packages:
```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "pdf-parse": "^1.1.1",
    "pdfkit": "^0.13.0"
  }
}
```

## Integration Examples

### Excel to PDF Conversion

```javascript
// Read Excel data
const data = await readExcelFile({
  filepath: "./data/sales.xlsx"
});

// Create PDF from Excel data
await createPdfDocument({
  filepath: "./output/sales_report.pdf",
  content: [
    {
      type: "text",
      text: "Sales Report",
      fontSize: 20,
      font: "Helvetica-Bold"
    },
    {
      type: "table",
      data: data,
      headers: true
    }
  ]
});
```

## Version History

- **1.0.0** (2026-02-06): Initial release with core PDF operations
