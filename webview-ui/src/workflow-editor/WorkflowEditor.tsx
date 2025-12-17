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
import { v4 as uuidv4 } from 'uuid';
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge, ServerStatus, ServerState } from './types/workflow.types';
import { ChatMessage } from './types/chat.types';
import { jsonToFlow } from './converters/jsonToFlow';
import { flowToJson } from './converters/flowToJson';
import { WorkflowNode } from './WorkflowNode';
import { ToolNode } from './ToolNode';
import { WorkflowToolbar } from './WorkflowToolbar';
import { SaveNotification } from './SaveNotification';
import { ContextMenu } from './ContextMenu';
import { WorkflowSettingsPanel } from './WorkflowSettingsPanel';
import { ChatPanel } from './ChatPanel';

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
  const [showSettings, setShowSettings] = useState(false);

  // Server state (Phase 10A)
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    state: ServerState.IDLE
  });

  // Chat state (Phase 10B)
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isWaitingForInterrupt, setIsWaitingForInterrupt] = useState(false);
  const [interruptMessage, setInterruptMessage] = useState('');
  const [sessionId] = useState(() => uuidv4());
  const [unreadCount, setUnreadCount] = useState(0);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    workflowNode: WorkflowNode,
    toolNode: ToolNode,
  }), []);

  // Handle node name change from inline editing
  const handleNodeNameChangeFromNode = useCallback(
    (oldId: string, newId: string) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === oldId ? { ...node, id: newId, data: { ...node.data, label: newId } } : node
        )
      );

      setEdges((currentEdges) =>
        currentEdges.map((edge) => ({
          ...edge,
          source: edge.source === oldId ? newId : edge.source,
          target: edge.target === oldId ? newId : edge.target,
        }))
      );

      setIsDirty(true);
    },
    [setNodes, setEdges]
  );

  const loadWorkflow = useCallback((config: WorkflowConfig, path: string) => {
    setWorkflowConfig(config);
    setFilePath(path);
    setIsDirty(false);

    // Log A2A clients for Phase 9B verification
    if (config.a2aClients) {
      console.log('[Phase 9B] A2A Clients loaded:', config.a2aClients);
      console.log('[Phase 9B] A2A Client count:', Object.keys(config.a2aClients).length);
    } else {
      console.log('[Phase 9B] No A2A Clients in workflow');
    }

    try {
      const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);
      // Add onNodeNameChange callback and models to all nodes
      const nodesWithCallback = flowNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          models: config.models || [],
          onNodeNameChange: handleNodeNameChangeFromNode,
        }
      }));
      setNodes(nodesWithCallback);
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
  }, [handleNodeNameChangeFromNode, setNodes, setEdges]);

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
        case 'serverStatus':
          setServerStatus(message.status);
          break;
        case 'serverError':
          setNotification({
            message: `Server error: ${message.error}`,
            type: 'error',
          });
          break;

        // Chat execution messages (Phase 10B)
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

    // Notify extension that webview is ready
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({ command: 'ready' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [loadWorkflow, showChat]);

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

      // Log A2A clients for Phase 9B verification
      if (updatedConfig.a2aClients) {
        console.log('[Phase 9B] A2A Clients being saved:', updatedConfig.a2aClients);
        console.log('[Phase 9B] A2A Client count:', Object.keys(updatedConfig.a2aClients).length);
      } else {
        console.log('[Phase 9B] No A2A Clients in saved workflow');
      }

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
  const handleAddNode = useCallback((nodeType: 'function' | 'tool') => {
    if (nodeType === 'tool') {
      // Create ToolNode
      const newNode: ReactFlowNode = {
        id: `tool_${Date.now()}`,
        type: 'toolNode',
        position: { x: 250, y: 250 },
        data: {
          label: '新しいToolNode',
          nodeType: 'ToolNode',
          useA2AClients: true,
          onNodeNameChange: handleNodeNameChangeFromNode,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    } else {
      // Create Function Node
      const newNode: ReactFlowNode = {
        id: `node_${Date.now()}`,
        type: 'workflowNode',
        position: { x: 250, y: 250 },
        data: {
          label: '新しいノード',
          implementation: '// コードをここに書く\nreturn state;',
          parameters: [{ name: 'state', type: 'any' }],
          output: {},
          onNodeNameChange: handleNodeNameChangeFromNode,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
    setIsDirty(true);
  }, [setNodes, handleNodeNameChangeFromNode]);

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
        onNodeNameChange: handleNodeNameChangeFromNode,
      },
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setIsDirty(true);
  }, [selectedNodes, nodes, setNodes, handleNodeNameChangeFromNode]);

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
      // Canvas context menu - Add submenu for node types
      items.push(
        {
          label: 'Function Node追加',
          icon: '⚙️',
          onClick: () => handleAddNode('function'),
        },
        {
          label: 'ToolNode追加',
          icon: '🛠️',
          onClick: () => handleAddNode('tool'),
        }
      );
    }

    return items;
  }, [contextMenu, handleAddNode, handleDuplicateSelected, handleDeleteSelected]);

  // Handle workflow config updates
  const handleUpdateWorkflowConfig = useCallback(
    (updates: Partial<WorkflowConfig>) => {
      setWorkflowConfig((prev) => (prev ? { ...prev, ...updates } : prev));
      setIsDirty(true);
    },
    []
  );

  // Handle nodes update from settings panel
  const handleUpdateNodes = useCallback(
    (updatedNodes: ReactFlowNode[]) => {
      setNodes(updatedNodes);
      setIsDirty(true);
    },
    [setNodes]
  );

  // Handle edges update from settings panel
  const handleUpdateEdges = useCallback(
    (updatedEdges: ReactFlowEdge[]) => {
      setEdges(updatedEdges);
      setIsDirty(true);
    },
    [setEdges]
  );

  // Chat handlers (Phase 10B)
  const handleToggleChat = useCallback(() => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0); // Clear unread when opening
    }
  }, [showChat]);

  const handleSendMessage = useCallback((message: string) => {
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
      if (typeof vscode !== 'undefined') {
        vscode.postMessage({
          command: 'resumeWorkflow',
          input: message,
          sessionId
        });
      }
    } else {
      // Start new execution
      if (typeof vscode !== 'undefined') {
        vscode.postMessage({
          command: 'executeWorkflow',
          input: message,
          sessionId,
          filePath
        });
      }
    }

    setIsExecuting(true);
  }, [isWaitingForInterrupt, sessionId, filePath]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    setIsExecuting(false);
    setIsWaitingForInterrupt(false);
    setInterruptMessage('');
    setUnreadCount(0);
  }, []);

  // Server control handlers (Phase 10A)
  const handleStartServer = useCallback(() => {
    if (!filePath) {
      setNotification({
        message: 'No workflow file loaded',
        type: 'error',
      });
      return;
    }

    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'startA2AServer',
        filePath,
        port: 3000,
      });
    }
  }, [filePath]);

  const handleStopServer = useCallback(() => {
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'stopA2AServer',
      });
    }
  }, []);

  const handleRestartServer = useCallback(() => {
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'restartServer',
      });
    }
  }, []);

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
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleChat={handleToggleChat}
        isDirty={isDirty}
        hasSelection={selectedNodes.length > 0 || selectedEdges.length > 0}
        serverStatus={serverStatus}
        onStartServer={handleStartServer}
        onStopServer={handleStopServer}
        onRestartServer={handleRestartServer}
        showChat={showChat}
        unreadCount={unreadCount}
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
      {workflowConfig && (
        <WorkflowSettingsPanel
          show={showSettings}
          workflowConfig={workflowConfig}
          nodes={nodes}
          edges={edges}
          onClose={() => setShowSettings(false)}
          onUpdateConfig={handleUpdateWorkflowConfig}
          onUpdateNodes={handleUpdateNodes}
          onUpdateEdges={handleUpdateEdges}
        />
      )}
      <ChatPanel
        open={showChat}
        onClose={() => setShowChat(false)}
        workflowPath={filePath}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isExecuting={isExecuting}
        isWaitingForInterrupt={isWaitingForInterrupt}
        interruptMessage={interruptMessage}
        onClearChat={handleClearChat}
      />
    </div>
  );
};
