import { styled } from "@mui/material/styles";
import { Fab } from "@mui/material";

export const StyledFab = styled(Fab)(({ theme, color = "primary" }) => ({
  color: "white",
  backgroundColor: "var(--vscode-button-background)",
  "&:hover": {
    backgroundColor: "var(--vscode-button-background)",
    backgroundImage: `linear-gradient(rgb(0 0 0/10%) 0 0)`,
  },
}));
