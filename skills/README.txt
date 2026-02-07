# Skills Library

このディレクトリには、SceneGraphManagerで使用可能なスキル定義ファイルが含まれています。スキルはAIエージェントが実行可能な専門機能をカプセル化したものです。

## 📁 ディレクトリ構成

```
skills/
├── README.md                   # このファイル
├── data/                       # データ処理・分析スキル
│   ├── data_analysis.md        # データ分析
│   ├── statistical_analysis.md # 統計分析
│   └── visualization.md        # データ可視化
├── office/                     # オフィスドキュメント操作
│   ├── excel_operations.md     # Excel操作
│   ├── pdf_processing.md       # PDF処理
│   ├── powerpoint_operations.md# PowerPoint操作
│   └── word_operations.md      # Word操作
├── support/                    # カスタマーサポート
│   ├── faq_handling.md         # FAQ対応
│   ├── product_knowledge.md    # 製品知識
│   └── troubleshooting.md      # トラブルシューティング
└── web/                        # Web関連機能
    ├── web_scraping.md         # Webスクレイピング
    └── web_search.md           # Web検索
```

## 📚 スキルカテゴリ

### data/ - データ処理・分析

データの加工、分析、可視化に関するスキル群。

- **[data_analysis.md](data/data_analysis.md)** - データ分析の基本機能
  - CSV/JSON/Excel形式のデータ読み込み
  - データクリーニング・前処理
  - 基本統計量の計算
  - データ変換・フィルタリング

- **[statistical_analysis.md](data/statistical_analysis.md)** - 統計分析
  - 記述統計
  - 推測統計（t検定、分散分析など）
  - 相関分析
  - 回帰分析

- **[visualization.md](data/visualization.md)** - データ可視化
  - チャート・グラフ生成
  - インタラクティブな可視化
  - ダッシュボード作成
  - レポート生成

### office/ - オフィスドキュメント操作

Microsoft Officeドキュメントの読み取り・編集・生成。

- **[excel_operations.md](office/excel_operations.md)** - Excel操作
  - Excel読み込み・書き込み
  - セルの書式設定
  - 数式・関数の利用
  - チャート・ピボットテーブル作成

- **[pdf_processing.md](office/pdf_processing.md)** - PDF処理
  - PDFテキスト抽出
  - PDF生成・変換
  - PDF結合・分割
  - フォーム入力・電子署名

- **[powerpoint_operations.md](office/powerpoint_operations.md)** - PowerPoint操作
  - プレゼンテーション作成
  - スライドレイアウト管理
  - 画像・図形の挿入
  - アニメーション設定

- **[word_operations.md](office/word_operations.md)** - Word操作
  - ドキュメント読み込み・編集
  - スタイル・書式設定
  - テンプレートからの生成
  - 差し込み印刷

### support/ - カスタマーサポート

顧客対応・サポート業務に特化したスキル。

- **[faq_handling.md](support/faq_handling.md)** - FAQ対応
  - よくある質問の検索
  - 回答テンプレート管理
  - 質問の自動分類
  - 回答精度の向上

- **[product_knowledge.md](support/product_knowledge.md)** - 製品知識
  - 製品情報の検索
  - 仕様・スペックの参照
  - 互換性チェック
  - 製品比較

- **[troubleshooting.md](support/troubleshooting.md)** - トラブルシューティング
  - 問題診断フロー
  - 解決手順の提示
  - エラーコード解析
  - エスカレーション判定

### web/ - Web関連機能

Webからの情報収集・処理機能。

- **[web_scraping.md](web/web_scraping.md)** - Webスクレイピング
  - HTML/JSONデータの抽出
  - 複数ページの巡回
  - 動的コンテンツの取得
  - データの構造化

- **[web_search.md](web/web_search.md)** - Web検索
  - 複数検索エンジンの利用
  - 検索結果の集約
  - フィルタリング・ランキング
  - メタデータの取得

## 🚀 スキルの使い方

### 基本的な使い方

スキルはワークフロー設定（JSON）内で参照します。

