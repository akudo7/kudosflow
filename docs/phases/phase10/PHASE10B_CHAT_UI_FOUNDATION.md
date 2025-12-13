# Phase 10B: Chat UI Foundation

**Status**: ⬜ 未開始
**Time**: 2-3 days
**Complexity**: Medium
**Priority**: High

## Overview

Create chat interface UI for interactive workflow execution. This phase builds the visual components for chat-based workflow interaction, setting the foundation for Phase 10C's execution engine integration.

## Goal

Provide a chat panel UI where users can:
- Send messages to trigger workflow execution
- View workflow responses
- Handle workflow interrupts (user input required)
- See execution history

## Architecture

### Layout Strategy

**Sliding Panel Design** (similar to WorkflowSettingsPanel):
- Width: 400px (fixed, resizable in future)
- Position: Right side overlay
- Animation: Slide in/out with Material-UI Drawer
- Coexistence: Can be open alongside settings panel

### Component Structure

```
WorkflowEditor
├── WorkflowToolbar (+ Chat toggle button)
└── ChatPanel (Drawer)
    ├── ChatHeader
    ├── MessageList
    │   └── ChatMessage (multiple)
    ├── InterruptPrompt (conditional)
    └── ChatInput
```

## Implementation Tasks

### Task 1: Chat Types (`webview-ui/src/workflow-editor/types/chat.types.ts`)

Define chat-related types (30-50 lines):

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'interrupt';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isExecuting: boolean;
  isWaitingForInterrupt: boolean;
  interruptMessage?: string;
  sessionId: string;
}

export interface InterruptPromptProps {
  show: boolean;
  message?: string;
}
```

### Task 2: Chat Panel Component (`webview-ui/src/workflow-editor/ChatPanel.tsx`)

Create main chat panel component (200-250 lines):

```tsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ChatMessage } from './types/chat.types';
import { MessageList } from './MessageList';
import { InterruptPrompt } from './InterruptPrompt';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  workflowPath: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isExecuting: boolean;
  isWaitingForInterrupt: boolean;
  interruptMessage?: string;
  onClearChat: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  open,
  onClose,
  workflowPath,
  messages,
  onSendMessage,
  isExecuting,
  isWaitingForInterrupt,
  interruptMessage,
  onClearChat
}) => {
  const workflowName = workflowPath.split('/').pop() || 'Workflow';

  return (
    <Drawer
      anchor="right"
      open={open}
      variant="persistent"
      sx={{
        width: 400,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 400,
          boxSizing: 'border-box'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chat
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {workflowName}
          </Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={onClearChat}>
            <DeleteIcon />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Message List */}
      <MessageList messages={messages} />

      {/* Interrupt Prompt */}
      <InterruptPrompt
        show={isWaitingForInterrupt}
        message={interruptMessage}
      />

      {/* Input Area */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isExecuting && !isWaitingForInterrupt}
        placeholder={
          isWaitingForInterrupt
            ? "Provide input to continue..."
            : "Type your message..."
        }
      />
    </Drawer>
  );
};
```

### Task 3: Message List (`webview-ui/src/workflow-editor/MessageList.tsx`)

Scrollable message display (80-100 lines):

```tsx
import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { ChatMessage as ChatMessageType } from './types/chat.types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: ChatMessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const listEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      {messages.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">
            Start a conversation to execute the workflow
          </Typography>
        </Box>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
          <div ref={listEndRef} />
        </>
      )}
    </Box>
  );
};
```

### Task 4: Chat Message Component (`webview-ui/src/workflow-editor/ChatMessage.tsx`)

Color-coded message bubbles (80-100 lines):

```tsx
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ChatMessage as ChatMessageType } from './types/chat.types';

export const ChatMessage: React.FC<ChatMessageType> = ({
  role,
  content,
  timestamp
}) => {
  const getMessageStyle = () => {
    switch (role) {
      case 'user':
        return {
          bg: '#1976d2',
          color: 'white',
          align: 'flex-end'
        };
      case 'assistant':
        return {
          bg: '#4caf50',
          color: 'white',
          align: 'flex-start'
        };
      case 'system':
        return {
          bg: '#757575',
          color: 'white',
          align: 'flex-start'
        };
      case 'interrupt':
        return {
          bg: '#ff9800',
          color: 'white',
          align: 'flex-start'
        };
    }
  };

  const style = getMessageStyle();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: style.align,
        mb: 1
      }}
    >
      <Paper
        sx={{
          bgcolor: style.bg,
          color: style.color,
          p: 1.5,
          maxWidth: '80%',
          borderRadius: 2
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.7,
            display: 'block',
            mt: 0.5,
            textAlign: role === 'user' ? 'right' : 'left'
          }}
        >
          {format(timestamp, 'HH:mm:ss')}
        </Typography>
      </Paper>
    </Box>
  );
};
```

### Task 5: Chat Input Area (`webview-ui/src/workflow-editor/ChatInput.tsx`)

Multi-line input with send button (80-100 lines):

```tsx
import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid #e0e0e0',
        bgcolor: 'background.paper'
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        variant="outlined"
        size="small"
      />
      <Button
        fullWidth
        variant="contained"
        endIcon={<SendIcon />}
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        sx={{ mt: 1 }}
      >
        Send
      </Button>
    </Box>
  );
};
```

### Task 6: Interrupt Prompt (`webview-ui/src/workflow-editor/InterruptPrompt.tsx`)

Highlighted prompt for user input (50-70 lines):

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface InterruptPromptProps {
  show: boolean;
  message?: string;
}

export const InterruptPrompt: React.FC<InterruptPromptProps> = ({
  show,
  message
}) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        p: 2,
        mx: 2,
        bgcolor: '#fff3e0',
        borderLeft: '4px solid #ff9800',
        borderRadius: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <WarningIcon sx={{ color: '#ff9800', mr: 1 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          User Input Required
        </Typography>
      </Box>
      <Typography variant="body2">
        {message || 'Please provide input to continue workflow execution'}
      </Typography>
    </Box>
  );
};
```

