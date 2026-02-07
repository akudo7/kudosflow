---
skill_id: statistical_analysis
name: statistical_analysis
category: data
version: 1.0.0
description: Advanced statistical analysis including regression, correlation, hypothesis testing, and inferential statistics
author: SceneGraphManager Team
created: 2026-02-06
updated: 2026-02-06
tags:
  - statistics
  - analysis
  - regression
  - testing
  - correlation
  - hypothesis
  - inference
requires:
  - simple-statistics
  - regression-js
  - jstat
  - mathjs
dependencies:
  - data_analysis
complexity: high
estimated_tokens: 1000-4000
---

# Statistical Analysis Skill

## Overview

The Statistical Analysis skill provides advanced statistical capabilities for data analysis, including descriptive statistics, inferential statistics, regression analysis, correlation analysis, hypothesis testing, and probability distributions. It integrates with professional statistical libraries to deliver accurate and reliable results.

This skill is essential for data scientists, researchers, and analysts who need to perform rigorous statistical analysis and make data-driven decisions with confidence.

## Usage

### Basic Syntax

```typescript
{
  id: "perform_analysis",
  type: "function",
  function: `
    async (state) => {
      const results = performStatisticalAnalysis({
        data: state.data,
        analysisType: state.analysisType,
        parameters: state.parameters
      });
      return { statisticalResults: results };
    }
  `
}
```

## Examples

### Example 1: Descriptive Statistics

```typescript
{
  nodes: [
    {
      id: "descriptive_stats",
      type: "function",
      function: `
        async (state) => {
          const ss = require('simple-statistics');

          const data = state.data.map(d => d[state.variable]);

          const results = {
            mean: ss.mean(data),
            median: ss.median(data),
            mode: ss.mode(data),
            standardDeviation: ss.standardDeviation(data),
            variance: ss.variance(data),
            min: ss.min(data),
            max: ss.max(data),
            range: ss.max(data) - ss.min(data),
            quartiles: {
              q1: ss.quantile(data, 0.25),
              q2: ss.quantile(data, 0.5),
              q3: ss.quantile(data, 0.75)
            },
            iqr: ss.quantile(data, 0.75) - ss.quantile(data, 0.25),
            skewness: ss.sampleSkewness(data),
            kurtosis: ss.sampleKurtosis(data)
          };

          // Identify outliers using IQR method
          const q1 = results.quartiles.q1;
          const q3 = results.quartiles.q3;
          const iqr = results.iqr;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;

          results.outliers = data.filter(d => d < lowerBound || d > upperBound);
          results.outlierCount = results.outliers.length;

          // Five number summary
          results.fiveNumberSummary = {
            minimum: results.min,
            q1: results.quartiles.q1,
            median: results.median,
            q3: results.quartiles.q3,
            maximum: results.max
          };

          return {
            descriptiveStats: results,
            sampleSize: data.length
          };
        }
      `
    }
  ]
}
```

### Example 2: Linear Regression

```typescript
{
  nodes: [
    {
      id: "linear_regression",
      type: "function",
      function: `
        async (state) => {
          const regression = require('regression');

          // Prepare data as [x, y] pairs
          const data = state.data.map(d => [
            d[state.xVariable],
            d[state.yVariable]
          ]);

          // Perform linear regression
          const result = regression.linear(data);

          // Calculate R-squared
          const yMean = data.reduce((sum, d) => sum + d[1], 0) / data.length;
          const ssTotal = data.reduce((sum, d) => sum + Math.pow(d[1] - yMean, 2), 0);
          const ssResidual = data.reduce((sum, d, i) => {
            const predicted = result.predict(d[0])[1];
            return sum + Math.pow(d[1] - predicted, 2);
          }, 0);
          const rSquared = 1 - (ssResidual / ssTotal);

          // Calculate residuals
          const residuals = data.map(d => {
            const predicted = result.predict(d[0])[1];
            return d[1] - predicted;
          });

          // Standard error
          const standardError = Math.sqrt(ssResidual / (data.length - 2));

          return {
            regression: {
              equation: result.string,
              slope: result.equation[0],
              intercept: result.equation[1],
              rSquared: rSquared,
              correlation: Math.sqrt(rSquared) * (result.equation[0] > 0 ? 1 : -1),
              standardError: standardError,
              residuals: residuals,
              predictions: data.map(d => ({
                x: d[0],
                actual: d[1],
                predicted: result.predict(d[0])[1],
                residual: d[1] - result.predict(d[0])[1]
              }))
            }
          };
        }
      `
    }
  ]
}
```

### Example 3: Correlation Analysis

```typescript
{
  nodes: [
    {
      id: "correlation_analysis",
      type: "function",
      function: `
        async (state) => {
          const ss = require('simple-statistics');
          const math = require('mathjs');

          // Extract variables
          const variables = state.variables;
          const data = state.data;

          // Create correlation matrix
          const correlationMatrix = {};

          variables.forEach(var1 => {
            correlationMatrix[var1] = {};
            variables.forEach(var2 => {
              const x = data.map(d => d[var1]);
              const y = data.map(d => d[var2]);

              // Pearson correlation
              const pearson = ss.sampleCorrelation(x, y);

              // Spearman correlation (rank-based)
              const rankX = x.map((val, i) => ({ val, i }))
                .sort((a, b) => a.val - b.val)
                .map((item, rank) => ({ ...item, rank: rank + 1 }))
                .sort((a, b) => a.i - b.i)
                .map(item => item.rank);

              const rankY = y.map((val, i) => ({ val, i }))
                .sort((a, b) => a.val - b.val)
                .map((item, rank) => ({ ...item, rank: rank + 1 }))
                .sort((a, b) => a.i - b.i)
                .map(item => item.rank);

              const spearman = ss.sampleCorrelation(rankX, rankY);

              // Test significance
              const n = x.length;
              const t = pearson * Math.sqrt((n - 2) / (1 - pearson * pearson));
              const df = n - 2;

              correlationMatrix[var1][var2] = {
                pearson: pearson,
                spearman: spearman,
                tStatistic: t,
                degreesOfFreedom: df,
                significant: Math.abs(t) > 2.0 // Rough approximation
              };
            });
          });

          // Find strongest correlations
          const correlations = [];
          variables.forEach((var1, i) => {
            variables.slice(i + 1).forEach(var2 => {
              correlations.push({
                var1,
                var2,
                ...correlationMatrix[var1][var2]
              });
            });
          });

          correlations.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson));

          return {
            correlationMatrix,
            strongestCorrelations: correlations.slice(0, 10),
            summary: {
              variableCount: variables.length,
              totalPairs: correlations.length,
              significantPairs: correlations.filter(c => c.significant).length
            }
          };
        }
      `
    }
  ]
}
```

### Example 4: Hypothesis Testing (t-test)

```typescript
{
  nodes: [
    {
      id: "t_test",
      type: "function",
      function: `
        async (state) => {
          const ss = require('simple-statistics');
          const jstat = require('jstat');

          const group1 = state.data.filter(d => d[state.groupVar] === state.group1Value)
            .map(d => d[state.testVar]);
          const group2 = state.data.filter(d => d[state.groupVar] === state.group2Value)
            .map(d => d[state.testVar]);

          // Calculate means and standard deviations
          const mean1 = ss.mean(group1);
          const mean2 = ss.mean(group2);
          const sd1 = ss.standardDeviation(group1);
          const sd2 = ss.standardDeviation(group2);
          const n1 = group1.length;
          const n2 = group2.length;

          // Independent samples t-test
          const pooledSD = Math.sqrt(
            ((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2)
          );

          const tStatistic = (mean1 - mean2) / (pooledSD * Math.sqrt(1/n1 + 1/n2));
          const df = n1 + n2 - 2;

          // Calculate p-value (two-tailed)
          const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStatistic), df));

          // Effect size (Cohen's d)
          const cohensD = (mean1 - mean2) / pooledSD;

          // Confidence interval
          const tCritical = jstat.studentt.inv(0.975, df); // 95% CI
          const marginOfError = tCritical * pooledSD * Math.sqrt(1/n1 + 1/n2);
          const ciLower = (mean1 - mean2) - marginOfError;
          const ciUpper = (mean1 - mean2) + marginOfError;

          return {
            tTest: {
              groups: {
                group1: { name: state.group1Value, n: n1, mean: mean1, sd: sd1 },
                group2: { name: state.group2Value, n: n2, mean: mean2, sd: sd2 }
              },
              statistics: {
                tStatistic: tStatistic,
                degreesOfFreedom: df,
                pValue: pValue,
                significant: pValue < (state.alpha || 0.05),
                alpha: state.alpha || 0.05
              },
              effectSize: {
                cohensD: cohensD,
                interpretation: Math.abs(cohensD) < 0.2 ? 'small' :
                               Math.abs(cohensD) < 0.5 ? 'medium' : 'large'
              },
              confidenceInterval: {
                level: 0.95,
                lower: ciLower,
                upper: ciUpper,
                difference: mean1 - mean2
              }
            }
          };
        }
      `
    }
  ]
}
```