```typescript
// スキルを使ったワークフロー例
{
  "config": {
    "name": "Excel Report Generator"
  },
  "models": [
    {
      "id": "assistant",
      "type": "anthropic",
      "config": {
        "model": "claude-3-5-sonnet-20241022"
      },
      "systemPrompt": "You are an Excel automation assistant with access to excel_operations skill."
    }
  ],
  "nodes": [
    {
      "id": "generate_report",
      "type": "model",
      "modelRef": "assistant"
    }
  ],
  "edges": [
    { "from": "__start__", "to": "generate_report" },
    { "from": "generate_report", "to": "__end__" }
  ]
}
```

### スキルをFunction Nodeで直接使用

```typescript
{
  "nodes": [
    {
      "id": "process_excel",
      "type": "function",
      "function": `
        async (state) => {
          // Excel操作スキルを使用
          const data = await readExcelFile({
            filepath: "./data/sales.xlsx",
            sheet: "Q1 Sales"
          });

          // データ処理
          const summary = analyzeSalesData(data);

          return { summary };
        }
      `
    }
  ]
}
```

### MCP Serverとの統合

スキルはMCP（Model Context Protocol）サーバーと組み合わせて使用できます。

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    }
  },
  "models": [
    {
      "id": "assistant",
      "type": "anthropic",
      "config": {
        "model": "claude-3-5-sonnet-20241022"
      },
      "bindMcpServers": ["filesystem"]
    }
  ]
}
```

### スキルの組み合わせ

複数のスキルを組み合わせて複雑なワークフローを構築できます。

```typescript
// Web検索 → データ分析 → Excelレポート生成
{
  "nodes": [
    {
      "id": "search_data",
      "type": "function",
      "function": `
        async (state) => {
          const results = await performWebSearch({
            query: state.query,
            maxResults: 20
          });
          return { searchResults: results };
        }
      `
    },
    {
      "id": "analyze_data",
      "type": "function",
      "function": `
        async (state) => {
          const analysis = await analyzeData({
            data: state.searchResults,
            metrics: ['frequency', 'trends']
          });
          return { analysis };
        }
      `
    },
    {
      "id": "generate_report",
      "type": "function",
      "function": `
        async (state) => {
          await writeExcelFile({
            filepath: "./reports/analysis.xlsx",
            data: state.analysis,
            formatting: { headerRow: true }
          });
          return { reportGenerated: true };
        }
      `
    }
  ],
  "edges": [
    { "from": "__start__", "to": "search_data" },
    { "from": "search_data", "to": "analyze_data" },
    { "from": "analyze_data", "to": "generate_report" },
    { "from": "generate_report", "to": "__end__" }
  ]
}
```

## 📖 スキル定義フォーマット

各スキルファイルは以下の構造を持ちます：

```markdown
---
name: skill_name
description: スキルの説明
version: 1.0.0
author: 作者名
tags:
  - カテゴリ1
  - カテゴリ2
requires:
  - 依存パッケージ1
  - 依存パッケージ2
---

# スキル名

## Overview
スキルの概要

## Usage
使用方法の説明

## Examples
実装例

## Parameters
パラメータの詳細

## Returns
戻り値の説明

## Error Handling
エラー処理

## Best Practices
ベストプラクティス
```

## 🎯 ユースケース別推奨スキル

### データ分析レポート作成

使用スキル：
- [data_analysis.md](data/data_analysis.md)
- [statistical_analysis.md](data/statistical_analysis.md)
- [visualization.md](data/visualization.md)
- [excel_operations.md](office/excel_operations.md)

### カスタマーサポート自動化

使用スキル：
- [faq_handling.md](support/faq_handling.md)
- [product_knowledge.md](support/product_knowledge.md)
- [troubleshooting.md](support/troubleshooting.md)

### Web調査・リサーチ

使用スキル：
- [web_search.md](web/web_search.md)
- [web_scraping.md](web/web_scraping.md)
- [data_analysis.md](data/data_analysis.md)

### ドキュメント生成自動化

使用スキル：
- [word_operations.md](office/word_operations.md)
- [powerpoint_operations.md](office/powerpoint_operations.md)
- [pdf_processing.md](office/pdf_processing.md)

### 営業レポート自動化

使用スキル：
- [excel_operations.md](office/excel_operations.md)
- [data_analysis.md](data/data_analysis.md)
- [visualization.md](data/visualization.md)
- [powerpoint_operations.md](office/powerpoint_operations.md)

## 🔧 環境設定

### 必要な依存パッケージのインストール

```bash
# データ処理スキル用
yarn add csv-parser xlsx papaparse

# オフィススキル用
yarn add xlsx exceljs pdf-lib pdfjs-dist officegen docxtemplater

# Web スキル用
yarn add axios cheerio puppeteer node-fetch

# 統計・分析用
yarn add simple-statistics regression mathjs
```

### 環境変数の設定

```bash
# Web検索API用
export GOOGLE_SEARCH_API_KEY="your-google-api-key"
export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"
export BING_SEARCH_API_KEY="your-bing-api-key"

# ファイルアクセスパス
export WORKSPACE_PATH="/path/to/workspace"
export REPORTS_PATH="/path/to/reports"
```

## 📝 新しいスキルの作成

### スキル作成ガイドライン

1. **明確な目的**: スキルは単一の責任を持つべき
2. **再利用可能**: 様々なワークフローで利用可能
3. **エラー処理**: 適切なエラーハンドリングと報告
4. **ドキュメント**: 使用例とパラメータの明確な説明
5. **テスト可能**: 単体テストが書きやすい設計

### スキルテンプレート

新しいスキルを作成する際のテンプレート：

```markdown
---
name: new_skill_name
description: 新しいスキルの説明
version: 1.0.0
author: Your Name
tags:
  - category
requires:
  - required-package
---

# New Skill Name

## Overview

スキルの概要を簡潔に説明します。

## Usage

このスキルは以下のようなシーンで使用できます：
- ユースケース1
- ユースケース2

## Examples

### Example 1: 基本的な使用例

\`\`\`javascript
// コード例
const result = await newSkillFunction({
  param1: "value1",
  param2: "value2"
});
\`\`\`

## Parameters

### functionName(options)

- `param1` (type, required): 説明
- `param2` (type, optional): 説明 (default: value)

## Returns

戻り値の説明

## Error Handling

エラーハンドリングの説明

### Common Error Codes

- `ERROR_CODE_1`: 説明
- `ERROR_CODE_2`: 説明

## Best Practices

1. ベストプラクティス1
2. ベストプラクティス2

## Version History

- **1.0.0** (YYYY-MM-DD): Initial release
```

### スキルの追加手順

1. 適切なカテゴリディレクトリを選択（または新規作成）
2. スキル定義ファイルを作成（`skill_name.md`）
3. frontmatter（YAML）でメタデータを記述
4. ドキュメントセクションを記述
5. 実装例とテストコードを追加
6. このREADMEに追加したスキルを記載

## 🧪 テスト

スキルのテストは [../tests/skills/](../tests/skills/) にあります。

### テストの実行

```bash
# すべてのスキルテストを実行
yarn test:skills

# 特定のスキルカテゴリのテスト
yarn test:skills:data
yarn test:skills:office
yarn test:skills:support
yarn test:skills:web
```

### テスト例

```typescript
import { readExcelFile, writeExcelFile } from '../skills/office/excel_operations';

describe('Excel Operations Skill', () => {
  test('should read Excel file correctly', async () => {
    const data = await readExcelFile({
      filepath: './test/fixtures/sample.xlsx',
      sheet: 'Sheet1'
    });

    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });

  test('should write Excel file correctly', async () => {
    const result = await writeExcelFile({
      filepath: './test/output/report.xlsx',
      data: [
        ['Name', 'Age', 'City'],
        ['Alice', 30, 'Tokyo'],
        ['Bob', 25, 'Osaka']
      ]
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(3);
  });
});
```

## 🔍 スキル検索

プロジェクト内のスキルを検索するには：

```bash
# スキル名で検索
grep -r "name: excel" skills/

# タグで検索
grep -r "tags:" skills/ | grep "data"

# 説明で検索
grep -r "description:" skills/ | grep "分析"
```

