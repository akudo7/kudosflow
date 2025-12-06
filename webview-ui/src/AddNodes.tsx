import { useState, useRef, useEffect } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  ClickAwayListener,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  OutlinedInput,
  Paper,
  Popper,
  Stack,
  Typography,
  Chip,
  Tab,
  Tabs,
  Theme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// third-party
import PerfectScrollbar from "react-perfect-scrollbar";

// project imports
import MainCard from "./MainCard";

// icons
import { IconPlus, IconSearch, IconMinus, IconX } from "@tabler/icons-react";

import { StyledFab } from "./StyledFab";
import Transitions from "./Transitions";
import { vscode } from "./utilities/vscode";

interface SearchResult {
  category: string;
  name: string;
  tags?: string[];
  // Add other necessary properties
}

interface GroupByResult {
  [key: string]: NodeData[];
}

interface AddNodesProps {
  nodesData: NodeData[];
  isAgentCanvas?: boolean;
}

interface CategoryExpanded {
  [key: string]: boolean;
}

interface NodesState {
  [category: string]: NodeData[];
}

function a11yProps(index: number) {
  return {
    id: `attachment-tab-${index}`,
    "aria-controls": `attachment-tabpanel-${index}`,
  };
}

const blacklistCategoriesForAgentCanvas: string[] = [
  "Agents",
  "Memory",
  "Record Manager",
  "Utilities",
];

const agentMemoryNodes: string[] = [
  "agentMemory",
  "sqliteAgentMemory",
  "postgresAgentMemory",
  "mySQLAgentMemory",
];

const exceptionsForAgentCanvas: { [key: string]: string[] } = {
  Memory: agentMemoryNodes,
  Utilities: ["getVariable", "setVariable", "stickyNote"],
};

const blacklistForChatflowCanvas: { [key: string]: string[] } = {
  Memory: agentMemoryNodes,
};