### Example 5: ANOVA (Analysis of Variance)

```typescript
{
  nodes: [
    {
      id: "anova",
      type: "function",
      function: `
        async (state) => {
          const ss = require('simple-statistics');
          const jstat = require('jstat');

          // Group data by factor
          const groups = {};
          state.data.forEach(d => {
            const groupValue = d[state.groupVar];
            if (!groups[groupValue]) {
              groups[groupValue] = [];
            }
            groups[groupValue].push(d[state.testVar]);
          });

          const groupNames = Object.keys(groups);
          const k = groupNames.length; // Number of groups
          const N = state.data.length; // Total sample size

          // Calculate group means
          const groupStats = {};
          groupNames.forEach(name => {
            groupStats[name] = {
              n: groups[name].length,
              mean: ss.mean(groups[name]),
              sd: ss.standardDeviation(groups[name])
            };
          });

          // Grand mean
          const grandMean = ss.mean(state.data.map(d => d[state.testVar]));

          // Sum of Squares Between Groups (SSB)
          const ssb = groupNames.reduce((sum, name) => {
            const n = groupStats[name].n;
            const mean = groupStats[name].mean;
            return sum + n * Math.pow(mean - grandMean, 2);
          }, 0);

          // Sum of Squares Within Groups (SSW)
          const ssw = groupNames.reduce((sum, name) => {
            const groupMean = groupStats[name].mean;
            return sum + groups[name].reduce((groupSum, value) => {
              return groupSum + Math.pow(value - groupMean, 2);
            }, 0);
          }, 0);

          // Total Sum of Squares (SST)
          const sst = ssb + ssw;

          // Degrees of freedom
          const dfBetween = k - 1;
          const dfWithin = N - k;
          const dfTotal = N - 1;

          // Mean Squares
          const msb = ssb / dfBetween;
          const msw = ssw / dfWithin;

          // F-statistic
          const fStatistic = msb / msw;

          // P-value
          const pValue = 1 - jstat.centralF.cdf(fStatistic, dfBetween, dfWithin);

          // Effect size (Eta-squared)
          const etaSquared = ssb / sst;

          return {
            anova: {
              groups: groupStats,
              anovaTable: {
                betweenGroups: {
                  sumOfSquares: ssb,
                  degreesOfFreedom: dfBetween,
                  meanSquare: msb
                },
                withinGroups: {
                  sumOfSquares: ssw,
                  degreesOfFreedom: dfWithin,
                  meanSquare: msw
                },
                total: {
                  sumOfSquares: sst,
                  degreesOfFreedom: dfTotal
                }
              },
              statistics: {
                fStatistic: fStatistic,
                pValue: pValue,
                significant: pValue < (state.alpha || 0.05),
                alpha: state.alpha || 0.05
              },
              effectSize: {
                etaSquared: etaSquared,
                interpretation: etaSquared < 0.01 ? 'small' :
                               etaSquared < 0.06 ? 'medium' : 'large'
              },
              summary: {
                groupCount: k,
                totalSampleSize: N,
                grandMean: grandMean
              }
            }
          };
        }
      `
    }
  ]
}
```

### Example 6: Chi-Square Test

