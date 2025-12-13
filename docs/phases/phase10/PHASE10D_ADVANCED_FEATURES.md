# Phase 10D: Advanced Features & Polish

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium
**Priority**: Enhancement

## Overview

Add polish and advanced features to the workflow execution system. This phase enhances user experience with visual feedback, execution history, detailed server information, and configuration options.

## Goal

Provide professional-grade execution experience with:
- Visual feedback on executing nodes
- Execution history (save/load sessions)
- Detailed server status panel
- Execution settings in settings panel
- Keyboard shortcuts
- Status bar integration

## Implementation Tasks

### Task 1: Visual Execution Feedback

Highlight nodes during execution on the React Flow canvas.

#### Implementation (`webview-ui/src/workflow-editor/WorkflowNode.tsx`)

Add execution state visualization (+50 lines):

```typescript
interface WorkflowNodeProps {
  data: WorkflowNodeData;
  isExecuting?: boolean;
  hasExecuted?: boolean;
}

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  data,
  isExecuting = false,
  hasExecuted = false
}) => {
  // Get border color based on execution state
  const getBorderColor = () => {
    if (isExecuting) return '#4caf50'; // Green - currently executing
    if (hasExecuted) return '#2196f3'; // Blue - has executed
    return '#ccc'; // Default
  };

  const getBorderWidth = () => {
    if (isExecuting) return 3;
    if (hasExecuted) return 2;
    return 1;
  };

  return (
    <Box
      sx={{
        border: `${getBorderWidth()}px solid ${getBorderColor()}`,
        borderRadius: 1,
        position: 'relative',
        // ... rest of styles
      }}
    >
      {/* Executing badge */}
      {isExecuting && (
        <Chip
          label="Executing..."
          color="success"
          size="small"
          sx={{
            position: 'absolute',
            top: -12,
            right: 8,
            height: 20,
            fontSize: 10
          }}
        />
      )}

      {/* Node content */}
      {/* ... existing node content */}
    </Box>
  );
};
```

#### Execution Tracker (`webview-ui/src/workflow-editor/ExecutionTracker.tsx`)

Track which nodes have executed (100-120 lines):

```typescript
import { useState, useEffect } from 'react';

export interface ExecutionTrace {
  nodeId: string;
  timestamp: Date;
  status: 'executing' | 'completed' | 'error';
}

export function useExecutionTracker() {
  const [executingNodes, setExecutingNodes] = useState<Set<string>>(new Set());
  const [executedNodes, setExecutedNodes] = useState<Set<string>>(new Set());
  const [trace, setTrace] = useState<ExecutionTrace[]>([]);

  // Listen for execution updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'nodeExecutionStarted') {
        setExecutingNodes(prev => new Set(prev).add(message.nodeId));
        setTrace(prev => [...prev, {
          nodeId: message.nodeId,
          timestamp: new Date(),
          status: 'executing'
        }]);
      }

      if (message.command === 'nodeExecutionCompleted') {
        setExecutingNodes(prev => {
          const next = new Set(prev);
          next.delete(message.nodeId);
          return next;
        });
        setExecutedNodes(prev => new Set(prev).add(message.nodeId));
        setTrace(prev => [...prev, {
          nodeId: message.nodeId,
          timestamp: new Date(),
          status: 'completed'
        }]);
      }

      if (message.command === 'executionComplete') {
        setExecutingNodes(new Set());
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const clear = () => {
    setExecutingNodes(new Set());
    setExecutedNodes(new Set());
    setTrace([]);
  };

  return {
    executingNodes,
    executedNodes,
    trace,
    clear
  };
}
```

### Task 2: Execution History

Save and load chat sessions for later review.

#### Session Storage (`webview-ui/src/workflow-editor/ExecutionHistory.tsx`)

Manage execution history (150-200 lines):

```typescript
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { ChatMessage } from './types/chat.types';

export interface SavedSession {
  id: string;
  workflowPath: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
}

interface ExecutionHistoryProps {
  open: boolean;
  onClose: () => void;
  onLoadSession: (session: SavedSession) => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  open,
  onClose,
  onLoadSession
}) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  // Load sessions from extension
  useEffect(() => {
    if (open) {
      vscode.postMessage({ command: 'getSavedSessions' });
    }
  }, [open]);

  // Listen for saved sessions
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === 'savedSessions') {
        setSessions(message.sessions || []);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDelete = (sessionId: string) => {
    vscode.postMessage({
      command: 'deleteSession',
      sessionId
    });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleLoad = (session: SavedSession) => {
    onLoadSession(session);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Execution History</DialogTitle>
      <DialogContent>
        {sessions.length === 0 ? (
          <Typography color="text.secondary">
            No saved sessions
          </Typography>
        ) : (
          <List>
            {sessions.map((session) => (
              <ListItem
                key={session.id}
                button
                onClick={() => handleLoad(session)}
              >
                <ListItemText
                  primary={session.workflowPath.split('/').pop()}
                  secondary={`${format(session.startTime, 'PPpp')} - ${session.messages.length} messages`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

#### Auto-Save Hook (`webview-ui/src/workflow-editor/hooks/useAutoSave.ts`)

Automatically save sessions (80-100 lines):

```typescript
import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat.types';

