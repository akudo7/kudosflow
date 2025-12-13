import { ReactFlowNode } from '../types/workflow.types';

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
