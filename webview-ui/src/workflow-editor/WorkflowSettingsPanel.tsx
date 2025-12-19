import React, { useState } from 'react';
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge, AnnotationField, ModelConfig, MCPServerConfig, A2AClientConfig } from './types/workflow.types';
import { NodeNameEditor } from './settings/NodeNameEditor';
import { ConfigEditor } from './settings/ConfigEditor';
import { StateAnnotationEditor } from './settings/StateAnnotationEditor';
import { StateGraphEditor } from './settings/StateGraphEditor';
import { AnnotationFieldsEditor } from './settings/AnnotationFieldsEditor';
import { ModelEditor } from './settings/ModelEditor';
import { MCPServerEditor } from './settings/MCPServerEditor';
import { A2AClientEditor } from './settings/A2AClientEditor';

interface Props {
  show: boolean;
  workflowConfig: WorkflowConfig;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  onClose: () => void;
  onUpdateConfig: (updates: Partial<WorkflowConfig>) => void;
  onUpdateNodes: (nodes: ReactFlowNode[]) => void;
  onUpdateEdges: (edges: ReactFlowEdge[]) => void;
}

type TabType = 'nodes' | 'settings' | 'stateGraph' | 'annotation' | 'a2aClients' | 'models' | 'mcpServers';

export const WorkflowSettingsPanel: React.FC<Props> = ({
  show,
  workflowConfig,
  nodes,
  edges,
  onClose,
  onUpdateConfig,
  onUpdateNodes,
  onUpdateEdges,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('nodes');

  if (!show) return null;

  const handleNodeNameChange = (oldId: string, newId: string) => {
    // Update nodes
    const updatedNodes = nodes.map((node) =>
      node.id === oldId ? { ...node, id: newId, data: { ...node.data, label: newId } } : node
    );

    // Update edges
    const updatedEdges = edges.map((edge) => ({
      ...edge,
      source: edge.source === oldId ? newId : edge.source,
      target: edge.target === oldId ? newId : edge.target,
    }));

    onUpdateNodes(updatedNodes);
    onUpdateEdges(updatedEdges);
  };

  const handleConfigChange = (config: any) => {
    onUpdateConfig({ config });
  };

  const handleStateAnnotationChange = (stateAnnotation: { name: string; type: string }) => {
    onUpdateConfig({
      stateAnnotation: {
        name: stateAnnotation.name,
        type: "Annotation.Root"
      }
    });
  };

  const handleStateGraphChange = (stateGraph: any) => {
    onUpdateConfig({ stateGraph });
  };

  const handleAnnotationChange = (annotation: Record<string, AnnotationField>) => {
    onUpdateConfig({ annotation });
  };

  const handleModelsChange = (models: ModelConfig[]) => {
    onUpdateConfig({ models });
  };

  const handleMcpServersChange = (mcpServers: Record<string, MCPServerConfig>) => {
    onUpdateConfig({ mcpServers });
  };

  const handleA2AClientsChange = (a2aClients: Record<string, A2AClientConfig>) => {
    onUpdateConfig({ a2aClients });
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '350px',
    height: '100vh',
    background: 'var(--vscode-sideBar-background)',
    borderLeft: '1px solid var(--vscode-sideBar-border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--vscode-sideBar-border)',
    background: 'var(--vscode-sideBarTitle-background)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'var(--vscode-sideBarTitle-foreground)',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--vscode-sideBarTitle-foreground)',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '0 4px',
    lineHeight: '1',
  };

  const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid var(--vscode-sideBar-border)',
    background: 'var(--vscode-sideBar-background)',
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 8px',
    background: isActive ? 'var(--vscode-tab-activeBackground)' : 'transparent',
    color: isActive
      ? 'var(--vscode-tab-activeForeground)'
      : 'var(--vscode-tab-inactiveForeground)',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--vscode-tab-activeBorder)' : 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    color: 'var(--vscode-sideBar-foreground)',
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Workflow Settings</div>
        <button onClick={onClose} style={closeButtonStyle} title="Close">
          ×
        </button>
      </div>

      <div style={tabContainerStyle}>
        <button
          onClick={() => setActiveTab('nodes')}
          style={getTabStyle(activeTab === 'nodes')}
        >
          Nodes
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={getTabStyle(activeTab === 'settings')}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('stateGraph')}
          style={getTabStyle(activeTab === 'stateGraph')}
        >
          State Graph
        </button>
        <button
          onClick={() => setActiveTab('annotation')}
          style={getTabStyle(activeTab === 'annotation')}
        >
          Annotation
        </button>
        <button
          onClick={() => setActiveTab('a2aClients')}
          style={getTabStyle(activeTab === 'a2aClients')}
        >
          A2A
        </button>
        <button
          onClick={() => setActiveTab('models')}
          style={getTabStyle(activeTab === 'models')}
        >
          Models
        </button>
        <button
          onClick={() => setActiveTab('mcpServers')}
          style={getTabStyle(activeTab === 'mcpServers')}
        >
          MCP
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'nodes' && (
          <NodeNameEditor nodes={nodes} onNodeNameChange={handleNodeNameChange} />
        )}
        {activeTab === 'settings' && (
          <>
            <div style={{ padding: '12px 12px 0' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: 'var(--vscode-foreground)',
              }}>
                Config
              </div>
            </div>
            <ConfigEditor
              config={workflowConfig.config}
              onConfigChange={handleConfigChange}
            />
            <div style={{
              height: '1px',
              background: 'var(--vscode-sideBar-border)',
              margin: '16px 0',
            }} />
            <div style={{ padding: '0 12px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: 'var(--vscode-foreground)',
              }}>
                State Annotation
              </div>
            </div>
            <StateAnnotationEditor
              stateAnnotation={workflowConfig.stateAnnotation}
              onStateAnnotationChange={handleStateAnnotationChange}
            />
          </>
        )}
        {activeTab === 'stateGraph' && (
          <StateGraphEditor
            stateGraph={workflowConfig.stateGraph}
            stateAnnotationName={workflowConfig.stateAnnotation.name}
            onStateGraphChange={handleStateGraphChange}
          />
        )}
        {activeTab === 'annotation' && (
          <AnnotationFieldsEditor
            annotation={workflowConfig.annotation}
            onAnnotationChange={handleAnnotationChange}
          />
        )}
        {activeTab === 'a2aClients' && (
          <A2AClientEditor
            a2aClients={workflowConfig.a2aClients || {}}
            onA2AClientsChange={handleA2AClientsChange}
          />
        )}
        {activeTab === 'models' && (
          <ModelEditor
            models={workflowConfig.models || []}
            onModelsChange={handleModelsChange}
            a2aClientsExist={
              workflowConfig.a2aClients !== undefined &&
              Object.keys(workflowConfig.a2aClients).length > 0
            }
            mcpServersExist={
              workflowConfig.mcpServers !== undefined &&
              Object.keys(workflowConfig.mcpServers).length > 0
            }
            nodes={nodes}
          />
        )}
        {activeTab === 'mcpServers' && (
          <MCPServerEditor
            mcpServers={workflowConfig.mcpServers || {}}
            onMcpServersChange={handleMcpServersChange}
          />
        )}
      </div>
    </div>
  );
};