export function useAutoSave(
  sessionId: string,
  messages: ChatMessage[],
  workflowPath: string,
  enabled: boolean = true
) {
  const lastSaveRef = useRef<number>(0);
  const saveIntervalMs = 30000; // Save every 30 seconds

  useEffect(() => {
    if (!enabled || messages.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastSaveRef.current < saveIntervalMs) {
      return;
    }

    // Save session
    vscode.postMessage({
      command: 'saveSession',
      session: {
        id: sessionId,
        workflowPath,
        messages,
        startTime: messages[0]?.timestamp,
        endTime: messages[messages.length - 1]?.timestamp
      }
    });

    lastSaveRef.current = now;
  }, [messages, sessionId, workflowPath, enabled]);
}
```

### Task 3: Server Status Panel

Detailed server information dialog.

#### Server Status Dialog (`webview-ui/src/workflow-editor/ServerStatusPanel.tsx`)

Show server endpoints and info (200-250 lines):

```typescript
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ServerStatus } from '../types/workflow.types';

interface ServerStatusPanelProps {
  open: boolean;
  onClose: () => void;
  serverStatus: ServerStatus;
}

export const ServerStatusPanel: React.FC<ServerStatusPanelProps> = ({
  open,
  onClose,
  serverStatus
}) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    vscode.postMessage({
      command: 'showInfo',
      message: 'Copied to clipboard'
    });
  };

  const handleOpen = (url: string) => {
    vscode.postMessage({
      command: 'openExternal',
      url
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        A2A Server Status
        <Chip
          label={serverStatus.state}
          color={serverStatus.state === 'running' ? 'success' : 'default'}
          size="small"
          sx={{ ml: 2 }}
        />
      </DialogTitle>

      <DialogContent>
        {/* Server Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Server Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Port"
                secondary={serverStatus.port || 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Process ID"
                secondary={serverStatus.pid || 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Start Time"
                secondary={
                  serverStatus.startTime
                    ? new Date(serverStatus.startTime).toLocaleString()
                    : 'N/A'
                }
              />
            </ListItem>
          </List>
        </Box>

        {/* Endpoints */}
        {serverStatus.endpoints && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              API Endpoints
            </Typography>
            {Object.entries(serverStatus.endpoints).map(([name, url]) => (
              <Box key={name} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={url}
                    InputProps={{ readOnly: true }}
                  />
                  <IconButton size="small" onClick={() => handleCopy(url)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpen(url)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Error */}
        {serverStatus.error && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Error
            </Typography>
            <Typography variant="body2">{serverStatus.error}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Task 4: Execution Settings

Add execution configuration to settings panel.

#### Settings Tab (`webview-ui/src/workflow-editor/settings/ExecutionSettings.tsx`)

Execution preferences (150-200 lines):

```typescript
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  TextField,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';

export interface ExecutionConfig {
  autoSaveSessions: boolean;
  defaultPort: number;
  showExecutionTrace: boolean;
  autoScrollChat: boolean;
  maxHistorySize: number;
}

interface ExecutionSettingsProps {
  config: ExecutionConfig;
  onChange: (config: ExecutionConfig) => void;
}

export const ExecutionSettings: React.FC<ExecutionSettingsProps> = ({
  config,
  onChange
}) => {
  const handleChange = (key: keyof ExecutionConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Execution Settings
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Chat Settings */}
      <Typography variant="subtitle2" gutterBottom>
        Chat Preferences
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={config.autoScrollChat}
            onChange={(e) => handleChange('autoScrollChat', e.target.checked)}
          />
        }
        label="Auto-scroll chat to bottom"
      />

      <FormControlLabel
        control={
          <Switch
            checked={config.autoSaveSessions}
            onChange={(e) => handleChange('autoSaveSessions', e.target.checked)}
          />
        }
        label="Auto-save execution sessions"
      />

      <FormControl fullWidth sx={{ mt: 2 }}>
        <FormLabel>Maximum history size</FormLabel>
        <TextField
          type="number"
          value={config.maxHistorySize}
          onChange={(e) => handleChange('maxHistorySize', parseInt(e.target.value))}
          inputProps={{ min: 10, max: 1000 }}
        />
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* Server Settings */}
      <Typography variant="subtitle2" gutterBottom>
        Server Preferences
      </Typography>

      <FormControl fullWidth>
        <FormLabel>Default A2A server port</FormLabel>
        <TextField
          type="number"
          value={config.defaultPort}
          onChange={(e) => handleChange('defaultPort', parseInt(e.target.value))}
          inputProps={{ min: 1000, max: 65535 }}
        />
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* Debug Settings */}
      <Typography variant="subtitle2" gutterBottom>
        Debug Options
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={config.showExecutionTrace}
            onChange={(e) => handleChange('showExecutionTrace', e.target.checked)}
          />
        }
        label="Show execution trace on canvas"
      />
    </Box>
  );
};
```

### Task 5: Keyboard Shortcuts

Add keyboard shortcuts for common actions.

#### Shortcut Handler (`webview-ui/src/workflow-editor/hooks/useKeyboardShortcuts.ts`)

Handle keyboard shortcuts (80-100 lines):

```typescript
import { useEffect } from 'react';

export interface ShortcutHandlers {
  onToggleChat?: () => void;
  onSendMessage?: () => void;
  onClearChat?: () => void;
  onStartServer?: () => void;
  onStopServer?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+C - Toggle chat
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handlers.onToggleChat?.();
      }

      // Ctrl+Enter - Send message (when chat input focused)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handlers.onSendMessage?.();
      }

      // Ctrl+Shift+X - Clear chat
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        handlers.onClearChat?.();
      }

      // Ctrl+Shift+R - Start server
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handlers.onStartServer?.();
      }

      // Ctrl+Shift+S - Stop server
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handlers.onStopServer?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

### Task 6: Status Bar Integration

Show execution status in VSCode status bar.

#### Status Bar Manager (`src/execution/StatusBarManager.ts`)

Manage VSCode status bar items (100-150 lines):

```typescript
import * as vscode from 'vscode';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  showExecuting(workflowName: string): void {
    this.statusBarItem.text = `$(sync~spin) Executing: ${workflowName}`;
    this.statusBarItem.tooltip = 'Workflow execution in progress';
    this.statusBarItem.show();
  }

  showServerRunning(port: number): void {
    this.statusBarItem.text = `$(server) A2A Server :${port}`;
    this.statusBarItem.tooltip = 'A2A server is running';
    this.statusBarItem.command = 'kudosflow.showServerStatus';
    this.statusBarItem.show();
  }

  showIdle(): void {
    this.statusBarItem.text = '$(circle-large-outline) Workflow Idle';
    this.statusBarItem.tooltip = 'No active execution';
    this.statusBarItem.hide();
  }

  showError(message: string): void {
    this.statusBarItem.text = `$(error) ${message}`;
    this.statusBarItem.tooltip = 'Execution error';
    this.statusBarItem.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
```

## Files to Create

1. `webview-ui/src/workflow-editor/ExecutionHistory.tsx` (150-200 lines)
2. `webview-ui/src/workflow-editor/ExecutionTracker.tsx` (100-120 lines)
3. `webview-ui/src/workflow-editor/ServerStatusPanel.tsx` (200-250 lines)
4. `webview-ui/src/workflow-editor/settings/ExecutionSettings.tsx` (150-200 lines)
5. `webview-ui/src/workflow-editor/hooks/useAutoSave.ts` (80-100 lines)
6. `webview-ui/src/workflow-editor/hooks/useKeyboardShortcuts.ts` (80-100 lines)
7. `webview-ui/src/workflow-editor/hooks/useExecutionTracker.ts` (100-120 lines)
8. `src/execution/StatusBarManager.ts` (100-150 lines)

## Files to Modify

1. `webview-ui/src/workflow-editor/WorkflowNode.tsx` (+50 lines) - Execution visualization
2. `webview-ui/src/workflow-editor/WorkflowEditor.tsx` (+100 lines) - Integrate all features
3. `webview-ui/src/workflow-editor/WorkflowToolbar.tsx` (+40 lines) - History button
4. `webview-ui/src/workflow-editor/WorkflowSettingsPanel.tsx` (+50 lines) - Execution tab
5. `src/panels/WorkflowEditorPanel.ts` (+80 lines) - Session storage handlers
6. `src/extension.ts` (+30 lines) - Status bar integration

## Testing Checklist

- [ ] Execution visualization highlights correct nodes
- [ ] Execution history saves automatically
- [ ] Saved sessions can be loaded
- [ ] Server status panel displays all info
- [ ] Endpoints can be copied to clipboard
- [ ] Execution settings persist
- [ ] Keyboard shortcuts work
- [ ] Status bar updates correctly
- [ ] No performance impact with large histories
- [ ] Session auto-save doesn't block UI

## Success Criteria

Phase 10D is complete when:

- ✓ Visual execution feedback functional
- ✓ Execution history working
- ✓ Server status panel complete
- ✓ Settings tab functional
- ✓ Keyboard shortcuts enabled
- ✓ Status bar integration working
- ✓ All features polished and intuitive
- ✓ No bugs or UX issues

## Phase 10 Completion

After Phase 10D, all Phase 10 sub-phases are complete. The workflow editor now has full execution capabilities with both A2A server mode and interactive chat mode.
