/**
 * Implementation コードから possibleTargets を抽出
 * シンプルな return '文字列リテラル' パターンのみサポート
 */
export function extractPossibleTargets(implementation: string): string[] | null {
  // return 'string' または return "string" パターンをマッチ
  const returnPattern = /return\s+['"]([^'"]+)['"]/g;
  const matches = [...implementation.matchAll(returnPattern)];

  if (matches.length === 0) {
    return null; // return 文が見つからない
  }

  // 重複を削除してユニークな targets を抽出
  const targets = matches.map(m => m[1]);
  const uniqueTargets = [...new Set(targets)];

  return uniqueTargets;
}

/**
 * 抽出が成功したかを検証
 */
export function validateExtraction(
  implementation: string,
  extractedTargets: string[] | null
): { valid: boolean; error?: string } {
  // 変数を使用した return を検出
  if (/return\s+[a-zA-Z_$]/.test(implementation) &&
      !/return\s+['"]/.test(implementation)) {
    return {
      valid: false,
      error: 'Variables in return statements are not supported. Use return "literalString" instead.'
    };
  }

  if (!extractedTargets || extractedTargets.length === 0) {
    return {
      valid: false,
      error: 'Could not extract possibleTargets from implementation. Ensure all return statements use string literals.'
    };
  }

  return { valid: true };
}
