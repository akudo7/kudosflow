---
name: powerpoint_operations
description: PowerPoint presentation operations including creation, editing, and formatting
version: 1.0.0
author: SceneGraphManager Team
tags:
  - office
  - powerpoint
  - presentation
  - slides
requires:
  - pptxgenjs
---

# PowerPoint Operations Skill

## Overview

The PowerPoint Operations skill provides comprehensive functionality for working with PowerPoint presentations (.pptx). It enables creating, reading, editing, and formatting presentations programmatically.

## Usage

This skill can be integrated into workflows that require:
- Creating new presentations from scratch
- Reading and extracting content from existing presentations
- Modifying slide content and layout
- Applying themes and formatting
- Adding charts, images, and multimedia
- Generating reports as presentations

## Examples

### Example 1: Create Simple Presentation

```javascript
// Create a new PowerPoint presentation
await createPresentation({
  filepath: "./output/quarterly_review.pptx",
  slides: [
    {
      type: "title",
      title: "Q1 2024 Review",
      subtitle: "Quarterly Performance Summary"
    },
    {
      type: "content",
      title: "Key Achievements",
      bullets: [
        "Revenue increased by 25%",
        "Launched 3 new products",
        "Expanded to 5 new markets"
      ]
    },
    {
      type: "chart",
      title: "Revenue Growth",
      chartType: "column",
      data: [
        { name: "Q1", value: 50000 },
        { name: "Q2", value: 55000 },
        { name: "Q3", value: 62000 },
        { name: "Q4", value: 70000 }
      ]
    }
  ]
});
```

### Example 2: Read Presentation Content

```javascript
// Read content from PowerPoint presentation
const content = await readPresentation({
  filepath: "./presentations/training.pptx",
  extractImages: true,
  includeNotes: true
});

// Returns:
// {
//   slideCount: 25,
//   slides: [
//     {
//       slideNumber: 1,
//       title: "Introduction",
//       content: "...",
//       notes: "Speaker notes...",
//       images: [...]
//     },
//     ...
//   ]
// }
```

### Example 3: Advanced Slide with Multiple Elements

```javascript
// Create slide with multiple elements
await createPresentation({
  filepath: "./output/sales_presentation.pptx",
  slides: [
    {
      type: "custom",
      title: "Sales Performance",
      elements: [
        {
          type: "text",
          text: "Regional Performance",
          x: "10%",
          y: "20%",
          fontSize: 18,
          bold: true
        },
        {
          type: "chart",
          chartType: "bar",
          x: "10%",
          y: "30%",
          width: "40%",
          height: "60%",
          data: [
            { region: "North", sales: 50000 },
            { region: "South", sales: 45000 },
            { region: "East", sales: 52000 },
            { region: "West", sales: 48000 }
          ]
        },
        {
          type: "image",
          path: "./images/logo.png",
          x: "60%",
          y: "30%",
          width: "30%",
          height: "20%"
        },
        {
          type: "table",
          x: "60%",
          y: "55%",
          rows: [
            ["Region", "Target", "Actual"],
            ["North", "$45K", "$50K"],
            ["South", "$40K", "$45K"]
          ]
        }
      ]
    }
  ]
});
```

### Example 4: Apply Theme and Master Slide

```javascript
// Create presentation with custom theme
await createPresentation({
  filepath: "./output/branded_presentation.pptx",
  theme: {
    colors: {
      accent1: "#2E75B6",
      accent2: "#4472C4",
      background: "#FFFFFF",
      text: "#000000"
    },
    fonts: {
      headingFont: "Arial",
      bodyFont: "Calibri"
    }
  },
  master: {
    logo: "./images/company_logo.png",
    footer: "Company Confidential - 2024"
  },
  slides: [
    // Slide definitions...
  ]
});
```

## Parameters

### createPresentation(options)

- `filepath` (string, required): Output file path
- `slides` (array, required): Array of slide definitions
- `theme` (object, optional): Theme configuration
- `master` (object, optional): Master slide settings
- `layout` (string, optional): "standard" (4:3) or "widescreen" (16:9) (default: "widescreen")
- `author` (string, optional): Presentation author
- `title` (string, optional): Presentation title

### readPresentation(options)

- `filepath` (string, required): Path to PowerPoint file
- `extractImages` (boolean, optional): Extract embedded images (default: false)
- `includeNotes` (boolean, optional): Include speaker notes (default: false)
- `includeMetadata` (boolean, optional): Include presentation metadata (default: true)

### Slide Types

- `title`: Title slide with title and subtitle
- `content`: Content slide with title and bullets
- `chart`: Chart slide with data visualization
- `image`: Image slide with optional caption
- `table`: Table slide with data
- `custom`: Custom slide with positioned elements

### Chart Types

- `bar`: Horizontal bar chart
- `column`: Vertical column chart
- `line`: Line chart
- `pie`: Pie chart
- `doughnut`: Doughnut chart
- `area`: Area chart
- `scatter`: Scatter plot

## Returns

