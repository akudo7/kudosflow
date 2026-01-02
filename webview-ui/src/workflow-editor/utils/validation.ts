import { ReactFlowNode, A2AServerConfig, WorkflowNode, ConditionalEdgeCondition, ModelConfig, MCPServerConfig } from '../types/workflow.types';
import { extractPossibleTargets, validateExtraction } from './extractPossibleTargets';

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
      error: 'Please enter a node name',
    };
  }

  const trimmedName = newName.trim();

  // Reserved words check
  if (RESERVED_NODE_NAMES.includes(trimmedName)) {
    return {
      valid: false,
      error: `Reserved word "${trimmedName}" cannot be used`,
    };
  }

  // Uniqueness check
  const isDuplicate = nodes.some(
    (node) => node.id !== excludeId && node.id === trimmedName
  );
  if (isDuplicate) {
    return {
      valid: false,
      error: `Node name "${trimmedName}" is already in use`,
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
      error: `annotationRef "${annotationRef}" must match stateAnnotation.name "${stateAnnotationName}"`,
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
 * Check if a string is a valid JavaScript identifier
 * @param name - The name to check
 * @returns boolean
 */
export function isValidJSIdentifier(name: string): boolean {
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  return jsIdentifierRegex.test(name) && !isReservedKeyword(name);
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
      error: 'Please enter a field name',
    };
  }

  const trimmedName = fieldName.trim();

  // JavaScript identifier validation (must start with letter, $, or _, followed by letters, digits, $, or _)
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(trimmedName)) {
    return {
      valid: false,
      error: 'Must be a valid JavaScript identifier (letters, numbers, $, _ only)',
    };
  }

  // Reserved keywords check
  if (isReservedKeyword(trimmedName)) {
    return {
      valid: false,
      error: `Reserved word "${trimmedName}" cannot be used`,
    };
  }

  // Uniqueness check
  if (excludeField !== trimmedName && trimmedName in existingFields) {
    return {
      valid: false,
      error: `Field name "${trimmedName}" is already in use`,
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
      error: 'Please enter a parameter name',
    };
  }

  const trimmedName = name.trim();

  // Valid JS identifier check
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(trimmedName)) {
    return {
      valid: false,
      error: 'Must be a valid JavaScript identifier (letters, numbers, $, _ only)',
    };
  }

  // Reserved keywords check
  if (isReservedKeyword(trimmedName)) {
    return {
      valid: false,
      error: `Reserved word "${trimmedName}" cannot be used`,
    };
  }

  // Uniqueness check
  const duplicates = existingParameters.filter(
    (p, i) => i !== excludeIndex && p.name === trimmedName
  ).length;
  if (duplicates > 0) {
    return {
      valid: false,
      error: 'Parameter name is duplicated',
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
      error: 'Please enter an output key',
    };
  }

  const trimmedKey = key.trim();

  // Valid JS identifier check
  const jsIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!jsIdentifierRegex.test(trimmedKey)) {
    return {
      valid: false,
      error: 'Must be a valid JavaScript identifier (letters, numbers, $, _ only)',
    };
  }

  // Reserved keywords check
  if (isReservedKeyword(trimmedKey)) {
    return {
      valid: false,
      error: `Reserved word "${trimmedKey}" cannot be used`,
    };
  }

  // Uniqueness check
  const keys = Object.keys(existingOutput).filter((k) => k !== excludeKey);
  if (keys.includes(trimmedKey)) {
    return {
      valid: false,
      error: 'Output key is duplicated',
    };
  }

  return { valid: true };
}

/**
 * Validate A2A Server configuration
 * @param server - The A2A server configuration to validate
 * @returns ValidationResult
 */
