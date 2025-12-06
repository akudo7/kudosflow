import { createPortal } from "react-dom";
import { useState, useEffect, FC } from "react";
import { Dialog, DialogContent } from "@mui/material";
import PerfectScrollbar from "react-perfect-scrollbar";
import NodeInputHandler from "./NodeInputHandler";

interface InputParam {
  additionalParams?: boolean;
  hidden?: boolean;
  [key: string]: any;
}

interface DialogProps {
  data?: any;
  inputParams?: InputParam[];
  disabled?: boolean;
  confirmButtonName?: string;
  cancelButtonName?: string;
}

interface AdditionalParamsDialogProps {
  show: boolean;
  dialogProps: DialogProps;
  onCancel: () => void;
}

export const AdditionalParamsDialog: FC<AdditionalParamsDialogProps> = ({
  show,
  dialogProps,
  onCancel,
}) => {
  const portalElement = document.getElementById("root");

  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    if (dialogProps.inputParams) setInputParams(dialogProps.inputParams);
    if (dialogProps.data) setData(dialogProps.data);

    return () => {
      setInputParams([]);
      setData({});
    };
  }, [dialogProps]);

  const component = show ? (
    <Dialog
      onClose={onCancel}
      open={show}
      fullWidth
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogContent
        sx={{
          color: "var(--vscode-editor-foreground)",
          backgroundColor: "var(--vscode-editor-background)",
        }}
      >
        <PerfectScrollbar
          style={{
            height: "100%",
            maxHeight: "calc(100vh - 220px)",
            overflowX: "hidden",
          }}
        >
          {inputParams.map((inputParam, index) => {
            /*
            {
            additionalParams: true,
            default: "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.",
            description: "If Chat Prompt Template is provided, this will be ignored",
            id: "kudo-input-systemMessagePrompt-string",
            label: "System Message",
            name: "systemMessagePrompt",
            optional: true,
            placeholder: "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.",
            rows: 4,
            type: "string",
            }
            */
            // inputParam に id がない場合は追加
            const enhancedInputParam = {
              ...inputParam,
              id: inputParam.id || `input-${index}`,
            };

            return (
              <NodeInputHandler
                disabled={dialogProps.disabled}
                key={index}
                inputParam={enhancedInputParam}
                data={data}
                nodeData={{ id: `node-${index}`, selected: false }}
                isAdditionalParams={true}
              />
            );
          })}
        </PerfectScrollbar>
      </DialogContent>
    </Dialog>
  ) : null;

  if (!portalElement) {
    throw new Error("Portal element not found");
  }

  return createPortal(component, portalElement);
};

export default AdditionalParamsDialog;
