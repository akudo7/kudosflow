import { styled, Theme } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";

// カスタムテーマの型定義
declare module "@mui/material/styles" {
  interface Palette {
    nodeToolTip: {
      background: string;
      color: string;
    };
  }
  interface PaletteOptions {
    nodeToolTip: {
      background: string;
      color: string;
    };
  }
}

// コンポーネントのProps型定義
interface NodeTooltipProps extends Omit<TooltipProps, "classes"> {
  className?: string;
}

const NodeTooltip = styled(({ className, ...props }: NodeTooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }: { theme: Theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    color: "var(--vscode-editor-foreground)",
    backgroundColor: "var(--vscode-editor-background)",
    boxShadow: "0 2px 14px 0 rgb(32 40 45 / 8%)",
  },
}));

export default NodeTooltip;
