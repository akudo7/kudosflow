import {
  Handle,
  Position,
  Connection,
  ReactFlowInstance,
  useUpdateNodeInternals,
} from "reactflow";
import { FC, forwardRef, useEffect, useRef, useState } from "react";

// material-ui
import { useTheme, styled } from "@mui/material/styles";
import { Box, Typography, Tooltip } from "@mui/material";
import { tooltipClasses } from "@mui/material/Tooltip";

// Define interfaces for the component props and data structures
interface OutputAnchor {
  options?: any; // optionalに変更
  id: string;
  type?: string;
  label: string;
  optional?: boolean;
}

interface NodeData {
  id: string; // Added required id property
  selected?: boolean;
}

interface NodeOutputHandlerProps {
  outputAnchor: OutputAnchor;
  nodeData: NodeData;
  disabled?: boolean;
  disablePadding?: boolean;
  onHideNodeInfoDialog?: () => void;
  reactFlowInstance?: ReactFlowInstance;
}

const CustomWidthTooltip = styled(
  ({ className, ...props }: { className?: string } & React.ComponentProps<typeof Tooltip>) => (
    <Tooltip {...props} classes={{ popper: className }} />
  )
)({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500,
    backgroundColor: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    border: '1px solid var(--vscode-focusBorder)',
  },
});

const StyledBox = styled(Box)({
  color: 'var(--vscode-editor-foreground)',
  backgroundColor: 'var(--vscode-editor-background)',
});

const StyledTypography = styled(Typography)({
  color: 'var(--vscode-editor-foreground)',
});

// ===========================|| NodeOutputHandler ||=========================== //

const NodeOutputHandler = forwardRef<HTMLDivElement, NodeOutputHandlerProps>(
  (
    {
      outputAnchor,
      nodeData,
      disabled = false,
      disablePadding = false,
      reactFlowInstance,
    },
    ref
  ) => {
    const theme = useTheme();
    const updateNodeInternals = useUpdateNodeInternals();
    const [handlePosition, setHandlePosition] = useState(0);

    // refの型定義を修正
    const divRef = useRef<HTMLDivElement | null>(null);

    // combinedRefの実装を修正
    const combinedRef = (node: HTMLDivElement | null) => {
      if (node) {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        divRef.current = node;
      }
    };

    useEffect(() => {
      if (divRef.current) {
        const newPosition = divRef.current.offsetTop + (divRef.current.clientHeight / 2);
        setHandlePosition(newPosition);
        updateNodeInternals(nodeData.id);
      }
    }, [nodeData.id, updateNodeInternals]);

    useEffect(() => {
      updateNodeInternals(nodeData.id);
    }, [nodeData.id, handlePosition, updateNodeInternals]);

    if (!outputAnchor) return null;

    return (
      <div ref={combinedRef}>
        <CustomWidthTooltip placement="right" title={outputAnchor.type || ''}>
          <Handle
            type="source"
            position={Position.Right}
            key={outputAnchor.id}
            id={outputAnchor.id}
            isValidConnection={(connection: Connection) => {
              if (reactFlowInstance) {
                // Uncomment and implement validation if needed
                // return isValidConnection({ connection, reactFlowInstance });
              }
              return true;
            }}
            style={{
              height: 10,
              width: 10,
              backgroundColor: nodeData.selected ? 'var(--vscode-focusBorder)' : 'var(--vscode-editor-foreground)',
              top: handlePosition,
            }}
          />
        </CustomWidthTooltip>
        <StyledBox sx={{ p: 2, textAlign: "end" }}>
          <StyledTypography>{outputAnchor.label}</StyledTypography>
        </StyledBox>
      </div>
    );
  }
);

NodeOutputHandler.displayName = "NodeOutputHandler";

export default NodeOutputHandler;