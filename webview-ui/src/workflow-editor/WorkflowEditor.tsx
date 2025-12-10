import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge } from './types/workflow.types';
import { jsonToFlow } from './converters/jsonToFlow';
import { flowToJson } from './converters/flowToJson';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowToolbar } from './WorkflowToolbar';
import { SaveNotification } from './SaveNotification';

// VSCode API
declare const vscode: any;

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    workflowNode: WorkflowNode,
  }), []);

  // メッセージ受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'loadWorkflow':
          loadWorkflow(message.data, message.filePath);
          break;
        case 'saveSuccess':
          setIsDirty(false);
          setNotification({
            message: 'ワークフローを保存しました',
            type: 'success',
          });
          break;
        case 'saveError':
          setNotification({
            message: `保存に失敗しました: ${message.error}`,
            type: 'error',
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify extension that webview is ready
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({ command: 'ready' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadWorkflow = (config: WorkflowConfig, path: string) => {
    setWorkflowConfig(config);
    setFilePath(path);
    setIsDirty(false);

    try {
      const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);
      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error converting workflow to flow:', error);
      if (typeof vscode !== 'undefined') {
        vscode.postMessage({
          command: 'error',
          message: `Failed to load workflow: ${error}`
        });
      }
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  // Handle nodes change with dirty state
  const handleNodesChange = useCallback(
    (changes: NodeChange<ReactFlowNode>[]) => {
      onNodesChange(changes);
      // Only set dirty for user actions (not for initial load)
      if (changes.some((change) => change.type !== 'dimensions' && change.type !== 'position')) {
        setIsDirty(true);
      }
    },
    [onNodesChange]
  );

  // Handle edges change with dirty state
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<ReactFlowEdge>[]) => {
      onEdgesChange(changes);
      // Only set dirty for user actions
      if (changes.length > 0) {
        setIsDirty(true);
      }
    },
    [onEdgesChange]
  );

  const handleSave = useCallback(() => {
    if (!workflowConfig) {
      return;
    }

    try {
      const updatedConfig = flowToJson(nodes, edges, workflowConfig);

      if (typeof vscode !== 'undefined') {
        vscode.postMessage({
          command: 'save',
          data: updatedConfig,
          filePath
        });
      }
    } catch (error) {
      console.error('Error converting flow to JSON:', error);
      if (typeof vscode !== 'undefined') {
        vscode.postMessage({
          command: 'error',
          message: `Failed to save workflow: ${error}`
        });
      }
    }
  }, [nodes, edges, workflowConfig, filePath]);

  // Ctrl+S handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorkflowToolbar onSave={handleSave} isDirty={isDirty} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {notification && (
        <SaveNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};
