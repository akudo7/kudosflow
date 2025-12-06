import { useRef, useState, useCallback, useContext } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
} from "reactflow";
// material-ui
import { Toolbar, Box, AppBar, Button, Fab } from "@mui/material";

import "reactflow/dist/style.css";

import CanvasNode from "./CanvasNode";
// utils
import { getUniqueNodeId, initNode } from "./genericHelper";
import AddNodes from "./AddNodes";
import { flowContext } from "./ReactFlowContext";
import CanvasHeader from "./CanvasHeader";

const nodesData: NodeData[] = [
  {
    label: "Conversation Chain",
    name: "conversationChain",
    version: 3,
    type: "ConversationChain",
    icon: "ConversationChain.svg",
    category: "Chains",
    description: "Chat models specific conversational chain with memory",
    baseClasses: ["ConversationChain", "LLMChain", "BaseChain", "Runnable"],
    inputs: [
      {
        label: "Chat Model",
        name: "model",
        type: "BaseChatModel",
      },
      {
        label: "Memory",
        name: "memory",
        type: "BaseMemory",
      },
      {
        label: "Chat Prompt Template",
        name: "chatPromptTemplate",
        type: "ChatPromptTemplate",
        description:
          "Override existing prompt with Chat Prompt Template. Human Message must includes {input} variable",
        optional: true,
      },
      {
        label: "Input Moderation",
        description:
          "Detect text that could generate harmful output and prevent it from being sent to the language model",
        name: "inputModeration",
        type: "Moderation",
        optional: true,
        list: true,
      },
      {
        label: "System Message",
        name: "systemMessagePrompt",
        type: "string",
        rows: 4,
        description:
          "If Chat Prompt Template is provided, this will be ignored",
        additionalParams: true,
        optional: true,
        default:
          "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.",
        placeholder:
          "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.",
      },
    ],
    filePath:
      "/Users/akirakudo/Desktop/MyWork/Flowise/packages/server/node_modules/flowise-components/dist/nodes/chains/ConversationChain/ConversationChain.js",
    inputAnchors: [],
    outputAnchors: [],
    inputParams: [],
    id: "",
  },
];
const initialNodes: Node[] = [
  /*
    {
      id: "1",
      position: { x: 0, y: 0 },
      type: "customNode",
      data: initNode(nodeData[0], "kudo"),
    },
    */
];
const initialEdges: any[] = [];
const nodeTypes = { customNode: CanvasNode };

interface DropEvent {
  preventDefault: () => void;
  dataTransfer: { getData: (arg0: string) => any };
  clientX: number;
  clientY: number;
}

function App() {
  const { reactFlowInstance, setReactFlowInstance } = useContext(flowContext);

  // ==============================|| ReactFlow ||============================== //

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const setDirty = () => {
    // dispatch({ type: SET_DIRTY });
  };

  const onDrop = useCallback(
    (event: DropEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds /* || !reactFlowInstance */) {
        return;
      }
      let nodeData = event.dataTransfer.getData("application/reactflow");
      // check if the dropped element is valid
      if (typeof nodeData === "undefined" || !nodeData) {
        return;
      }
      nodeData = JSON.parse(nodeData);
      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      }) ?? { x: event.clientX - 100, y: event.clientY - 50 };

      // TODO:Create a nodeId correctly
      const newNodeId = Date.now().toString();
      // const newNodeId = getUniqueNodeId(nodeData, nodesData); // reactFlowInstance.getNodes()
      const newNode: Node = {
        id: newNodeId,
        position,
        type: nodeData.type !== "StickyNote" ? "customNode" : "stickyNote",
        data: initNode(nodeData, newNodeId),
      };

      setSelectedNode(newNode);
      setNodes((nds) =>
        nds.concat(newNode).map((node) => {
          if (node.id === newNode.id) {
            node.data = {
              ...node.data,
              selected: true,
            };
          } else {
            node.data = {
              ...node.data,
              selected: false,
            };
          }
          return node;
        })
      );
      setTimeout(() => setDirty(), 0);
    },

    // eslint-disable-next-line
    [reactFlowInstance]
  );

  const onNodeClick = useCallback((_event: any, clickedNode: Node) => {
    setSelectedNode(clickedNode);
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: node.id === clickedNode.id,
        },
      }))
    );
  }, []); // Add empty dependency array

  function handleSaveFlow(name: string): void {
    throw new Error("Function not implemented.");
  }

  function handleDeleteFlow(): void {
    throw new Error("Function not implemented.");
  }

  function handleLoadFlow(file: File): void {
    throw new Error("Function not implemented.");
  }

  return (
    <>
      <Box>
        <AppBar
          enableColorOnDark
          position="fixed"
          color="inherit"
          elevation={1}
          sx={{
            backgroundColor: "var(--vscode-editor-background)",
          }}
        >
          <Toolbar>
            <CanvasHeader
              chatflow={undefined}
              handleSaveFlow={handleSaveFlow}
              handleDeleteFlow={handleDeleteFlow}
              handleLoadFlow={handleLoadFlow}
              isAgentCanvas={false}
            />
          </Toolbar>
        </AppBar>
        <Box
          sx={{ pt: "70px", height: "100vh", width: "100vw" }}
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            onEdgesChange={onEdgesChange}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
          >
            <Controls
              style={{
                display: "flex",
                flexDirection: "row",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <AddNodes nodesData={nodesData} isAgentCanvas={false} />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </Box>
      </Box>
    </>
  );
}

export default App;
