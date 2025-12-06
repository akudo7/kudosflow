import { FC, useEffect, useState } from "react";

// material-ui
import {
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  styled,
} from "@mui/material";
import { IconTrash, IconCopy, IconInfoCircle } from "@tabler/icons-react";

import { vscode } from "./utilities/vscode";

import NodeCardWrapper from "./NodeCardWrapper";
import NodeInputHandler from "./NodeInputHandler";
import NodeOutputHandler from "./NodeOutputHandler";
import NodeTooltip from "./NodeTooltip";
import AdditionalParamsDialog from "./AdditionalParamsDialog";

interface CanvasNodeProps {
  data: NodeData | undefined;
}

interface SectionDividerProps {
  title: string;
}

interface NodeIconProps {
  icon?: string;
}

const CanvasNode: FC<CanvasNodeProps> = ({ data }) => {
  const [dialogProps, setDialogProps] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [isForceCloseNodeInfo, setIsForceCloseNodeInfo] = useState(null);

  // Early return if data is undefined
  if (!data) {
    return null;
  }

  const hasInputs: boolean =
    data.inputAnchors.length > 0 || data.inputParams.length > 0;
  const hasAdditionalParams: boolean = data.inputParams.some(
    (param) => param.additionalParams
  );
  const hasOutputs: boolean = data.outputAnchors.length > 0;

  // VSCodeのテーマに合わせた色を定義
  const borderColor = data.selected
    ? "var(--vscode-focusBorder)"
    : "var(--vscode-editor-foreground)";

  const buttonStyles = {
    height: "35px",
    width: "35px",
    color: "var(--vscode-editor-foreground)",
    "&:hover": {
      color: "var(--vscode-button-foreground)",
      backgroundColor: "var(--vscode-button-background)",
    },
  };
/*
  useEffect(() => {
    console.log(`Node(${data?.id}): ${data?.selected}`);
  }, [data?.selected, data?.id]);
*/
  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const getNodeInfoOpenStatus = () => {
    if (!data?.selected) return false;
    else return true;
  };

  const onDialogClicked = () => {
    const dialogProps = {
      data,
      inputParams: data.inputParams
        .filter((inputParam) => !inputParam.hidden)
        .filter((param) => param.additionalParams),
      confirmButtonName: "Save",
      cancelButtonName: "Cancel",
    };
    setDialogProps(dialogProps);
    setShowDialog(true);
  };

  return (
    <>
      <NodeCardWrapper
        content={false}
        sx={{
          padding: 0,
          borderColor: borderColor,
        }}
        border={false}
      >
        <NodeTooltip
          open={getNodeInfoOpenStatus()}
          onClose={handleClose}
          onOpen={handleOpen}
          disableFocusListener={true}
          title={
            <div
              style={{
                background: "var(--vscode-editor-background)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <IconButton
                title="Duplicate"
                onClick={() => {}}
                sx={{
                  ...buttonStyles,
                  "&:hover": {
                    color: "var(--vscode-focusBorder)",
                  },
                }}
              >
                <IconCopy />
              </IconButton>
              <IconButton
                title="Delete"
                onClick={() => {}}
                sx={{
                  ...buttonStyles,
                  "&:hover": {
                    color: "var(--vscode-errorForeground)",
                  },
                }}
              >
                <IconTrash />
              </IconButton>
              <IconButton
                title="Info"
                onClick={() => {}}
                sx={{
                  ...buttonStyles,
                  "&:hover": {
                    color: "var(--vscode-editor-foreground)",
                  },
                }}
              >
                <IconInfoCircle />
              </IconButton>
            </div>
          }
          placement="right-start"
        >
          <Box>
            {/* Header Section */}
            <NodeHeader nodeData={data} />

            {/* Inputs Section */}
            {hasInputs && <InputsSection nodeData={data} />}

            {/* Additional Parameters Button */}
            {hasAdditionalParams && (
              <Box sx={{ textAlign: "center", mt: 2, mb: 2 }}>
                <Button
                  sx={{ borderRadius: 25, width: "90%", mb: 2 }}
                  variant="outlined"
                  onClick={onDialogClicked}
                >
                  Additional Parameters
                </Button>
              </Box>
            )}

            {/* Outputs Section */}
            {hasOutputs && <OutputsSection />}
            {hasOutputs && <Divider />}
            {hasOutputs &&
              data.outputAnchors.map((outputAnchor) => (
                <NodeOutputHandler
                  key={outputAnchor.id || JSON.stringify(outputAnchor)}
                  outputAnchor={outputAnchor as OutputAnchor}
                  nodeData={data}
                />
              ))}
          </Box>
        </NodeTooltip>
      </NodeCardWrapper>
      <AdditionalParamsDialog
        show={showDialog}
        dialogProps={dialogProps}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
};

const StyledBox = styled(Box)({
  color: "var(--vscode-editor-foreground)",
  backgroundColor: "var(--vscode-editor-background)",
});

const StyledTypography = styled(Typography)({
  color: "var(--vscode-editor-foreground)",
});

// Subcomponents for better organization
const NodeHeader: FC<{ nodeData: NodeData }> = ({ nodeData }) => (
  <StyledBox sx={{ display: "flex", alignItems: "center", p: 1 }}>
    <NodeIcon icon={nodeData.icon} />
    <StyledTypography sx={{ fontSize: "1rem", fontWeight: 500, ml: 2 }}>
      {nodeData.label}
    </StyledTypography>
  </StyledBox>
);

const NodeIcon: React.FC<NodeIconProps> = (nodeIconProps) => {
  const [iconPath, setIconPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const loadIcon = async () => {
      try {
        if (!mounted) return;

        setIsLoading(true);
        const path = await vscode.getIconPath(nodeIconProps.icon ?? "");

        if (mounted) {
          setIconPath(path);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!mounted) return;

        console.error("Icon loading error:", err);

        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          retryTimeout = setTimeout(loadIcon, 2000);
        } else {
          setError("Failed to load icon");
          setIsLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  return (
    <Box sx={{ width: 50, mr: 1, p: 0.5 }}>
      <Box
        sx={{
          borderRadius: "50%",
          backgroundColor: "white", // 白い円の背景
          cursor: "grab",
          width: "40px", // サイズを固定
          height: "40px", // サイズを固定
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px", // 内側の余白
          boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.1)", // オプション: 微かな白い縁取り
          position: "relative", // 位置の基準点
        }}
      >
        <img
          style={{
            width: "100%",
            height: "100%",
            padding: 5,
            objectFit: "contain",
          }}
          src={iconPath}
          alt="Notification"
        />
      </Box>
    </Box>
  );
};

const InputsSection: FC<{ nodeData: NodeData }> = ({ nodeData }) => (
  <>
    <SectionDivider title="Inputs" />
    {nodeData.inputAnchors.map((inputAnchor: InputAnchor, index: number) => (
      <NodeInputHandler key={index} inputAnchor={inputAnchor} nodeData={nodeData} />
    ))}
  </>
);

const OutputsSection: FC = () => <SectionDivider title="Output" />;

const SectionDivider: FC<SectionDividerProps> = ({ title }) => (
  <>
    <Divider
      sx={{
        borderColor: "var(--section-divider-border)",
        opacity: "var(--section-divider-border-opacity)",
      }}
    />
    <Box
      sx={{
        background: "var(--section-divider-background,rgb(101, 93, 93))",
        opacity: "var(--section-divider-opacity)",
        p: 1,
      }}
    >
      <Typography
        sx={{
          fontWeight: 500,
          textAlign: "center",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        {title}
      </Typography>
    </Box>
    <Divider
      sx={{
        borderColor: "var(--section-divider-border)",
        opacity: "var(--section-divider-border-opacity)",
      }}
    />
  </>
);

export default CanvasNode;
