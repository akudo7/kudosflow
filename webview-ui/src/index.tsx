import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { WorkflowEditor } from "./workflow-editor/WorkflowEditor";

// Determine which component to render based on data attribute
const rootElement = document.getElementById("root");
const isWorkflowEditor = rootElement?.dataset?.editor === "workflow";

ReactDOM.render(
  <React.StrictMode>
    {isWorkflowEditor ? <WorkflowEditor /> : <App />}
  </React.StrictMode>,
  rootElement
);