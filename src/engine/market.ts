// 株価生成エンジン。
// 日次対数リターン = β × 市場要因 + 業種要因 + 個別要因 + イベント影響
// シードから全期間を一括生成し、プレイヤーには「今日」までだけを見せる。

import { createRng } from './rng';
import { rollEvents, type ActiveEffect, type NewsItem } from './events';
import type { Sector, StockDef } from '../data/stocks';

export const TRADING_DAYS_PER_YEAR = 250;

export type Candle = { open: number; high: number; low: number; close: number; volume: number };

export type Regime = 'bull' | 'normal' | 'bear';

export const REGIME_LABELS: Record<Regime, string> = { bull: '強気相場', normal: '平常', bear: '弱気相場' };

// 相場局面ごとの市場要因（年率）
const REGIME_PARAMS: Record<Regime, { mu: number; sigma: number }> = {
  bull: { mu: 0.25, sigma: 0.12 },
  normal: { mu: 0.04, sigma: 0.16 },
  bear: { mu: -0.3, sigma: 0.28 },
};

// 1 日ごとの局面遷移確率（マルコフ連鎖）
const REGIME_TRANSITIONS: Record<Regime, [Regime, number][]> = {
  bull: [['normal', 0.015]],
  normal: [['bull', 0.008], ['bear', 0.006]],
  bear: [['normal', 0.025]],
};

const SECTOR_DAILY_SIGMA = 0.007;

export type MarketData = {
  stocks: readonly StockDef[];
  /** 銘柄 ID → 日ごとのローソク足 */
  candles: Record<string, Candle[]>;
  /** 市場指数（全銘柄の等ウェイト、開始日を 1000 とする） */
  index: number[];
  regimes: Regime[];
  news: NewsItem[];
  totalDays: number;
};

export function generateMarket(
  seed: string,
  stocks: readonly StockDef[],
  totalDays: number,
  indexBaseDay = 0,
): MarketData {
  const rng = createRng(seed);
  const sqrtDt = Math.sqrt(1 / TRADING_DAYS_PER_YEAR);

  const candles: Record<string, Candle[]> = {};
  const prev: Record<string, number> = {};
  for (const s of stocks) {
    candles[s.id] = [];
    prev[s.id] = s.initialPrice;
  }
  const sectors = [...new Set(stocks.map((s) => s.sector))];

  let regime: Regime = 'normal';
  const regimes: Regime[] = [];
  const news: NewsItem[] = [];
  let active: ActiveEffect[] = [];

  for (let day = 0; day < totalDays; day++) {
    // 局面遷移
    let r = rng.next();
    for (const [to, p] of REGIME_TRANSITIONS[regime]) {
      if (r < p) {
        regime = to;
        break;
      }
      r -= p;
    }
    regimes.push(regime);

    const rp = REGIME_PARAMS[regime];
    const marketReturn = rp.mu / TRADING_DAYS_PER_YEAR + rp.sigma * sqrtDt * rng.normal();
    const sectorReturn = Object.fromEntries(sectors.map((sec) => [sec, SECTOR_DAILY_SIGMA * rng.normal()])) as Record<
      Sector,
      number
    >;

    const ev = rollEvents(rng, day, stocks, active);
    active = ev.active;
    news.push(...ev.news);

    for (const s of stocks) {
      const p0 = prev[s.id];
      // 個別要因：市場要因で説明される分を差し引いた残りのボラティリティ
      const idioSigma = Math.sqrt(Math.max(s.sigma ** 2 - (s.beta * rp.sigma) ** 2, (s.sigma * 0.4) ** 2));
      const drift = (s.mu - 0.5 * s.sigma ** 2) / TRADING_DAYS_PER_YEAR;
      const logRet =
        drift + s.beta * marketReturn + sectorReturn[s.sector] + idioSigma * sqrtDt * rng.normal() + (ev.impact[s.id] ?? 0);

      const close = Math.max(1, Math.round(p0 * Math.exp(logRet)));
      // 寄り付きは前日終値からの小さなギャップ、高値・安値は日中の振れ幅
      const open = Math.max(1, Math.round(p0 * Math.exp(logRet * 0.3 + 0.003 * rng.normal())));
      const range = s.sigma * sqrtDt * 0.6;
      const high = Math.round(Math.max(open, close) * (1 + Math.abs(rng.normal()) * range));
      const low = Math.max(1, Math.round(Math.min(open, close) * (1 - Math.abs(rng.normal()) * range)));
      // 値動きが大きい日ほど出来高が増える
      const volume = Math.round(100_000 * (1 + Math.abs(logRet) * 40) * (0.6 + rng.next() * 0.8)) * 100;

      candles[s.id].push({ open, high, low, close, volume });
      prev[s.id] = close;
    }
  }

  const index = Array.from({ length: totalDays }, (_, day) => {
    const ratios = stocks.map((s) => candles[s.id][day].close / candles[s.id][indexBaseDay].close);
    return (1000 * ratios.reduce((a, b) => a + b, 0)) / stocks.length;
  });

  return { stocks, candles, index, regimes, news, totalDays };
}

/** データ上の日インデックス → 'YYYY-MM-DD'（土日を飛ばした営業日） */
export function dayToDate(day: number, start = '2031-01-06'): string {
  const d = new Date(`${start}T00:00:00Z`);
  let remaining = day;
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) remaining--;
  }
  return d.toISOString().slice(0, 10);
}
