import { FC, useEffect, useRef, useState } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  ButtonBase,
  Typography,
  Stack,
  TextField,
} from "@mui/material";

// icons
import {
  IconSettings,
  IconChevronLeft,
  IconDeviceFloppy,
  IconPencil,
  IconCheck,
  IconX,
  IconCode,
} from "@tabler/icons-react";

// Common Avatar Style
const commonAvatarStyle = {
  cursor: "pointer",
  borderRadius: "8px",
  width: "34px",
  height: "34px",
  fontSize: "1.2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// Types
interface Chatflow {
  id: string;
  name: string;
  flowData: string;
  apikeyid?: string;
}

interface CanvasHeaderProps {
  chatflow: Chatflow | undefined;
  isAgentCanvas: boolean;
  handleSaveFlow: (name: string) => void;
  handleDeleteFlow: () => void;
  handleLoadFlow: (file: File) => void;
}

interface APIDialogProps {
  title: string;
  chatflowid: string;
  chatflowApiKeyId?: string;
  isFormDataRequired: boolean;
  isSessionMemory: boolean;
  isAgentCanvas: boolean;
}

interface DialogProps {
  title: string;
  chatflow: Chatflow;
}

interface RootState {
  canvas: {
    isDirty: boolean;
  };
}

// 共通のボタンスタイル
const buttonStyle = {
  ...commonAvatarStyle,
  transition: "all .2s ease-in-out",
  background: "var(--vscode-button-background)",
  color: "var(--vscode-button-foreground)",
  "&:hover": {
    background: "var(--vscode-button-hoverBackground)",
    color: "var(--vscode-button-foreground)",
  },
};

// セカンダリボタンスタイル
const secondaryButtonStyle = {
  ...commonAvatarStyle,
  transition: "all .2s ease-in-out",
  background: "var(--vscode-button-secondaryBackground)",
  color: "var(--vscode-button-secondaryForeground)",
  "&:hover": {
    background: "var(--vscode-button-secondaryHoverBackground)",
    color: "var(--vscode-button-secondaryForeground)",
  },
};

//テキストフィールドのスタイリング:
const textFieldStyle = {
  width: "100%",
  ml: 2,
  "& .MuiInputBase-input": {
    color: "var(--vscode-input-foreground)",
    backgroundColor: "var(--vscode-input-background)",
    border: "1px solid var(--vscode-input-border)",
    "&:focus": {
      borderColor: "var(--vscode-focusBorder)",
    },
  },
};

// タイポグラフィのスタイリング:
const typographyStyle = {
  fontSize: "1.5rem",
  fontWeight: 600,
  ml: 2,
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  color: "var(--vscode-foreground)",
};

const CanvasHeader: FC<CanvasHeaderProps> = ({
  chatflow,
  isAgentCanvas,
  handleSaveFlow,
  handleDeleteFlow,
  handleLoadFlow,
}) => {
  const theme = useTheme();
  const flowNameRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);

  const [isEditingFlowName, setEditingFlowName] = useState<boolean>(false);
  const [flowName, setFlowName] = useState<string>(
    chatflow?.name || "Untitled Chatflow"
  );
  const [isSettingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const title = isAgentCanvas ? "Agents" : "Chatflow";

  const handleBack = () => {
    // Implement back navigation logic
    console.log("Back navigation clicked");
  };

  const submitFlowName = () => {
    if (flowNameRef.current) {
      const newName = flowNameRef.current.value;
      handleSaveFlow(newName);
      setFlowName(newName);
      setEditingFlowName(false);
    }
  };

  const handleSaveClick = async () => {
    try {
      setIsSaving(true);
      await handleSaveFlow(flowName);
    } catch (error) {
      console.error("Failed to save flow:", error);
      // Here you might want to show an error message to the user
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Update flowName when chatflow changes
    if (chatflow?.name) {
      setFlowName(chatflow.name);
    }

    return () => {
      // Cleanup any subscriptions or side effects
    };
  }, [chatflow]);

  return (
    <>
      <Stack
        flexDirection="row"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Stack flexDirection="row" sx={{ width: "100%", maxWidth: "50%" }}>
          <Box>
            <ButtonBase title="Back" sx={{ borderRadius: "50%" }}>
              <Avatar
                variant="rounded"
                sx={secondaryButtonStyle}
                color="inherit"
                onClick={handleBack}
              >
                <IconChevronLeft stroke={1.5} size="1.3rem" />
              </Avatar>
            </ButtonBase>
          </Box>
          <Box sx={{ width: "100%" }}>
            {!isEditingFlowName ? (
              <Stack flexDirection="row">
                <Typography sx={typographyStyle}>
                  {false && (
                    <strong style={{ color: "var(--vscode-errorForeground)" }}>
                      *
                    </strong>
                  )}{" "}
                  {flowName}{" "}
                </Typography>
                {chatflow?.id && (
                  <ButtonBase title="Edit Name" sx={{ borderRadius: "50%" }}>
                    <Avatar
                      variant="rounded"
                      sx={secondaryButtonStyle}
                      color="inherit"
                      onClick={() => setEditingFlowName(true)}
                    >
                      <IconPencil stroke={1.5} size="1.3rem" />
                    </Avatar>
                  </ButtonBase>
                )}
              </Stack>
            ) : (
              <Stack flexDirection="row" sx={{ width: "100%" }}>
                <TextField
                  //eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  size="small"
                  inputRef={flowNameRef}
                  sx={textFieldStyle}
                  defaultValue={flowName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submitFlowName();
                    } else if (e.key === "Escape") {
                      setEditingFlowName(false);
                    }
                  }}
                />
                <ButtonBase title="Save Name" sx={{ borderRadius: "50%" }}>
                  <Avatar
                    variant="rounded"
                    sx={secondaryButtonStyle}
                    color="inherit"
                  >
                    <IconCheck stroke={1.5} size="1.3rem" />
                  </Avatar>
                </ButtonBase>
                <ButtonBase title="Cancel" sx={{ borderRadius: "50%" }}>
                  <Avatar
                    variant="rounded"
                    sx={secondaryButtonStyle}
                    color="inherit"
                    onClick={() => setEditingFlowName(false)}
                  >
                    <IconX stroke={1.5} size="1.3rem" />
                  </Avatar>
                </ButtonBase>
              </Stack>
            )}
          </Box>
        </Stack>
        <Box>
          {chatflow?.id && (
            <ButtonBase
              title="API Endpoint"
              sx={{ borderRadius: "50%", mr: 2 }}
            >
              <Avatar
                variant="rounded"
                sx={secondaryButtonStyle}
                color="inherit"
              >
                <IconCode stroke={1.5} size="1.3rem" />
              </Avatar>
            </ButtonBase>
          )}
          <ButtonBase
            title={`Save ${title}`}
            sx={{ borderRadius: "50%", mr: 2 }}
          >
            <Avatar variant="rounded" sx={secondaryButtonStyle} color="inherit">
              <IconDeviceFloppy stroke={1.5} size="1.3rem" />
            </Avatar>
          </ButtonBase>
          <ButtonBase
            ref={settingsRef}
            title="Settings"
            sx={{ borderRadius: "50%" }}
          >
            <Avatar
              variant="rounded"
              sx={secondaryButtonStyle}
              onClick={() => setSettingsOpen(!isSettingsOpen)}
            >
              <IconSettings stroke={1.5} size="1.3rem" />
            </Avatar>
          </ButtonBase>
        </Box>
      </Stack>
    </>
  );
};

export default CanvasHeader;
