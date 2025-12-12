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
