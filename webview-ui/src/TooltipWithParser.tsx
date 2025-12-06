import { Info } from "@mui/icons-material";
import { IconButton, Tooltip, SxProps, Theme } from "@mui/material";
import parser from "html-react-parser";

interface TooltipWithParserProps {
  title: string | React.ReactNode;
  sx?: SxProps<Theme>;
  style?: React.CSSProperties; // style プロパティを追加
}

interface CustomizationState {
  customization: {
    isDarkMode: boolean;
  };
}

export const TooltipWithParser: React.FC<TooltipWithParserProps> = ({
  title,
  sx,
  style,
}) => {
  return (
    <Tooltip
      title={typeof title === "string" ? parser(title) : title}
      placement="right"
    >
      <IconButton sx={{ height: 15, width: 15, ml: 2, mt: -0.5 }} style={style}>
        <Info
          sx={{
            ...sx,
            background: "transparent",
            color: true ? "white" : "inherit",
            height: 15,
            width: 15,
          }}
        />
      </IconButton>
    </Tooltip>
  );
};
