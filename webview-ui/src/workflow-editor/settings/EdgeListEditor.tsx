import React, { useMemo, useState } from 'react';
import { ReactFlowEdge, ReactFlowNode } from '../types/workflow.types';
import { ConditionalEdgeFormModal } from './ConditionalEdgeFormModal';

interface EdgeListEditorProps {
  edges: ReactFlowEdge[];
  nodes: ReactFlowNode[];
  onUpdateEdges: (edges: ReactFlowEdge[]) => void;
}

interface ConditionalEdgeGroup {
  groupId: string;
  sourceId: string;
  sourceName: string;
  conditionName: string;
  targets: string[];
  edges: ReactFlowEdge[];
}

export const EdgeListEditor: React.FC<EdgeListEditorProps> = ({
  edges,
  nodes,
  onUpdateEdges,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingEdgeGroup, setEditingEdgeGroup] = useState<ReactFlowEdge[] | null>(null);

  // Group edges by conditionalGroupId
  const { conditionalGroups, regularEdges } = useMemo(() => {
    const groups = new Map<string, ReactFlowEdge[]>();
    const regular: ReactFlowEdge[] = [];

    edges.forEach((edge) => {
      if (edge.data?.conditionalGroupId && edge.data?.isConditional) {
        const groupId = edge.data.conditionalGroupId;
        if (!groups.has(groupId)) {
          groups.set(groupId, []);
        }
        groups.get(groupId)!.push(edge);
      } else {
        regular.push(edge);
      }
    });

    // Convert groups to structured data
    const structuredGroups: ConditionalEdgeGroup[] = Array.from(
      groups.entries()
    ).map(([groupId, groupEdges]) => {
      const firstEdge = groupEdges[0];
      const sourceNode = nodes.find((n) => n.id === firstEdge.source);
      const targets = groupEdges.map((e) => e.target);

      return {
        groupId,
        sourceId: firstEdge.source,
        sourceName: (sourceNode?.data?.name as string) || firstEdge.source,
        conditionName: firstEdge.data?.condition?.name || 'unnamed',
        targets,
        edges: groupEdges,
      };
    });

    return { conditionalGroups: structuredGroups, regularEdges: regular };
  }, [edges, nodes]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (
      !confirm(
        'Delete this conditional edge group? All targets will be removed.'
      )
    ) {
      return;
    }

    const updatedEdges = edges.filter(
      (e) => e.data?.conditionalGroupId !== groupId
    );
    onUpdateEdges(updatedEdges);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (!confirm('Delete this edge?')) {
      return;
    }

    const updatedEdges = edges.filter((e) => e.id !== edgeId);
    onUpdateEdges(updatedEdges);
  };

  const handleSaveConditionalEdge = (updatedEdges: ReactFlowEdge[]) => {
    const groupId = updatedEdges[0]?.data?.conditionalGroupId;
    const filteredEdges = edges.filter(
      (e) => e.data?.conditionalGroupId !== groupId
    );

    onUpdateEdges([...filteredEdges, ...updatedEdges]);
    setShowModal(false);
    setEditingEdgeGroup(null);
  };

  const getNodeName = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    return (node?.data?.name as string) || nodeId;
  };

  return (
    <div style={{ padding: '12px', color: 'var(--vscode-editor-foreground)' }}>
      {/* Header */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'var(--vscode-descriptionForeground)',
        }}
      >
        Edges ({edges.length} total)
      </div>

      {/* Conditional Edges Section */}
      {conditionalGroups.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: 'var(--vscode-textLink-foreground)',
            }}
          >
            Conditional Edges ({conditionalGroups.length})
          </div>

          {conditionalGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);

            return (
              <div
                key={group.groupId}
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  border: '1px solid var(--vscode-panel-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--vscode-editor-background)',
                }}
              >
                {/* Group Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <button
                      onClick={() => toggleGroup(group.groupId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--vscode-editor-foreground)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '6px',
                        padding: '0',
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      📍 <strong>{group.sourceName}</strong> →{' '}
                      <em>{group.conditionName}</em> ({group.targets.length}{' '}
                      targets)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setEditingEdgeGroup(group.edges);
                        setShowModal(true);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.groupId)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor:
                          'var(--vscode-inputValidation-errorBackground)',
                        color: 'var(--vscode-inputValidation-errorForeground)',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Group Targets (Expanded) */}
                {isExpanded && (
                  <div
                    style={{
                      marginLeft: '20px',
                      fontSize: '11px',
                      color: 'var(--vscode-descriptionForeground)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {group.targets.map((target, index) => {
                      const isLast = index === group.targets.length - 1;
                      return (
                        <div key={target} style={{ marginBottom: '2px' }}>
                          {isLast ? '└─' : '├─'} {getNodeName(target)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Regular Edges Section */}
      {regularEdges.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: 'var(--vscode-textLink-foreground)',
            }}
          >
            Regular Edges ({regularEdges.length})
          </div>

          {regularEdges.map((edge) => (
            <div
              key={edge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                padding: '6px 10px',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--vscode-editor-background)',
              }}
            >
              <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                {getNodeName(edge.source)} → {getNodeName(edge.target)}
              </span>
              <button
                onClick={() => handleDeleteEdge(edge.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor:
                    'var(--vscode-inputValidation-errorBackground)',
                  color: 'var(--vscode-inputValidation-errorForeground)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {edges.length === 0 && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--vscode-descriptionForeground)',
            fontSize: '12px',
          }}
        >
          No edges in workflow. Create edges by connecting nodes on the canvas.
        </div>
      )}

      <ConditionalEdgeFormModal
        show={showModal}
        edgeGroup={editingEdgeGroup || undefined}
        allNodes={nodes}
        onSave={handleSaveConditionalEdge}
        onCancel={() => {
          setShowModal(false);
          setEditingEdgeGroup(null);
        }}
      />
    </div>
  );
};