### createPresentation
Returns an object with:
- `success` (boolean): Whether operation succeeded
- `filepath` (string): Path to created presentation
- `slideCount` (number): Number of slides created

### readPresentation
Returns an object with:
- `slideCount` (number): Total number of slides
- `slides` (array): Array of slide objects
- `metadata` (object): Presentation metadata

## Error Handling

The skill handles common errors gracefully:

```javascript
try {
  const content = await readPresentation({
    filepath: "./missing.pptx"
  });
} catch (error) {
  if (error.code === "FILE_NOT_FOUND") {
    console.error("Presentation not found:", error.filepath);
  } else if (error.code === "CORRUPTED_FILE") {
    console.error("Presentation is corrupted");
  } else if (error.code === "INVALID_CHART_DATA") {
    console.error("Chart data format is invalid");
  }
}
```

### Common Error Codes

- `FILE_NOT_FOUND`: Presentation file does not exist
- `CORRUPTED_FILE`: File is corrupted or invalid
- `INVALID_SLIDE_TYPE`: Unknown slide type specified
- `INVALID_CHART_DATA`: Chart data format is invalid
- `IMAGE_NOT_FOUND`: Referenced image file not found
- `PERMISSION_DENIED`: No permission to read/write file
- `UNSUPPORTED_VERSION`: PowerPoint version not supported

## Best Practices

1. **Use widescreen layout**: Modern presentations use 16:9 aspect ratio
2. **Keep slides simple**: Avoid overcrowding slides with too much content
3. **Optimize images**: Compress images before embedding to reduce file size
4. **Use consistent styling**: Apply themes for consistent look and feel
5. **Add speaker notes**: Include detailed notes for presenters
6. **Test compatibility**: Verify presentations work across different PowerPoint versions
7. **Use appropriate chart types**: Choose chart types that best represent your data
8. **Consider accessibility**: Use high contrast colors and readable fonts

## Advanced Features

### Animation and Transitions

```javascript
// Add animations to slide elements
await createPresentation({
  filepath: "./output/animated.pptx",
  slides: [
    {
      type: "content",
      title: "Animated Slide",
      bullets: ["Point 1", "Point 2", "Point 3"],
      animations: [
        {
          target: "title",
          effect: "fadeIn",
          delay: 0
        },
        {
          target: "bullets",
          effect: "appear",
          delay: 500,
          each: true // Animate each bullet separately
        }
      ],
      transition: {
        type: "fade",
        duration: 1000
      }
    }
  ]
});
```

### Smart Art and Diagrams

```javascript
// Create SmartArt diagram
await addSmartArt({
  presentation: "./output/process_flow.pptx",
  slideNumber: 2,
  smartArt: {
    type: "process",
    layout: "horizontal",
    items: [
      { text: "Planning", icon: "plan" },
      { text: "Development", icon: "code" },
      { text: "Testing", icon: "check" },
      { text: "Deployment", icon: "rocket" }
    ]
  }
});
```

### Video and Audio

```javascript
// Add multimedia to slides
await createPresentation({
  filepath: "./output/multimedia.pptx",
  slides: [
    {
      type: "custom",
      elements: [
        {
          type: "video",
          path: "./media/demo.mp4",
          x: "10%",
          y: "20%",
          width: "80%",
          height: "60%",
          autoplay: true
        },
        {
          type: "audio",
          path: "./audio/narration.mp3",
          autoplay: false
        }
      ]
    }
  ]
});
```

## Performance Considerations

- **Small presentations (<20 slides)**: Load entire presentation - fastest
- **Medium presentations (20-100 slides)**: Process slide by slide
- **Large presentations (>100 slides)**: Use streaming APIs
- **Media-heavy presentations**: Compress videos and audio files

## Dependencies

Required npm packages:
```json
{
  "dependencies": {
    "pptxgenjs": "^3.12.0"
  }
}
```

## Integration Examples

### Data to Presentation Pipeline

```javascript
// Read data from Excel
const data = await readExcelFile({
  filepath: "./data/quarterly_results.xlsx"
});

// Create charts from data
const chartData = transformDataForChart(data);

// Generate PowerPoint presentation
await createPresentation({
  filepath: "./output/quarterly_presentation.pptx",
  slides: [
    {
      type: "title",
      title: "Quarterly Results",
      subtitle: "Q1 2024"
    },
    {
      type: "chart",
      title: "Revenue Overview",
      chartType: "column",
      data: chartData
    }
  ]
});

// Convert to PDF for distribution
await convertPresentationToPdf({
  inputFile: "./output/quarterly_presentation.pptx",
  outputFile: "./output/quarterly_presentation.pdf"
});
```

## Common Use Cases

### 1. Automated Report Generation
Generate periodic reports as PowerPoint presentations from data sources.

### 2. Data Visualization
Create charts and graphs from datasets for stakeholder presentations.

### 3. Template-Based Presentations
Generate personalized presentations from templates.

### 4. Training Materials
Create standardized training slide decks.

### 5. Sales Presentations
Generate customized sales presentations with dynamic content.

## Version History

- **1.0.0** (2026-02-06): Initial release with core PowerPoint operations
