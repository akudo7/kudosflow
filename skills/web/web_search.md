---
skill_id: web_search
name: web_search
category: web
version: 1.0.0
description: Comprehensive web search capabilities with multiple search engines, result aggregation, and intelligent filtering
author: SceneGraphManager Team
created: 2026-02-06
updated: 2026-02-06
tags:
  - web
  - search
  - internet
  - research
  - google
  - bing
  - aggregation
requires:
  - axios
  - cheerio
  - node-fetch
dependencies: []
complexity: medium
estimated_tokens: 600-2500
---

# Web Search Skill

## Overview

The Web Search skill provides comprehensive capabilities for searching the web using multiple search engines, aggregating results, and filtering by relevance, date, and other criteria. It supports Google, Bing, DuckDuckGo, and custom search APIs, with built-in rate limiting, caching, and result deduplication.

This skill is essential for research tasks, information gathering, competitive analysis, and staying up-to-date with current events.

## Usage

### Basic Syntax

```typescript
{
  id: "search_web",
  type: "function",
  function: `
    async (state) => {
      const results = await performWebSearch({
        query: state.query,
        engines: state.engines,
        maxResults: state.maxResults
      });
      return { searchResults: results };
    }
  `
}
```

## Examples

### Example 1: Google Custom Search API

```typescript
{
  nodes: [
    {
      id: "google_search",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');

          const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
          const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

          const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              key: apiKey,
              cx: searchEngineId,
              q: state.query,
              num: state.maxResults || 10,
              start: state.startIndex || 1,
              dateRestrict: state.dateRestrict, // e.g., 'd[1-7]' for last week
              sort: state.sort, // e.g., 'date' for date-sorted
              fileType: state.fileType, // e.g., 'pdf', 'doc'
              siteSearch: state.siteSearch, // restrict to specific domain
              siteSearchFilter: state.siteSearchFilter // 'i' (include) or 'e' (exclude)
            }
          });

          const results = response.data.items?.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            displayLink: item.displayLink,
            formattedUrl: item.formattedUrl,
            image: item.pagemap?.cse_image?.[0],
            thumbnail: item.pagemap?.cse_thumbnail?.[0],
            metatags: item.pagemap?.metatags?.[0]
          })) || [];

          return {
            results: results,
            searchInfo: {
              totalResults: response.data.searchInformation.totalResults,
              searchTime: response.data.searchInformation.searchTime,
              formattedTotalResults: response.data.searchInformation.formattedTotalResults
            },
            query: state.query,
            engine: 'google'
          };
        }
      `
    }
  ]
}
```

### Example 2: Bing Search API

```typescript
{
  nodes: [
    {
      id: "bing_search",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');

          const apiKey = process.env.BING_SEARCH_API_KEY;

          const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey
            },
            params: {
              q: state.query,
              count: state.maxResults || 10,
              offset: state.offset || 0,
              mkt: state.market || 'en-US', // Market (language/country)
              safeSearch: state.safeSearch || 'Moderate',
              textDecorations: true,
              textFormat: 'HTML',
              freshness: state.freshness // 'Day', 'Week', 'Month'
            }
          });

          const results = response.data.webPages?.value?.map(item => ({
            title: item.name,
            link: item.url,
            snippet: item.snippet,
            displayUrl: item.displayUrl,
            dateLastCrawled: item.dateLastCrawled,
            language: item.language,
            isNavigational: item.isNavigational
          })) || [];

          return {
            results: results,
            searchInfo: {
              totalEstimatedMatches: response.data.webPages?.totalEstimatedMatches,
              rankingResponse: response.data.rankingResponse
            },
            relatedSearches: response.data.relatedSearches?.value?.map(s => s.text) || [],
            query: state.query,
            engine: 'bing'
          };
        }
      `
    }
  ]
}
```

### Example 3: Multi-Engine Search with Aggregation

