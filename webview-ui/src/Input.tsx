import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FormControl, OutlinedInput, InputBase, Popover } from "@mui/material";

import SelectVariable from "./SelectVariable";
import { getAvailableNodesForVariable } from "./genericHelper";

interface InputParams {
  step?: number;
  placeholder?: string | undefined;
  name?: string; // 必須プロパティとして追加
  id?: string;
  type?: "string" | "password" | "number" | "code";
  label?: string;
  optional?: boolean;
  description?: string;
  default?: string | number;
  acceptVariable?: boolean;
  rows?: number;
  hint?: {
    label: string;
    [key: string]: any;
  };
  additionalParams?: boolean;
}

interface InputProps {
  inputParam: InputParams;
  value?: string | number;
  nodes?: any[]; // より具体的な型定義が必要な場合は変更してください
  edges?: any[]; // より具体的な型定義が必要な場合は変更してください
  nodeId?: string;
  onChange: (value: string | number) => void;
  disabled?: boolean;
}

export const Input = ({
  inputParam,
  value,
  nodes,
  edges,
  nodeId,
  onChange,
  disabled = false,
}: InputProps): JSX.Element => {
  const [myValue, setMyValue] = useState<string | number>(value ?? "");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [availableNodesForVariable, setAvailableNodesForVariable] = useState<
    any[]
  >([]);
  const ref = useRef<HTMLDivElement>(null);

  const openPopOver: boolean = Boolean(anchorEl);

  const handleClosePopOver = (): void => {
    setAnchorEl(null);
  };

  const setNewVal = (val: string): void => {
    const newVal = `${myValue}${val.substring(2)}`;
    onChange(newVal);
    setMyValue(newVal);
  };

  const getInputType = (type?: string): string => {
    switch (type) {
      case "string":
        return "text";
      case "password":
        return "password";
      case "number":
        return "number";
      default:
        return "text";
    }
  };

  useEffect(() => {
    if (!disabled && nodes && edges && nodeId && inputParam) {
      const nodesForVariable = inputParam?.acceptVariable
        ? getAvailableNodesForVariable(nodes, edges, nodeId, inputParam.id)
        : [];
      setAvailableNodesForVariable(nodesForVariable);
    }
  }, [disabled, inputParam, nodes, edges, nodeId]);

  useEffect(() => {
    if (typeof myValue === "string" && myValue && myValue.endsWith("{{")) {
      setAnchorEl(ref.current);
    }
  }, [myValue]);

  return (
    <>
      {inputParam.name === "note" ? (
        <FormControl
          sx={{
            background: "var(--section-divider-background,rgb(101, 93, 93))",
            opacity: "var(--section-divider-opacity)",
            width: "100%",
            height: "auto",
          }}
          size="small"
        >
          <InputBase
            id={nodeId}
            size="small"
            disabled={disabled}
            type={getInputType(inputParam.type)}
            placeholder={inputParam.placeholder}
            multiline={!!inputParam.rows}
            minRows={inputParam.rows ?? 1}
            value={myValue}
            name={inputParam.name}
            onChange={(e) => {
              setMyValue(e.target.value);
              onChange(e.target.value);
            }}
            inputProps={{
              step: inputParam.step ?? 1,
              style: {
                border: "none",
                background: "none",
                color: "#212121",
              },
            }}
            sx={{
              border: "none",
              background: "none",
              padding: "10px 14px",
              textarea: {
                "&::placeholder": {
                  color: "var(--vscode-editor-foreground)",
                },
              },
            }}
          />
        </FormControl>
      ) : (
        <FormControl 
          sx={{ 
            background: "var(--section-divider-background,rgb(101, 93, 93))",
            opacity: "var(--section-divider-opacity)",
            mt: 1, 
            width: "100%" 
          }} 
          size="small">
          <OutlinedInput
            id={inputParam.name}
            size="small"
            disabled={disabled}
            type={getInputType(inputParam.type)}
            placeholder={inputParam.placeholder}
            multiline={!!inputParam.rows}
            rows={inputParam.rows ?? 1}
            value={myValue}
            name={inputParam.name}
            onChange={(e) => {
              setMyValue(e.target.value);
              onChange(e.target.value);
            }}
            inputProps={{
              step: inputParam.step ?? 1,
              style: {
                height: inputParam.rows ? "90px" : "inherit",
                color: "var(--vscode-editor-foreground)"
              },
            }}
          />
        </FormControl>
      )}
      <div ref={ref}></div>
      {inputParam?.acceptVariable && (
        <Popover
          open={openPopOver}
          anchorEl={anchorEl}
          onClose={handleClosePopOver}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <SelectVariable
            disabled={disabled}
            availableNodesForVariable={availableNodesForVariable}
            onSelectAndReturnVal={(val: string) => {
              setNewVal(val);
              handleClosePopOver();
            }}
          />
        </Popover>
      )}
    </>
  );
};
