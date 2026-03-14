---
name: teams
description: Analyzes user prompts and dynamically creates and launches a team of specialist agents optimized for the task, executing them in parallel
---

# Teams Skill

## Purpose of this skill

Analyze user prompts and create specialist agents.
Rather than a fixed team, assemble and work in parallel on-the-fly based on the request.

## Port Assignment Rules

Available port range: 3100–3199

The number of workers N is determined after analyzing the prompt. Ports are assigned sequentially starting from BASE=3100.

Clean up existing processes before launching:

```
bash_command("lsof -ti:3100-3199 | xargs kill -9 2>/dev/null || true")
```

Launch only the required agents (no upper limit).

---

## Constraints (must be followed)

- **Never use `glob_files`**. No file exploration is needed.
- **Only read the following 2 files with `read_file`**: `skills/teams/SKILL.md` and `skills/teams/worker-template.json`
- Do not explore the repository structure or read source code.

---

## Worker Design Principles

Role names are freely assigned by the LLM to best fit the user's prompt.
There is no pre-defined role table.

Naming conventions:
- Express the task's domain of expertise as an English noun (e.g., researcher, writer, analyst)
- Avoid overly generic names (e.g., worker1 is not allowed)
- Use only alphanumerics and underscores

Determining the number of workers:
- Break tasks down into units that can be executed independently in parallel
- Each worker is limited to one clearly defined domain
- Minimum 1, maximum 5. Use 1 worker for tasks that cannot be split.

Information required for each worker:
- role: Worker's role name (following naming conventions)
- port: Assigned port number (determined by port assignment rules above)
- systemPrompt: System prompt defining this worker's expertise
- task: The specific task assigned to this worker

---

## Steps

### Step 1: Analyze prompt → Design workers

Read the user's prompt and determine the following:

1. Break the task into independent specialist domains
2. Assign a role name to each domain (following "Worker Design Principles" above)
3. Design a system prompt for each worker
4. Describe each worker's assigned task in detail

Output format for worker design (organize internally as a JSON array):
```
[
  {
    "role": "role_name",
    "port": 3100,
    "systemPrompt": "You are a ... specialist. Focus on ...",
    "task": "Specific task description"
  },
  ...
]
```

- Determine worker count N and assign ports sequentially from BASE=3100 (worker_0=3100, worker_1=3101, ...)

Example: "Create a market research report"
→ researcher (port 3100), analyst (port 3101), writer (port 3102) = 3 agents

---

### Step 2: Generate worker JSON

```
read_file("skills/teams/worker-template.json")
```

Load the template and generate the JSON for each role.

Replacement rules:
- `{{WORKER_NAME}}` → `team_{role}` (e.g., `team_researcher`)
- `{{WORKER_PORT}}` → dynamic port number determined in Step 1
- `{{ROLE_SYSTEM_PROMPT}}` → system prompt specialized for this role. Generate using the following pattern:
  `"You are a {role} specialist. Focus on {specific description of expertise}. Your output should be {expected output format}."`
- `{{ASSIGNED_TASK}}` → specific task assigned to this worker

Write the generated JSON (write all workers **in parallel simultaneously** using `write_file`. Sequential execution wastes turns):
```
write_file("/tmp/teams/worker_{role_0}.json", <JSON>)  # simultaneously
write_file("/tmp/teams/worker_{role_1}.json", <JSON>)  # simultaneously
# ... write all roles in 1 turn in parallel
```

---

### Step 3: Launch worker processes

Use the generated JSON to launch all workers in **a single `bash_command`** (to minimize turn count).

Prepare the working directory, copy `.env`, and launch all workers in one command:

> **Why copy `.env`**: kudosflow's `serverRunner.ts` searches for `.env` in the
> "same directory as the workflow JSON".
> Since worker JSON files are generated in `/tmp/teams/`, without `.env` in that directory,
> `ANTHROPIC_API_KEY` and other vars won't be loaded and workers will error immediately after launch.

```
bash_command("
  mkdir -p /tmp/teams
  cp /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow/.env /tmp/teams/.env
  cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow
  npx tsx scripts/start-a2a-server.ts --config /tmp/teams/worker_{role_0}.json --port {port_0} --name team_{role_0} > /tmp/teams/{role_0}.log 2>&1 &
  npx tsx scripts/start-a2a-server.ts --config /tmp/teams/worker_{role_1}.json --port {port_1} --name team_{role_1} > /tmp/teams/{role_1}.log 2>&1 &
  # ... dynamically generate lines for all workers (using role/port list determined in Step 1)
  echo 'all workers launched'
")
```

> **Important**: Combine all worker launches into a single `bash_command`. Calling them individually wastes LLM turns and hits the recursionLimit.

---

### Step 4: Verify launch (healthcheck)

Verify all workers in **a single `bash_command`** (to minimize turn count):

```
bash_command("
  for port in {port_0} {port_1} ...; do
    for i in \$(seq 1 15); do
      curl -sf http://localhost:\$port/.well-known/agent.json > /dev/null && echo \"port \$port: ready\" && break || sleep 1
    done
  done
")
```

If "ready" is not returned for any port, check the log for that role:
```
bash_command("cat /tmp/teams/{role}.log")
```

---

### Step 5: Send tasks in parallel

After confirming all workers are launched, send each worker its assigned task.

```
bash_command("cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx scripts/send-a2a-message.ts --url http://localhost:{port} --message '{assigned_task}' --output json --timeout 300000")
```

Execute all role commands **simultaneously** (background execution with `&` + `wait` to wait for all to complete):

> **Important**: Set `bash_command` `timeout` to **360000** (6 minutes). The default 120 seconds will cause `wait` to time out.

> **Do not use OpenAI for worker models**: Multiple independent Node.js processes calling the
> OpenAI API simultaneously will hit RPM/TPM limits (HTTP 429).
> Keep the model in `worker-template.json` as Anthropic.

```
bash_command("
  cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow
  npx tsx scripts/send-a2a-message.ts --url http://localhost:{port_0} --message '{task_role_0}' --output json --timeout 300000 > /tmp/teams/result_{role_0}.json &
  npx tsx scripts/send-a2a-message.ts --url http://localhost:{port_1} --message '{task_role_1}' --output json --timeout 300000 > /tmp/teams/result_{role_1}.json &
  # ... dynamically generate lines for all workers (using role/port list determined in Step 1)
  wait
  echo 'all workers completed'
")
```

---

### Step 6: Collect and integrate results

Read each worker's result file:
```
read_file("/tmp/teams/result_{role}.json")
```

Integrate all worker results to create the final report:
1. Compile each worker's deliverables
2. Resolve contradictions and dependencies during integration
3. Output the final report to the user

---

### Step 7: Cleanup (automatic prompt)

After Step 6 completes, `finalize_node` will automatically ask the user about cleanup.

- User answers **yes / y** → execute `pkill -f start-a2a-server.ts` + `rm -rf /tmp/teams/`
- User answers **no** → skip (logs remain in `/tmp/teams/`)

**Do not execute bash_command in this step.** Cleanup is delegated to the leader workflow's `finalize_node`.
