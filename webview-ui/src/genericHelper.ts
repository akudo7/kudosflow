export const getUniqueNodeId = (
  nodeData: NodeData,
  nodes: NodeData[]
): string => {
  let suffix = 0;
  let baseId = `${nodeData.name}_${suffix}`;

  while (nodes.some((node) => node.id === baseId)) {
    suffix += 1;
    baseId = `${nodeData.name}_${suffix}`;
  }

  return baseId;
};

const convertToInputAnchor = (input: NodeInput): InputAnchor => {
  return {
      ...input,
      id: input.id || '', // Provide default value since id is optional in NodeInput
      // label: input.label ?? input.name,  // Using name as label
      // optional: input.optional ?? input.additionalParams // Using additionalParams as optional flag
  };
};

export const initNode = (nodeData: NodeData, newNodeId: string): NodeData => {
  const inputAnchors: NodeInput[] = [];
  const inputParams: NodeInput[] = [];
  const incoming =
    nodeData.inputs && Array.isArray(nodeData.inputs)
      ? nodeData.inputs.length
      : 0;
  const outgoing = 1;

  const whitelistTypes = [
    "asyncOptions",
    "options",
    "multiOptions",
    "datagrid",
    "string",
    "number",
    "boolean",
    "password",
    "json",
    "code",
    "date",
    "file",
    "folder",
    "tabs",
    "conditionFunction",
  ];

  // Inputs
  if (nodeData.inputs && Array.isArray(nodeData.inputs)) {
    for (let i = 0; i < incoming; i += 1) {
      const input = nodeData.inputs[i];
      const newInput: NodeInput = {
        ...input,
        id: `${newNodeId}-input-${input.name}-${input.type}`,
        hidden: false,  // Add the missing required property
      };
      if (whitelistTypes.includes(input.type)) {
        console.log('inputParams', newInput);
        inputParams.push(newInput);
      } else {
        console.log('inputAnchors', newInput);
        inputAnchors.push(newInput);
      }
    }
  }

  // Credential
  if (nodeData.credential) {
    const newInput: NodeInput = {
      ...nodeData.credential,
      id: `${newNodeId}-input-${nodeData.credential.name}-${nodeData.credential.type}`,
      hidden: false, // Add the missing required property
    };
    inputParams.unshift(newInput);
  }

  // Outputs
  const outputAnchors: NodeOutput[] = [];
  if (!nodeData.hideOutput) {
    if (
      nodeData.outputs &&
      Array.isArray(nodeData.outputs) &&
      nodeData.outputs.length
    ) {
      const options: NodeOutput[] = [];
      for (let j = 0; j < nodeData.outputs.length; j += 1) {
        const output = nodeData.outputs[j];
        let baseClasses = "";
        let type = "";

        const outputBaseClasses = output.baseClasses ?? [];
        if (outputBaseClasses.length > 1) {
          baseClasses = outputBaseClasses.join("|");
          type = outputBaseClasses.join(" | ");
        } else if (outputBaseClasses.length === 1) {
          baseClasses = outputBaseClasses[0];
          type = outputBaseClasses[0];
        }

        const newOutputOption: NodeOutput = {
          id: `${newNodeId}-output-${output.name}-${baseClasses}`,
          name: output.name,
          label: output.label,
          description: output.description ?? "",
          type,
          isAnchor: output?.isAnchor,
          hidden: output?.hidden,
        };
        options.push(newOutputOption);
      }
      const newOutput: NodeOutput = {
        name: "output",
        label: "Output",
        type: "options",
        description: nodeData.outputs[0]?.description ?? "",
        options,
        default: nodeData.outputs[0]?.name,
      };
      outputAnchors.push(newOutput);
    } else {
      const newOutput: NodeOutput = {
        id: `${newNodeId}-output-${nodeData.name}-${nodeData.baseClasses!.join(
          "|"
        )}`,
        name: nodeData.name,
        label: nodeData.type,
        description: nodeData.description ?? "",
        type: nodeData.baseClasses!.join(" | "),
      };
      outputAnchors.push(newOutput);
    }
  }

  // Inputs
  nodeData.inputAnchors = inputAnchors.map(convertToInputAnchor);
  nodeData.inputParams = inputParams;
  nodeData.inputs =
    nodeData.inputs && Array.isArray(nodeData.inputs)
      ? nodeData.inputs.reduce<Record<string, any>>(
          (acc, input) => ({
            ...acc,
            [input.name]: input.default ?? "",
          }),
          {}
        )
      : {};

  // Outputs
  nodeData.outputs = outputAnchors.length
    ? outputAnchors.reduce<Record<string, any>>(
        (acc, output) => ({
          ...acc,
          [output.name]: output.default ?? "",
        }),
        {}
      )
    : {};

  nodeData.outputAnchors = outputAnchors;

  // Credential
  if (nodeData.credential) {
    nodeData.credential = undefined;
  }

  nodeData.id = newNodeId;

  return nodeData;
};

