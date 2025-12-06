import { CSSProperties } from 'react';

// VSCode拡張機能用のスタイル定義
const styles: Record<string, CSSProperties> = {
  container: {
    flex: 30,
  },
  scrollContainer: {
    height: "100%",
    maxHeight: "calc(100vh - 220px)",
    overflowX: "hidden",
  },
  listItemButton: {
    padding: 0,
    borderRadius: "4px",
    boxShadow: "0 2px 14px 0 rgb(32 40 45 / 8%)",
    marginBottom: "8px",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: "100%",
    padding: 10,
    objectFit: "contain" as const,
  },
};

const sequentialStateMessagesSelection = [
  {
    primary: "$flow.state.messages",
    secondary: `All messages from the start of the conversation till now`,
  },
  {
    primary: "$flow.state.<replace-with-key>",
    secondary: `Current value of the state variable with specified key`,
  },
  {
    primary: "$flow.state.messages[0].content",
    secondary: `First message content`,
  },
  {
    primary: "$flow.state.messages[-1].content",
    secondary: `Last message content`,
  },
];

interface SelectVariableProps {
  availableNodesForVariable?: Node[];
  disabled?: boolean;
  onSelectAndReturnVal: (value: string) => void;
  isSequentialAgent?: boolean;
}

interface Node {
  id: string;
  data: {
    name: string;
    label: string;
    description?: string;
    outputAnchors: Array<{
      options?: Array<{
        name: string;
        label: string;
      }>;
    }>;
    outputs: {
      output: string;
    };
    inputs: {
      chainName?: string;
      functionName?: string;
      variableName?: string;
    };
    id: string;
  };
}

const SelectVariable = ({
  availableNodesForVariable = [],
  disabled = false,
  onSelectAndReturnVal,
  isSequentialAgent = false,
}: SelectVariableProps): JSX.Element => {
  const onSelectOutputResponseClick = (
    node: Node | null,
    prefix?: string
  ): void => {
    let variablePath = node ? `${node.id}.data.instance` : prefix;
    const newInput = `{{${variablePath}}}`;
    onSelectAndReturnVal(newInput);
  };

  return (
    <>
      {!disabled && (
        <div style={styles.container}>
          {/* VSCode UI要素に置き換え */}
          <div className="variable-selector">
            <h3>Select Variable</h3>
            <div style={styles.scrollContainer}>
              <div className="variable-list">
                {/* 基本変数 */}
                <div
                  className="variable-item"
                  onClick={() => onSelectOutputResponseClick(null, "question")}
                >
                  <span>question</span>
                  <span>User's question from chatbox</span>
                </div>

                {/* ノード変数 */}
                {availableNodesForVariable.map((node, index) => {
                  const selectedOutputAnchor =
                    node.data.outputAnchors[0]?.options?.find(
                      (ancr) => ancr.name === node.data.outputs["output"]
                    );

                  return (
                    <div
                      key={index}
                      className="variable-item"
                      onClick={() => onSelectOutputResponseClick(node)}
                    >
                      <span>
                        {node.data.inputs.chainName ??
                          node.data.inputs.functionName ??
                          node.data.inputs.variableName ??
                          node.data.id}
                      </span>
                      <span>
                        {node.data.name === "ifElseFunction"
                          ? node.data.description
                          : `${selectedOutputAnchor?.label ?? "output"} from ${
                              node.data.label
                            }`}
                      </span>
                    </div>
                  );
                })}

                {/* Sequential State Messages */}
                {isSequentialAgent &&
                  sequentialStateMessagesSelection.map((item, index) => (
                    <div
                      key={index}
                      className="variable-item"
                      onClick={() => onSelectAndReturnVal(item.primary)}
                    >
                      <span>{item.primary}</span>
                      <span>{item.secondary}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectVariable;