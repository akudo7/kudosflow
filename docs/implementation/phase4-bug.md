# Phase 4 - Bug Report

**作成日**: 2025-12-27
**ステータス**: 🔴 Critical - 未解決

---

## 🐛 問題: 構文エラー "Missing catch or finally after try"

### エラー内容

```
Error addNode executing node quality_evaluator: SyntaxError: Missing catch or finally after try
    at new Function (<anonymous>)
    at file:///Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/node_modules/@kudos/scene-graph-manager/dist/lib/workflow.js:348:39
```

### 症状

- 品質評価サーバー ([quality-evaluation.json](../../json/a2a/phase4/servers/quality-evaluation.json)) が起動時にクラッシュ
- ワークフロー全体がquality_evaluationフェーズで停止
- "Workflow execution failed" エラーが発生

### 実装背景

この修正を行なっていた理由:

1. **問題**: 品質評価サーバーが調査結果を正しく抽出できず、`qualityScore: 0` を返していた
2. **原因分析**:
   - クライアントが5個の調査結果を個別に送信していたが、サーバーは最後の1件のみ受信
   - 調査結果が多層にネストされたJSON構造（4層以上）になっており、解析が困難
   - A2Aプロトコルによる追加のJSON文字列化で制御文字エラーが発生
3. **解決アプローチ**:
   - クライアント側で全ての調査結果を集約し、事前にフラット化してから送信
   - サーバー側は複雑な多層解析を削除し、フラット化されたデータを直接使用
   - これにより、ネストされたJSONの解析問題とJSON制御文字エラーを回避

具体的には、サーバー側で以下の複雑な多層解析ロジック（約50行）を削除し、シンプルな直接代入（3行）に置き換える必要があった:

```javascript
// 削除対象: 多層解析ロジック（約50行）
for (let i = 0; i < evaluationData.researchResults.length; i++) {
  const item = evaluationData.researchResults[i];
  // レイヤー1, 2, 3の解析...
}

// 置き換え先: 直接使用（3行）
if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
  researchResults = evaluationData.researchResults;
}
```

### 根本原因

この修正を自動化しようとして、Node.jsスクリプトによる正規表現置換で、**try-catchブロックの構文が壊れた**。

具体的には、以下のコマンドが原因:

```javascript
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('quality-evaluation.json', 'utf8'));

// 問題のある正規表現置換
const newImpl = data.nodes[0].function.implementation.replace(
  /\/\/ researchResultsの各要素を処理[\s\S]*?console\.log\(\`  ✅ 最終的に抽出した調査結果数: \\\${researchResults\.length}\`\);/,
  '...' // 新しいコード
);

data.nodes[0].function.implementation = newImpl;
fs.writeFileSync('quality-evaluation.json', JSON.stringify(data, null, 2));
"
```

この置換により:
1. `try`ブロックの途中で閉じ括弧 `}` が削除された
2. 結果として `try { ... }` が不完全になり、`catch` または `finally` が見つからない
3. JavaScript構文エラーが発生

### 壊れたコードの例

```javascript
try {
  console.log('\n🔍 JSON解析開始...');

  const jsonMatch = userContent.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    console.log('  ✓ JSON部分を検出');

    const evaluationData = JSON.parse(jsonMatch[0]);
    // ...

    if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
      console.log('  ✓ researchResults配列を検出:', evaluationData.researchResults.length, 'items');
      researchResults = evaluationData.researchResults;
      console.log('  ✅ 調査結果を直接使用:', researchResults.length, 'items');
    }
    }  // ← この閉じ括弧が余分（構文エラー）
  } else {
    // ...
  }
} catch (e) {  // ← tryブロックが正しく閉じていないためエラー
  // ...
}
```

### 影響範囲

- **品質評価サーバー**: 起動不可
- **Phase 4ワークフロー全体**: 実行不可
- **テスト**: 全て失敗

### 解決方法

#### オプション1: バックアップファイルから復元（推奨）

```bash
cd /Users/akirakudo/Desktop/MyWork/test/json/a2a/phase4/servers
cp quality-evaluation-backup.json quality-evaluation.json
```

その後、手動で修正を適用（下記参照）。

#### オプション2: 手動修正

1. [quality-evaluation.json](../../json/a2a/phase4/servers/quality-evaluation.json:60) を開く

2. `implementation`フィールドを検索し、以下の部分を見つける:

```javascript
// researchResultsの各要素を処理
if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
  console.log('  ✓ researchResults配列を検出:', evaluationData.researchResults.length, 'items');

  for (let i = 0; i < evaluationData.researchResults.length; i++) {
    const item = evaluationData.researchResults[i];
    // ... 多層解析ロジック
  }

  console.log(`  ✅ 最終的に抽出した調査結果数: ${researchResults.length}`);
}
```

3. 以下のシンプルなコードに置き換える:

```javascript
// researchResultsを直接使用（クライアント側で既にフラット化済み）
if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
  console.log('  ✓ researchResults配列を検出:', evaluationData.researchResults.length, 'items');
  researchResults = evaluationData.researchResults;
  console.log('  ✅ 調査結果を直接使用:', researchResults.length, 'items');
}
```

4. **重要**: tryブロックの閉じ括弧が正しく配置されていることを確認:

```javascript
try {
  console.log('\n🔍 JSON解析開始...');

  const jsonMatch = userContent.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    console.log('  ✓ JSON部分を検出');

    const evaluationData = JSON.parse(jsonMatch[0]);
    console.log('  ✓ evaluationData解析成功');
    console.log('    - originalRequest:', evaluationData.originalRequest?.substring(0, 50));
    console.log('    - totalResults:', evaluationData.totalResults);

    originalRequest = evaluationData.originalRequest || '';

    // researchResultsを直接使用（クライアント側で既にフラット化済み）
    if (evaluationData.researchResults && Array.isArray(evaluationData.researchResults)) {
      console.log('  ✓ researchResults配列を検出:', evaluationData.researchResults.length, 'items');
      researchResults = evaluationData.researchResults;
      console.log('  ✅ 調査結果を直接使用:', researchResults.length, 'items');
    }
  } else {
    console.log('  ⚠️  JSON形式が見つかりません - 全体をテキストとして扱います');
    originalRequest = userContent;
  }
} catch (e) {
  console.error('\n❌ JSON解析エラー:', e.message);
  console.error('  スタック:', e.stack);
  console.log('  フォールバック: 全体をテキストとして扱います');
  originalRequest = userContent;
}
```

5. ファイルを保存し、サーバーを再起動

### 検証方法

修正後、以下のコマンドでサーバーが正常に起動することを確認:

```bash
node -e "require('/Users/akirakudo/Desktop/MyWork/VSCode/test/ReactFlowTest/out/execution/serverRunner.js').runServer('/Users/akirakudo/Desktop/MyWork/test/json/a2a/phase4/servers/quality-evaluation.json', 3003)"
```

期待される出力:

```
✅ A2A Server is running on port 3003
✅ Server is ready to receive A2A requests
```

エラーがなく、サーバーが正常に起動すれば修正完了。

### 予防策

今後、同様の問題を防ぐために:

1. **正規表現による自動置換を避ける** - 特に複雑なJavaScriptコードに対しては使用しない
2. **Editツールを使用** - Claude CodeのEditツールは構文を理解しているため安全
3. **バックアップを作成** - 重要なファイルを編集する前に必ずバックアップを取る
4. **構文チェック** - 編集後は必ず構文エラーがないか確認する

### 教訓

- ✅ JSONファイル内のJavaScriptコードは正規表現で置換してはいけない
- ✅ 複雑なコード編集は手動またはEditツールを使用すべき
- ✅ try-catchブロックの構造は慎重に扱う必要がある
- ✅ 自動化ツールの使用には注意が必要

---

## ステータス更新

- **発見日時**: 2025-12-27 19:19 JST
- **修正開始**: 未着手
- **修正完了**: 未完了
- **検証済み**: ❌

---

## 関連ファイル

- [quality-evaluation.json](../../json/a2a/phase4/servers/quality-evaluation.json) - 壊れたファイル
- [quality-evaluation-backup.json](../../json/a2a/phase4/servers/quality-evaluation-backup.json) - バックアップ
- [phase4-status.md](./phase4-status.md) - Phase 4実装ステータス

---

## 次のステップ

1. ✅ バグレポートを作成（このファイル）
2. ⬜ バックアップから復元
3. ⬜ 手動で修正を適用
4. ⬜ サーバーが起動することを確認
5. ⬜ エンドツーエンドテストを実行
6. ⬜ phase4-status.mdを更新
