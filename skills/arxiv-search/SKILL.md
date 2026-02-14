---
name: arxiv-search
description: Search arXiv preprint repository for papers in physics, mathematics, computer science, quantitative biology, and related fields
---

# arXiv Search Skill

Search the arXiv preprint repository for research papers in physics, mathematics, computer science, quantitative biology, and related fields.

## When to Use This Skill

Use this skill when you need to:

- Find preprints and recent research papers before journal publication
- Search for papers in computational biology, bioinformatics, or systems biology
- Access mathematical or statistical methods papers relevant to biology
- Find machine learning papers applied to biological problems
- Get the latest research that may not yet be in PubMed

## Instructions

To search arXiv for papers, follow these steps:

1. **Identify the search query** from the user's request
2. **Determine the number of papers** to retrieve (default: 10, or as specified by user)
3. **Execute the search script** using the `bash_command` tool with this exact command format:

```bash
cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx skills/arxiv-search/arxiv_search.ts "SEARCH_QUERY" --max-papers N
```

Replace:
- `SEARCH_QUERY` with the actual search query (keep quotes)
- `N` with the desired number of papers (e.g., 3, 5, 10)

4. **Parse the results** and present them to the user in a clear format

## Examples

### Example 1: Search for 5 deep learning papers
```bash
cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx skills/arxiv-search/arxiv_search.ts "deep learning drug discovery" --max-papers 5
```

### Example 2: Search for 3 transformer papers
```bash
cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx skills/arxiv-search/arxiv_search.ts "transformers in natural language processing" --max-papers 3
```

### Example 3: Search for protein folding papers (default 10)
```bash
cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx skills/arxiv-search/arxiv_search.ts "protein folding prediction" --max-papers 10
```

## Output Format

The script returns formatted results with:

- **Title**: Paper title
- **Summary**: Abstract/summary text

Each paper is separated by blank lines for readability.

## Features

- **Relevance sorting**: Results ordered by relevance to query
- **Fast retrieval**: Direct API access with no authentication required
- **Simple interface**: Clean, easy-to-parse output
- **No API key required**: Free access to arXiv database

## Notes

- arXiv is particularly strong for:
  - Computer science (cs.LG, cs.AI, cs.CV)
  - Quantitative biology (q-bio)
  - Statistics (stat.ML)
  - Physics and mathematics
- Papers are preprints and may not be peer-reviewed
- Results include both recent uploads and older papers
- Best for computational/theoretical work in biology
