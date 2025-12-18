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
        const target = e.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
          e.preventDefault();
          handlers.onSendMessage?.();
        }
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

      // Ctrl+Shift+S - Stop server (override default browser save)
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handlers.onStopServer?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