### Task 7: Chat Toggle Button (`webview-ui/src/workflow-editor/WorkflowToolbar.tsx`)

Add chat toggle to toolbar (+40 lines):

```tsx
import ChatIcon from '@mui/icons-material/Chat';
import { Badge } from '@mui/material';

{/* Chat Toggle */}
<IconButton
  onClick={handleToggleChat}
  color={showChat ? 'primary' : 'default'}
  size="small"
>
  <Badge badgeContent={unreadCount} color="error">
    <ChatIcon />
  </Badge>
</IconButton>
```

### Task 8: Chat State Management (`webview-ui/src/workflow-editor/WorkflowEditor.tsx`)

Integrate chat state (+150 lines):

```typescript
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatState } from './types/chat.types';

// Chat state
const [showChat, setShowChat] = useState(false);
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
const [isExecuting, setIsExecuting] = useState(false);
const [isWaitingForInterrupt, setIsWaitingForInterrupt] = useState(false);
const [interruptMessage, setInterruptMessage] = useState('');
const [sessionId] = useState(() => uuidv4());
const [unreadCount, setUnreadCount] = useState(0);

// Toggle chat panel
const handleToggleChat = () => {
  setShowChat(!showChat);
  if (!showChat) {
    setUnreadCount(0); // Clear unread when opening
  }
};

// Send message handler
const handleSendMessage = (message: string) => {
  // Add user message to UI
  const userMessage: ChatMessage = {
    id: uuidv4(),
    role: 'user',
    content: message,
    timestamp: new Date()
  };
  setChatMessages(prev => [...prev, userMessage]);

  // Send to extension
  if (isWaitingForInterrupt) {
    // Resume workflow with user input
    vscode.postMessage({
      command: 'resumeWorkflow',
      input: message,
      sessionId
    });
  } else {
    // Start new execution
    vscode.postMessage({
      command: 'executeWorkflow',
      input: message,
      sessionId
    });
  }

  setIsExecuting(true);
};

// Clear chat
const handleClearChat = () => {
  setChatMessages([]);
  setIsExecuting(false);
  setIsWaitingForInterrupt(false);
  setInterruptMessage('');
};

// Message listener
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;

    switch (message.command) {
      case 'executionMessage':
        const newMessage: ChatMessage = {
          id: uuidv4(),
          role: message.role,
          content: message.content,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, newMessage]);

        // Increment unread if chat is closed
        if (!showChat) {
          setUnreadCount(prev => prev + 1);
        }
        break;

      case 'interruptRequired':
        setIsWaitingForInterrupt(true);
        setInterruptMessage(message.message);
        setIsExecuting(false);
        break;

      case 'executionComplete':
        setIsExecuting(false);
        setIsWaitingForInterrupt(false);
        break;

      case 'executionError':
        setIsExecuting(false);
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'system',
          content: `Error: ${message.error}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [showChat]);
```

## Files to Create

1. `webview-ui/src/workflow-editor/types/chat.types.ts` (30-50 lines)
2. `webview-ui/src/workflow-editor/ChatPanel.tsx` (200-250 lines)
3. `webview-ui/src/workflow-editor/MessageList.tsx` (80-100 lines)
4. `webview-ui/src/workflow-editor/ChatMessage.tsx` (80-100 lines)
5. `webview-ui/src/workflow-editor/ChatInput.tsx` (80-100 lines)
6. `webview-ui/src/workflow-editor/InterruptPrompt.tsx` (50-70 lines)

## Files to Modify

1. `webview-ui/src/workflow-editor/WorkflowToolbar.tsx` (+40 lines) - Chat toggle button
2. `webview-ui/src/workflow-editor/WorkflowEditor.tsx` (+150 lines) - Chat state and integration
3. `webview-ui/src/workflow-editor/types/workflow.types.ts` (+20 lines) - Export chat types

## Dependencies

Add to `webview-ui/package.json`:
```json
{
  "dependencies": {
    "uuid": "^9.0.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```

## Testing Checklist

- [ ] Chat panel opens/closes smoothly
- [ ] Chat toggle button highlights when open
- [ ] Message input field works correctly
- [ ] Enter key sends message (Shift+Enter for new line)
- [ ] Messages display with correct colors (user=blue, assistant=green, system=gray, interrupt=orange)
- [ ] Timestamps display correctly
- [ ] Interrupt prompt displays when needed
- [ ] Input disabled during execution (except during interrupt)
- [ ] Auto-scroll to bottom on new messages
- [ ] Clear chat button works
- [ ] Unread badge shows when chat is closed
- [ ] Chat panel coexists with settings panel
- [ ] Responsive layout (no overflow issues)

## Success Criteria

Phase 10B is complete when:

- ✓ Chat panel UI fully functional
- ✓ Messages display correctly
- ✓ Input handling works as expected
- ✓ Interrupt prompts visible
- ✓ Toggle button functional
- ✓ Unread badge works
- ✓ Clear chat functionality
- ✓ No layout issues
- ✓ Ready for execution engine integration (Phase 10C)

## Next Phase

After completing Phase 10B, proceed to [Phase 10C: Workflow Execution Engine Integration](PHASE10C_EXECUTION_ENGINE.md) to connect the chat UI with actual workflow execution.
