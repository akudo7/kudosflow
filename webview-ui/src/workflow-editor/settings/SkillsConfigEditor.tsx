import React from 'react';
import { SkillsConfig, DEFAULT_SKILLS_CONFIG } from '../types/skills.types';
import './SkillsConfigEditor.css';

interface SkillsConfigEditorProps {
  /** Current skills configuration */
  config: SkillsConfig | undefined;

  /** Callback when configuration is updated */
  onConfigUpdate: (config: SkillsConfig) => void;
}

// Declare vscode API for message posting
declare const vscode: {
  postMessage: (message: any) => void;
};

/**
 * SkillsConfigEditor Component
 *
 * Provides UI for configuring Skills functionality in a workflow.
 * Includes:
 * - Enable/disable toggle
 * - Skills directory path configuration
 * - Backend settings (virtual mode, root directory)
 * - Quick access button to open skills folder in VSCode explorer
 * - Information about using VSCode native features for browsing skills
 */
export const SkillsConfigEditor: React.FC<SkillsConfigEditorProps> = ({
  config,
  onConfigUpdate
}) => {
  const currentConfig: SkillsConfig = config || DEFAULT_SKILLS_CONFIG;

  const handleChange = (updates: Partial<SkillsConfig>) => {
    onConfigUpdate({ ...currentConfig, ...updates });
  };

  const handleBackendChange = (updates: Partial<SkillsConfig['backend']>) => {
    onConfigUpdate({
      ...currentConfig,
      backend: { ...currentConfig.backend, ...updates }
    });
  };

  const openSkillsFolder = () => {
    vscode.postMessage({
      type: 'skills:openFolder',
      path: currentConfig.skillsPath
    });
  };

  return (
    <div className="config-section">
      <h3>Skills Configuration</h3>

      {/* Enable Toggle */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={currentConfig.enabled}
            onChange={(e) => handleChange({ enabled: e.target.checked })}
          />
          Enable Skills
        </label>
        <p className="help-text">
          Enable dynamic skill discovery and loading for this workflow.
          Skills are declarative instructions stored as SKILL.md files that AI agents can discover and execute.
        </p>
      </div>

      {/* Skills Path */}
      {currentConfig.enabled && (
        <>
          <div className="form-group">
            <label>Skills Directory</label>
            <div className="input-with-button">
              <input
                type="text"
                value={currentConfig.skillsPath}
                onChange={(e) => handleChange({ skillsPath: e.target.value })}
                placeholder="skills"
              />
              <button
                onClick={openSkillsFolder}
                className="secondary-button"
                title="Open skills folder in explorer"
              >
                📁 Open
              </button>
            </div>
            <p className="help-text">
              Directory containing SKILL.md files (relative to workspace root)
            </p>
          </div>

          {/* Backend Settings */}
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={currentConfig.backend.virtualMode}
                onChange={(e) => handleBackendChange({ virtualMode: e.target.checked })}
              />
              Virtual Mode
            </label>
            <p className="help-text">
              Enable virtual filesystem for skill discovery (recommended for better performance)
            </p>
          </div>

          <div className="form-group">
            <label>Root Directory</label>
            <input
              type="text"
              value={currentConfig.backend.rootDir}
              onChange={(e) => handleBackendChange({ rootDir: e.target.value })}
              placeholder="."
            />
            <p className="help-text">
              Root directory for skill resolution (relative to workspace root)
            </p>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <p>ℹ️ <strong>Browse and Manage Skills:</strong></p>
            <ul>
              <li>Use VSCode File Explorer to browse <code>{currentConfig.skillsPath}/</code></li>
              <li>Click SKILL.md files to preview in VSCode</li>
              <li>Use Cmd+Shift+F (or Ctrl+Shift+F) to search across all skills</li>
              <li>Create new skills by adding SKILL.md files to the skills directory</li>
            </ul>
          </div>

          {/* Claude Code Tools Info */}
          <div className="info-box">
            <p>ℹ️ <strong>Claude Code Tools:</strong></p>
            <p>
              Skills use 7 specialized tools (read_file, write_file, edit_file, glob_files, grep_search, bash_command, web_fetch).
              Enable these tools at the model or node level to allow skills to perform file operations and system tasks.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
