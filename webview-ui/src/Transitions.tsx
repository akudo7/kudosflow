import PropTypes from "prop-types";
import { forwardRef, ReactNode } from "react";

// material-ui
import { Collapse, Fade, Box, Grow, Slide, Zoom } from "@mui/material";

// Types
type TransitionType = "grow" | "fade" | "collapse" | "slide" | "zoom";
type PositionType = "top-left" | "top-right" | "top" | "bottom-left" | "bottom-right" | "bottom";
type DirectionType = "up" | "down" | "left" | "right";

interface TransitionsProps {
  children: ReactNode;
  position?: PositionType;
  type?: TransitionType;
  direction?: DirectionType;
  [key: string]: any; // その他のプロパティ用
}

// ==============================|| TRANSITIONS ||============================== //

const Transitions = forwardRef<HTMLDivElement, TransitionsProps>(function Transitions(
  { children, position = "top-left", type = "grow", direction = "up", ...others },
  ref
) {
  let positionSX: { transformOrigin: string } = {
    transformOrigin: "0 0 0",
  };

  switch (position) {
    case "top-right":
      positionSX = {
        transformOrigin: "top right",
      };
      break;
    case "top":
      positionSX = {
        transformOrigin: "top",
      };
      break;
    case "bottom-left":
      positionSX = {
        transformOrigin: "bottom left",
      };
      break;
    case "bottom-right":
      positionSX = {
        transformOrigin: "bottom right",
      };
      break;
    case "bottom":
      positionSX = {
        transformOrigin: "bottom",
      };
      break;
    case "top-left":
    default:
      positionSX = {
        transformOrigin: "0 0 0",
      };
      break;
  }

  return (
    <Box ref={ref}>
      {type === "grow" && (
        <Grow {...others}>
          <Box sx={positionSX}>{children}</Box>
        </Grow>
      )}
      {type === "collapse" && (
        <Collapse {...others} sx={positionSX}>
          {children}
        </Collapse>
      )}
      {type === "fade" && (
        <Fade
          {...others}
          timeout={{
            appear: 500,
            enter: 600,
            exit: 400,
          }}
        >
          <Box sx={positionSX}>{children}</Box>
        </Fade>
      )}
      {type === "slide" && (
        <Slide
          {...others}
          timeout={{
            appear: 0,
            enter: 400,
            exit: 200,
          }}
          direction={direction}
        >
          <Box sx={positionSX}>{children}</Box>
        </Slide>
      )}
      {type === "zoom" && (
        <Zoom {...others}>
          <Box sx={positionSX}>{children}</Box>
        </Zoom>
      )}
    </Box>
  );
});

// PropTypesは TypeScriptの型で代替されるため削除可能ですが、
// 実行時の型チェックが必要な場合は残しておくことも可能です
Transitions.propTypes = {
  children: PropTypes.node,
  type: PropTypes.oneOf(["grow", "fade", "collapse", "slide", "zoom"]),
  position: PropTypes.oneOf([
    "top-left",
    "top-right",
    "top",
    "bottom-left",
    "bottom-right",
    "bottom",
  ]),
  direction: PropTypes.oneOf(["up", "down", "left", "right"]),
};

export default Transitions;
