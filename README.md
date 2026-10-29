# カブシム

架空の株式市場で取引する、ブラウザ完結型のシミュレーションゲーム（静的サイト）。

## 開発

```bash
npm install
npm run dev      # 開発サーバー http://localhost:5173
npm test         # エンジンの単体テスト
npm run build    # dist/ に静的ファイルを出力
```

## デプロイ（GitHub Pages）

1. GitHub に公開リポジトリとして push（ブランチ `main`）
2. リポジトリの Settings → Pages → Source を「GitHub Actions」に設定
3. `.github/workflows/deploy.yml` がテスト・ビルド・公開を自動で行う

## 構成

```
src/
├── engine/      UI に依存しない純粋ロジック（テスト対象）
│   ├── rng.ts       シード付き乱数（mulberry32）
│   ├── market.ts    株価生成（GBM + 市場/業種要因 + 相場局面）
│   ├── events.ts    ニュースイベント
│   ├── broker.ts    注文・約定・手数料
│   └── scoring.ts   リターン・最大ドローダウン・シャープレシオ
├── data/stocks.ts   架空銘柄マスタ（パラメータ調整はここ）
├── store/game.ts    ゲーム状態（Zustand、localStorage に自動保存）
├── components/      銘柄一覧・チャート・注文・ポートフォリオ・ニュース
└── pages/           タイトル・取引・結果
```

相場はシードから全期間を一括生成し、プレイヤーには当日分までしか見せない。
保存するのはシード・日付・ポートフォリオだけ。`?seed=XXXX` を付けた URL で同じ相場を共有できる。

チャートには [TradingView Lightweight Charts](https://www.tradingview.com/lightweight-charts/)（Apache 2.0）を使用。
