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
import { ContextMenu } from './ContextMenu';

// VSCode API
declare const vscode: any;

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReactFlowEdge>([]);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
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

  // Handle selection change
  const onSelectionChange = useCallback(({ nodes, edges }: any) => {
    setSelectedNodes(nodes.map((n: any) => n.id));
    setSelectedEdges(edges.map((e: any) => e.id));
  }, []);

  // Add node
  const handleAddNode = useCallback(() => {
    const newNode: ReactFlowNode = {
      id: `node_${Date.now()}`,
      type: 'workflowNode',
      position: { x: 250, y: 250 },
      data: {
        label: '新しいノード',
        implementation: '// コードをここに書く\nreturn state;',
        parameters: [{ name: 'state', type: 'any' }],
        output: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  }, [setNodes]);

  // Delete selected nodes/edges
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return;
    }

    const itemCount = selectedNodes.length + selectedEdges.length;
    const confirmed = window.confirm(
      `選択した${itemCount}個のアイテムを削除しますか？`
    );
    if (!confirmed) {
      return;
    }

    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedEdges.includes(e.id)));
    setSelectedNodes([]);
    setSelectedEdges([]);
    setIsDirty(true);
  }, [selectedNodes, selectedEdges, setNodes, setEdges]);

  // Duplicate selected nodes
  const handleDuplicateSelected = useCallback(() => {
    if (selectedNodes.length === 0) {
      return;
    }

    const nodesToDuplicate = nodes.filter((n) => selectedNodes.includes(n.id));
    const newNodes: ReactFlowNode[] = nodesToDuplicate.map((node) => ({
      ...node,
      id: `${node.id}_copy_${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (コピー)`,
      },
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setIsDirty(true);
  }, [selectedNodes, nodes, setNodes]);

  // Handle node context menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: ReactFlowNode) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  // Handle pane context menu (canvas background)
  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  // Get context menu items based on what was clicked
  const getContextMenuItems = useCallback(() => {
    if (!contextMenu) return [];

    const items = [];

    if (contextMenu.nodeId) {
      // Node context menu
      items.push(
        {
          label: '複製',
          icon: '📋',
          onClick: () => {
            setSelectedNodes([contextMenu.nodeId!]);
            handleDuplicateSelected();
          },
        },
        {
          label: '削除',
          icon: '🗑️',
          onClick: () => {
            setSelectedNodes([contextMenu.nodeId!]);
            handleDeleteSelected();
          },
        }
      );
    } else {
      // Canvas context menu
      items.push({
        label: 'ノード追加',
        icon: '➕',
        onClick: handleAddNode,
      });
    }

    return items;
  }, [contextMenu, handleAddNode, handleDuplicateSelected, handleDeleteSelected]);

  // Ctrl+S handling and Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save with Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Delete with Delete or Backspace key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input or textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleDeleteSelected]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorkflowToolbar
        onSave={handleSave}
        onAddNode={handleAddNode}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        isDirty={isDirty}
        hasSelection={selectedNodes.length > 0 || selectedEdges.length > 0}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
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
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