interface Connection {
  sourceHandle: string;
  targetHandle: string;
  target: string;
}

interface ReactFlowInstance {
  getNode: (id: string) => NodeData | undefined;
  getEdges: () => Edge[];
}

interface Edge {
  targetHandle: string;
}

export const isValidConnection = (
  connection: Connection,
  reactFlowInstance: ReactFlowInstance
): boolean => {
  const sourceHandle = connection.sourceHandle;
  const targetHandle = connection.targetHandle;
  const target = connection.target;

  //sourceHandle: "llmChain_0-output-llmChain-BaseChain"
  //targetHandle: "mrlkAgentLLM_0-input-model-BaseLanguageModel"

  let sourceTypes = sourceHandle
    .split("-")
    [sourceHandle.split("-").length - 1].split("|");
  sourceTypes = sourceTypes.map((s) => s.trim());
  let targetTypes = targetHandle
    .split("-")
    [targetHandle.split("-").length - 1].split("|");
  targetTypes = targetTypes.map((t) => t.trim());

  if (targetTypes.some((t) => sourceTypes.includes(t))) {
    let targetNode = reactFlowInstance.getNode(target);

    if (!targetNode) {
      if (
        !reactFlowInstance
          .getEdges()
          .find((e) => e.targetHandle === targetHandle)
      ) {
        return true;
      }
    } else {
      const targetNodeInputAnchor =
        targetNode.data.inputAnchors.find(
          (ancr: { id: string }) => ancr.id === targetHandle
        ) ||
        targetNode.data.inputParams.find(
          (ancr: { id: string }) => ancr.id === targetHandle
        );
      if (
        (targetNodeInputAnchor &&
          !targetNodeInputAnchor?.list &&
          !reactFlowInstance
            .getEdges()
            .find((e) => e.targetHandle === targetHandle)) ||
        targetNodeInputAnchor?.list
      ) {
        return true;
      }
    }
  }
  return false;
};

interface Node {
  id: string;
  data: {
    name: string;
    category?: string;
  };
}

interface Edge {
  source: string;
  target: string;
  targetHandle: string;
}

export const getAvailableNodesForVariable = (
  nodes: Node[],
  edges: Edge[],
  target: string,
  targetHandle: string | undefined
): Node[] => {
  const parentNodes: Node[] = [];

  const targetNode = nodes.find((nd) => nd.id === target);
  const isSeqAgent = targetNode?.data?.category === "Sequential Agents";

  function collectParentNodes(
    targetNodeId: string, 
    nodes: Node[], 
    edges: Edge[]
  ): void {
    const inputEdges = edges.filter(
      (edg) =>
        edg.target === targetNodeId &&
        edg.targetHandle.includes(`${targetNodeId}-input-sequentialNode`)
    );

    inputEdges.forEach((edge) => {
      const parentNode = nodes.find((nd) => nd.id === edge.source);
      if (!parentNode) {return;}

      // 再帰的に親ノードを探索
      collectParentNodes(parentNode.id, nodes, edges);

      const excludeNodeNames = [
        "seqAgent",
        "seqLLMNode",
        "seqToolNode",
        "seqCustomFunction",
        "seqExecuteFlow",
      ];
      
      if (excludeNodeNames.includes(parentNode.data.name)) {
        parentNodes.push(parentNode);
      }
    });
  }

  if (isSeqAgent) {
    collectParentNodes(target, nodes, edges);
    // uniq関数は配列から重複を除去する関数です
    // lodashのuniqを使用する場合:
    // return uniq(parentNodes);
    // または純粋なJavaScriptで実装する場合:
    return Array.from(new Set(parentNodes));
  } else {
    const inputEdges = edges.filter(
      (edg) => edg.target === target && edg.targetHandle === targetHandle
    );
    
    if (inputEdges && inputEdges.length) {
      for (const edge of inputEdges) {
        const node = nodes.find((nd) => nd.id === edge.source);
        if (node) {
          parentNodes.push(node);
        }
      }
    }
    return parentNodes;
  }
};
