<h1 align="center">kudosflow</h1>

<h4 align="center">
  <a href="#settings">Settings</a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="https://github.com/akudo7/kudosflow/issues">Support</a>
</h4>

<p align="left">
kufosflow is a Flowise-like LangChain extension for VSCode that uses an innovative AI flow management engine (SceneGraphManager) and brings an AI chatbot right into your editor. Use it as your AI programming assistant to understand complex code, make improvements, or generate comments. To get started, launch it from the Command Menu, highlight a piece of code, click the plus icon on the left to open a chat, and start talking—just like in ChatGPT. All your conversations are saved in the chat history and can be exported as a JSON file.
</p>
  <p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudosflow.png"/>
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/v120.gif" />
  </p>
&nbsp;

# Technology overview

SceneGraphManager is an innovative AI flow management engine that dramatically accelerates enterprise AI adoption. This solution provides functionality to automatically execute LangChain applications from LLM application definitions described in JSON files. Implemented as a TypeScript library, it can be directly integrated into existing systems, significantly reducing system integration barriers.

The core functionality lies in its ability to visually design LLM applications and save/load them as JSON. Developers can execute different LLM applications simply by switching JSON files, dramatically reducing development and maintenance costs. As it's provided as a library, it operates in environments isolated from networks, such as desktop applications, embedded systems, and IoT devices. This enables AI utilization even in environments handling highly confidential information.

SceneGraphManager supports Flowise-compatible JSON format, allowing seamless import of AI flows designed and developed in existing Flowise environments. This enables an efficient workflow where AI flows can be designed using Flowise's intuitive visual interface and integrated into production environments through SceneGraphManager. AI applications verified in Flowise environments can be integrated into production systems without code changes, significantly shortening the development-to-deployment cycle.

Furthermore, it provides a more integrated development experience through the kudosflow VSCode extension. kudosflow provides a ReactFlow-based visual editor within VSCode, working in conjunction with SceneGraphManager. Developers can design, test, and debug AI flows without leaving their code editor, dramatically improving development efficiency. AI flows created in kudosflow are output as JSON directly executable by SceneGraphManager.

Technically, it's implemented as a directed acyclic graph engine, efficiently managing and executing LangChain component nodes. It analyzes node dependencies from JSON and automatically determines optimal execution order, eliminating the need for developers to spend time on complex workflow design.

SceneGraphManager's greatest strength is the democratization of AI application development. It enables general developers to implement sophisticated LLM applications that traditionally required AI specialists. This allows enterprises to rapidly deploy high-business-value AI solutions while significantly reducing AI implementation time and costs.

<p align="center">
<img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/SceneGraphManager.png" />
</p>

Here's a translation of the introduction to LangChain nodes supported by SceneGraphManager:

- Chains
  - Conversational Retrieval QA Chain
  - Conversational Chain
- Chat model
  - Anthropic
  - OpenAI
  - Azure OpenAI
  - Ollama
- Embeddings
  - OpenAI Embeddings
  - Azure OpenAI Embeddings
  - Ollama Embeddings
- Memory
  - Buffer Memory
  - Redis Backed Chat Memory
- Vector Store Retriever
  - Weaviate
  - Qdrant

# Settings

kudosflow provides powerful features for making requests to AI through an intuitive and easy-to-use interface.

## ver 1.3.2
&nbsp;
<details>
 <summary>01. Set the token:</summary>
