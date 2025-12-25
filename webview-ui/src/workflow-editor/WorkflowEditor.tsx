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
import { ConditionalEdge } from './ConditionalEdge';
import { WorkflowToolbar } from './WorkflowToolbar';
import { SaveNotification } from './SaveNotification';
import { ContextMenu } from './ContextMenu';
import { WorkflowSettingsPanel } from './WorkflowSettingsPanel';
import { ChatPanel } from './ChatPanel';
import { ConditionalEdgeFormModal } from './settings/ConditionalEdgeFormModal';
import { NodeEditorDialog } from './NodeEditorDialog';

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

  // Conditional edge modal state
  const [showConditionalModal, setShowConditionalModal] = useState(false);
  const [editingEdgeGroup, setEditingEdgeGroup] = useState<ReactFlowEdge[] | null>(null);

  // Edge type dialog state (Phase 15D)
  const [showEdgeTypeDialog, setShowEdgeTypeDialog] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);

  // Node editor dialog state
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [selectedNodeForEditor, setSelectedNodeForEditor] = useState<{
    nodeId: string;
    nodeData: any;
  } | null>(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    workflowNode: WorkflowNode,
    toolNode: ToolNode,
  }), []);

  // Define custom edge types
  const edgeTypes = useMemo(() => ({
    conditional: ConditionalEdge,
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

  // Handle node double-click to open editor
  const handleNodeDoubleClick = useCallback((nodeId: string, nodeData: any) => {
    setSelectedNodeForEditor({ nodeId, nodeData });
    setShowNodeEditor(true);
  }, []);

  // Handle save from node editor
  const handleSaveNodeChanges = useCallback((nodeId: string, updatedData: Partial<any>) => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        if (node.id === nodeId) {
          // Handle node name change
          const newId = updatedData.label && updatedData.label !== node.data.label
            ? updatedData.label
            : node.id;

          const updatedNode = {
            ...node,
            id: newId,
            data: {
              ...node.data,
              ...updatedData,
            },
          };

          // Update edges if node ID changed
          if (newId !== nodeId) {
            setEdges((currentEdges) =>
              currentEdges.map((edge) => ({
                ...edge,
                source: edge.source === nodeId ? newId : edge.source,
                target: edge.target === nodeId ? newId : edge.target,
              }))
            );
          }

          return updatedNode;
        }
        return node;
      });
    });
    setIsDirty(true);
  }, [setNodes, setEdges]);

  // Add double-click handler to conditional edges
  const handleConditionalEdgeDoubleClick = useCallback((groupId: string) => {
    // Find all edges in the same conditional group from current edges state
    setEdges((currentEdges) => {
      const edgeGroup = currentEdges.filter(
        (e) => e.data?.conditionalGroupId === groupId
      );

      // Set editing group and show modal
      setEditingEdgeGroup(edgeGroup);
      setShowConditionalModal(true);

      return currentEdges; // No change to edges
    });
  }, [setEdges]);

  const loadWorkflow = useCallback((config: WorkflowConfig, path: string) => {
    setWorkflowConfig(config);
    setFilePath(path);  // May be empty string for new workflows
    setIsDirty(false);

    // Log A2A clients for Phase 9B verification
    if (config.a2aClients) {
      console.log('[Phase 9B] A2A Clients loaded:', config.a2aClients);
      console.log('[Phase 9B] A2A Client count:', Object.keys(config.a2aClients).length);
    } else {
      console.log('[Phase 9B] No A2A Clients in workflow');
    }

    // Log workflow type (Phase 14B)
    if (!path || path === '') {
      console.log('[Phase 14B] Loaded new workflow (no file path)');
    } else {
      console.log('[Phase 14B] Loaded existing workflow:', path);
    }

    try {
      const { nodes: flowNodes, edges: flowEdges } = jsonToFlow(config);

      // Add onNodeNameChange callback, models, and onNodeDoubleClick to all nodes
      const nodesWithCallback = flowNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          models: config.models || [],
          onNodeNameChange: handleNodeNameChangeFromNode,
          onNodeDoubleClick: handleNodeDoubleClick,
        }
      }));

      // Add double-click handler to conditional edges
      const edgesWithHandler = flowEdges.map(edge => {
        if (edge.data?.isConditional && edge.data?.conditionalGroupId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              onDoubleClick: handleConditionalEdgeDoubleClick,
            },
          };
        }
        return edge;
      });

      setNodes(nodesWithCallback);
      setEdges(edgesWithHandler);
    } catch (error) {
      console.error('Error converting workflow to flow:', error);
      if (typeof vscode !== 'undefined') {
        vscode.postMessage({
          command: 'error',
          message: `Failed to load workflow: ${error}`
        });
      }
    }
  }, [handleNodeNameChangeFromNode, handleConditionalEdgeDoubleClick, handleNodeDoubleClick, setNodes, setEdges]);

  // Handle save conditional edge from modal
  const handleSaveConditionalEdge = useCallback((updatedEdges: ReactFlowEdge[]) => {
    const groupId = updatedEdges[0]?.data?.conditionalGroupId;

    setEdges((currentEdges) => {
      // Remove old edges in group
      const filteredEdges = currentEdges.filter(
        (e) => e.data?.conditionalGroupId !== groupId
      );

      // Add onDoubleClick handler to updated edges
      const newEdges = [...filteredEdges, ...updatedEdges];
      const edgesWithHandlers = newEdges.map(edge => {
        if (edge.data?.isConditional && edge.data?.conditionalGroupId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              onDoubleClick: handleConditionalEdgeDoubleClick,
            },
          };
        }
        return edge;
      });

      return edgesWithHandlers;
    });

    setShowConditionalModal(false);
    setEditingEdgeGroup(null);
    setIsDirty(true);
  }, [handleConditionalEdgeDoubleClick, setEdges]);


  // Initialize workflow execution when filePath changes (Phase 10C)
  useEffect(() => {
    if (filePath && typeof vscode !== 'undefined') {
      console.log('[WorkflowEditor] Initializing workflow execution:', sessionId, filePath);
      vscode.postMessage({
        command: 'initializeWorkflow',
        sessionId,
        filePath
      });
    }
  }, [filePath, sessionId]);

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
          // Update filePath if it was a new workflow (first save)
          if (message.filePath && message.filePath !== filePath) {
            setFilePath(message.filePath);
          }
          setNotification({
            message: 'Workflow saved successfully',
            type: 'success',
          });
          break;
        case 'saveError':
          setNotification({
            message: `Failed to save: ${message.error}`,
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

        // Chat execution messages (Phase 10C)
        case 'executionReady':
          console.log('[WorkflowEditor] Execution ready:', message.sessionId, message.threadId);
          break;

        case 'executionStarted':
          console.log('[WorkflowEditor] Execution started');
          setIsExecuting(true);
          break;

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

  // Handle connection creation - show edge type dialog (Phase 15D)
  const onConnect = useCallback(
    (connection: Connection) => {
      // Store connection and show type selection dialog
      setPendingConnection(connection);
      setShowEdgeTypeDialog(true);
    },
    []
  );

  // Create regular edge
  const handleCreateRegularEdge = useCallback(() => {
    if (pendingConnection) {
      setEdges((eds) => addEdge({
        ...pendingConnection,
        markerEnd: {
          type: 'arrowclosed',
        },
      }, eds));
      setIsDirty(true);
    }
    setShowEdgeTypeDialog(false);
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  // Create conditional edge
  const handleCreateConditionalEdge = useCallback(() => {
    if (pendingConnection) {
      // Create single edge as placeholder, user will edit via modal
      const tempGroupId = `conditional-${pendingConnection.source}-${Date.now()}`;
      const defaultEdge: ReactFlowEdge = {
        id: `${tempGroupId}-${pendingConnection.target}`,
        source: pendingConnection.source || '',
        target: pendingConnection.target || '',
        type: 'conditional',
        animated: true,
        label: 'new condition',
        markerEnd: { type: 'arrowclosed' },
        data: {
          conditionalGroupId: tempGroupId,
          condition: {
            name: 'new condition',
            function: {
              parameters: [],
              output: 'string',
              implementation: '// TODO: Implement condition logic\nreturn "' + (pendingConnection.target || '__end__') + '";',
            },
            possibleTargets: [pendingConnection.target || ''],
          },
          possibleTargets: [pendingConnection.target || ''],
          isConditional: true,
          onDoubleClick: handleConditionalEdgeDoubleClick,
        },
      };

      setEdges((eds) => [...eds, defaultEdge]);
      setIsDirty(true);

      // Automatically open edit modal
      setEditingEdgeGroup([defaultEdge]);
      setShowConditionalModal(true);
    }
    setShowEdgeTypeDialog(false);
    setPendingConnection(null);
  }, [pendingConnection, handleConditionalEdgeDoubleClick, setEdges]);

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
          label: 'New ToolNode',
          nodeType: 'ToolNode',
          useA2AClients: true,
          onNodeNameChange: handleNodeNameChangeFromNode,
          onNodeDoubleClick: handleNodeDoubleClick,
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
          label: 'New Node',
          implementation: '// Write code here\nreturn state;',
          parameters: [{ name: 'state', type: 'any' }],
          output: {},
          onNodeNameChange: handleNodeNameChangeFromNode,
          onNodeDoubleClick: handleNodeDoubleClick,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
    setIsDirty(true);
  }, [setNodes, handleNodeNameChangeFromNode, handleNodeDoubleClick]);

  // Delete selected nodes/edges
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return;
    }

    const itemCount = selectedNodes.length + selectedEdges.length;
    const confirmed = window.confirm(
      `Delete ${itemCount} selected item(s)?`
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
        label: `${node.data.label} (Copy)`,
        onNodeNameChange: handleNodeNameChangeFromNode,
        onNodeDoubleClick: handleNodeDoubleClick,
      },
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setIsDirty(true);
  }, [selectedNodes, nodes, setNodes, handleNodeNameChangeFromNode, handleNodeDoubleClick]);

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

  // Handle edge click (Phase 15D - future enhancement)
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: ReactFlowEdge) => {
    // For now, just select the edge
    // Full context menu can be added later
    console.log('Edge clicked:', edge);
  }, []);

  // Get context menu items based on what was clicked
  const getContextMenuItems = useCallback(() => {
    if (!contextMenu) return [];

    const items = [];

    if (contextMenu.nodeId) {
      // Node context menu
      items.push(
        {
          label: 'Duplicate',
          icon: '📋',
          onClick: () => {
            setSelectedNodes([contextMenu.nodeId!]);
            handleDuplicateSelected();
          },
        },
        {
          label: 'Delete',
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
          label: 'Add Function Node',
          icon: '⚙️',
          onClick: () => handleAddNode('function'),
        },
        {
          label: 'Add ToolNode',
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

  // Node editor dialog handler
  const handleCloseNodeEditor = useCallback(() => {
    setShowNodeEditor(false);
    setSelectedNodeForEditor(null);
  }, []);

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

  // Handle reload workflow (reload JSON from file)
  const handleReload = useCallback(() => {
    if (!filePath) {
      setNotification({
        message: 'No workflow file to reload',
        type: 'error',
      });
      return;
    }

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Reloading will discard them. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'reload',
        filePath,
      });
    }
  }, [filePath, isDirty]);

  // Server control handlers (Phase 10A)
  const handleStartServer = useCallback(() => {
    if (!filePath) {
      setNotification({
        message: 'Please save the workflow before starting the server',
        type: 'error',
      });
      return;
    }

    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'startA2AServer',
        filePath,
      });
    }
  }, [filePath]);

  const handleStopServer = useCallback(() => {
    if (!filePath || filePath === '') {
      return; // Silently ignore if no file path
    }

    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'stopA2AServer',
        filePath,
      });
    }
  }, [filePath]);

  const handleRestartServer = useCallback(() => {
    if (!filePath || filePath === '') {
      setNotification({
        message: 'Please save the workflow before restarting the server',
        type: 'error',
      });
      return;
    }

    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'restartServer',
        filePath,
      });
    }
  }, [filePath]);

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
        onReload={handleReload}
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
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
      <ConditionalEdgeFormModal
        show={showConditionalModal}
        edgeGroup={editingEdgeGroup || undefined}
        allNodes={nodes}
        onSave={handleSaveConditionalEdge}
        onCancel={() => {
          setShowConditionalModal(false);
          setEditingEdgeGroup(null);
        }}
      />
      {selectedNodeForEditor && (
        <NodeEditorDialog
          show={showNodeEditor}
          onClose={handleCloseNodeEditor}
          nodeId={selectedNodeForEditor.nodeId}
          nodeData={selectedNodeForEditor.nodeData}
          onSave={handleSaveNodeChanges}
        />
      )}
      {showEdgeTypeDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={() => {
            setShowEdgeTypeDialog(false);
            setPendingConnection(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              border: '1px solid var(--vscode-panel-border)',
              borderRadius: '6px',
              padding: '20px',
              minWidth: '300px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px' }}>
              Create Edge
            </h3>
            <p style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
              Choose edge type:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleCreateRegularEdge}
                style={{
                  padding: '10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <strong>Regular Edge</strong>
                <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                  Direct connection between nodes
                </div>
              </button>
              <button
                onClick={handleCreateConditionalEdge}
                style={{
                  padding: '10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <strong>Conditional Edge</strong>
                <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                  Route based on condition logic
                </div>
              </button>
              <button
                onClick={() => {
                  setShowEdgeTypeDialog(false);
                  setPendingConnection(null);
                }}
                style={{
                  padding: '8px',
                  fontSize: '12px',
                  backgroundColor: 'var(--vscode-button-secondaryBackground)',
                  color: 'var(--vscode-button-secondaryForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
