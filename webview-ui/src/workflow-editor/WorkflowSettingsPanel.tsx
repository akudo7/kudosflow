import React, { useState } from 'react';
import { WorkflowConfig, ReactFlowNode, ReactFlowEdge } from './types/workflow.types';
import { NodeNameEditor } from './settings/NodeNameEditor';
import { ConfigEditor } from './settings/ConfigEditor';
import { StateAnnotationEditor } from './settings/StateAnnotationEditor';
import { StateGraphEditor } from './settings/StateGraphEditor';

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

type TabType = 'nodes' | 'settings' | 'stateGraph';

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
    padding: '10px 16px',
    background: isActive ? 'var(--vscode-tab-activeBackground)' : 'transparent',
    color: isActive
      ? 'var(--vscode-tab-activeForeground)'
      : 'var(--vscode-tab-inactiveForeground)',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--vscode-tab-activeBorder)' : 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--vscode-font-family)',
  });

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    color: 'var(--vscode-sideBar-foreground)',
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>ワークフロー設定</div>
        <button onClick={onClose} style={closeButtonStyle} title="閉じる">
          ×
        </button>
      </div>

      <div style={tabContainerStyle}>
        <button
          onClick={() => setActiveTab('nodes')}
          style={getTabStyle(activeTab === 'nodes')}
        >
          ノード
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={getTabStyle(activeTab === 'settings')}
        >
          設定
        </button>
        <button
          onClick={() => setActiveTab('stateGraph')}
          style={getTabStyle(activeTab === 'stateGraph')}
        >
          State Graph
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
      </div>
    </div>
  );
};
