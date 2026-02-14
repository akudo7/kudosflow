/**
 * Skills Configuration Types
 *
 * These types define the structure for Skills configuration in the workflow editor.
 * Skills are declarative instructions stored as SKILL.md files that AI agents can
 * discover, load, and execute using Claude Code tools.
 */

/**
 * Skills configuration for a workflow
 */
export interface SkillsConfig {
  /** Enable/disable skills functionality for this workflow */
  enabled: boolean;

  /** Path to skills directory (relative to workspace root) */
  skillsPath: string;

  /** Backend configuration for skill discovery */
  backend: {
    /** Enable virtual filesystem mode (recommended) */
    virtualMode: boolean;

    /** Root directory for skill resolution */
    rootDir: string;
  };
}

/**
 * System Skills configuration for models and nodes
 *
 * Claude Code Tools are 7 specialized tools for AI agents:
 * - read_file: Read files with line numbers
 * - write_file: Create or overwrite files
 * - edit_file: String replacement in files
 * - glob_files: Pattern-based file search
 * - grep_search: Content search with regex
 * - bash_command: Shell command execution
 * - web_fetch: HTTP content fetching
 */
export interface SystemSkillsConfig {
  /**
   * Bind System Skills to this model (model-level)
   * When true, all nodes using this model will have access to System Skills
   */
  bindSystemSkills?: boolean;

  /**
   * Use System Skills for this node (node-level)
   * Overrides model-level settings for this specific node
   */
  useSystemSkills?: boolean;
}

/**
 * Default Skills configuration
 */
export const DEFAULT_SKILLS_CONFIG: SkillsConfig = {
  enabled: false,
  skillsPath: 'skills',
  backend: {
    virtualMode: true,
    rootDir: '.'
  }
};
