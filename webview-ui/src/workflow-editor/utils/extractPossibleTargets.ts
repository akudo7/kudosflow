/**
 * Implementation コードから possibleTargets を抽出
 * - return '文字列リテラル' パターン
 * - new Send('ノード名', ...) パターン (LangGraph fan-out)
 */
export function extractPossibleTargets(implementation: string): string[] | null {
  const targets: string[] = [];

  // return 'string' または return "string" パターンをマッチ
  const returnPattern = /return\s+['"]([^'"]+)['"]/g;
  for (const m of implementation.matchAll(returnPattern)) {
    targets.push(m[1]);
  }

  // new Send('node', ...) または new Send("node", ...) パターンをマッチ
  const sendPattern = /new\s+Send\(\s*['"]([^'"]+)['"]/g;
  for (const m of implementation.matchAll(sendPattern)) {
    targets.push(m[1]);
  }

  if (targets.length === 0) {
    return null;
  }

  return [...new Set(targets)];
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