```typescript
{
  nodes: [
    {
      id: "chi_square_test",
      type: "function",
      function: `
        async (state) => {
          const jstat = require('jstat');

          // Create contingency table
          const observed = state.contingencyTable; // 2D array

          // Calculate row and column totals
          const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0));
          const colTotals = observed[0].map((_, colIndex) =>
            observed.reduce((sum, row) => sum + row[colIndex], 0)
          );
          const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

          // Calculate expected frequencies
          const expected = observed.map((row, i) =>
            row.map((_, j) => (rowTotals[i] * colTotals[j]) / grandTotal)
          );

          // Calculate chi-square statistic
          let chiSquare = 0;
          observed.forEach((row, i) => {
            row.forEach((obs, j) => {
              const exp = expected[i][j];
              chiSquare += Math.pow(obs - exp, 2) / exp;
            });
          });

          // Degrees of freedom
          const df = (observed.length - 1) * (observed[0].length - 1);

          // P-value
          const pValue = 1 - jstat.chisquare.cdf(chiSquare, df);

          // Cramér's V (effect size)
          const n = grandTotal;
          const minDim = Math.min(observed.length, observed[0].length);
          const cramersV = Math.sqrt(chiSquare / (n * (minDim - 1)));

          return {
            chiSquareTest: {
              observed: observed,
              expected: expected,
              statistics: {
                chiSquare: chiSquare,
                degreesOfFreedom: df,
                pValue: pValue,
                significant: pValue < (state.alpha || 0.05),
                alpha: state.alpha || 0.05
              },
              effectSize: {
                cramersV: cramersV,
                interpretation: cramersV < 0.1 ? 'small' :
                               cramersV < 0.3 ? 'medium' : 'large'
              },
              totals: {
                rowTotals: rowTotals,
                colTotals: colTotals,
                grandTotal: grandTotal
              }
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
| `data` | array | Yes | Dataset for analysis |
| `analysisType` | string | Yes | Type: 'descriptive', 'regression', 'correlation', 'ttest', 'anova', 'chisquare' |
| `variable` | string | Conditional | Variable for descriptive stats |
| `xVariable` | string | Conditional | Independent variable for regression |
| `yVariable` | string | Conditional | Dependent variable for regression |
| `variables` | string[] | Conditional | Variables for correlation analysis |
| `groupVar` | string | Conditional | Grouping variable for t-test/ANOVA |
| `testVar` | string | Conditional | Test variable for t-test/ANOVA |
| `group1Value` | any | Conditional | First group value for t-test |
| `group2Value` | any | Conditional | Second group value for t-test |
| `contingencyTable` | number[][] | Conditional | Observed frequencies for chi-square |
| `alpha` | number | No | Significance level (default: 0.05) |
| `confidenceLevel` | number | No | Confidence level for intervals (default: 0.95) |

## Returns

### Success Response

```typescript
{
  // Descriptive Statistics
  descriptiveStats?: {
    mean: number,
    median: number,
    mode: number,
    standardDeviation: number,
    variance: number,
    min: number,
    max: number,
    range: number,
    quartiles: { q1: number, q2: number, q3: number },
    iqr: number,
    skewness: number,
    kurtosis: number,
    outliers: number[],
    outlierCount: number,
    fiveNumberSummary: object
  },

  // Regression
  regression?: {
    equation: string,
    slope: number,
    intercept: number,
    rSquared: number,
    correlation: number,
    standardError: number,
    residuals: number[],
    predictions: array
  },

  // Correlation
  correlationMatrix?: object,
  strongestCorrelations?: array,

  // T-Test
  tTest?: {
    groups: object,
    statistics: {
      tStatistic: number,
      degreesOfFreedom: number,
      pValue: number,
      significant: boolean,
      alpha: number
    },
    effectSize: {
      cohensD: number,
      interpretation: string
    },
    confidenceInterval: object
  },

  // ANOVA
  anova?: {
    groups: object,
    anovaTable: object,
    statistics: {
      fStatistic: number,
      pValue: number,
      significant: boolean,
      alpha: number
    },
    effectSize: {
      etaSquared: number,
      interpretation: string
    },
    summary: object
  },

  // Chi-Square
  chiSquareTest?: {
    observed: number[][],
    expected: number[][],
    statistics: {
      chiSquare: number,
      degreesOfFreedom: number,
      pValue: number,
      significant: boolean,
      alpha: number
    },
    effectSize: {
      cramersV: number,
      interpretation: string
    },
    totals: object
  }
}
```

### Error Response

```typescript
{
  error: string,              // Error message
  errorType: string,          // 'DATA_ERROR', 'ANALYSIS_ERROR', 'PARAMETER_ERROR'
  details?: any              // Additional error details
}
```

## Error Handling

### Common Errors

1. **Insufficient Data**
   - Error: Not enough data points for analysis
   - Solution: Ensure sample size meets minimum requirements (typically n > 30)

2. **Invalid Distribution**
   - Error: Data doesn't meet test assumptions
   - Solution: Check normality, homogeneity of variance, independence

3. **Division by Zero**
   - Error: Zero variance in data
   - Solution: Check for constant values, add variation

4. **Missing Values**
   - Error: Null or undefined values in dataset
   - Solution: Clean data before analysis or specify handling strategy

5. **Multicollinearity**
   - Error: Highly correlated independent variables
   - Solution: Remove or combine correlated variables

### Error Handling Example

```typescript
{
  id: "safe_statistical_analysis",
  type: "function",
  function: `
    async (state) => {
      try {
        // Validate sample size
        if (state.data.length < 30) {
          console.warn('Warning: Small sample size (n < 30). Results may be unreliable.');
        }

        // Check for missing values
        const missingCount = state.data.filter(d =>
          d[state.variable] == null
        ).length;

        if (missingCount > 0) {
          throw new Error(\`Found \${missingCount} missing values. Clean data first.\`);
        }

        // Check variance
        const ss = require('simple-statistics');
        const values = state.data.map(d => d[state.variable]);
        const variance = ss.variance(values);

        if (variance === 0) {
          throw new Error('Zero variance detected. All values are identical.');
        }

        // Perform analysis
        const results = performAnalysis(state);

        return {
          success: true,
          ...results
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

### 1. Check Assumptions

Always validate statistical assumptions:

```typescript
const checkNormality = (data) => {
  const ss = require('simple-statistics');
  const skewness = ss.sampleSkewness(data);
  const kurtosis = ss.sampleKurtosis(data);

  return {
    normalityTest: {
      skewness: skewness,
      kurtosis: kurtosis,
      likelyNormal: Math.abs(skewness) < 1 && Math.abs(kurtosis - 3) < 3
    }
  };
};
```

### 2. Report Effect Sizes

Always include effect sizes with hypothesis tests:

```typescript
const reportResults = (test) => {
  return {
    significance: test.pValue < 0.05,
    pValue: test.pValue,
    effectSize: test.cohensD,
    interpretation: `The effect is ${test.effectSize.interpretation} (d = ${test.cohensD.toFixed(2)})`
  };
};
```

### 3. Use Appropriate Tests

Select tests based on data characteristics:

```typescript
const selectTest = (data, groups) => {
  if (groups === 2 && isNormal(data)) return 'ttest';
  if (groups === 2 && !isNormal(data)) return 'mannwhitney';
  if (groups > 2 && isNormal(data)) return 'anova';
  if (groups > 2 && !isNormal(data)) return 'kruskalwallis';
};
```

### 4. Handle Outliers

Implement robust outlier detection:

```typescript
const detectOutliers = (data, method = 'iqr') => {
  const ss = require('simple-statistics');

  if (method === 'iqr') {
    const q1 = ss.quantile(data, 0.25);
    const q3 = ss.quantile(data, 0.75);
    const iqr = q3 - q1;
    return data.filter(d => d < q1 - 1.5 * iqr || d > q3 + 1.5 * iqr);
  }

  if (method === 'zscore') {
    const mean = ss.mean(data);
    const sd = ss.standardDeviation(data);
    return data.filter(d => Math.abs((d - mean) / sd) > 3);
  }
};
```

### 5. Multiple Comparisons Correction

Apply corrections for multiple tests:

```typescript
const bonferroniCorrection = (pValues, alpha = 0.05) => {
  const adjustedAlpha = alpha / pValues.length;
  return pValues.map(p => ({
    original: p,
    adjusted: Math.min(p * pValues.length, 1),
    significant: p < adjustedAlpha
  }));
};
```

## Integration Examples

### With Data Analysis Skill

```typescript
{
  nodes: [
    {
      id: "load_clean",
      type: "function",
      function: "/* load and clean data */"
    },
    {
      id: "descriptive_analysis",
      type: "function",
      function: "/* calculate descriptive statistics */"
    },
    {
      id: "inferential_analysis",
      type: "function",
      function: `
        async (state) => {
          // Perform hypothesis tests based on research question
          const results = {
            tTest: await performTTest(state.cleanedData),
            anova: await performANOVA(state.cleanedData),
            correlation: await analyzeCorrelations(state.cleanedData)
          };
          return { inferentialResults: results };
        }
      `
    }
  ],
  edges: [
    { from: "__start__", to: "load_clean" },
    { from: "load_clean", to: "descriptive_analysis" },
    { from: "descriptive_analysis", to: "inferential_analysis" },
    { from: "inferential_analysis", to: "__end__" }
  ]
}
```

### With Visualization Skill

```typescript
{
  nodes: [
    {
      id: "statistical_tests",
      type: "function",
      function: "/* perform statistical tests */"
    },
    {
      id: "visualize_results",
      type: "function",
      function: `
        async (state) => {
          // Create visualizations of statistical results
          const charts = [
            await createBoxPlot(state.data, state.groups),
            await createQQPlot(state.residuals),
            await createScatterPlotWithRegression(state.data, state.regression)
          ];
          return { visualizations: charts };
        }
      `
    }
  ]
}
```

## Version History

### Version 1.0.0 (2026-02-06)
- Initial release
- Descriptive statistics
- Linear regression analysis
- Correlation analysis (Pearson, Spearman)
- Independent samples t-test
- One-way ANOVA
- Chi-square test of independence
- Effect size calculations
- Confidence intervals
- Hypothesis testing framework
