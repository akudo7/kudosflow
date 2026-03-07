---
name: swarms
description: ユーザのプロンプトを解析し、タスクに最適な専門エージェントチームを動的に生成・起動して並列実行する
---

# Swarms スキル

## このスキルの目的

ユーザのプロンプトを解析し、専門エージェントを生成する。
固定チームではなく、依頼内容に応じてその場でチームを組成し並列で作業する。

## 利用可能なエージェント種別

| role名 | 専門領域 | 使用するポート |
|--------|---------|-------------|
| `frontend` | UI/UX、React、CSS、コンポーネント設計 | 3011 |
| `backend`  | API、データベース、サーバーロジック | 3012 |
| `test`     | テスト設計、Jest、E2E、品質保証 | 3013 |
| `docs`     | ドキュメント、README、API仕様 | 3014 |
| `arch`     | アーキテクチャ設計、技術選定、レビュー | 3015 |

必要なエージェントのみ起動する（最小2、最大5）。

---

## 制約（必ず守ること）

- **`glob_files` は絶対に使わない**。ファイル探索は一切不要。
- **`read_file` で読むのは以下の2ファイルのみ**: `skills/swarms/SKILL.md` と `skills/swarms/worker-template.json`
- リポジトリの構造調査・コード読み込みは行わない。

---

## 手順

### Step 1: プロンプト解析 → チーム構成を決定

ユーザーの依頼を読み、必要なroleの一覧を決定する。

判断基準:
- UIの変更を含む → `frontend`
- API/サーバー/DBの変更を含む → `backend`
- テストが言及されている、または品質保証が必要 → `test`
- ドキュメント更新が必要 → `docs`
- 大きな設計判断がある → `arch`

例：「ReactアプリにダークモードとREST APIを追加して」
→ frontend（ダークモード）, backend（REST API）, test（両方のテスト）= 3エージェント

---

### Step 2: worker JSONを生成

```
read_file("skills/swarms/worker-template.json")
```

テンプレートを読み込み、各roleのJSONを生成する。

置換ルール:
- `{{WORKER_NAME}}` → `swarm_{role}` （例: `swarm_frontend`）
- `{{WORKER_PORT}}` → roleに対応するポート番号
- `{{ROLE_SYSTEM_PROMPT}}` → roleに特化したシステムプロンプト（下記参照）
- `{{ASSIGNED_TASK}}` → このworkerに割り当てる具体的なタスク

roleごとのシステムプロンプト:
- frontend: "You are a frontend specialist. Focus on React components, CSS, and UI/UX implementation."
- backend:  "You are a backend specialist. Focus on API design, database schema, and server logic."
- test:     "You are a QA specialist. Focus on test strategy, Jest unit tests, and integration tests."
- docs:     "You are a documentation specialist. Focus on clear, accurate technical documentation."
- arch:     "You are a software architect. Focus on system design, patterns, and technical decisions."

生成したJSONを書き出す:
```
write_file("/tmp/swarms/worker_{role}.json", <生成したJSON文字列>)
```

---

### Step 3: workerプロセスを起動

生成したJSONを使い、各workerをA2Aサーバーとして起動する。

まず作業ディレクトリと `.env` を準備する（APIキーの読み込みに必要）:

```
bash_command("mkdir -p /tmp/swarms")
bash_command("cp /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow/.env /tmp/swarms/.env")
```

> **なぜ `.env` をコピーするか**: kudosflow の `serverRunner.ts` は `.env` を
> 「ワークフロー JSON と同じディレクトリ」からも探索する。
> worker JSON は `/tmp/swarms/` に生成されるため、同ディレクトリに `.env` がないと
> `ANTHROPIC_API_KEY` 等が読み込まれず worker が起動直後にエラーになる。

各workerを起動する（`cd` で kudosflow ルートを起点にすること）:

```
bash_command("cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && npx tsx scripts/start-a2a-server.ts --config /tmp/swarms/worker_{role}.json --port {port} --name swarm_{role} > /tmp/swarms/{role}.log 2>&1 &")
```

全roleに対して順次実行する。

---

### Step 4: 起動確認（healthcheck）

各workerが起動するまで待機する（最大15秒）:

```
bash_command("for i in $(seq 1 15); do curl -sf http://localhost:{port}/.well-known/agent.json > /dev/null && echo 'ready' && break || sleep 1; done")
```

「ready」が返らない場合はそのworkerの起動失敗と判断し、ログを確認する:
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
  npx tsx scripts/send-a2a-message.ts --url http://localhost:3011 --message '{task_frontend}' --output json --timeout 300000 > /tmp/swarms/result_frontend.json &
  npx tsx scripts/send-a2a-message.ts --url http://localhost:3012 --message '{task_backend}'  --output json --timeout 300000 > /tmp/swarms/result_backend.json  &
  npx tsx scripts/send-a2a-message.ts --url http://localhost:3013 --message '{task_test}'     --output json --timeout 300000 > /tmp/swarms/result_test.json     &
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

### Step 7: クリーンアップ（オプション）

セッション終了後にworkerプロセスを停止する:
```
bash_command("pkill -f 'start-a2a-server.ts' || true")
bash_command("rm -rf /tmp/swarms/")
```
