import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge } from './types/workflow.types';
import { jsonToFlow } from './converters/jsonToFlow';
import { flowToJson } from './converters/flowToJson';

// VSCode API
declare const vscode: any;

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [filePath, setFilePath] = useState<string>('');

  // メッセージ受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'loadWorkflow':
          loadWorkflow(message.data, message.filePath);
          break;
        case 'saveSuccess':
          console.log('保存成功');
          break;
        case 'saveError':
          console.error('保存失敗:', message.error);
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
    console.log('Loading workflow:', config);
    setWorkflowConfig(config);
    setFilePath(path);

    try {
      const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);
      console.log('Converted to React Flow:', { nodes: flowNodes, edges: flowEdges });
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
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleSave = useCallback(() => {
    if (!workflowConfig) {
      console.warn('No workflow config to save');
      return;
    }

    try {
      const updatedConfig = flowToJson(nodes, edges, workflowConfig);
      console.log('Saving workflow:', updatedConfig);

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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
