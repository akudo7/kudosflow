/**
 * Get the default template for a new workflow.
 * Contains only start and end nodes with no edges or custom nodes.
 */
export function getDefaultWorkflowTemplate(): any {
  return {
    config: {
      recursionLimit: 25
    },
    stateAnnotation: {
      name: "State",
      type: "Annotation.Root"
    },
    annotation: {
      messages: {
        type: "string[]",
        reducer: "(x, y) => x.concat(y)",
        default: []
      }
    },
    models: [],
    nodes: [],
    edges: [
      {
        from: "__start__",
        to: "__end__"
      }
    ],
    stateGraph: {
      annotationRef: "State"
    }
  };
}
