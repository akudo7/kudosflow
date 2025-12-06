import { FC, forwardRef, useEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
  Connection,
  ReactFlowInstance,
  useUpdateNodeInternals,
} from "reactflow";

// material-ui
import {
  Box,
  Typography,
  Tooltip,
  Popper,
  Button,
  IconButton,
  InputProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tooltipClasses } from "@mui/material/Tooltip";
import { autocompleteClasses } from "@mui/material/Autocomplete";
import { TooltipWithParser } from "./TooltipWithParser";
import { isValidConnection } from "./genericHelper";
import { IconArrowsMaximize, IconBulb } from "@tabler/icons-react";
import IconAutoFixHigh from "@mui/icons-material/AutoFixHigh";
import { Input } from "./Input";

// Define interfaces for the component props and data structures
interface ExpandDialogProps {
  value: string;
  inputParam: InputParam;
  disabled: boolean;
  languageType?: string;
  confirmButtonName: string;
  cancelButtonName: string;
}

interface NodeData {
  id: string; // Added required id property
  selected?: boolean;
}

interface NodeInputHandlerProps {
  inputAnchor?: InputAnchor;
  inputParam?: InputParam;
  nodeData: NodeData; // required に変更
  data?: any;
  disabled?: boolean;
  disablePadding?: boolean;
  onHideNodeInfoDialog?: () => void;
  reactFlowInstance?: ReactFlowInstance;
  isAdditionalParams?: boolean;
}

// VSCode theme interface
interface VSCodeTheme {
  colors: {
    "editor.background": string;
    "editor.foreground": string;
    errorForeground: string;
    focusBorder: string;
  };
}

const CustomWidthTooltip = styled(
  ({
    className,
    ...props
  }: { className?: string } & React.ComponentProps<typeof Tooltip>) => (
    <Tooltip {...props} classes={{ popper: className }} />
  )
)({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500,
    backgroundColor: "var(--vscode-editor-background)",
    color: "var(--vscode-editor-foreground)",
    border: "1px solid var(--vscode-focusBorder)",
  },
});

const StyledPopper = styled(Popper)({
  boxShadow:
    "0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)",
  borderRadius: "10px",
  backgroundColor: "var(--vscode-editor-background)",
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": {
      padding: 10,
      margin: 10,
      color: "var(--vscode-editor-foreground)",
    },
  },
});

const StyledBox = styled(Box)({
  color: "var(--vscode-editor-foreground)",
  backgroundColor: "var(--vscode-editor-background)",
});

const StyledTypography = styled(Typography)({
  color: "var(--vscode-editor-foreground)",
});

// ===========================|| NodeInputHandler ||=========================== //