</br>
To enable kudosflow, you need to set the token below in Settings > kudosflow > token. After setting the token, please restart VSCode for the changes to take effect.
</br>
</br>
<font color="red">The kudosflow token for the pre-release version is valid until March 31, 2026.</font>

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9kdWN0Ijoia3Vkb3NmbG93IiwidmVyc2lvbiI6IjEuMC4wIiwicHVibGlzaCI6InByZS1yZWxlYXNlIiwiaGFzaCI6ImIyOGM5NGIyMTk1YzhlZDI1OWYwYjQxNWFhZWUzZjM5YjBiMjkyMGE0NTM3NjExNDk5ZmEwNDQ5NTY5MTdhMjEiLCJ1c2VySWQiOm51bGwsInRva2VuSWQiOiIyYjg2NTliMi0xNDgzLTRjNTktOGQzMi05ZTllZThkNmUyNGEiLCJpYXQiOjE3NDQxOTA3OTEsImV4cCI6MTc3NDkxNTIwMH0.be6BrokynSKsdMo1-pHd20CoOK4WqZ6a3IFWA-D6wylnZlGo_1nj7uw6g5axDt2ScjCKAb9RD38bNgyb3CZ4N1ZmsOmlOzzqnsvW-6dArbzciRZrtGDXlYXzs1i7BjxNYFfKueGqOuPdyPeAsePFxjsZrnbtMJ3fgj8vySivmiIRgHMFEiT7IjRyULFDd1NZSRzhYTuc1FmXYN4EhA9CzAG7o88851QDSa-bAx8DMzfTUixyVvSIm90hNv3iOvQ5OgmocQriSKdq4zi0r7nXT5506hTP3lO6WcHNhAGNDf3X20X4gXgynPIApSgM03Wm0T4MOfXg5YWbQt9u4DoboQ
```

<p align="center">
<img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/settings.png" />
</p>
</details>
&nbsp;
<details>
<summary>02. Set for the Assistant</summary>
&nbsp;

VSCode environment values for kudosflow are accessible to the Assistant.

- Temp Folder
  - example: `/var/tmp`
- Tree
  - command
    - example: `tree`
  - argument
    - example: `-I 'node_modules|out|json|resources|.map|.org|.js|eslint.config.mjs|readme.txt|README.md|CHANGELOG.md|yarn.lock|vsc-extension-quickstart.md|tree.txt'`
- Messages
  - progress
    - example: `inquiring...`
  - terminal
    - example: `Here are the results. Let me know if any corrections are needed and provide suggestions for improvement.`
  - asking
    - example: `CAUTION: If answering a question requires checking specific files in the project, do not provide an answer immediately. Instead, prompt the user with the following message: \"Please provide the actual filename including its full path.\" When the user’s request involves adding or modifying multiple files, follow these steps: 1. First, list all relevant filenames with their full paths. 2. Wait for the user to confirm or specify which file to proceed with. 3. Then, show only the additions or modifications for the selected file. 4. Repeat this process for each file individually.`
  - askingImage
    - example: `CAUTION: If answering a question requires checking specific files in the project, do not provide an answer immediately. Instead, prompt the user with the following message: \"Please provide the actual filename including its full path.\" When the user’s request involves adding or modifying multiple files, follow these steps: 1. First, list all relevant filenames with their full paths. 2. Wait for the user to confirm or specify which file to proceed with. 3. Then, show only the additions or modifications for the selected file. 4. Repeat this process for each file individually.`

</details>
&nbsp;

<details>
<summary>03. Set for the Copilot:</summary>

VSCode environment values for kudosflow are accessible to Copilot.
To use this feature, Ollama must be installed.

- Host
  - example: `http://127.0.0.1:11434`
- Model
  - example: `deepseek-coder:1.3b-base-q4_1`
- FIM
  - example: `starcoder`
- num_predict
  - example: `10`
- temperature
  - example: `0.1`

</details>
&nbsp;

<details>
<summary>04. Set for the LangChain flow:</summary>

VSCode environment variables set for kudosflow are available to the currently active flow.

- Chatflow
  - example: `/Users/akirakudo/Desktop/MyWork/VSCode/kudosflow/json/chats/bufferMemory/OpenAI Chatflow.json`

</details>
&nbsp;
<details>
<summary>Troubleshooting:</summary>
If you're experiencing issues, some common problems are listed below.

<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/trouble1.png"/>
</p>

- The chatflow JSON file is either missing or invalid.
<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/trouble3.png"/>
</p>

- You need to install the required packages manually.
<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/trouble2.png"/>
</p>
</details>
&nbsp;

# Features

kudosflow provides powerful features for making requests to AI through an intuitive and easy-to-use interface.

## ver 1.3.2
&nbsp;
<details>
<summary>01. Set the credentials: </summary>

After kudosflow is successfully loaded, `.kudosflow` folder and `credential.json` file are automatically created in your current project directory. The LangChain nodes used in your flow require certain credentials to be defined in this JSON file.

<p align="center">
<img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/credentials.png" />
</p>

</details>
&nbsp;
<details>
<summary>02. Set a current flow:</summary>

