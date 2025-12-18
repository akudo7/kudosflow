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

      if (message.command === 'nodeExecutionError') {
        setExecutingNodes(prev => {
          const next = new Set(prev);
          next.delete(message.nodeId);
          return next;
        });
        setTrace(prev => [...prev, {
          nodeId: message.nodeId,
          timestamp: new Date(),
          status: 'error'
        }]);
      }

      if (message.command === 'executionComplete') {
        setExecutingNodes(new Set());
      }

      if (message.command === 'executionError') {
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
