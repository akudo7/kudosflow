---
skill_id: web_scraping
name: web_scraping
category: web
version: 1.0.0
description: Extract structured data from websites using CSS selectors, XPath, and headless browser automation
author: SceneGraphManager Team
created: 2026-02-06
updated: 2026-02-06
tags:
  - web
  - scraping
  - extraction
  - crawler
  - automation
  - data
requires:
  - cheerio
  - puppeteer
  - axios
  - jsdom
dependencies:
  - web_search
complexity: high
estimated_tokens: 800-3500
---

# Web Scraping Skill

## Overview

The Web Scraping skill provides comprehensive capabilities for extracting structured data from websites. It supports both static page scraping with Cheerio and dynamic page rendering with Puppeteer, offering CSS selectors, XPath queries, pagination handling, and data extraction rules.

This skill is essential for data collection, competitive analysis, price monitoring, content aggregation, and research automation.

## Usage

### Basic Syntax

```typescript
{
  id: "scrape_page",
  type: "function",
  function: `
    async (state) => {
      const data = await scrapeWebsite({
        url: state.url,
        selectors: state.selectors,
        extractionRules: state.rules
      });
      return { scrapedData: data };
    }
  `
}
```

## Examples

### Example 1: Basic Static Page Scraping with Cheerio

```typescript
{
  nodes: [
    {
      id: "scrape_static",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');
          const cheerio = require('cheerio');

          // Fetch page
          const response = await axios.get(state.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ScraperBot/1.0)',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000
          });

          const $ = cheerio.load(response.data);

          // Extract data using CSS selectors
          const data = {
            title: $('h1').first().text().trim(),
            description: $('meta[name="description"]').attr('content'),
            content: $('article, .content, main').first().text().trim(),
            links: [],
            images: []
          };

          // Extract all links
          $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && text) {
              data.links.push({
                url: new URL(href, state.url).href,
                text: text
              });
            }
          });

          // Extract all images
          $('img[src]').each((i, elem) => {
            const src = $(elem).attr('src');
            const alt = $(elem).attr('alt') || '';
            if (src) {
              data.images.push({
                url: new URL(src, state.url).href,
                alt: alt
              });
            }
          });

          return {
            data: data,
            url: state.url,
            scrapedAt: new Date().toISOString(),
            method: 'static'
          };
        }
      `
    }
  ]
}
```

### Example 2: Dynamic Page Scraping with Puppeteer

```typescript
{
  nodes: [
    {
      id: "scrape_dynamic",
      type: "function",
      function: `
        async (state) => {
          const puppeteer = require('puppeteer');

          // Launch browser
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          try {
            const page = await browser.newPage();

            // Set viewport and user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Navigate to page
            await page.goto(state.url, {
              waitUntil: 'networkidle2',
              timeout: 30000
            });

            // Wait for dynamic content to load
            if (state.waitForSelector) {
              await page.waitForSelector(state.waitForSelector, { timeout: 10000 });
            }

            // Execute JavaScript if needed (e.g., scroll, click, etc.)
            if (state.executeScript) {
              await page.evaluate(state.executeScript);
              await page.waitForTimeout(2000);
            }

            // Extract data
            const data = await page.evaluate((selectors) => {
              const result = {};

              // Extract by selectors
              Object.keys(selectors).forEach(key => {
                const selector = selectors[key];
                const elements = document.querySelectorAll(selector);

                if (elements.length === 0) {
                  result[key] = null;
                } else if (elements.length === 1) {
                  result[key] = elements[0].textContent.trim();
                } else {
                  result[key] = Array.from(elements).map(el => el.textContent.trim());
                }
              });

              return result;
            }, state.selectors);

            // Take screenshot if requested
            if (state.screenshot) {
              const screenshotBuffer = await page.screenshot({
                fullPage: state.fullPageScreenshot || false
              });
              data.screenshot = screenshotBuffer.toString('base64');
            }

            return {
              data: data,
              url: state.url,
              scrapedAt: new Date().toISOString(),
              method: 'dynamic'
            };
          } finally {
            await browser.close();
          }
        }
      `
    }
  ]
}
```

### Example 3: Table Data Extraction

```typescript
{
  nodes: [
    {
      id: "scrape_table",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');
          const cheerio = require('cheerio');

          const response = await axios.get(state.url);
          const $ = cheerio.load(response.data);

          // Find table by selector or index
          const table = state.tableSelector ?
            $(state.tableSelector) :
            $('table').eq(state.tableIndex || 0);

          // Extract headers
          const headers = [];
          table.find('thead th, thead td').each((i, elem) => {
            headers.push($(elem).text().trim());
          });

          // If no thead, try first row
          if (headers.length === 0) {
            table.find('tr').first().find('th, td').each((i, elem) => {
              headers.push($(elem).text().trim());
            });
          }

          // Extract rows
          const rows = [];
          const rowSelector = state.skipHeader ? 'tbody tr' : 'tr';

          table.find(rowSelector).each((i, row) => {
            // Skip header row if it's in tbody
            if (i === 0 && headers.length === 0) return;

            const rowData = {};
            $(row).find('td, th').each((j, cell) => {
              const header = headers[j] || \`column_\${j}\`;
              const value = $(cell).text().trim();

              // Try to parse numbers
              const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
              rowData[header] = isNaN(numValue) ? value : numValue;
            });

            if (Object.keys(rowData).length > 0) {
              rows.push(rowData);
            }
          });

          return {
            headers: headers,
            rows: rows,
            rowCount: rows.length,
            url: state.url,
            scrapedAt: new Date().toISOString()
          };
        }
      `
    }
  ]
}
```

### Example 4: Pagination and Multi-Page Scraping

```typescript
{
  nodes: [
    {
      id: "scrape_paginated",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');
          const cheerio = require('cheerio');

          const allData = [];
          let currentUrl = state.url;
          let pageCount = 0;
          const maxPages = state.maxPages || 10;

          while (currentUrl && pageCount < maxPages) {
            try {
              console.log(\`Scraping page \${pageCount + 1}: \${currentUrl}\`);

              const response = await axios.get(currentUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; ScraperBot/1.0)'
                }
              });

              const $ = cheerio.load(response.data);

              // Extract items from current page
              $(state.itemSelector).each((i, elem) => {
                const item = {};

                Object.keys(state.fields).forEach(field => {
                  const selector = state.fields[field];
                  const value = $(elem).find(selector).first().text().trim();
                  item[field] = value;
                });

                if (Object.keys(item).length > 0) {
                  allData.push(item);
                }
              });

              // Find next page link
              const nextLink = $(state.nextPageSelector).attr('href');

              if (nextLink) {
                currentUrl = new URL(nextLink, currentUrl).href;
                pageCount++;

                // Polite delay between requests
                await new Promise(resolve => setTimeout(resolve, state.delay || 1000));
              } else {
                currentUrl = null;
              }
            } catch (error) {
              console.error(\`Error scraping page \${pageCount + 1}:\`, error.message);
              break;
            }
          }

          return {
            data: allData,
            pagesScraped: pageCount + 1,
            totalItems: allData.length,
            url: state.url,
            scrapedAt: new Date().toISOString()
          };
        }
      `
    }
  ]
}
```

### Example 5: Handling JavaScript-Heavy Sites with Puppeteer

```typescript
{
  nodes: [
    {
      id: "scrape_spa",
      type: "function",
      function: `
        async (state) => {
          const puppeteer = require('puppeteer');

          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
          });

          try {
            const page = await browser.newPage();

            // Block unnecessary resources for faster loading
            await page.setRequestInterception(true);
            page.on('request', (req) => {
              const resourceType = req.resourceType();
              if (state.blockResources &&
                  ['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
              } else {
                req.continue();
              }
            });

            await page.goto(state.url, { waitUntil: 'networkidle2' });

            // Handle infinite scroll if needed
            if (state.infiniteScroll) {
              await autoScroll(page, state.scrollCount || 5);
            }

            // Handle "Load More" buttons
            if (state.loadMoreSelector) {
              let clickable = true;
              while (clickable && state.loadMoreClicks-- > 0) {
                try {
                  await page.waitForSelector(state.loadMoreSelector, { timeout: 2000 });
                  await page.click(state.loadMoreSelector);
                  await page.waitForTimeout(1000);
                } catch {
                  clickable = false;
                }
              }
            }

            // Extract data
            const data = await page.evaluate((config) => {
              const results = [];
              const items = document.querySelectorAll(config.itemSelector);

              items.forEach(item => {
                const result = {};

                Object.keys(config.fields).forEach(field => {
                  const selector = config.fields[field];
                  const elem = item.querySelector(selector);

                  if (elem) {
                    // Extract text, attribute, or innerHTML based on field config
                    if (selector.includes('@')) {
                      const [sel, attr] = selector.split('@');
                      const el = item.querySelector(sel);
                      result[field] = el ? el.getAttribute(attr) : null;
                    } else {
                      result[field] = elem.textContent.trim();
                    }
                  }
                });

                if (Object.keys(result).length > 0) {
                  results.push(result);
                }
              });

              return results;
            }, {
              itemSelector: state.itemSelector,
              fields: state.fields
            });

            return {
              data: data,
              itemCount: data.length,
              url: state.url,
              scrapedAt: new Date().toISOString()
            };
          } finally {
            await browser.close();
          }
        }
      `
    }
  ]
}
```

### Example 6: Downloading Files and Media

```typescript
{
  nodes: [
    {
      id: "download_files",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');
          const cheerio = require('cheerio');
          const fs = require('fs');
          const path = require('path');
          const crypto = require('crypto');

          // Fetch page
          const response = await axios.get(state.url);
          const $ = cheerio.load(response.data);

          const downloads = [];
          const downloadDir = state.downloadDir || './downloads';

          // Create download directory
          if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
          }

          // Find all matching files
          const fileUrls = [];
          $(state.fileSelector).each((i, elem) => {
            let fileUrl = $(elem).attr('href') || $(elem).attr('src');
            if (fileUrl) {
              fileUrl = new URL(fileUrl, state.url).href;

              // Filter by file extension if specified
              if (!state.fileTypes ||
                  state.fileTypes.some(ext => fileUrl.toLowerCase().endsWith(ext))) {
                fileUrls.push(fileUrl);
              }
            }
          });

          // Download files
          for (const fileUrl of fileUrls) {
            try {
              console.log(\`Downloading: \${fileUrl}\`);

              const fileResponse = await axios.get(fileUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                maxContentLength: state.maxFileSize || 100 * 1024 * 1024 // 100MB default
              });

              // Generate filename
              const urlPath = new URL(fileUrl).pathname;
              const originalFilename = path.basename(urlPath);
              const hash = crypto.createHash('md5').update(fileUrl).digest('hex').slice(0, 8);
              const filename = state.preserveFilename ?
                originalFilename :
                \`\${hash}_\${originalFilename}\`;

              const filePath = path.join(downloadDir, filename);

              // Save file
              fs.writeFileSync(filePath, fileResponse.data);

              downloads.push({
                url: fileUrl,
                path: filePath,
                filename: filename,
                size: fileResponse.data.length,
                contentType: fileResponse.headers['content-type']
              });

              // Polite delay
              await new Promise(resolve => setTimeout(resolve, state.delay || 500));
            } catch (error) {
              console.error(\`Error downloading \${fileUrl}:\`, error.message);
              downloads.push({
                url: fileUrl,
                error: error.message
              });
            }
          }

          return {
            downloads: downloads,
            successCount: downloads.filter(d => !d.error).length,
            errorCount: downloads.filter(d => d.error).length,
            totalSize: downloads.reduce((sum, d) => sum + (d.size || 0), 0),
            downloadDir: downloadDir
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
| `url` | string | Yes | URL to scrape |
| `method` | string | No | Scraping method: 'static' (Cheerio) or 'dynamic' (Puppeteer) |
| `selectors` | object | No | CSS selectors for data extraction: { field: selector } |
| `itemSelector` | string | No | Selector for repeated items (lists, cards, etc.) |
| `fields` | object | No | Field extraction rules: { field: selector } |
| `tableSelector` | string | No | Selector for table element |
| `tableIndex` | number | No | Table index if multiple tables (default: 0) |
| `skipHeader` | boolean | No | Skip first row in table (default: false) |
| `waitForSelector` | string | No | Wait for element before scraping (Puppeteer) |
| `executeScript` | string | No | JavaScript to execute on page (Puppeteer) |
| `screenshot` | boolean | No | Take screenshot (Puppeteer) |
| `fullPageScreenshot` | boolean | No | Full page screenshot (default: false) |
| `infiniteScroll` | boolean | No | Handle infinite scroll (Puppeteer) |
| `scrollCount` | number | No | Number of scroll iterations (default: 5) |
| `loadMoreSelector` | string | No | Selector for "Load More" button |
| `loadMoreClicks` | number | No | Max clicks on "Load More" (default: 10) |
| `nextPageSelector` | string | No | Selector for next page link (pagination) |
| `maxPages` | number | No | Max pages to scrape (default: 10) |
| `fileSelector` | string | No | Selector for files to download |
| `fileTypes` | string[] | No | File extensions to download: ['.pdf', '.doc'] |
| `downloadDir` | string | No | Download directory (default: './downloads') |
| `maxFileSize` | number | No | Max file size in bytes (default: 100MB) |
| `preserveFilename` | boolean | No | Keep original filenames (default: false) |
| `blockResources` | boolean | No | Block images/styles for faster loading (Puppeteer) |
| `delay` | number | No | Delay between requests in ms (default: 1000) |

## Returns

### Success Response

```typescript
{
  data: object | array,       // Extracted data
  url: string,               // Scraped URL
  scrapedAt: string,         // ISO timestamp
  method?: string,           // Scraping method used
  headers?: string[],        // Table headers (for tables)
  rows?: array,             // Table rows (for tables)
  rowCount?: number,        // Number of rows
  pagesScraped?: number,    // Pages scraped (pagination)
  totalItems?: number,      // Total items extracted
  itemCount?: number,       // Item count
  downloads?: array,        // Downloaded files
  successCount?: number,    // Successful downloads
  errorCount?: number,      // Failed downloads
  totalSize?: number,       // Total download size
  screenshot?: string       // Base64 screenshot (if requested)
}
```

### Error Response

```typescript
{
  error: string,              // Error message
  errorType: string,          // 'NETWORK_ERROR', 'PARSE_ERROR', 'SELECTOR_ERROR'
  url?: string,              // URL that failed
  details?: any              // Additional error details
}
```

## Error Handling

### Common Errors

1. **Network Errors**
   - Error: Connection timeout, DNS failure
   - Solution: Retry with exponential backoff, check URL validity

2. **Selector Not Found**
   - Error: No elements match selector
   - Solution: Verify selector, inspect page structure, try alternative selectors

3. **JavaScript Required**
   - Error: Static scraping returns empty results
   - Solution: Use Puppeteer for dynamic pages

4. **Rate Limiting/Blocking**
   - Error: 403 Forbidden, CAPTCHA
   - Solution: Add delays, rotate user agents, use proxies

5. **Memory Issues**
   - Error: Out of memory (large pages/images)
   - Solution: Block unnecessary resources, increase memory limit

### Error Handling Example

```typescript
{
  id: "robust_scraping",
  type: "function",
  function: `
    async (state) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAYS = [1000, 3000, 5000];

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Validate URL
          new URL(state.url);

          // Perform scraping
          const result = await scrapeWebsite(state);

          // Validate results
          if (!result.data || Object.keys(result.data).length === 0) {
            console.warn('No data extracted from page');
          }

          return {
            success: true,
            ...result,
            attempts: attempt + 1
          };
        } catch (error) {
          console.error(\`Scraping attempt \${attempt + 1} failed:\`, error.message);

          if (attempt === MAX_RETRIES - 1) {
            return {
              error: error.message,
              errorType: error.code === 'ECONNABORTED' ? 'TIMEOUT' :
                        error.response?.status === 403 ? 'BLOCKED' :
                        error.response?.status === 404 ? 'NOT_FOUND' :
                        'NETWORK_ERROR',
              url: state.url,
              attempts: attempt + 1,
              details: error.response?.data
            };
          }

          // Wait before retry
          await new Promise(resolve =>
            setTimeout(resolve, RETRY_DELAYS[attempt])
          );
        }
      }
    }
  `
}
```

## Best Practices

### 1. Polite Scraping

Respect robots.txt and add delays:

```typescript
const checkRobotsTxt = async (url) => {
  try {
    const baseUrl = new URL(url).origin;
    const robotsTxtUrl = \`\${baseUrl}/robots.txt\`;
    const response = await axios.get(robotsTxtUrl);

    // Parse robots.txt
    const rules = response.data.split('\\n')
      .filter(line => line.startsWith('Disallow:'))
      .map(line => line.replace('Disallow:', '').trim());

    return rules;
  } catch {
    return [];
  }
};

const isAllowed = (url, disallowedPaths) => {
  const path = new URL(url).pathname;
  return !disallowedPaths.some(p => path.startsWith(p));
};
```

### 2. User Agent Rotation

Rotate user agents to avoid detection:

```typescript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};
```

### 3. Data Validation

Validate extracted data:

```typescript
const validateData = (data, schema) => {
  const errors = [];

  Object.keys(schema).forEach(field => {
    const rule = schema[field];

    if (rule.required && !data[field]) {
      errors.push(\`Missing required field: \${field}\`);
    }

    if (rule.type === 'number' && typeof data[field] !== 'number') {
      data[field] = parseFloat(data[field]);
      if (isNaN(data[field])) {
        errors.push(\`Invalid number for field: \${field}\`);
      }
    }

    if (rule.pattern && !rule.pattern.test(data[field])) {
      errors.push(\`Field \${field} doesn't match pattern\`);
    }
  });

  return { valid: errors.length === 0, errors, data };
};
```

### 4. Caching

Cache scraped data to reduce requests:

```typescript
const cacheData = (url, data, ttl = 3600000) => {
  const cache = {};
  const key = crypto.createHash('md5').update(url).digest('hex');

  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl
  };

  return key;
};

const getCachedData = (url) => {
  const key = crypto.createHash('md5').update(url).digest('hex');
  const cached = cache[key];

  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  return null;
};
```

### 5. Error Recovery

Implement graceful error recovery:

```typescript
const scrapeWithFallback = async (url, primaryMethod, fallbackMethod) => {
  try {
    return await primaryMethod(url);
  } catch (primaryError) {
    console.warn('Primary method failed, trying fallback');
    try {
      return await fallbackMethod(url);
    } catch (fallbackError) {
      throw new Error(\`Both methods failed: \${primaryError.message}, \${fallbackError.message}\`);
    }
  }
};
```

## Integration Examples

### With Web Search Skill

```typescript
{
  nodes: [
    {
      id: "search",
      type: "function",
      function: "/* perform web search */"
    },
    {
      id: "scrape_results",
      type: "function",
      function: `
        async (state) => {
          // Scrape top search results
          const scrapedData = await Promise.all(
            state.searchResults.slice(0, 10).map(result =>
              scrapeWebPage({ url: result.link, selectors: state.selectors })
            )
          );
          return { scrapedData };
        }
      `
    }
  ],
  edges: [
    { from: "__start__", to: "search" },
    { from: "search", to: "scrape_results" },
    { from: "scrape_results", to: "__end__" }
  ]
}
```

### With Data Analysis Skill

```typescript
{
  nodes: [
    {
      id: "scrape_prices",
      type: "function",
      function: "/* scrape product prices from multiple sites */"
    },
    {
      id: "analyze_prices",
      type: "function",
      function: `
        async (state) => {
          // Analyze price trends
          const analysis = {
            average: calculateAverage(state.scrapedData.map(d => d.price)),
            min: Math.min(...state.scrapedData.map(d => d.price)),
            max: Math.max(...state.scrapedData.map(d => d.price)),
            priceByStore: groupBy(state.scrapedData, 'store')
          };
          return { priceAnalysis: analysis };
        }
      `
    }
  ]
}
```

## Version History

### Version 1.0.0 (2026-02-06)
- Initial release
- Static page scraping with Cheerio
- Dynamic page scraping with Puppeteer
- Table data extraction
- Pagination handling
- Multi-page scraping
- Infinite scroll support
- File and media downloading
- Screenshot capture
- Resource blocking for performance
- Error handling and retry logic
- User agent rotation
- Polite crawling with delays
