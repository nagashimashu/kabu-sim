import { describe, expect, it } from 'vitest';
import { createRng } from './rng';
import { dayToDate, generateMarket } from './market';
import { buy, calcFee, createPortfolio, maxBuyable, sell, totalAssets } from './broker';
import { maxDrawdown, rankFor, returnRate } from './scoring';
import { STOCKS } from '../data/stocks';

describe('rng', () => {
  it('同じシードなら同じ乱数列', () => {
    const a = createRng('ABC');
    const b = createRng('ABC');
    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next));
  });

  it('異なるシードなら異なる乱数列', () => {
    expect(createRng('ABC').next()).not.toBe(createRng('XYZ').next());
  });

  it('正規乱数の平均と分散がおおむね 0 と 1', () => {
    const r = createRng(1);
    const xs = Array.from({ length: 20000 }, r.normal);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(variance - 1)).toBeLessThan(0.05);
  });
});

describe('market', () => {
  it('シードから決定的に生成される', () => {
    const a = generateMarket('SEED1', STOCKS, 300);
    const b = generateMarket('SEED1', STOCKS, 300);
    expect(a.candles).toEqual(b.candles);
    expect(a.news).toEqual(b.news);
  });

  it('全期間・全銘柄のローソク足が整合している', () => {
    const m = generateMarket('SEED2', STOCKS, 300);
    for (const s of STOCKS) {
      expect(m.candles[s.id]).toHaveLength(300);
      for (const c of m.candles[s.id]) {
        expect(c.low).toBeGreaterThanOrEqual(1);
        expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
        expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
        expect(Number.isInteger(c.close)).toBe(true);
      }
    }
  });

  it('指数は基準日に 1000', () => {
    const m = generateMarket('SEED3', STOCKS, 100, 60);
    expect(m.index[60]).toBeCloseTo(1000);
  });

  it('多数のシードで株価が極端に発散しない', () => {
    for (let i = 0; i < 30; i++) {
      const m = generateMarket(`S${i}`, STOCKS, 310);
      for (const s of STOCKS) {
        const ratio = m.candles[s.id][309].close / s.initialPrice;
        expect(ratio).toBeGreaterThan(0.05);
        expect(ratio).toBeLessThan(20);
      }
    }
  });

  it('営業日は土日を飛ばす', () => {
    expect(dayToDate(0, '2031-01-06')).toBe('2031-01-06'); // 月
    expect(dayToDate(4, '2031-01-06')).toBe('2031-01-10'); // 金
    expect(dayToDate(5, '2031-01-06')).toBe('2031-01-13'); // 翌月曜
  });
});

describe('broker', () => {
  it('手数料は 0.1%、最低 100 円', () => {
    expect(calcFee(10_000)).toBe(100);
    expect(calcFee(1_000_000)).toBe(1000);
  });

  it('買って売ると現金と実現損益が正しく計算される', () => {
    let p = createPortfolio(1_000_000);
    const b = buy(p, 'A', 100, 1000, 0);
    if (!b.ok) throw new Error(b.error);
    p = b.portfolio;
    expect(p.cash).toBe(1_000_000 - 100_000 - 100);
    expect(p.positions.A).toEqual({ shares: 100, avgCost: 1001 });

    const s = sell(p, 'A', 100, 1200, 1);
    if (!s.ok) throw new Error(s.error);
    expect(s.portfolio.positions.A).toBeUndefined();
    expect(s.portfolio.cash).toBe(899_900 + 120_000 - 120);
    expect(s.trade.realized).toBe(120_000 - 120 - 100_100);
  });

  it('買い増しで平均取得単価が更新される', () => {
    let p = createPortfolio(10_000_000);
    p = (buy(p, 'A', 100, 1000, 0) as { portfolio: typeof p }).portfolio;
    p = (buy(p, 'A', 100, 2000, 1) as { portfolio: typeof p }).portfolio;
    expect(p.positions.A.shares).toBe(200);
    expect(p.positions.A.avgCost).toBe((100_100 + 200_200) / 200);
  });

  it('単元株・現金不足・保有不足はエラー', () => {
    const p = createPortfolio(100_000);
    expect(buy(p, 'A', 50, 100, 0).ok).toBe(false);
    expect(buy(p, 'A', 100, 1000, 0).ok).toBe(false);
    expect(sell(p, 'A', 100, 1000, 0).ok).toBe(false);
  });

  it('最大購入可能株数は手数料込みで現金を超えない', () => {
    const shares = maxBuyable(1_000_000, 999);
    expect(shares % 100).toBe(0);
    expect(shares * 999 + calcFee(shares * 999)).toBeLessThanOrEqual(1_000_000);
    expect(buy(createPortfolio(1_000_000), 'A', shares + 100, 999, 0).ok).toBe(false);
  });

  it('総資産 = 現金 + 時価', () => {
    const r = buy(createPortfolio(1_000_000), 'A', 100, 1000, 0);
    if (!r.ok) throw new Error(r.error);
    expect(totalAssets(r.portfolio, { A: 1500 })).toBe(899_900 + 150_000);
  });
});

describe('scoring', () => {
  it('最大ドローダウン', () => {
    expect(maxDrawdown([100, 120, 90, 110, 60, 130])).toBeCloseTo(0.5);
    expect(maxDrawdown([100, 110, 120])).toBe(0);
  });

  it('リターンとランク', () => {
    expect(returnRate(100, 150)).toBeCloseTo(0.5);
    expect(rankFor(0.6)).toBe('凄腕トレーダー');
    expect(rankFor(-0.9)).toBe('退場寸前');
  });
});
