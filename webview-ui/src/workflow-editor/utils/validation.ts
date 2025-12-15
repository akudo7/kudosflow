import { ReactFlowNode, A2AClientConfig, WorkflowNode, ConditionalEdgeCondition } from '../types/workflow.types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Reserved node names
const RESERVED_NODE_NAMES = ['__start__', '__end__'];

/**
 * Validate node name
 * @param newName - The new node name to validate
 * @param nodes - Current list of nodes
 * @param excludeId - Node ID to exclude from uniqueness check (for editing existing node)
 * @returns ValidationResult
 */
export function validateNodeName(
  newName: string,
  nodes: ReactFlowNode[],
  excludeId?: string
): ValidationResult {
  // Empty check
  if (!newName || newName.trim() === '') {
    return {
      valid: false,
      error: 'ノード名を入力してください',
    };
  }

  const trimmedName = newName.trim();

  // Reserved words check
  if (RESERVED_NODE_NAMES.includes(trimmedName)) {
    return {
      valid: false,
      error: `予約語 "${trimmedName}" は使用できません`,
    };
  }

  // Uniqueness check
  const isDuplicate = nodes.some(
    (node) => node.id !== excludeId && node.id === trimmedName
  );
  if (isDuplicate) {
    return {
      valid: false,
      error: `ノード名 "${trimmedName}" は既に使用されています`,
    };
  }

  return { valid: true };
}

/**
 * Validate StateGraph configuration
 * @param annotationRef - The annotationRef value in stateGraph
 * @param stateAnnotationName - The name value in stateAnnotation
 * @returns ValidationResult
 */
export function validateStateGraph(
  annotationRef: string,
  stateAnnotationName: string
): ValidationResult {
  // Check if annotationRef matches stateAnnotation.name
  if (annotationRef !== stateAnnotationName) {
    return {
      valid: false,
      error: `annotationRef "${annotationRef}" は stateAnnotation.name "${stateAnnotationName}" と一致する必要があります`,
    };
  }

  return { valid: true };
}

// JavaScript reserved keywords
const RESERVED_KEYWORDS = [
  'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'export',
  'extends', 'finally', 'for', 'function', 'if', 'import',
  'in', 'instanceof', 'let', 'new', 'return', 'super',
  'switch', 'this', 'throw', 'try', 'typeof', 'var',
  'void', 'while', 'with', 'yield', 'await', 'enum',
  'implements', 'interface', 'package', 'private', 'protected',
  'public', 'static', 'null', 'true', 'false'
];

/**
 * Check if a string is a reserved JavaScript keyword
 * @param name - The name to check
 * @returns boolean
 */
export function isReservedKeyword(name: string): boolean {
  return RESERVED_KEYWORDS.includes(name);
}

/**
 * Validate annotation field name
 * @param fieldName - The field name to validate
 * @param existingFields - Current annotation fields
 * @param excludeField - Field name to exclude from uniqueness check (for editing existing field)
 * @returns ValidationResult
 */
export function validateFieldName(
  fieldName: string,
  existingFields: Record<string, any>,
  excludeField?: string
): ValidationResult {
  // Empty check
  if (!fieldName || fieldName.trim() === '') {
    return {
      valid: false,
      error: 'フィールド名を入力してください',
    };
  }

  const trimmedName = fieldName.trim();

  // JavaScript identifier validation (must start with letter, $, or _, followed by letters, digits, $, or _)
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(trimmedName)) {
    return {
      valid: false,
      error: '有効なJavaScript識別子である必要があります（英字、数字、$、_ のみ使用可能）',
    };
  }

  // Reserved keywords check
  if (isReservedKeyword(trimmedName)) {
    return {
      valid: false,
      error: `予約語 "${trimmedName}" は使用できません`,
    };
  }

  // Uniqueness check
  if (excludeField !== trimmedName && trimmedName in existingFields) {
    return {
      valid: false,
      error: `フィールド名 "${trimmedName}" は既に使用されています`,
    };
  }

  return { valid: true };
}

/**
 * Validate parameter name
 * @param name - The parameter name to validate
 * @param existingParameters - Current list of parameters
 * @param excludeIndex - Parameter index to exclude from uniqueness check (for editing existing parameter)
 * @returns ValidationResult
 */
export function validateParameterName(
  name: string,
  existingParameters: Array<{ name: string }>,
  excludeIndex?: number
): ValidationResult {
  // Empty check
  if (!name || name.trim() === '') {
    return {
      valid: false,
      error: 'パラメータ名を入力してください',
    };
  }

  const trimmedName = name.trim();

  // Valid JS identifier check
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(trimmedName)) {
    return {
      valid: false,
      error: '有効なJavaScript識別子である必要があります（英字、数字、$、_ のみ使用可能）',
    };
  }

  // Reserved keywords check
  if (isReservedKeyword(trimmedName)) {
    return {
      valid: false,
      error: `予約語 "${trimmedName}" は使用できません`,
    };
  }

  // Uniqueness check
  const duplicates = existingParameters.filter(
    (p, i) => i !== excludeIndex && p.name === trimmedName
  ).length;
  if (duplicates > 0) {
    return {
      valid: false,
      error: 'パラメータ名が重複しています',
    };
  }

  return { valid: true };
}

