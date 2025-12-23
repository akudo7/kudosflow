import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';

interface ConditionalEdgeProps extends EdgeProps {
  data?: {
    onDoubleClick?: (groupId: string) => void;
    conditionalGroupId?: string;
    condition?: any;
    possibleTargets?: string[];
    isConditional?: boolean;
  };
}

export const ConditionalEdge: React.FC<ConditionalEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (data?.onDoubleClick && data?.conditionalGroupId) {
      // Pass the groupId to the handler
      data.onDoubleClick(data.conditionalGroupId);
    }
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              backgroundColor: 'var(--vscode-editor-background)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--vscode-panel-border)',
              color: 'var(--vscode-editor-foreground)',
              cursor: 'pointer',
              userSelect: 'none',
              pointerEvents: 'all',
            }}
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit condition"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