```typescript
{
  nodes: [
    {
      id: "multi_engine_search",
      type: "function",
      function: `
        async (state) => {
          const engines = state.engines || ['google', 'bing'];
          const query = state.query;
          const maxResults = state.maxResults || 10;

          // Search all engines in parallel
          const searchPromises = engines.map(async (engine) => {
            try {
              switch (engine) {
                case 'google':
                  return await googleSearch(query, maxResults);
                case 'bing':
                  return await bingSearch(query, maxResults);
                case 'duckduckgo':
                  return await duckDuckGoSearch(query, maxResults);
                default:
                  return { results: [], engine };
              }
            } catch (error) {
              console.error(\`Error searching \${engine}:\`, error.message);
              return { results: [], engine, error: error.message };
            }
          });

          const engineResults = await Promise.all(searchPromises);

          // Aggregate and deduplicate results
          const allResults = engineResults.flatMap(er =>
            er.results.map(r => ({ ...r, source: er.engine }))
          );

          // Deduplicate by URL
          const uniqueResults = [];
          const seenUrls = new Set();

          allResults.forEach(result => {
            const normalizedUrl = normalizeUrl(result.link);
            if (!seenUrls.has(normalizedUrl)) {
              seenUrls.add(normalizedUrl);
              uniqueResults.push(result);
            }
          });

          // Score and rank results
          const rankedResults = uniqueResults.map(result => {
            let score = 0;

            // Boost results that appear in multiple engines
            const appearances = allResults.filter(r =>
              normalizeUrl(r.link) === normalizeUrl(result.link)
            ).length;
            score += appearances * 10;

            // Boost by position in original results
            score += (maxResults - allResults.indexOf(result)) / maxResults * 5;

            // Boost by query term matches in title
            const titleMatches = countQueryMatches(result.title, query);
            score += titleMatches * 3;

            return { ...result, score };
          });

          // Sort by score
          rankedResults.sort((a, b) => b.score - a.score);

          return {
            results: rankedResults.slice(0, state.maxResults || 20),
            metadata: {
              query: query,
              enginesUsed: engines,
              totalResults: allResults.length,
              uniqueResults: uniqueResults.length,
              deduplicationRate: ((allResults.length - uniqueResults.length) / allResults.length * 100).toFixed(1) + '%'
            }
          };
        }
      `
    }
  ]
}
```

### Example 4: Search with Filtering and Date Range

```typescript
{
  nodes: [
    {
      id: "filtered_search",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');

          // Perform search
          const searchResults = await performSearch(state.query, state.engine);

          // Apply filters
          let filtered = searchResults.results;

          // Date filter
          if (state.dateRange) {
            const { start, end } = state.dateRange;
            filtered = filtered.filter(result => {
              const date = new Date(result.dateLastCrawled || result.publishedDate);
              return date >= new Date(start) && date <= new Date(end);
            });
          }

          // Domain filter
          if (state.includeDomains) {
            filtered = filtered.filter(result =>
              state.includeDomains.some(domain => result.link.includes(domain))
            );
          }

          if (state.excludeDomains) {
            filtered = filtered.filter(result =>
              !state.excludeDomains.some(domain => result.link.includes(domain))
            );
          }

          // Keyword filter
          if (state.requiredKeywords) {
            filtered = filtered.filter(result => {
              const text = (result.title + ' ' + result.snippet).toLowerCase();
              return state.requiredKeywords.every(keyword =>
                text.includes(keyword.toLowerCase())
              );
            });
          }

          if (state.excludeKeywords) {
            filtered = filtered.filter(result => {
              const text = (result.title + ' ' + result.snippet).toLowerCase();
              return !state.excludeKeywords.some(keyword =>
                text.includes(keyword.toLowerCase())
              );
            });
          }

          // File type filter
          if (state.fileTypes) {
            filtered = filtered.filter(result =>
              state.fileTypes.some(type => result.link.endsWith('.' + type))
            );
          }

          // Sort results
          if (state.sortBy === 'relevance') {
            // Already sorted by search engine
          } else if (state.sortBy === 'date') {
            filtered.sort((a, b) => {
              const dateA = new Date(a.dateLastCrawled || a.publishedDate || 0);
              const dateB = new Date(b.dateLastCrawled || b.publishedDate || 0);
              return dateB - dateA;
            });
          } else if (state.sortBy === 'title') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
          }

          return {
            results: filtered,
            metadata: {
              originalCount: searchResults.results.length,
              filteredCount: filtered.length,
              filtersApplied: {
                dateRange: !!state.dateRange,
                domainFilters: !!(state.includeDomains || state.excludeDomains),
                keywordFilters: !!(state.requiredKeywords || state.excludeKeywords),
                fileTypeFilter: !!state.fileTypes
              }
            }
          };
        }
      `
    }
  ]
}
```

### Example 5: Search with Caching and Rate Limiting

```typescript
{
  nodes: [
    {
      id: "cached_search",
      type: "function",
      function: `
        async (state) => {
          const crypto = require('crypto');
          const fs = require('fs');
          const path = require('path');

          // Create cache key from query and parameters
          const cacheKey = crypto
            .createHash('md5')
            .update(JSON.stringify({
              query: state.query,
              engine: state.engine,
              maxResults: state.maxResults
            }))
            .digest('hex');

          const cacheDir = path.join(process.cwd(), '.cache', 'searches');
          const cacheFile = path.join(cacheDir, \`\${cacheKey}.json\`);

          // Check cache
          if (fs.existsSync(cacheFile)) {
            const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            const cacheAge = Date.now() - cacheData.timestamp;
            const maxAge = (state.cacheMaxAge || 3600) * 1000; // Default 1 hour

            if (cacheAge < maxAge) {
              console.log('Returning cached results');
              return {
                ...cacheData.results,
                cached: true,
                cacheAge: Math.floor(cacheAge / 1000) + 's'
              };
            }
          }

          // Rate limiting
          const rateLimitFile = path.join(cacheDir, 'rate_limit.json');
          let rateLimitData = { requests: [], limit: 100, window: 3600000 }; // 100 req/hour

          if (fs.existsSync(rateLimitFile)) {
            rateLimitData = JSON.parse(fs.readFileSync(rateLimitFile, 'utf8'));
          }

          // Clean old requests
          const now = Date.now();
          rateLimitData.requests = rateLimitData.requests.filter(
            time => now - time < rateLimitData.window
          );

          // Check rate limit
          if (rateLimitData.requests.length >= rateLimitData.limit) {
            const oldestRequest = Math.min(...rateLimitData.requests);
            const waitTime = rateLimitData.window - (now - oldestRequest);

            return {
              error: 'Rate limit exceeded',
              errorType: 'RATE_LIMIT',
              retryAfter: Math.ceil(waitTime / 1000),
              message: \`Please wait \${Math.ceil(waitTime / 1000)} seconds before searching again\`
            };
          }

          // Perform search
          const results = await performSearch(state.query, state.engine, state.maxResults);

          // Update rate limit
          rateLimitData.requests.push(now);
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          fs.writeFileSync(rateLimitFile, JSON.stringify(rateLimitData));

          // Cache results
          fs.writeFileSync(cacheFile, JSON.stringify({
            timestamp: now,
            results: results
          }));

          return {
            ...results,
            cached: false
          };
        }
      `
    }
  ]
}
```

### Example 6: Semantic Search with Result Enrichment

```typescript
{
  nodes: [
    {
      id: "semantic_search",
      type: "function",
      function: `
        async (state) => {
          const axios = require('axios');
          const cheerio = require('cheerio');

          // Perform initial search
          const searchResults = await performSearch(state.query, state.engine);

          // Enrich results with additional metadata
          const enrichedResults = await Promise.all(
            searchResults.results.slice(0, state.enrichLimit || 10).map(async (result) => {
              try {
                // Fetch page content
                const response = await axios.get(result.link, {
                  timeout: 5000,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
                  }
                });

                const $ = cheerio.load(response.data);

                // Extract metadata
                const metadata = {
                  title: $('meta[property="og:title"]').attr('content') || result.title,
                  description: $('meta[name="description"]').attr('content') || result.snippet,
                  image: $('meta[property="og:image"]').attr('content'),
                  author: $('meta[name="author"]').attr('content'),
                  publishDate: $('meta[property="article:published_time"]').attr('content'),
                  keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()),
                  wordCount: $('body').text().split(/\\s+/).length,
                  readingTime: Math.ceil($('body').text().split(/\\s+/).length / 200) // ~200 words/min
                };

                // Extract main content
                const content = $('article, main, .content, #content').first().text().trim()
                  .slice(0, 1000); // First 1000 chars

                return {
                  ...result,
                  metadata,
                  content,
                  enriched: true
                };
              } catch (error) {
                console.error(\`Error enriching \${result.link}:\`, error.message);
                return {
                  ...result,
                  enriched: false,
                  enrichmentError: error.message
                };
              }
            })
          );

          return {
            results: enrichedResults,
            metadata: {
              query: state.query,
              totalResults: searchResults.results.length,
              enrichedCount: enrichedResults.filter(r => r.enriched).length
            }
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
| `query` | string | Yes | Search query |
| `engines` | string[] | No | Search engines: ['google', 'bing', 'duckduckgo'] (default: ['google']) |
| `maxResults` | number | No | Maximum results per engine (default: 10) |
| `startIndex` | number | No | Starting index for pagination (default: 1) |
| `offset` | number | No | Offset for pagination (default: 0) |
| `dateRange` | object | No | Date range filter: { start: date, end: date } |
| `dateRestrict` | string | No | Date restriction (e.g., 'd[1-7]' for last week) |
| `freshness` | string | No | Content freshness: 'Day', 'Week', 'Month' |
| `includeDomains` | string[] | No | Include only these domains |
| `excludeDomains` | string[] | No | Exclude these domains |
| `requiredKeywords` | string[] | No | Results must contain these keywords |
| `excludeKeywords` | string[] | No | Exclude results with these keywords |
| `fileTypes` | string[] | No | File type filter: ['pdf', 'doc', 'ppt'] |
| `siteSearch` | string | No | Restrict to specific domain |
| `market` | string | No | Market/language (default: 'en-US') |
| `safeSearch` | string | No | Safe search level: 'Off', 'Moderate', 'Strict' |
| `sortBy` | string | No | Sort order: 'relevance', 'date', 'title' |
| `cacheMaxAge` | number | No | Cache duration in seconds (default: 3600) |
| `enrichLimit` | number | No | Number of results to enrich with metadata (default: 10) |

## Returns

### Success Response

```typescript
{
  results: Array<{
    title: string,           // Page title
    link: string,           // URL
    snippet: string,        // Content snippet
    displayUrl: string,     // Display URL
    source?: string,        // Search engine source
    score?: number,         // Relevance score
    dateLastCrawled?: string,
    publishedDate?: string,
    language?: string,
    image?: string,
    thumbnail?: object,
    metadata?: object,      // Enriched metadata
    content?: string,       // Extracted content
    enriched?: boolean     // Whether metadata was enriched
  }>,
  searchInfo?: {
    totalResults: string,
    searchTime: number,
    totalEstimatedMatches: number
  },
  relatedSearches?: string[],
  metadata?: {
    query: string,
    enginesUsed: string[],
    totalResults: number,
    uniqueResults: number,
    filtersApplied: object
  },
  cached?: boolean,
  cacheAge?: string
}
```

### Error Response

```typescript
{
  error: string,              // Error message
  errorType: string,          // 'API_ERROR', 'RATE_LIMIT', 'NETWORK_ERROR'
  retryAfter?: number,       // Seconds to wait before retry
  details?: any              // Additional error details
}
```

## Error Handling

### Common Errors

1. **API Key Missing/Invalid**
   - Error: Authentication failed
   - Solution: Verify API key is set and valid

2. **Rate Limit Exceeded**
   - Error: Too many requests
   - Solution: Implement caching and rate limiting

3. **Network Timeout**
   - Error: Request timeout
   - Solution: Increase timeout, retry with exponential backoff

4. **Invalid Query**
   - Error: Query contains invalid characters
   - Solution: Sanitize query before searching

5. **No Results Found**
   - Error: Search returned zero results
   - Solution: Suggest alternative queries or broaden search

### Error Handling Example

```typescript
{
  id: "robust_search",
  type: "function",
  function: `
    async (state) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // ms

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Validate query
          if (!state.query || state.query.trim().length === 0) {
            throw new Error('Query cannot be empty');
          }

          // Sanitize query
          const sanitizedQuery = state.query.trim().slice(0, 500);

          // Perform search
          const results = await performSearch(sanitizedQuery, state.engine);

          if (!results.results || results.results.length === 0) {
            console.warn('No results found for query:', sanitizedQuery);
          }

          return {
            success: true,
            ...results,
            attempts: attempt
          };
        } catch (error) {
          console.error(\`Search attempt \${attempt} failed:\`, error.message);

          if (attempt === MAX_RETRIES) {
            return {
              error: error.message,
              errorType: error.response?.status === 429 ? 'RATE_LIMIT' :
                        error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'API_ERROR',
              attempts: attempt,
              details: error.response?.data
            };
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }
  `
}
```

## Best Practices

### 1. Query Optimization

Optimize queries for better results:

```typescript
const optimizeQuery = (query) => {
  // Remove extra whitespace
  query = query.trim().replace(/\\s+/g, ' ');

  // Add quotes for exact phrases
  if (query.includes(' ') && !query.includes('"')) {
    query = \`"\${query}"\`;
  }

  // Add site restriction for specific domains
  // query += ' site:example.com';

  return query;
};
```

### 2. Result Deduplication

Implement robust deduplication:

```typescript
const normalizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Remove www, query params, fragments
    return parsed.hostname.replace('www.', '') + parsed.pathname.replace(/\\/$/, '');
  } catch {
    return url;
  }
};
```

### 3. Caching Strategy

Implement intelligent caching:

```typescript
const getCacheKey = (query, params) => {
  return crypto
    .createHash('md5')
    .update(JSON.stringify({ query, ...params }))
    .digest('hex');
};

const shouldRefreshCache = (cacheAge, contentType) => {
  const maxAge = {
    news: 300,        // 5 minutes
    general: 3600,    // 1 hour
    reference: 86400  // 24 hours
  };
  return cacheAge > (maxAge[contentType] || maxAge.general);
};
```

### 4. Rate Limiting

Implement fair rate limiting:

```typescript
class RateLimiter {
  constructor(limit = 100, window = 3600000) {
    this.limit = limit;
    this.window = window;
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);

    if (this.requests.length >= this.limit) {
      const waitTime = this.window - (now - this.requests[0]);
      throw new Error(\`Rate limit exceeded. Wait \${waitTime}ms\`);
    }

    this.requests.push(now);
  }
}
```

### 5. Result Relevance Scoring

Score results for better ranking:

```typescript
const scoreResult = (result, query) => {
  let score = 0;

  // Title match
  const titleMatches = countMatches(result.title, query);
  score += titleMatches * 3;

  // Snippet match
  const snippetMatches = countMatches(result.snippet, query);
  score += snippetMatches * 2;

  // Domain authority (simplified)
  const topDomains = ['wikipedia.org', 'github.com', 'stackoverflow.com'];
  if (topDomains.some(d => result.link.includes(d))) {
    score += 5;
  }

  // Freshness
  if (result.publishedDate) {
    const ageInDays = (Date.now() - new Date(result.publishedDate)) / 86400000;
    score += Math.max(0, 10 - ageInDays / 30);
  }

  return score;
};
```

## Integration Examples

### With Web Scraping Skill

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
          // Scrape top results for detailed content
          const scrapedContent = await Promise.all(
            state.results.slice(0, 5).map(result =>
              scrapeWebPage(result.link)
            )
          );
          return { scrapedContent };
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
      id: "search_trends",
      type: "function",
      function: `
        async (state) => {
          // Search for trend data over time
          const queries = state.keywords.map(keyword =>
            performSearch(keyword + ' ' + state.year, 'google')
          );
          const results = await Promise.all(queries);
          return { trendData: results };
        }
      `
    },
    {
      id: "analyze_trends",
      type: "function",
      function: "/* analyze search result trends */"
    }
  ]
}
```

## Version History

### Version 1.0.0 (2026-02-06)
- Initial release
- Google Custom Search API integration
- Bing Search API integration
- Multi-engine search with aggregation
- Result deduplication
- Advanced filtering (date, domain, keywords, file type)
- Caching system
- Rate limiting
- Result enrichment with metadata
- Semantic search capabilities
