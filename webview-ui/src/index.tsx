import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { WorkflowEditor } from "./workflow-editor/WorkflowEditor";

// Configure Monaco Editor environment for VSCode webview
if (typeof window !== 'undefined') {
  // Disable Monaco Editor workers in VSCode webview environment
  // This prevents CORS and worker loading issues
  (window as any).MonacoEnvironment = {
    getWorker(_: any, label: string) {
      // Return a simple inline worker to avoid external file loading
      const workerCode = `
        self.addEventListener('message', (e) => {
          // Simple echo worker for basic functionality
          self.postMessage(e.data);
        });
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    }
  };
}

// Determine which component to render based on data attribute
const rootElement = document.getElementById("root");
const isWorkflowEditor = rootElement?.dataset?.editor === "workflow";

ReactDOM.render(
  <React.StrictMode>
    {isWorkflowEditor ? <WorkflowEditor /> : <App />}
  </React.StrictMode>,
  rootElement
);