const AddNodes: React.FC<AddNodesProps> = ({ nodesData, isAgentCanvas }) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const theme = useTheme();

  const [searchValue, setSearchValue] = useState<string>("");
  const [nodes, setNodes] = useState<NodesState>({});
  const [open, setOpen] = useState<boolean>(false);
  const [categoryExpanded, setCategoryExpanded] = useState<CategoryExpanded>(
    {}
  );
  const [tabValue, setTabValue] = useState<number>(0);

  const anchorRef = useRef<HTMLButtonElement>(null);
  const prevOpen = useRef<boolean>(open);
  const ps = useRef<HTMLElement>();
  let accordianCategories: Record<string, boolean> = {};
  let filteredResult: Record<string, NodeData[]> = {};

  const [resourcePath, setResourcePath] =
    useState<string>("../resources/icons");

  useEffect(() => {
    if (nodesData) {
      groupByCategory(nodesData, tabValue, false);
    }
  }, [nodesData]);

  const filterSearch = (value: string, newTabValue?: number) => {
    setSearchValue(value);
    setTimeout(() => {
      if (value) {
        const returnData = getSearchedNodes(value);
        groupByCategory(returnData, newTabValue ?? tabValue, true);
        scrollTop();
      } else if (value === "") {
        groupByCategory(nodesData, newTabValue ?? tabValue, false);
        scrollTop();
      }
    }, 500);
  };

  const groupByTags = (nodes: NodeData[], tabValue: number): NodeData[] => {
    if (tabValue === 0) {
      return nodes.filter((node) => !node.tags?.includes("LlamaIndex"));
    } else if (tabValue === 1) {
      return nodes.filter((node) => node.tags?.includes("LlamaIndex"));
    }
    return nodes;
  };

  const groupByCategory = (
    nodes: NodeData[],
    newTabValue: number = 0,
    isFilter: boolean = false
  ) => {
    if (isAgentCanvas) {
      accordianCategories = {};
      const result = nodes.reduce<GroupByResult>((r, a) => {
        const category = a.category;
        if (!r[category]) {
          r[category] = [];
        }
        r[category].push(a);
        return r;
      }, {} as GroupByResult);

      // Rest of the code remains the same
    } else {
      const taggedNodes = groupByTags(nodes, newTabValue);
      accordianCategories = {};
      const result = taggedNodes.reduce<GroupByResult>((r, a) => {
        const category = a.category;
        if (!r[category]) {
          r[category] = [];
        }
        r[category].push(a);
        accordianCategories[category] = isFilter ? true : false;
        return r;
      }, {} as GroupByResult);

      const filteredResult: GroupByResult = {};
      for (const category in result) {
        if (category === "Multi Agents" || category === "Sequential Agents") {
          continue;
        }
        if (Object.keys(blacklistForChatflowCanvas).includes(category)) {
          const nodes = blacklistForChatflowCanvas[category];
          result[category] = result[category].filter(
            (nd) => !nodes.includes(nd.name)
          );
        }
        filteredResult[category] = result[category];
      }

      setNodes(filteredResult);
      setCategoryExpanded(accordianCategories);
    }
  };

  const getSearchedNodes = (searchValue: string): NodeData[] => {
    return nodesData.filter((node) => {
      const nameMatch = node.name
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const descriptionMatch = node.description
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      return nameMatch || descriptionMatch;
    });
  };

  const scrollTop = (): void => {
    const curr = ps.current;
    if (curr) {
      curr.scrollTop = 0;
    }
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ): void => {};

  const addException = (category?: string): NodeData[] => {
    let nodes: NodeData[] = [];
    if (category) {
      const nodeNames = exceptionsForAgentCanvas[category] || [];
      nodes = nodesData.filter(
        (nd) => nd.category === category && nodeNames.includes(nd.name)
      );
    } else {
      for (const category in exceptionsForAgentCanvas) {
        const nodeNames = exceptionsForAgentCanvas[category];
        nodes.push(
          ...nodesData.filter(
            (nd) => nd.category === category && nodeNames.includes(nd.name)
          )
        );
      }
    }
    return nodes;
  };

  const handleAccordionChange =
    (category: string) => (_event: any, isExpanded: boolean) => {
      const accordianCategories = { ...categoryExpanded };
      accordianCategories[category] = isExpanded;
      setCategoryExpanded(accordianCategories);
    };

  const handleClose = (event: MouseEvent | TouchEvent): void => {
    if (
      anchorRef.current &&
      event.target instanceof Node &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const onDragStart = (event: React.DragEvent, node: NodeData): void => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(node));
    event.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const loadIcon = async () => {
      try {
        if (!mounted) return;
        setResourcePath(await vscode.getIconPath(""));
      } catch (err) {
        if (!mounted) return;

        console.error("Icon loading error:", err);

        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          retryTimeout = setTimeout(loadIcon, 2000);
        }
      }
    };

    loadIcon();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  const getImage = (tabValue: number): string => {
    if (tabValue === 0) {
      return `${resourcePath}/langchain.png`;
    } else if (tabValue === 1) {
      return `${resourcePath}/llamaindex.png`;
    } else {
      return `${resourcePath}/utilNodes.png`;
    }
  };

  return (
    <>
      <StyledFab
        sx={{ left: 20, top: 20 }}
        ref={anchorRef}
        size="small"
        color="primary"
        aria-label="add"
        title="Add Node"
        onClick={handleToggle}
      >
        {open ? <IconMinus /> : <IconPlus />}
      </StyledFab>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [-40, 14],
              },
            },
          ],
        }}
        sx={{
          zIndex: 1000,
          background: "var(--vscode-editor-background)",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        {({ TransitionProps }) => (
          <Transitions in={open} {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  border={false}
                  elevation={16}
                  content={false}
                  boxShadow
                  shadow={theme.shadows[16]}
                >
                  <Box
                    sx={{
                      p: 2,
                      background: "var(--vscode-editor-background)",
                      color: "var(--vscode-editor-foreground)",
                    }}
                  >
                    <Stack>
                      <Typography variant="h4">Add Nodes</Typography>
                    </Stack>
                    <OutlinedInput
                      // eslint-disable-next-line
                      autoFocus
                      sx={{
                        width: "100%",
                        pr: 2,
                        pl: 2,
                        my: 2,
                        color: "var(--vscode-editor-foreground)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--vscode-input-border)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "var(--vscode-input-border)",
                        },
                      }}
                      id="input-search-node"
                      value={searchValue}
                      onChange={(e) => {}}
                      placeholder="Search nodes"
                      startAdornment={
                        <InputAdornment position="start">
                          <IconSearch
                            stroke={1.5}
                            size="1rem"
                            color={theme.palette.grey[500]}
                          />
                        </InputAdornment>
                      }
                      endAdornment={
                        <InputAdornment
                          position="end"
                          sx={{
                            cursor: "pointer",
                            color: theme.palette.grey[500],
                            "&:hover": {
                              color: theme.palette.grey[900],
                            },
                          }}
                          title="Clear Search"
                        >
                          <IconX
                            stroke={1.5}
                            size="1rem"
                            onClick={() => {}}
                            style={{
                              cursor: "pointer",
                            }}
                          />
                        </InputAdornment>
                      }
                      aria-describedby="search-helper-text"
                      inputProps={{
                        "aria-label": "weight",
                      }}
                    />
                    {!isAgentCanvas && (
                      <Tabs
                        sx={{
                          position: "relative",
                          minHeight: "50px",
                          height: "50px",
                          "& .MuiTab-root": {
                            color: "var(--vscode-tab-inactiveForeground)",
                            "&.Mui-selected": {
                              color: "var(--vscode-tab-activeForeground)",
                            },
                          },
                          "& .MuiTabs-indicator": {
                            backgroundColor:
                              "var(--vscode-tab-activeBackground)",
                          },
                        }}
                        variant="fullWidth"
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="tabs"
                      >
                        {["LangChain", "LlamaIndex", "Utilities"].map(
                          (item, index) => (
                            <Tab
                              icon={
                                <div
                                  style={{
                                    borderRadius: "50%",
                                  }}
                                >
                                  <img
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      objectFit: "contain",
                                    }}
                                    src={getImage(index)}
                                    alt={item}
                                  />
                                </div>
                              }
                              iconPosition="start"
                              sx={{ minHeight: "50px", height: "50px" }}
                              key={index}
                              label={item}
                              {...a11yProps(index)}
                            ></Tab>
                          )
                        )}
                      </Tabs>
                    )}
                    <Divider />
                  </Box>
                  <PerfectScrollbar
                    containerRef={(el) => {
                      ps.current = el;
                    }}
                    style={{
                      height: '100%',
                      maxHeight: `calc(100vh - ${isAgentCanvas ? '300' : '380'}px)`,
                      overflowX: 'hidden',
                      background: 'var(--vscode-editor-background)' // 背景色を追加
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        pt: 0,
                        background: "var(--vscode-editor-background)",
                        color: "var(--vscode-editor-foreground)",
                      }}
                    >
                      <List
                        sx={{
                          width: "100%",
                          // maxWidth: 370,
                          py: 0,
                          borderRadius: "10px",
                          [theme.breakpoints.down("md")]: {
                            maxWidth: 370,
                          },
                          "& .MuiListItemSecondaryAction-root": {
                            top: 22,
                          },
                          "& .MuiDivider-root": {
                            my: 0,
                          },
                          "& .list-container": {
                            pl: 7,
                          },
                        }}
                      >
                        {Object.keys(nodes)
                          .sort()
                          .map((category) => (
                            <Accordion
                              sx={{
                                background: "var(--vscode-editor-background)",
                                color: "var(--vscode-editor-foreground)",
                                "&:before": {
                                  display: "none",
                                },
                                "& .MuiAccordionSummary-root": {
                                  borderBottom:
                                    "1px solid var(--vscode-panel-border)",
                                  color: "var(--vscode-editor-foreground)", // Summaryのテキストカラー
                                },
                                "& .MuiAccordionSummary-expandIconWrapper": {
                                  color: "var(--vscode-editor-foreground)", // 展開アイコンの色
                                },
                              }}
                              expanded={categoryExpanded[category] || false}
                              onChange={handleAccordionChange(category)}
                              key={category}
                              disableGutters
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`nodes-accordian-${category}`}
                                id={`nodes-accordian-header-${category}`}
                              >
                                {category.split(";").length > 1 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography variant="h5">
                                      {category.split(";")[0]}
                                    </Typography>
                                    &nbsp;
                                    <Chip
                                      sx={{
                                        width: "max-content",
                                        fontWeight: 700,
                                        fontSize: "0.65rem",
                                        background:
                                          category.split(";")[1] ===
                                          "DEPRECATING"
                                            ? theme.palette.warning.main
                                            : theme.palette.teal.main,
                                        color:
                                          category.split(";")[1] !==
                                          "DEPRECATING"
                                            ? "white"
                                            : "inherit",
                                      }}
                                      size="small"
                                      label={category.split(";")[1]}
                                    />
                                  </div>
                                ) : (
                                  <Typography variant="h5">
                                    {category}
                                  </Typography>
                                )}
                              </AccordionSummary>
                              <AccordionDetails>
                                {nodes[category].map((node, index) => (
                                  <div
                                    color="var(--vscode-editor-foreground)"
                                    key={node.name}
                                    onDragStart={(event) =>
                                      onDragStart(event, node)
                                    }
                                    draggable
                                  >
                                    <ListItemButton
                                      sx={{
                                        p: 0,
                                        borderRadius: `10px`, // ${customization.borderRadius}
                                        cursor: "move",
                                        background:
                                          "var(--vscode-editor-background)",
                                        "&:hover": {
                                          background:
                                            "var(--vscode-list-hoverBackground)",
                                        },
                                      }}
                                    >
                                      <ListItem alignItems="center">
                                        <ListItemAvatar>
                                          <div
                                            style={{
                                              borderRadius: "50%",
                                              backgroundColor: "white", // 白い円の背景
                                              cursor: "grab",
                                              width: "40px", // サイズを固定
                                              height: "40px", // サイズを固定
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              padding: "8px", // 内側の余白
                                              boxShadow:
                                                "0 0 0 2px rgba(255, 255, 255, 0.1)", // オプション: 微かな白い縁取り
                                              position: "relative", // 位置の基準点
                                            }}
                                          >
                                            <img
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                padding: 5,
                                                objectFit: "contain",
                                              }}
                                              alt={node.name}
                                              src={`${resourcePath}/${node.icon}`}
                                            />
                                          </div>
                                        </ListItemAvatar>
                                        <ListItemText
                                          sx={{
                                            ml: 1,
                                            "& .MuiListItemText-primary": {
                                              color:
                                                "var(--vscode-editor-foreground)",
                                            },
                                            "& .MuiListItemText-secondary": {
                                              color:
                                                "var(--vscode-descriptionForeground)",
                                            },
                                          }}
                                          primary={
                                            <>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "row",
                                                  alignItems: "center",
                                                }}
                                              >
                                                <span>{node.label}</span>
                                                &nbsp;
                                                {node.badge && (
                                                  <Chip
                                                    sx={{
                                                      width: "max-content",
                                                      fontWeight: 700,
                                                      fontSize: "0.65rem",
                                                      background:
                                                        node.badge ===
                                                        "DEPRECATING"
                                                          ? theme.palette
                                                              .warning.main
                                                          : theme.palette.teal
                                                              .main,
                                                      color:
                                                        node.badge !==
                                                        "DEPRECATING"
                                                          ? "white"
                                                          : "inherit",
                                                    }}
                                                    size="small"
                                                    label={node.badge}
                                                  />
                                                )}
                                              </div>
                                              {node.author && (
                                                <span
                                                  style={{
                                                    fontSize: "0.65rem",
                                                    fontWeight: 700,
                                                  }}
                                                >
                                                  By {node.author}
                                                </span>
                                              )}
                                            </>
                                          }
                                          secondary={node.description}
                                        />
                                      </ListItem>
                                    </ListItemButton>
                                    {index ===
                                    nodes[category].length - 1 ? null : (
                                      <Divider
                                        sx={{
                                          borderColor:
                                            "var(--vscode-panel-border)",
                                        }}
                                      />
                                    )}
                                  </div>
                                ))}
                              </AccordionDetails>
                            </Accordion>
                          ))}
                      </List>
                    </Box>
                  </PerfectScrollbar>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </>
  );
};

export default AddNodes;