To configure the Chatflow used by the Assistant, you can either create a new Chatflow from scratch or use an existing one. Some usable ones are attached to this page—please feel free to refer to it!

- Create Chatflow
  - From the 'Add Nodes' menu, you can drag and drop the nodes you want to use, and connect the outputs to the node parameters via edges.

    <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/create1.png" />
    </p>
    <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/create2.png" />
    </p>

- Open Chatflow
  - Open an existing one.

    <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/open1.png" />
    </p>
    <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/open2.png" />
    </p>
    <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/open3.png" />
    </p>

- Set Chatflow
  - Set the Chatflow to be used by the Assistant.

    <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/save.png" />
    </p>

</details>
&nbsp;
<details>
<summary>03. Devin</summary>

Supported Devin feature

- Available to import XMLs which are exported by the Bolt.new system promopt.

  - See in detail of the original prompt at the "<https://github.com/stackblitz/bolt.new/blob/main/app/lib/.server/llm/prompts.ts>".
    - Recommend to change it for fitting with your environment.
  - boltArtifact and bolt_file_modifications are supported.
  - Samples
    - [Prompt](https://github.com/akudo7/kudos-gpt/raw/HEAD/bolt_new-system-prompt.txt)
    - [artifact.xml](https://github.com/akudo7/kudos-gpt/raw/HEAD/artifact.xml)
    - [modifications.xml](https://github.com/akudo7/kudos-gpt/raw/HEAD/modifications.xml)

  <p align="center">
  <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt.v5.0.0_1.gif"/>
  <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt.v5.0.0_2.gif"/>
  </p>

</details>
&nbsp;
<details>
<summary>04. Turn On/Off: </summary>

- Assistants
  - After successfully loading kudosflow, you need to manually run `kudosflow: Assistants On/Off` to enable it.
    <p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_04_1.png" />
    </p>
    So the plus icon on the left will be available for creating/opening a discussion.
    <p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_04_2.png" />
    </p>
- Copilot
  - After successfully loading kudosflow, you need to manually run `kudosflow: Copilot On/Off` to enable it.
    <p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_04_3.png" />
    </p>
    So the inputing the return key on the code will be available for asking some candidate codes to a LLM.
    <p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt.v3.0.0_1.gif" />
    </p>

</details>
&nbsp;
<details>
<summary>05. Have a discussion by asking directly:</summary>
To ask your question during a discussion, the `Direct Asking` button is available.

<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_05_1.png" />
</p>
Your question will be answered by the assistant.
<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_05_2.png" />
</p>

Added support for direct file input using the "Direct asking" button with the file: prefix
</br>
1. file:./path/to/file|func1,func2 (keep only listed functions)
2. file:./path/to/file!func1,func2 (exclude listed functions)

```typescript
import { useState } from 'react'
import TodoForm from './components/TodoForm'
import TodoItem from './components/TodoItem'

const App = () => {
    const [todos, setTodos] = useState([])

    const addTodo = (text) => {
        setTodos([...todos, { id: Date.now(), text, completed: false }])
    }

    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id))
    }

    return (
        <div className="max-w-lg mx-auto mt-10 p-4">
        <h1 className="text-2xl font-bold mb-4">Todo App</h1>
        <TodoForm onAdd={addTodo} />
        <div className="bg-white rounded shadow">
            {todos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                />
            ))}
            {todos.length === 0 && (
                <p className="p-4 text-gray-500">No todos yet. Add one above!</p>
            )}
        </div>
        </div>
    )
}

export default App
```

1. file:./src/App.jsx|App,toggleTodo
2. file:./src/App.jsx!addTodo,deleteTodo

```typescript
import { useState } from 'react'
import TodoForm from './components/TodoForm'
import TodoItem from './components/TodoItem'

const App = () => {
    const [todos, setTodos] = useState([])

    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }

    return (
        <div className="max-w-lg mx-auto mt-10 p-4">
        <h1 className="text-2xl font-bold mb-4">Todo App</h1>
        <TodoForm onAdd={addTodo} />
        <div className="bg-white rounded shadow">
            {todos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                />
            ))}
            {todos.length === 0 && (
                <p className="p-4 text-gray-500">No todos yet. Add one above!</p>
            )}
        </div>
        </div>
    )
}

export default App
```

  <p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/v120.gif" />
  </p>

</details>
&nbsp;
<details>
<summary>06. Have a discussion by asking image: </summary>
To ask a question about an image in a discussion, the `Asking Image` button is available.
Please note that you have to enter a question before clicking the button.
<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt.v4.4.0_1.gif"/>
</p>
</details>
&nbsp;
<details>
<summary>07. Have a discussion with templates:</summary>

There is template.txt in .kudosflow folder that includes a query. Some variables below are available.

- ${{kudosflow_tree}} : project construction
- ${{kudosflow_filename}} : current filename
- ${{kudosflow_content}} : current file content
- ${{kudosflow_terminal}} : terminal log
- ${{kudosflow_query}} : query

To start a discussion with a template, these values can be accessed using the `template` button.

This file is loaded every time a command is executed.

<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/template.gif" />
</p>



</details>
&nbsp;
<details>
<summary>08. Create a message from a terminal:</summary>

You can create a message with the output from the terminal using the Terminal button. All strings from the terminal will be added to the message with the "kudosflow.messages.terminal" prompt in the settings.

<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_21_0.png" />
</p>
<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_21_1.png" />
</p>
</details>
&nbsp;
<details>
<summary>09. Save a discussion: </summary>

To Save a chat history is available with the floppy disk icon labeled `JSON Export`. It will be created a new JSON file as an `opening file + _chathisoty.json`.

<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_11_1.png" />
</p>
</details>
&nbsp;
<details>
<summary>10. Delete discussions: </summary>

To delete all discussions, the trash icon labeled `del thread` is available. This will also delete a thread from the Chat Memory.

<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_07_1.png" />
</p>

All threads you open are used a chat memory.

</details>
&nbsp;
<details>
<summary>11. Compare/update an active text editor with a message</summary>

To compare/update an active text editor with a message in a discussion, the `Compare` command from the `More actions…` is available.
<font color="red">NOTE: A temporary file will be created in a folder `Setting / kudosflow / Temp Folder`.</font>

<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_40_0.png" />
</p>
<p align="center">
    <img src="https://github.com/akudo7/kudos-gpt/raw/HEAD/kudos-gpt_40_1.png" />
</p>
</details>
&nbsp;
<details>
<summary>12. RAG</summary>

To register files in the VectorDB, you can use the RAG Explorer that add metadata "kudosflow" to them. PostgreSQL is required to use this feature. The docker-compose.yml file attached to this page also includes support for PostgreSQL. Please take a look!
And Markdown file(.md) is now split by section when registered in RAG. This must be simplified development with llms-full.txt.

<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/rag1.png" />
</p>
<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/rag2.png" />
</p>
<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/rag3.png" />
</p>

This section explains how to enable filtering in RAG-based chat.

- Qdrant
<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/qdrant_search_filter.png" />
</p>

- Weaviate
<p align="center">
    <img src="https://github.com/akudo7/kudosflow/raw/HEAD/images/weaviate_search_filter.png" />
</p>

</details>
&nbsp;

# Get Started

This page contains sample flows and a docker-compose.yml file below, allowing you to start using it with KudosFlow right away. Feel free to give it a try!

- Sample flow
  - chats
    - bufferMemory
      - Anthropic Chatflow.json
      - AzureOpenAI Chatflow.json
      - Ollama Chatflow.json
      - OpenAI Chatflow.json
    - redis
      - Ollama and Redis Chatflow.json
  - stores
    - Qdrant
      - AzureOpenAI with Qdrant Chatflow.json
      - Ollama with Qdrant Chatflow.json
      - OpenAI with Qdrant Chatflow.json
    - Weaviate
      - OpenAI with Weaviate Chatflow.json
- yaml
  - docker-compose.yml

# Coming features soon(I hope...)

- LangGraph support
- Auto development with Agent(LangGraph)
  - Recommend to use [Kudos-gpt](https://marketplace.visualstudio.com/items?itemName=AkiraKudo.kudos-gpt) until this feature will be publishe, if you need to use Agents.
- Supporting to trained on permissive data with local models

## **Hand-crafted by [Akira Kudo](https://www.linkedin.com/in/akira-kudo-4b04163/) in Tokyo, Japan**
Feel free contact me if you are interested in SceneGraphManager!
<p align="center">Copyright and Reserved &copy; 2023-present Akira Kudo</p>
