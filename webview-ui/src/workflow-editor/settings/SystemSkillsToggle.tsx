import React from 'react';

interface SystemSkillsToggleProps {
  /** Whether System Skills are enabled */
  enabled: boolean;

  /** Configuration level (model or node) */
  level: 'model' | 'node';

  /** Callback when toggle state changes */
  onToggle: (enabled: boolean) => void;

  /** Whether the toggle is disabled */
  disabled?: boolean;

  /** Where the setting is inherited from (if applicable) */
  inheritedFrom?: string;
}

/**
 * SystemSkillsToggle Component
 *
 * Reusable component for enabling Claude Code Tools (System Skills) at model or node level.
 * Provides a checkbox with help text and expandable tool list.
 */
export const SystemSkillsToggle: React.FC<SystemSkillsToggleProps> = ({
  enabled,
  level,
  onToggle,
  disabled = false,
  inheritedFrom
}) => {
  const labels = {
    model: 'Bind System Skills',
    node: 'Use System Skills for this Node'
  };

  const helpTexts = {
    model: 'All nodes using this model will have access to System Skills',
    node: 'Override model settings for this specific node'
  };

  return (
    <div className="form-group">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
        />
        {labels[level]}
      </label>

      <p className="help-text">{helpTexts[level]}</p>

      {inheritedFrom && (
        <p className="info-text">
          ℹ️ Currently inherited from: {inheritedFrom}
        </p>
      )}

      {enabled && (
        <details className="tools-details">
          <summary>Available Tools (7)</summary>
          <ul className="tools-list">
            <li><code>read_file</code> - Read files with line numbers</li>
            <li><code>write_file</code> - Create or overwrite files</li>
            <li><code>edit_file</code> - String replacement in files</li>
            <li><code>glob_files</code> - Pattern-based file search</li>
            <li><code>grep_search</code> - Content search with regex</li>
            <li><code>bash_command</code> - Shell command execution</li>
            <li><code>web_fetch</code> - HTTP content fetching</li>
          </ul>
        </details>
      )}
    </div>
  );
};