export function validateA2AClient(server: A2AServerConfig): ValidationResult {
  // Check cardUrl exists
  if (!server.cardUrl || server.cardUrl.trim() === '') {
    return {
      valid: false,
      error: 'Please enter a card URL',
    };
  }

  // Check cardUrl is valid URL format
  try {
    const url = new URL(server.cardUrl);

    // Check protocol is http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Card URL must start with http or https',
      };
    }

    // Check URL format matches agent.json pattern
    if (!server.cardUrl.includes('agent.json')) {
      return {
        valid: false,
        error: 'Card URL must include an agent.json endpoint',
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  // Check timeout is positive number
  if (typeof server.timeout !== 'number' || server.timeout <= 0) {
    return {
      valid: false,
      error: 'Timeout must be a positive number',
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
      error: 'Node type is not "ToolNode"',
    };
  }

  // Check useA2AClients is boolean
  if (node.useA2AClients !== undefined && typeof node.useA2AClients !== 'boolean') {
    return {
      valid: false,
      error: 'useA2AClients must be a boolean',
    };
  }

  // ToolNode should not have handler property
  if (node.handler) {
    return {
      valid: false,
      error: 'ToolNode cannot have a handler property',
    };
  }

  // Warn if useA2AClients is true but no A2A clients defined
  if (node.useA2AClients && !workflowHasA2AClients) {
    return {
      valid: false,
      error: 'useA2AClients is true, but no A2A clients are defined in the workflow',
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
      error: 'Please enter a condition name',
    };
  }

  // Check condition.handler exists
  if (!condition.handler) {
    return {
      valid: false,
      error: 'Condition handler is not defined',
    };
  }

  // Check handler.parameters is array
  if (!Array.isArray(condition.handler.parameters)) {
    return {
      valid: false,
      error: 'Parameters must be an array',
    };
  }

  // Check handler.function exists
  if (!condition.handler.function || condition.handler.function.trim() === '') {
    return {
      valid: false,
      error: 'Please enter function code',
    };
  }

  // Auto-extract possibleTargets from function
  const extracted = extractPossibleTargets(condition.handler.function);
  const validation = validateExtraction(condition.handler.function, extracted);

  if (!validation.valid) {
    return validation; // 抽出失敗時はエラーを返す
  }

  const targets = extracted!;
  console.log('[Validation] Auto-extracted possibleTargets:', targets);

  // Validate auto-extracted targets
  if (!Array.isArray(targets)) {
    return {
      valid: false,
      error: 'Auto-extracted possibleTargets must be an array',
    };
  }

  // Check all targets are valid node IDs
  const validNodeIds = [...nodeIds, '__end__'];
  for (const target of targets) {
    if (!validNodeIds.includes(target)) {
      return {
        valid: false,
        error: `Invalid target: "${target}" does not exist in the workflow`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate ModelConfig configuration
 * @param model - The model configuration to validate
 * @param a2aClientsExist - Whether the workflow has any A2A clients defined
 * @param mcpServersExist - Whether the workflow has any MCP servers defined
 * @returns ValidationResult
 */
export function validateModelConfig(
  model: ModelConfig,
  a2aClientsExist?: boolean,
  mcpServersExist?: boolean
): ValidationResult {
  // Check model ID exists
  if (!model.id || model.id.trim() === '') {
    return {
      valid: false,
      error: 'Please enter a model ID',
    };
  }

  // Check model type exists
  if (!model.type || model.type.trim() === '') {
    return {
      valid: false,
      error: 'Please select a model type',
    };
  }

  // Check config exists
  if (!model.config) {
    return {
      valid: false,
      error: 'Model configuration is required',
    };
  }

  // Check config.model exists
  if (!model.config.model || model.config.model.trim() === '') {
    return {
      valid: false,
      error: 'Please enter a model name',
    };
  }

  // Check temperature if provided
  if (model.config.temperature !== undefined) {
    if (typeof model.config.temperature !== 'number') {
      return {
        valid: false,
        error: 'Temperature must be a number',
      };
    }
    if (model.config.temperature < 0 || model.config.temperature > 2) {
      return {
        valid: false,
        error: 'Temperature must be between 0 and 2',
      };
    }
  }

  // Warn if bindA2AClients is true but no A2A clients defined
  if (model.bindA2AClients && a2aClientsExist === false) {
    return {
      valid: false,
      error: 'bindA2AClients is true, but no A2A clients are defined in the workflow',
    };
  }

  // Warn if bindMcpServers is true but no MCP servers defined
  if (model.bindMcpServers && mcpServersExist === false) {
    return {
      valid: false,
      error: 'bindMcpServers is true, but no MCP servers are defined in the workflow',
    };
  }

  return { valid: true };
}

/**
 * Validate MCP Server configuration
 * @param server - The MCP server configuration to validate
 * @returns ValidationResult
 */
export function validateMCPServer(server: MCPServerConfig): ValidationResult {
  // Check transport is valid
  if (!server.transport || (server.transport !== 'stdio' && server.transport !== 'sse')) {
    return {
      valid: false,
      error: 'Transport must be "stdio" or "sse"',
    };
  }

  // Validate based on transport type
  if (server.transport === 'stdio') {
    // Check command exists
    if (!server.command || server.command.trim() === '') {
      return {
        valid: false,
        error: 'Please enter a command',
      };
    }

    // Check args is array if provided
    if (server.args !== undefined && !Array.isArray(server.args)) {
      return {
        valid: false,
        error: 'Args must be an array',
      };
    }
  } else if (server.transport === 'sse') {
    // Check URL exists
    if (!server.url || server.url.trim() === '') {
      return {
        valid: false,
        error: 'Please enter a URL',
      };
    }

    // Check URL is valid
    try {
      const url = new URL(server.url);

      // Check protocol is http or https
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return {
          valid: false,
          error: 'URL must start with http or https',
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  return { valid: true };
}
