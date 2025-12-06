import { styled } from "@mui/material/styles";
import { Theme } from "@mui/material/styles";
import MainCard from "./MainCard";

// Extend theme types
declare module "@mui/material/styles" {
  interface Theme {
    darkTextPrimary?: string;
    palette: {
      [x: string]: any;
      text: {
        primary: string;
        secondary: string;
      };
      card?: {
        main?: string;
      };
      primary: {
        main: string;
        [key: string]: string;
      };
    };
  }

  interface ThemeOptions {
    darkTextPrimary?: string;
  }
}

const NodeCardWrapper = styled(MainCard)<{ theme?: Theme }>(({ theme }) => ({
  // theme が undefined の場合のフォールバック値を設定
  background: theme?.palette?.card?.main || 'var(--vscode-editor-background)',
  color: theme?.darkTextPrimary || theme?.palette?.text?.primary || 'var(--vscode-editor-foreground)',
  border: "solid 1px",
  borderColor: theme?.palette?.primary?.[200] || theme?.palette?.primary?.main || 'var(--vscode-editor-foreground)',
  width: "300px",
  height: "auto",
  padding: "10px",
  boxShadow: "0 2px 14px 0 rgb(32 40 45 / 8%)",
  "&:hover": {
    borderColor: theme?.palette?.primary?.main || 'var(--vscode-focusBorder)',
  },
}));

export default NodeCardWrapper;
