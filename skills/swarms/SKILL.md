---
name: swarms
description: ユーザのプロンプトを解析し、タスクに最適な専門エージェントチームを動的に生成・起動して並列実行する
---

# Swarms スキル

## このスキルの目的

ユーザのプロンプトを解析し、専門エージェントを生成する。
固定チームではなく、依頼内容に応じてその場でチームを組成し並列で作業する。

## ポート割り当てルール

利用可能なポート範囲: 3100〜3199

Worker数 N はプロンプト解析後に決定する。ポートは BASE=3100 から連番で割り当てる。

起動前に既存プロセスをクリーンアップする:

```
bash_command("lsof -ti:3100-3199 | xargs kill -9 2>/dev/null || true")
```

必要なエージェントのみ起動する（上限なし）。

---

## 制約（必ず守ること）

- **`glob_files` は絶対に使わない**。ファイル探索は一切不要。
- **`read_file` で読むのは以下の2ファイルのみ**: `skills/swarms/SKILL.md` と `skills/swarms/worker-template.json`
- リポジトリの構造調査・コード読み込みは行わない。

---

## Worker設計の原則

ロール名はユーザーのプロンプトに最適なものをLLMが自由に命名する。
事前定義のロールテーブルは存在しない。

命名規則:
- タスクの専門領域を英語の名詞で表現する（例: researcher, writer, analyst）
- 汎用的すぎる名前は避ける（例: worker1 は不可）
- 英数字とアンダースコアのみ使用する

Worker数の決め方:
- タスクを独立して並列実行できる単位に分解する
- 1つのWorkerが担うタスクは明確に1つの専門領域に限定する
- 最小1、最大5。分割できないタスクは1Worker。

各Workerに必要な情報:
- role: Workerの役割名（命名規則に従う）
- port: 割り当てるポート番号（上記ポート割り当てルールで決定）
- systemPrompt: このWorkerの専門性を定義するシステムプロンプト
- task: このWorkerに割り当てる具体的なタスク

---

## 手順

### Step 1: プロンプト解析 → Worker設計

ユーザーのプロンプトを読み、以下を決定する:

1. タスクを独立した専門領域に分解する
2. 各領域に役割名（role）を命名する（上記「Worker設計の原則」に従う）
3. 各Workerのシステムプロンプトを設計する
4. 各Workerの担当タスクを具体的に記述する

Worker設計の出力形式（内部でJSON配列として整理する）:
```
[
  {
    "role": "役割名",
    "port": 3100,
    "systemPrompt": "You are a ... specialist. Focus on ...",
    "task": "具体的なタスク内容"
  },
  ...
]
```

- Worker数 N を決定し、BASE=3100 から連番でポートを割り当てる（worker_0=3100, worker_1=3101, ...）

例：「市場調査レポートを作成して」
→ researcher（ポート3100）, analyst（ポート3101）, writer（ポート3102）= 3エージェント

---

### Step 2: worker JSONを生成

```
read_file("skills/swarms/worker-template.json")
```

テンプレートを読み込み、各roleのJSONを生成する。

置換ルール:
- `{{WORKER_NAME}}` → `swarm_{role}` （例: `swarm_researcher`）
- `{{WORKER_PORT}}` → Step 1 で決定した動的ポート番号
- `{{ROLE_SYSTEM_PROMPT}}` → roleに特化したシステムプロンプト。以下のパターンで生成する:
  `"You are a {role} specialist. Focus on {専門領域の具体的な説明}. Your output should be {期待する成果物の形式}."`
- `{{ASSIGNED_TASK}}` → このworkerに割り当てる具体的なタスク

生成したJSONを書き出す（全workerを**並列で同時に** `write_file` すること。順次実行するとターン数を無駄に消費する）:
```
write_file("/tmp/swarms/worker_{role_0}.json", <JSON>)  # 同時に
write_file("/tmp/swarms/worker_{role_1}.json", <JSON>)  # 同時に
# ... 全roleを1ターンで並列書き出し
```

---

### Step 3: workerプロセスを起動

生成したJSONを使い、全workerを**1つの `bash_command`** でまとめて起動する（ターン数を最小化するため）。