## 📚 関連ドキュメント

### プロジェクトドキュメント

- [CLAUDE.md](../CLAUDE.md) - プロジェクト全体の技術ドキュメント
- [README.md](../README.md) - プロジェクト概要
- [Workflow Design Guide](../docs/guides/WORKFLOW_DESIGN_GUIDE.md) - ワークフロー設計ガイド

### 実装例

- [json/skills/](../json/skills/) - スキルを使用したワークフロー設定例
- [examples/](../examples/) - 実装サンプル集

### API リファレンス

- [WorkflowEngine API](../CLAUDE.md#workflowengine) - ワークフローエンジンAPI
- [Model Factory API](../CLAUDE.md#modelfactorymanager) - モデルファクトリAPI

## 💡 ベストプラクティス

### スキルの選択

1. **最小限のスキルセット**: 必要最小限のスキルを使用
2. **パフォーマンス考慮**: 重い処理は別ノードに分離
3. **エラーハンドリング**: 各スキルで適切にエラー処理
4. **ログ出力**: デバッグに必要な情報をログに記録

### スキルの組み合わせ

1. **段階的処理**: 複雑な処理は複数ステップに分割
2. **状態管理**: 中間結果を適切に状態に保存
3. **条件分岐**: 結果に応じて処理フローを変更
4. **並列処理**: 独立した処理は並列実行

### パフォーマンス最適化

1. **キャッシング**: 頻繁にアクセスするデータをキャッシュ
2. **バッチ処理**: 大量データは分割して処理
3. **非同期処理**: I/O操作は非同期で実行
4. **リソース管理**: メモリ・ファイルハンドルの適切な管理

## 🐛 トラブルシューティング

### よくある問題

#### スキルが見つからない

**原因**: スキルファイルのパスが間違っている

**解決策**:
```bash
# スキルファイルの存在確認
ls -la skills/office/excel_operations.md

# パスの確認
pwd
```

#### 依存パッケージのエラー

**原因**: 必要なnpmパッケージがインストールされていない

**解決策**:
```bash
# package.jsonの確認
cat package.json | grep "xlsx"

# パッケージのインストール
yarn add xlsx exceljs
```

#### 関数が定義されていない

**原因**: スキルの実装がワークフローに含まれていない

**解決策**: Function Nodeでスキルのロジックを実装するか、MCPサーバー経由で提供

#### メモリ不足エラー

**原因**: 大きなファイルをメモリに読み込んでいる

**解決策**:
```javascript
// ストリーミング処理を使用
const stream = fs.createReadStream('./large-file.csv');
stream.on('data', (chunk) => {
  // チャンク単位で処理
});
```

### デバッグ方法

```typescript
// デバッグ情報の出力
{
  "nodes": [
    {
      "id": "debug_node",
      "type": "function",
      "function": `
        async (state) => {
          console.log('Current state:', JSON.stringify(state, null, 2));
          console.log('Processing skill:', state.skillName);

          try {
            const result = await executeSkill(state);
            console.log('Skill result:', result);
            return result;
          } catch (error) {
            console.error('Skill error:', error.message);
            console.error('Stack trace:', error.stack);
            throw error;
          }
        }
      `
    }
  ]
}
```

## 🤝 コントリビューション

新しいスキルの追加や既存スキルの改善を歓迎します！

### コントリビューション手順

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/new-skill`)
3. スキル定義ファイルを作成
4. テストを追加
5. このREADMEを更新
6. コミットして push (`git push origin feature/new-skill`)
7. プルリクエストを作成

### レビュー基準

- スキル定義が明確で理解しやすい
- 実装例が動作する
- エラー処理が適切
- ドキュメントが充実している
- テストが含まれている

## 📄 ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) を参照してください。

## 📞 サポート

質問や問題がある場合：

1. [Issues](https://github.com/your-org/scene-graph-manager/issues) で検索
2. 既存のissueがなければ新規作成
3. [Discussions](https://github.com/your-org/scene-graph-manager/discussions) で質問

---

**最終更新:** 2026-02-06
**バージョン:** 1.0.0
**管理者:** SceneGraphManager Team
