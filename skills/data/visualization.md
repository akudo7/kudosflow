---
skill_id: visualization
name: Data Visualization
category: data
version: 1.0.0
description: Create interactive and static visualizations including charts, graphs, and dashboards
author: SceneGraphManager Team
created: 2026-02-06
updated: 2026-02-06
tags:
  - visualization
  - charts
  - graphs
  - dashboards
  - plotting
  - reporting
requires:
  - chart.js
  - d3
  - plotly.js
  - canvas
dependencies:
  - data_analysis
complexity: high
estimated_tokens: 800-3000
---

# Data Visualization Skill

## Overview

The Data Visualization skill provides comprehensive capabilities for creating visual representations of data. It supports multiple chart types, interactive dashboards, and customizable styling options. The skill integrates with Chart.js, D3.js, and Plotly to deliver professional-quality visualizations.

This skill is ideal for creating reports, dashboards, and data stories that communicate insights effectively.

## Usage

### Basic Syntax

```typescript
{
  id: "create_chart",
  type: "function",
  function: `
    async (state) => {
      const chart = createVisualization({
        type: state.chartType,
        data: state.data,
        options: state.chartOptions
      });
      return { visualization: chart };
    }
  `
}
```

## Examples

### Example 1: Bar Chart with Chart.js

```typescript
{
  nodes: [
    {
      id: "create_bar_chart",
      type: "function",
      function: `
        async (state) => {
          const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

          const width = 800;
          const height = 600;
          const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

          const configuration = {
            type: 'bar',
            data: {
              labels: state.data.map(d => d[state.xAxis]),
              datasets: [{
                label: state.label || 'Dataset',
                data: state.data.map(d => d[state.yAxis]),
                backgroundColor: state.colors || [
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: state.borderColors || [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: state.title || 'Bar Chart'
                },
                legend: {
                  display: state.showLegend !== false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: state.yAxisLabel || 'Value'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: state.xAxisLabel || 'Category'
                  }
                }
              }
            }
          };

          const image = await chartJSNodeCanvas.renderToBuffer(configuration);
          const fs = require('fs');
          const outputPath = state.outputPath || './chart.png';
          fs.writeFileSync(outputPath, image);

          return {
            chartPath: outputPath,
            chartType: 'bar',
            success: true
          };
        }
      `
    }
  ]
}
```

### Example 2: Line Chart with Multiple Series

```typescript
{
  nodes: [
    {
      id: "create_line_chart",
      type: "function",
      function: `
        async (state) => {
          const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

          const width = 1000;
          const height = 600;
          const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

          // Prepare datasets for multiple series
          const datasets = state.series.map((series, index) => ({
            label: series.label,
            data: series.data,
            borderColor: series.color || \`hsl(\${index * 360 / state.series.length}, 70%, 50%)\`,
            backgroundColor: series.fillColor || \`hsla(\${index * 360 / state.series.length}, 70%, 50%, 0.1)\`,
            tension: 0.4,
            fill: series.fill !== false,
            pointRadius: 3,
            pointHoverRadius: 5
          }));

          const configuration = {
            type: 'line',
            data: {
              labels: state.labels,
              datasets: datasets
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: state.title || 'Line Chart',
                  font: {
                    size: 16
                  }
                },
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  mode: 'index',
                  intersect: false
                }
              },
              interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
              },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: state.xAxisLabel || 'X Axis'
                  }
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: state.yAxisLabel || 'Y Axis'
                  }
                }
              }
            }
          };

          const image = await chartJSNodeCanvas.renderToBuffer(configuration);
          const fs = require('fs');
          const outputPath = state.outputPath || './line_chart.png';
          fs.writeFileSync(outputPath, image);

          return {
            chartPath: outputPath,
            chartType: 'line',
            seriesCount: datasets.length,
            success: true
          };
        }
      `
    }
  ]
}
```

### Example 3: Pie Chart with Percentages

```typescript
{
  nodes: [
    {
      id: "create_pie_chart",
      type: "function",
      function: `
        async (state) => {
          const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

          const width = 800;
          const height = 600;
          const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

          const total = state.data.reduce((sum, d) => sum + d.value, 0);

          const configuration = {
            type: 'pie',
            data: {
              labels: state.data.map(d => d.label),
              datasets: [{
                data: state.data.map(d => d.value),
                backgroundColor: state.colors || [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#FF6384',
                  '#C9CBCF'
                ],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: state.title || 'Pie Chart',
                  font: {
                    size: 16
                  }
                },
                legend: {
                  display: true,
                  position: 'right'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed;
                      const percentage = ((value / total) * 100).toFixed(1);
                      return \`\${label}: \${value} (\${percentage}%)\`;
                    }
                  }
                }
              }
            }
          };

          const image = await chartJSNodeCanvas.renderToBuffer(configuration);
          const fs = require('fs');
          const outputPath = state.outputPath || './pie_chart.png';
          fs.writeFileSync(outputPath, image);

          return {
            chartPath: outputPath,
            chartType: 'pie',
            total: total,
            segments: state.data.length,
            success: true
          };
        }
      `
    }
  ]
}
```

### Example 4: Scatter Plot with D3.js

```typescript
{
  nodes: [
    {
      id: "create_scatter_plot",
      type: "function",
      function: `
        async (state) => {
          const d3 = require('d3');
          const { JSDOM } = require('jsdom');
          const fs = require('fs');

          // Create virtual DOM
          const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
          const document = dom.window.document;

          // Set dimensions
          const margin = { top: 20, right: 30, bottom: 40, left: 50 };
          const width = 800 - margin.left - margin.right;
          const height = 600 - margin.top - margin.bottom;

          // Create SVG
          const svg = d3.select(document.body)
            .append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', \`translate(\${margin.left},\${margin.top})\`);

          // Create scales
          const x = d3.scaleLinear()
            .domain([0, d3.max(state.data, d => d.x)])
            .range([0, width]);

          const y = d3.scaleLinear()
            .domain([0, d3.max(state.data, d => d.y)])
            .range([height, 0]);

          // Add X axis
          svg.append('g')
            .attr('transform', \`translate(0,\${height})\`)
            .call(d3.axisBottom(x))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .text(state.xAxisLabel || 'X Axis');

          // Add Y axis
          svg.append('g')
            .call(d3.axisLeft(y))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -height / 2)
            .attr('fill', 'black')
            .text(state.yAxisLabel || 'Y Axis');

          // Add dots
          svg.selectAll('circle')
            .data(state.data)
            .enter()
            .append('circle')
            .attr('cx', d => x(d.x))
            .attr('cy', d => y(d.y))
            .attr('r', 5)
            .attr('fill', state.color || '#69b3a2')
            .attr('opacity', 0.7);

          // Add title
          svg.append('text')
            .attr('x', width / 2)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text(state.title || 'Scatter Plot');

          // Save SVG
          const svgString = document.body.innerHTML;
          const outputPath = state.outputPath || './scatter_plot.svg';
          fs.writeFileSync(outputPath, svgString);

          return {
            chartPath: outputPath,
            chartType: 'scatter',
            pointCount: state.data.length,
            success: true
          };
        }
      `
    }
  ]
}
```

### Example 5: Heatmap Visualization

```typescript
{
  nodes: [
    {
      id: "create_heatmap",
      type: "function",
      function: `
        async (state) => {
          const plotly = require('plotly');
          const fs = require('fs');

          // Prepare data for heatmap
          const z = state.matrix; // 2D array of values
          const x = state.xLabels || z[0].map((_, i) => \`Col \${i}\`);
          const y = state.yLabels || z.map((_, i) => \`Row \${i}\`);

          const data = [{
            z: z,
            x: x,
            y: y,
            type: 'heatmap',
            colorscale: state.colorscale || 'Viridis',
            showscale: true,
            colorbar: {
              title: state.colorbarTitle || 'Value'
            }
          }];

          const layout = {
            title: state.title || 'Heatmap',
            xaxis: {
              title: state.xAxisLabel || 'X Axis'
            },
            yaxis: {
              title: state.yAxisLabel || 'Y Axis'
            },
            width: state.width || 800,
            height: state.height || 600
          };

          // Generate HTML with embedded visualization
          const html = \`
            <!DOCTYPE html>
            <html>
            <head>
              <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            </head>
            <body>
              <div id="chart"></div>
              <script>
                const data = \${JSON.stringify(data)};
                const layout = \${JSON.stringify(layout)};
                Plotly.newPlot('chart', data, layout);
              </script>
            </body>
            </html>
          \`;

          const outputPath = state.outputPath || './heatmap.html';
          fs.writeFileSync(outputPath, html);

          return {
            chartPath: outputPath,
            chartType: 'heatmap',
            dimensions: { rows: z.length, cols: z[0].length },
            success: true
          };
        }
      `
    }
  ]
}
```

### Example 6: Dashboard with Multiple Charts

```typescript
{
  nodes: [
    {
      id: "create_dashboard",
      type: "function",
      function: `
        async (state) => {
          const fs = require('fs');

          // Create HTML dashboard
          const html = \`
            <!DOCTYPE html>
            <html>
            <head>
              <title>\${state.title || 'Dashboard'}</title>
              <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  background-color: #f5f5f5;
                }
                .dashboard-header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .chart-container {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                  gap: 20px;
                  margin-bottom: 20px;
                }
                .chart-card {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                canvas {
                  max-width: 100%;
                }
              </style>
            </head>
            <body>
              <div class="dashboard-header">
                <h1>\${state.title || 'Dashboard'}</h1>
                <p>\${state.description || 'Data Analysis Dashboard'}</p>
              </div>

              <div class="chart-container">
                \${state.charts.map((chart, index) => \`
                  <div class="chart-card">
                    <h3>\${chart.title}</h3>
                    <canvas id="chart\${index}"></canvas>
                  </div>
                \`).join('')}
              </div>

              <script>
                \${state.charts.map((chart, index) => \`
                  new Chart(document.getElementById('chart\${index}'), \${JSON.stringify(chart.config)});
                \`).join('\\n')}
              </script>
            </body>
            </html>
          \`;

          const outputPath = state.outputPath || './dashboard.html';
          fs.writeFileSync(outputPath, html);

          return {
            dashboardPath: outputPath,
            chartCount: state.charts.length,
            success: true
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
| `chartType` | string | Yes | Chart type: 'bar', 'line', 'pie', 'scatter', 'heatmap', 'radar', 'doughnut' |
| `data` | array/object | Yes | Data to visualize |
| `title` | string | No | Chart title |
| `xAxis` | string | No | X-axis data key (for bar/line charts) |
| `yAxis` | string | No | Y-axis data key (for bar/line charts) |
| `xAxisLabel` | string | No | X-axis label |
| `yAxisLabel` | string | No | Y-axis label |
| `labels` | string[] | No | Axis labels (for line charts) |
| `series` | object[] | No | Multiple data series (for line charts) |
| `colors` | string[] | No | Custom color palette |
| `borderColors` | string[] | No | Border color palette |
| `outputPath` | string | No | Output file path (default: './chart.png' or './chart.html') |
| `width` | number | No | Chart width in pixels (default: 800) |
| `height` | number | No | Chart height in pixels (default: 600) |
| `showLegend` | boolean | No | Show/hide legend (default: true) |
| `responsive` | boolean | No | Enable responsive sizing (default: true) |
| `colorscale` | string | No | Color scale for heatmaps (e.g., 'Viridis', 'Hot', 'Cool') |
| `matrix` | number[][] | No | 2D array for heatmaps |
| `charts` | object[] | No | Array of chart configs for dashboards |

### Chart Configuration Object

```typescript
{
  type: string,           // Chart type
  title: string,          // Chart title
  config: object,         // Chart.js configuration
  data?: any             // Chart data
}
```

### Series Object

```typescript
{
  label: string,          // Series label
  data: number[],         // Series data points
  color?: string,         // Line/point color
  fillColor?: string,     // Fill color (for area charts)
  fill?: boolean         // Enable/disable fill
}
```

## Returns

### Success Response

```typescript
{
  success: boolean,           // Operation success status
  chartPath: string,          // Path to generated chart file
  chartType: string,          // Type of chart created
  dimensions?: object,        // Chart dimensions
  seriesCount?: number,       // Number of data series
  pointCount?: number,        // Number of data points
  total?: number,            // Total value (for pie charts)
  segments?: number,         // Number of segments (for pie charts)
  chartCount?: number        // Number of charts (for dashboards)
}
```

### Error Response

```typescript
{
  error: string,              // Error message
  errorType: string,          // 'DATA_ERROR', 'RENDER_ERROR', 'FILE_ERROR'
  details?: any              // Additional error details
}
```

## Error Handling

### Common Errors

1. **Invalid Chart Type**
   - Error: Unsupported chart type specified
   - Solution: Use supported types: bar, line, pie, scatter, heatmap, etc.

2. **Missing Data**
   - Error: No data provided for visualization
   - Solution: Ensure data parameter contains valid data

3. **Dimension Mismatch**
   - Error: Data dimensions don't match chart requirements
   - Solution: Verify data structure matches chart type (e.g., 2D array for heatmaps)

4. **Render Error**
   - Error: Failed to render chart
   - Solution: Check canvas dependencies are installed

5. **File Write Error**
   - Error: Cannot write output file
   - Solution: Verify output path is writable

### Error Handling Example

```typescript
{
  id: "safe_visualization",
  type: "function",
  function: `
    async (state) => {
      try {
        // Validate input
        if (!state.data || state.data.length === 0) {
          throw new Error('No data provided for visualization');
        }

        if (!state.chartType) {
          throw new Error('Chart type is required');
        }

        const validTypes = ['bar', 'line', 'pie', 'scatter', 'heatmap'];
        if (!validTypes.includes(state.chartType)) {
          throw new Error(\`Invalid chart type: \${state.chartType}\`);
        }

        // Create visualization
        const chart = await createChart(state);

        return {
          success: true,
          ...chart
        };
      } catch (error) {
        return {
          error: error.message,
          errorType: 'RENDER_ERROR',
          details: error.stack
        };
      }
    }
  `
}
```

## Best Practices

### 1. Data Preparation

Always prepare and validate data before visualization:

```typescript
const prepareData = (rawData, chartType) => {
  // Remove null/undefined values
  const cleaned = rawData.filter(d => d != null);

  // Sort if needed
  if (chartType === 'line') {
    return cleaned.sort((a, b) => a.x - b.x);
  }

  return cleaned;
};
```

### 2. Color Palettes

Use consistent, accessible color schemes:

```typescript
const colorPalettes = {
  default: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD9BA'],
  vibrant: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'],
  grayscale: ['#000000', '#404040', '#808080', '#BFBFBF', '#FFFFFF']
};
```

### 3. Responsive Design

Ensure charts work on different screen sizes:

```typescript
const getResponsiveSize = (screenWidth) => {
  if (screenWidth < 600) return { width: 400, height: 300 };
  if (screenWidth < 1200) return { width: 800, height: 600 };
  return { width: 1200, height: 800 };
};
```

### 4. Performance Optimization

For large datasets, consider data aggregation:

```typescript
const aggregateData = (data, maxPoints = 1000) => {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
};
```

### 5. Accessibility

Add alt text and ARIA labels:

```typescript
const addAccessibility = (chart, description) => {
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-label', description);
  chart.setAttribute('alt', description);
};
```

## Integration Examples

### With Data Analysis Skill

```typescript
{
  nodes: [
    {
      id: "analyze",
      type: "function",
      function: "/* data analysis logic */"
    },
    {
      id: "visualize_results",
      type: "function",
      function: `
        async (state) => {
          // Create visualizations from analysis
          const charts = [
            await createBarChart(state.aggregatedData),
            await createLineChart(state.trendData),
            await createPieChart(state.distributionData)
          ];

          return {
            charts,
            dashboardPath: await createDashboard(charts)
          };
        }
      `
    }
  ],
  edges: [
    { from: "__start__", to: "analyze" },
    { from: "analyze", to: "visualize_results" },
    { from: "visualize_results", to: "__end__" }
  ]
}
```

### With Office Document Generation

```typescript
{
  nodes: [
    {
      id: "create_charts",
      type: "function",
      function: "/* create multiple charts */"
    },
    {
      id: "embed_in_powerpoint",
      type: "function",
      function: `
        async (state) => {
          const pptx = createPresentation();
          state.charts.forEach(chart => {
            pptx.addSlide().addImage({
              path: chart.path,
              x: 1,
              y: 1,
              w: 8,
              h: 5
            });
          });
          await pptx.save(state.outputPath);
        }
      `
    }
  ]
}
```

## Version History

### Version 1.0.0 (2026-02-06)
- Initial release
- Support for Chart.js, D3.js, and Plotly
- Bar, line, pie, scatter, and heatmap charts
- Dashboard creation
- Multiple color schemes
- Responsive sizing
- SVG and PNG output formats
- Interactive HTML dashboards