作業ディレクトリの準備・`.env` コピー・全worker起動を1コマンドで実行する:

> **なぜ `.env` をコピーするか**: kudosflow の `serverRunner.ts` は `.env` を
> 「ワークフロー JSON と同じディレクトリ」からも探索する。
> worker JSON は `/tmp/swarms/` に生成されるため、同ディレクトリに `.env` がないと
> `ANTHROPIC_API_KEY` 等が読み込まれず worker が起動直後にエラーになる。

```
bash_command("
  mkdir -p /tmp/swarms
  cp /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow/.env /tmp/swarms/.env
  cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow
  npx tsx scripts/start-a2a-server.ts --config /tmp/swarms/worker_{role_0}.json --port {port_0} --name swarm_{role_0} > /tmp/swarms/{role_0}.log 2>&1 &
  npx tsx scripts/start-a2a-server.ts --config /tmp/swarms/worker_{role_1}.json --port {port_1} --name swarm_{role_1} > /tmp/swarms/{role_1}.log 2>&1 &
  # ... 全workerの行を動的に生成する（Step 1 で決定したrole/port一覧を使う）
  echo 'all workers launched'
")
```

> **重要**: 全workerの起動を1回の `bash_command` にまとめること。個別に呼び出すとLLMのターン数を無駄に消費し recursionLimit に達する。

---

### Step 4: 起動確認（healthcheck）

全workerを**1つの `bash_command`** でまとめて確認する（ターン数を最小化するため）:

```
bash_command("
  for port in {port_0} {port_1} ...; do
    for i in \$(seq 1 15); do
      curl -sf http://localhost:\$port/.well-known/agent.json > /dev/null && echo \"port \$port: ready\" && break || sleep 1
    done
  done
")
```

いずれかのポートで「ready」が返らない場合は、該当ロールのログを確認する:
```
bash_command("cat /tmp/swarms/{role}.log")
```

---

### Step 5: タスクを並列送信

全workerの起動確認後、各workerに担当タスクを送信する。

```
bash_command("cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx scripts/send-a2a-message.ts --url http://localhost:{port} --message '{assigned_task}' --output json --timeout 300000")
```

全roleのコマンドを**同時に**実行する（`&` でバックグラウンド実行 + `wait` で全完了を待機）:

> **重要**: `bash_command` の `timeout` を **360000**（6分）に設定すること。デフォルトの120秒では `wait` がタイムアウトする。

> **OpenAI を worker モデルに使わないこと**: 複数の独立 Node.js プロセスが同時に
> OpenAI API を呼び出すと RPM/TPM 制限（HTTP 429）が発生する。
> `worker-template.json` のモデルは Anthropic のまま維持する。

```
bash_command("
  cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow
  npx tsx scripts/send-a2a-message.ts --url http://localhost:{port_0} --message '{task_role_0}' --output json --timeout 300000 > /tmp/swarms/result_{role_0}.json &
  npx tsx scripts/send-a2a-message.ts --url http://localhost:{port_1} --message '{task_role_1}' --output json --timeout 300000 > /tmp/swarms/result_{role_1}.json &
  # ... 全workerの行を動的に生成する（Step 1 で決定したrole/port一覧を使う）
  wait
  echo 'all workers completed'
")
```

---

### Step 6: 結果を収集・統合

各workerの結果ファイルを読む:
```
read_file("/tmp/swarms/result_{role}.json")
```

全workerの結果を統合して最終報告を作成する:
1. 各workerの成果物をまとめる
2. 統合時の矛盾・依存関係を解決する
3. ユーザーへの最終報告を出力する

---

### Step 7: クリーンアップ（自動問い合わせ）

Step 6 完了後、クリーンアップは `finalize_node` が自動的にユーザーへ確認する。

- ユーザーが **yes / y** を回答 → `pkill -f start-a2a-server.ts` + `rm -rf /tmp/swarms/` を実行
- ユーザーが **no** を回答 → スキップ（ログは `/tmp/swarms/` に残る）

**このステップで bash_command を実行しないこと。** クリーンアップは leader ワークフローの `finalize_node` に委ねる。
