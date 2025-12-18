import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat.types';

declare const vscode: {
  postMessage(message: any): void;
};

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
