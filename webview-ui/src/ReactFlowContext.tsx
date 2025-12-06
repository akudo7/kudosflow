import { createContext, ReactNode, useState } from "react";
// import { useDispatch } from "react-redux";
import { cloneDeep } from "lodash";
import { getUniqueNodeId } from "./genericHelper";
// import { SET_DIRTY } from "@/store/actions";
import { Node, Edge, ReactFlowInstance } from 'reactflow';

interface InputAnchor {
  name: string;
  id: string;
  list?: boolean;
}

interface InputParam {
  name: string;
  id: string;
  acceptVariable?: boolean;
}

interface OutputAnchor {
  id: string;
  options?: Array<{ id: string }>;
}

interface NodeData {
  id: string;
  inputAnchors: InputAnchor[];
  outputAnchors: OutputAnchor[];
  inputParams: InputParam[];
  inputs: {
    [key: string]: string | string[];
  };
}

interface FlowContextType {
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  duplicateNode: (id: string) => void;
  deleteNode: (nodeid: string) => void;
  deleteEdge: (edgeid: string) => void;
}

const initialValue: FlowContextType = {
  reactFlowInstance: null,
  setReactFlowInstance: () => {},
  duplicateNode: () => {},
  deleteNode: () => {},
  deleteEdge: () => {},
};

export const flowContext = createContext<FlowContextType>(initialValue);

interface ReactFlowContextProps {
  children: ReactNode;
}

export const ReactFlowContext = ({ children }: ReactFlowContextProps) => {
  // const dispatch = useDispatch();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const deleteNode = (nodeid: string): void => {
    if (!reactFlowInstance) return;
    
    deleteConnectedInput(nodeid, "node");
    reactFlowInstance.setNodes(
      reactFlowInstance.getNodes().filter((n) => n.id !== nodeid)
    );
    reactFlowInstance.setEdges(
      reactFlowInstance
        .getEdges()
        .filter((ns) => ns.source !== nodeid && ns.target !== nodeid)
    );
    // dispatch({ type: SET_DIRTY });
  };

  const deleteEdge = (edgeid: string): void => {
    if (!reactFlowInstance) return;

    deleteConnectedInput(edgeid, "edge");
    reactFlowInstance.setEdges(
      reactFlowInstance.getEdges().filter((edge) => edge.id !== edgeid)
    );
    // dispatch({ type: SET_DIRTY });
  };

  const deleteConnectedInput = (id: string, type: "node" | "edge"): void => {
    if (!reactFlowInstance) return;

    const connectedEdges =
      type === "node"
        ? reactFlowInstance.getEdges().filter((edge) => edge.source === id)
        : reactFlowInstance.getEdges().filter((edge) => edge.id === id);

    for (const edge of connectedEdges) {
      const targetNodeId = edge.target;
      const sourceNodeId = edge.source;
      const targetInput = edge.targetHandle?.split("-")[2];

      if (!targetInput) continue;

      reactFlowInstance.setNodes((nds) =>
        nds.map((node) => {
          if (node.id === targetNodeId) {
            let value: string | string[];
            const inputAnchor = node.data.inputAnchors.find(
              (ancr: { name: string; }) => ancr.name === targetInput
            );
            const inputParam = node.data.inputParams.find(
              (param: { name: string; }) => param.name === targetInput
            );

            if (inputAnchor && inputAnchor.list) {
              const values = (node.data.inputs[targetInput] as string[]) || [];
              value = values.filter((item) => !item.includes(sourceNodeId));
            } else if (inputParam && inputParam.acceptVariable) {
              value =
                ((node.data.inputs[targetInput] as string).replace(
                  `{{${sourceNodeId}.data.instance}}`,
                  ""
                )) || "";
            } else {
              value = "";
            }
            node.data = {
              ...node.data,
              inputs: {
                ...node.data.inputs,
                [targetInput]: value,
              },
            };
          }
          return node;
        })
      );
    }
  };

  const duplicateNode = (id: string): void => {
    if (!reactFlowInstance) return;

    const nodes = reactFlowInstance.getNodes() as any;
    const originalNode = nodes.find((n: { id: string; }) => n.id === id);
    if (originalNode) {
      const newNodeId = getUniqueNodeId(originalNode.data, nodes);
      const clonedNode = cloneDeep(originalNode);

      const duplicatedNode: Node = {
        ...clonedNode,
        id: newNodeId,
        position: {
          x: clonedNode.position.x + 400,
          y: clonedNode.position.y,
        },
        positionAbsolute: {
          x: clonedNode.positionAbsolute.x + 400,
          y: clonedNode.positionAbsolute.y,
        },
        data: {
          ...clonedNode.data,
          id: newNodeId,
        },
        selected: false,
      };

      const inputKeys: Array<keyof Pick<NodeData, "inputParams" | "inputAnchors">> = [
        "inputParams",
        "inputAnchors",
      ];
      for (const key of inputKeys) {
        for (const item of duplicatedNode.data[key]) {
          if (item.id) {
            item.id = item.id.replace(id, newNodeId);
          }
        }
      }

      const outputKeys: Array<keyof Pick<NodeData, "outputAnchors">> = ["outputAnchors"];
      for (const key of outputKeys) {
        for (const item of duplicatedNode.data[key]) {
          if (item.id) {
            item.id = item.id.replace(id, newNodeId);
          }
          if (item.options) {
            for (const output of item.options) {
              output.id = output.id.replace(id, newNodeId);
            }
          }
        }
      }

      // Clear connected inputs
      for (const inputName in duplicatedNode.data.inputs) {
        const input = duplicatedNode.data.inputs[inputName];
        if (
          typeof input === "string" &&
          input.startsWith("{{") &&
          input.endsWith("}}")
        ) {
          duplicatedNode.data.inputs[inputName] = "";
        } else if (Array.isArray(input)) {
          duplicatedNode.data.inputs[inputName] = input.filter(
            (item) =>
              !(
                typeof item === "string" &&
                item.startsWith("{{") &&
                item.endsWith("}}")
              )
          );
        }
      }

      reactFlowInstance.setNodes([...nodes, duplicatedNode]);
      // dispatch({ type: SET_DIRTY });
    }
  };

  return (
    <flowContext.Provider
      value={{
        reactFlowInstance,
        setReactFlowInstance,
        deleteNode,
        deleteEdge,
        duplicateNode,
      }}
    >
      {children}
    </flowContext.Provider>
  );
};
