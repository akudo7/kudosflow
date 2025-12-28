<h1 align="center">kudos-gpt</h1>

<h4 align="center">
  <a href="https://github.com/akudo7/kudos-gpt/blob/main/README.md#settings">Settings</a>
  ·
  <a href="https://github.com/akudo7/kudos-gpt/blob/main/README.md#features">Features</a>
  ·
  <a href="https://github.com/akudo7/kudos-gpt/issues">Support</a>
</h4>

<p align="left">
The kudos-gpt is a ChatGPT-like extension for the VSCode. Now you can have an AI chatbot like the ChatGPT right in the VSCode. Use it as your AI programming assistant which you can talk with to understand complex code, modify and improve your code, or generate comments for your code. The possibilities are endless until the maxTokens actually. To start, turn on it from the command menu, highlight a piece of code, click on the plus icon on the left to open a chat, and start talking with it just like in the ChatGPT. All your conversations are saved and exported in your workspace so you can look back on them automatically when you open files.
</p>
&nbsp;

# New features

<font color="red" size=5>ver 5.0.0</font>
- Supported Devin feature
  - Available to import XMLs which are exported by the Bolt.new system promopt.
    - See in detail of the original prompt at the "https://github.com/stackblitz/bolt.new/blob/main/app/lib/.server/llm/prompts.ts".
      - Recommend to change it for fitting with your environment.
    - boltArtifact and bolt_file_modifications are supported.
    - Samples
      - [System Prompt](https://github.com/akudo7/kudos-gpt/raw/HEAD/bolt_new-system-prompt.txt) 
      - [artifact.xml](https://github.com/akudo7/kudos-gpt/raw/HEAD/artifact.xml) 
      - [modifications.xml](https://github.com/akudo7/kudos-gpt/raw/HEAD/modifications.xml) 
  <p align="center">
  <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt.v5.0.0_1.gif"/>
  <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt.v5.0.0_2.gif"/>
  </p>

&nbsp;

# Settings & Features

The kudo-gpt supports many features to ask your requests to AIs with a simple and easy-to-use interface.
So see in detail at the <a href="https://github.com/akudo7/kudos-gpt/blob/main/README.md">README.md on the Github.</a>

&nbsp;

# Implementation Status

## Phase 5 - Report Generation and Approval (🟡 In Planning)

New workflow enhancement that adds report generation and user approval before quality evaluation:

### Architecture

```text
Task Creation → Approval → Research Execution → Approval
  → Report Generation → Report Approval → Quality Evaluation → Approval → Complete
```

### Key Features

- **Report Generator**: Consolidates multiple research results into a unified, readable markdown report
- **Report Approval Gate**: Users can review and approve the generated report before quality evaluation
- **Improved Transparency**: Users see the complete report before final evaluation
- **Enhanced Control**: Users can request re-investigation if the report needs improvement

### Implementation Plan

See [Phase 5 Plan](docs/implementation/phase5-plan.md) for detailed implementation steps.

### Benefits

- ✅ Better transparency in the research workflow
- ✅ User control before quality evaluation
- ✅ Fixes Phase 4 bug (syntax error in quality-evaluation server)
- ✅ Simplified data flow with flattened structures

---

# Comming features soon(I hope...)

- Publish sample Flowise applications
- Supporting to trained on permissive data with local models


## **Hand-crafted by [Akira Kudo](https://www.linkedin.com/in/akira-kudo-4b04163/) in Tokyo, Japan**

<p align="center">Copyright and Reversed &copy; 2023-present Akira Kudo</p>
