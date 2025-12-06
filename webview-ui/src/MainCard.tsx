import React, { forwardRef, ReactNode } from "react";
import PropTypes from "prop-types";

// material-ui
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";

// Define an interface for the component props
interface MainCardProps {
  boxShadow?: boolean;
  children?: ReactNode;
  content?: boolean;
  contentClass?: string;
  contentSX?: SxProps<Theme>;
  darkTitle?: boolean;
  secondary?: ReactNode;
  shadow?: string;
  sx?: SxProps<Theme>;
  title?: ReactNode;
  border?: boolean;
  elevation?: number;
}

// constant
const headerSX = {
  "& .MuiCardHeader-action": { mr: 0 },
};

const MainCard = forwardRef<HTMLDivElement, MainCardProps>(
  (
    {
      boxShadow,
      children,
      content = true,
      contentClass = "",
      contentSX = {
        px: 2,
        py: 0,
      },
      darkTitle,
      secondary,
      shadow,
      sx = {},
      title,
      border,
      ...others
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        {...others}
        sx={{
          background: "transparent",
          ":hover": {
            boxShadow: boxShadow
              ? shadow || "0 2px 14px 0 rgb(32 40 45 / 8%)"
              : "inherit",
          },
          maxWidth: "1280px",
          mx: "auto",
          ...(border === false ? { border: "none" } : {}),
          ...sx,
        }}
      >
        {/* card header and action */}
        {!darkTitle && title && (
          <CardHeader sx={headerSX} title={title} action={secondary} />
        )}
        {darkTitle && title && (
          <CardHeader
            sx={headerSX}
            title={<Typography variant="h3">{title}</Typography>}
            action={secondary}
          />
        )}

        {/* content & header divider */}
        {title && <Divider />}

        {/* card content */}
        {content && (
          <CardContent sx={contentSX} className={contentClass}>
            {children}
          </CardContent>
        )}
        {!content && children}
      </Card>
    );
  }
);

MainCard.propTypes = {
  border: PropTypes.bool,
  boxShadow: PropTypes.bool,
  children: PropTypes.node as any,
  content: PropTypes.bool,
  contentClass: PropTypes.string,
  contentSX: PropTypes.object,
  darkTitle: PropTypes.bool,
  secondary: PropTypes.node as any,
  shadow: PropTypes.string,
  sx: PropTypes.object,
  title: PropTypes.node as any,
} as any;

MainCard.displayName = "MainCard";

export default MainCard;