const NodeInputHandler = forwardRef<HTMLDivElement, NodeInputHandlerProps>(
  (
    {
      inputAnchor,
      inputParam,
      nodeData,
      data,
      disabled = false,
      isAdditionalParams = false,
      disablePadding = false,
      onHideNodeInfoDialog,
    },
    ref
  ) => {
    const [showExpandDialog, setShowExpandDialog] = useState(false);
    const [expandDialogProps, setExpandDialogProps] = useState({});
    const [handlePosition, setHandlePosition] = useState(0);
    const divRef = useRef<HTMLDivElement | null>(null);
    const reactFlowInstance: any = null;

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

    const updateNodeInternals = useUpdateNodeInternals();

    useEffect(() => {
      if (divRef.current && nodeData) {
        const newPosition =
          divRef.current.offsetTop + divRef.current.clientHeight / 2;
        setHandlePosition(newPosition);
        updateNodeInternals(nodeData.id);
      }
    }, [nodeData?.id, updateNodeInternals]);

    useEffect(() => {
      if (nodeData) {
        updateNodeInternals(nodeData.id);
      }
    }, [nodeData?.id, handlePosition, updateNodeInternals]);

    function onShowPromptHubButtonClicked(): void {
      throw new Error("Function not implemented.");
    }

    function onInputHintDialogClicked(hint: any): void {
      throw new Error("Function not implemented.");
    }

    const onExpandDialogClicked = (
      value: string,
      inputParam: InputParam,
      languageType?: string
    ): void => {
      const dialogProps: ExpandDialogProps = {
        value,
        inputParam,
        disabled,
        languageType,
        confirmButtonName: "Save",
        cancelButtonName: "Cancel",
      };

      setExpandDialogProps(dialogProps);
      setShowExpandDialog(true);
    };
/*
    useEffect(() => {
      console.log(`Node(${data?.id}): ${data?.selected}`);
    }, [data?.selected, data?.id]);
*/
    return (
      <div ref={combinedRef}>
        {inputAnchor && (
          <>
            <CustomWidthTooltip placement="left" title={inputAnchor.type || ""}>
              <Handle
                type="target"
                position={Position.Left}
                key={inputAnchor.id}
                id={inputAnchor.id}
                isValidConnection={(connection: Connection) => {
                  return true;
                }}
                style={{
                  height: 10,
                  width: 10,
                  backgroundColor: nodeData.selected
                    ? "var(--vscode-focusBorder)"
                    : "var(--vscode-editor-foreground)",
                  top: handlePosition,
                }}
              />
            </CustomWidthTooltip>
            <StyledBox sx={{ p: disablePadding ? 0 : 2 }}>
              <StyledTypography
                sx={{
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "not-allowed" : "default",
                }}
              >
                {inputAnchor.label}
                {!inputAnchor.optional && (
                  <span style={{ color: "var(--vscode-errorForeground)" }}>
                    &nbsp;*
                  </span>
                )}
                {inputAnchor?.description && (
                  <TooltipWithParser
                    style={{ marginLeft: 10 }}
                    title={inputAnchor?.description}
                  />
                )}
              </StyledTypography>
            </StyledBox>
          </>
        )}
        {((inputParam && !inputParam?.additionalParams) ||
          isAdditionalParams) && (
          <>
            {inputParam?.acceptVariable && !isAdditionalParams && (
              <CustomWidthTooltip placement="left" title={inputParam.type}>
                <Handle
                  type="target"
                  position={Position.Left}
                  key={inputParam.id}
                  id={inputParam.id}
                  isValidConnection={(connection) => {
                    // isValidConnection(connection, reactFlowInstance)
                    return true;
                  }}
                  style={{
                    height: 10,
                    width: 10,
                    backgroundColor: nodeData.selected
                      ? "var(--vscode-focusBorder)"
                      : "var(--vscode-editor-foreground)",
                    top: handlePosition,
                  }}
                />
              </CustomWidthTooltip>
            )}
            <Box sx={{ p: disablePadding ? 0 : 2 }}>
              {(data.name === "promptTemplate" ||
                data.name === "chatPromptTemplate") &&
                (inputParam?.name === "template" ||
                  inputParam?.name === "systemMessagePrompt") && (
                  <>
                    <Button
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        width: "100%",
                      }}
                      disabled={disabled}
                      sx={{ borderRadius: 25, width: "100%", mb: 2, mt: 0 }}
                      variant="outlined"
                      onClick={() => onShowPromptHubButtonClicked()}
                      endIcon={<IconAutoFixHigh />}
                    >
                      Langchain Hub
                    </Button>
                  </>
                )}
              <div style={{ display: "flex", flexDirection: "row" }}>
                <Typography>
                  {inputParam?.label}
                  {!inputParam?.optional && (
                    <span style={{ color: "red" }}>&nbsp;*</span>
                  )}
                  {inputParam?.description && (
                    <TooltipWithParser
                      style={{ marginLeft: 10 }}
                      title={inputParam?.description}
                    />
                  )}
                </Typography>
                <div style={{ flexGrow: 1 }}></div>
                {inputParam?.hint && !isAdditionalParams && (
                  <IconButton
                    size="small"
                    sx={{
                      height: 25,
                      width: 25,
                    }}
                    title={inputParam.hint.label}
                    color="secondary"
                    onClick={() => onInputHintDialogClicked(inputParam.hint)}
                  >
                    <IconBulb />
                  </IconButton>
                )}
                {inputParam?.hint && isAdditionalParams && (
                  <Button
                    sx={{ p: 0, px: 2 }}
                    color="secondary"
                    variant="text"
                    onClick={() => {
                      onInputHintDialogClicked(inputParam.hint);
                    }}
                    startIcon={<IconBulb size={17} />}
                  >
                    {inputParam.hint.label}
                  </Button>
                )}
                {((inputParam?.type === "string" && inputParam.rows) ||
                  inputParam?.type === "code") && (
                  <IconButton
                    size="small"
                    sx={{
                      height: 25,
                      width: 25,
                    }}
                    title="Expand"
                    color="primary"
                    onClick={() =>
                      onExpandDialogClicked(
                        data.inputs[inputParam.name] ??
                          inputParam.default ??
                          "",
                        inputParam
                      )
                    }
                  >
                    <IconArrowsMaximize />
                  </IconButton>
                )}
              </div>
              {(inputParam?.type === "string" ||
                inputParam?.type === "password" ||
                inputParam?.type === "number") && (
                <Input
                  key={data.inputs[inputParam.name]}
                  disabled={disabled}
                  inputParam={inputParam}
                  onChange={(newValue) =>
                    (data.inputs[inputParam.name] = newValue)
                  }
                  value={
                    data.inputs[inputParam.name] ?? inputParam.default ?? ""
                  }
                  nodes={
                    inputParam?.acceptVariable && reactFlowInstance
                      ? reactFlowInstance.getNodes()
                      : []
                  }
                  edges={
                    inputParam?.acceptVariable && reactFlowInstance
                      ? reactFlowInstance.getEdges()
                      : []
                  }
                  nodeId={data.id}
                />
              )}
            </Box>
          </>
        )}
      </div>
    );
  }
);

NodeInputHandler.displayName = "NodeInputHandler";

export default NodeInputHandler;
