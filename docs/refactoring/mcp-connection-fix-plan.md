# MCP接続エラー修正計画

**作成日**: 2026-01-05
**対象**: SceneGraphManager MCP接続エラー (`Error: Not connected`)
**ステータス**: Phase 1-7 完了、Phase 8 計画中

---

## 📑 フェーズ別ドキュメント

各フェーズの詳細は個別ファイルを参照:

| Phase | 概要 | ステータス | ドキュメント |
|-------|------|----------|------------|
| 1 | MCP接続の初期化 | ✅ 完了 | [phase1-scenegraphmanager-mcp-connection.md](mcp-connection-fix/phase1-scenegraphmanager-mcp-connection.md) |
| 2 | WorkflowEngine非同期対応 | ✅ 完了 | [phase2-scenegraphmanager-workflow-async.md](mcp-connection-fix/phase2-scenegraphmanager-workflow-async.md) |
| 3 | ツールエラーハンドリング | ✅ 完了 | [phase3-scenegraphmanager-tool-error-handling.md](mcp-connection-fix/phase3-scenegraphmanager-tool-error-handling.md) |
| 4 | システムプロンプト改善 | ✅ 完了 | [phase4-kudosflow-system-prompt.md](mcp-connection-fix/phase4-kudosflow-system-prompt.md) |
| 5 | result_formatter改善 | ✅ 完了 | [phase5-kudosflow-result-formatter.md](mcp-connection-fix/phase5-kudosflow-result-formatter.md) |
| 6 | ビルドとテスト | ✅ 完了 | [phase6-build-and-test.md](mcp-connection-fix/phase6-build-and-test.md) |
| 7 | ワークフロー再設計 | ✅ 完了 | [phase7-workflow-redesign.md](mcp-connection-fix/phase7-workflow-redesign.md) |
| 8 | quality-evaluation入力形式改善 | 📋 計画中 | [phase8-quality-evaluation-input-format.md](mcp-connection-fix/phase8-quality-evaluation-input-format.md) |

---

## 🔍 問題の概要

### Phase 1-6で解決した問題 ✅

1. **MCP接続の初期化不足**: `connect()` メソッドが呼ばれていない → **解決**
2. **ツールのモデルバインド**: MCPツールが正しくモデルに登録されていない → **解決**
3. **エラーハンドリング不足**: ツール実行エラー後の処理が不十分 → **解決**

**検証結果**:

```
✓ MCP client connected successfully
✓ MCP initialization complete
Added 2 MCP tools to node: tools
🔧 Tool: mcp__tavily-mcp__tavily-search
✓ ToolNode tools completed successfully
```

### Phase 6で発見されたワークフロー設計の問題 → Phase 7で解決 ✅

**問題**: LLMがツール結果を処理して最終回答を生成できない

```
現在: research_executor → tools → result_formatter (LLMの最終回答なし)
必要: research_executor → tools → research_executor → result_formatter (Agent-Tool-Agent)
```

**症状**:

- ツール実行は成功するが、LLMが結果を処理していない
- `LLM response length: 0 chars`
- 無限ループまたは「調査結果なし」のエラー

**Phase 7での解決策**:

1. needsTools条件をToolMessage結果カウントに変更
2. research_executorで初回/2回目を区別
3. システムプロンプトにツール使用ルール追加
4. result_formatterでAIMessage抽出を改善

**検証結果**:

```text
✓ ツール実行結果あり (1件)、result_formatterへ
✓ LLMの最終回答を使用
✓ Status: completed
✓ Findings length: 500+ chars
```

### Phase 7テスト中に発見された新たな問題 → Phase 8で対応予定 ❌

**問題**: quality-evaluationサーバーが自然言語入力を処理できない

```json
期待: JSON構造 {"originalRequest": "...", "researchResults": [...]}
実際: マークダウン形式 "1. **会社概要レポート**: ..."
```

**症状**:

- `JSON形式が見つかりません`
- `researchResults.length === 0`
- 品質スコア: 0/100、エラーメッセージ返却

→ **Phase 8で対応予定**

---

## 📋 修正済みファイル

### SceneGraphManager側 (Phase 1-3)

1. `src/lib/models/factory.ts` - MCP接続の初期化追加
2. `src/lib/workflow.ts` - 非同期対応、エラーハンドリング追加

### kudosflow側 (Phase 4-7)

1. `json/a2a/servers/research-execution.json` - システムプロンプト、Agent-Tool-Agentパターン、result_formatter改善
2. `docs/json-workflow-debugging.md` - JSONワークフローのデバッグガイド（新規作成）

### test側 (Phase 7)

1. `/Users/akirakudo/Desktop/MyWork/test/json/a2a/servers/quality-evaluation.json` - JSON解析の制御文字エスケープ対応

---

## 📊 成功基準

### Phase 1-6 (達成済み) ✅

- [x] MCPクライアントが正常に接続される
- [x] Tavilyツールがモデルにバインドされる
- [x] ツールが実行される

### Phase 7 (達成済み) ✅

- [x] LLMがツール結果を使って最終回答を生成する
- [x] 無限ループが発生しない
- [x] 調査結果が正常に返される (`Status: completed`)
- [x] JSON解析の制御文字エスケープが動作する
- [x] JSONワークフローのデバッグドキュメントが完備

### Phase 8 (未達成) ❌

- [ ] quality-evaluationサーバーが自然言語入力を処理できる
- [ ] JSON形式と自然言語形式の両方に対応する
- [ ] `researchResults.length === 0` エラーが発生しない
- [ ] 品質評価とサマリーが正常に生成される

---

## 🔄 次のステップ

**Phase 8**: quality-evaluation入力形式の改善 - 自然言語テキスト対応

詳細は [phase8-quality-evaluation-input-format.md](mcp-connection-fix/phase8-quality-evaluation-input-format.md) を参照

---

**最終更新**: 2026-01-05
**現在のステータス**: Phase 7 完了、Phase 8 計画中