/**
 * Validate output key
 * @param key - The output key to validate
 * @param existingOutput - Current output record
 * @param excludeKey - Output key to exclude from uniqueness check (for editing existing key)
 * @returns ValidationResult
 */
export function validateOutputKey(
  key: string,
  existingOutput: Record<string, string>,
  excludeKey?: string
): ValidationResult {
  // Empty check
  if (!key || key.trim() === '') {
    return {
      valid: false,
      error: '出力キーを入力してください',
    };
  }

  const trimmedKey = key.trim();

  // Valid JS identifier check
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(trimmedKey)) {
    return {
      valid: false,
      error: '有効なJavaScript識別子である必要があります（英字、数字、$、_ のみ使用可能）',
    };
  }

  // Reserved keywords check
  if (isReservedKeyword(trimmedKey)) {
    return {
      valid: false,
      error: `予約語 "${trimmedKey}" は使用できません`,
    };
  }

  // Uniqueness check
  const keys = Object.keys(existingOutput).filter((k) => k !== excludeKey);
  if (keys.includes(trimmedKey)) {
    return {
      valid: false,
      error: '出力キーが重複しています',
    };
  }

  return { valid: true };
}

/**
 * Validate A2A Client configuration
 * @param client - The A2A client configuration to validate
 * @returns ValidationResult
 */
export function validateA2AClient(client: A2AClientConfig): ValidationResult {
  // Check cardUrl exists
  if (!client.cardUrl || client.cardUrl.trim() === '') {
    return {
      valid: false,
      error: 'cardURLを入力してください',
    };
  }

  // Check cardUrl is valid URL format
  try {
    const url = new URL(client.cardUrl);

    // Check protocol is http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        valid: false,
        error: 'cardURLは http または https で始まる必要があります',
      };
    }

    // Check URL format matches agent.json pattern
    if (!client.cardUrl.includes('agent.json')) {
      return {
        valid: false,
        error: 'cardURLは agent.json エンドポイントを含む必要があります',
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: '有効なURL形式ではありません',
    };
  }

  // Check timeout is positive number
  if (typeof client.timeout !== 'number' || client.timeout <= 0) {
    return {
      valid: false,
      error: 'タイムアウトは正の数値である必要があります',
    };
  }

  return { valid: true };
}

/**
 * Validate ToolNode configuration
 * @param node - The ToolNode to validate
 * @param workflowHasA2AClients - Whether the workflow has any A2A clients defined
 * @returns ValidationResult
 */
export function validateToolNode(node: WorkflowNode, workflowHasA2AClients: boolean): ValidationResult {
  // Check node type is ToolNode
  if (node.type !== 'ToolNode') {
    return {
      valid: false,
      error: 'ノードタイプが "ToolNode" ではありません',
    };
  }

  // Check useA2AClients is boolean
  if (node.useA2AClients !== undefined && typeof node.useA2AClients !== 'boolean') {
    return {
      valid: false,
      error: 'useA2AClientsはboolean型である必要があります',
    };
  }

  // ToolNode should not have function property
  if (node.function) {
    return {
      valid: false,
      error: 'ToolNodeはfunctionプロパティを持つことができません',
    };
  }

  // Warn if useA2AClients is true but no A2A clients defined
  if (node.useA2AClients && !workflowHasA2AClients) {
    return {
      valid: false,
      error: 'useA2AClientsがtrueですが、ワークフローにA2Aクライアントが定義されていません',
    };
  }

  return { valid: true };
}

/**
 * Validate ConditionalEdge configuration
 * @param condition - The conditional edge condition to validate
 * @param nodeIds - List of valid node IDs in the workflow (including __end__)
 * @returns ValidationResult
 */
export function validateConditionalEdge(
  condition: ConditionalEdgeCondition,
  nodeIds: string[]
): ValidationResult {
  // Check condition name exists
  if (!condition.name || condition.name.trim() === '') {
    return {
      valid: false,
      error: '条件名を入力してください',
    };
  }

  // Check condition.function exists
  if (!condition.function) {
    return {
      valid: false,
      error: '条件関数が定義されていません',
    };
  }

  // Check function.parameters is array
  if (!Array.isArray(condition.function.parameters)) {
    return {
      valid: false,
      error: 'パラメータは配列である必要があります',
    };
  }

  // Check function.output is string
  if (typeof condition.function.output !== 'string') {
    return {
      valid: false,
      error: '出力は文字列型である必要があります',
    };
  }

  // Check function.implementation exists
  if (!condition.function.implementation || condition.function.implementation.trim() === '') {
    return {
      valid: false,
      error: '実装コードを入力してください',
    };
  }

  // Validate possibleTargets if present
  if (condition.possibleTargets) {
    if (!Array.isArray(condition.possibleTargets)) {
      return {
        valid: false,
        error: 'possibleTargetsは配列である必要があります',
      };
    }

    // Check all targets are valid node IDs
    const validNodeIds = [...nodeIds, '__end__'];
    for (const target of condition.possibleTargets) {
      if (!validNodeIds.includes(target)) {
        return {
          valid: false,
          error: `無効なターゲット: "${target}" はワークフロー内に存在しません`,
        };
      }
    }
  }

  return { valid: true };
}
