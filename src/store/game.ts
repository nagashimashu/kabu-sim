// ゲーム状態。相場はシードから再生成できるので、保存するのはシード・日付・ポートフォリオだけ。

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STOCKS } from '../data/stocks';
import { generateMarket, type MarketData } from '../engine/market';
import { buy, createPortfolio, sell, totalAssets, type Portfolio } from '../engine/broker';

/** ゲーム開始前に見せる過去データの日数 */
export const HISTORY_DAYS = 60;
/** ゲーム期間（営業日） */
export const GAME_DAYS = 250;
export const INITIAL_CASH = 10_000_000;

const marketCache = new Map<string, MarketData>();

export function getMarket(seed: string): MarketData {
  let m = marketCache.get(seed);
  if (!m) {
    m = generateMarket(seed, STOCKS, HISTORY_DAYS + GAME_DAYS + 1, HISTORY_DAYS);
    marketCache.set(seed, m);
  }
  return m;
}

/** ゲーム内の日 → 生成データ上のインデックス */
export const dataIndex = (day: number) => HISTORY_DAYS + day;

export function pricesAt(market: MarketData, day: number): Record<string, number> {
  const i = dataIndex(day);
  return Object.fromEntries(market.stocks.map((s) => [s.id, market.candles[s.id][i].close]));
}

type Screen = 'title' | 'game' | 'result';

type GameState = {
  screen: Screen;
  seed: string;
  day: number;
  portfolio: Portfolio;
  /** ゲーム内の日ごとの総資産（終値ベース） */
  equity: number[];
  selectedId: string;

  startGame(seed: string): void;
  resume(): void;
  nextDay(): void;
  placeOrder(side: 'buy' | 'sell', shares: number): string | null;
  select(id: string): void;
  toTitle(): void;
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      seed: '',
      day: 0,
      portfolio: createPortfolio(INITIAL_CASH),
      equity: [],
      selectedId: STOCKS[0].id,

      startGame: (seed) =>
        set({
          screen: 'game',
          seed,
          day: 0,
          portfolio: createPortfolio(INITIAL_CASH),
          equity: [INITIAL_CASH],
          selectedId: STOCKS[0].id,
        }),

      resume: () => set({ screen: get().day >= GAME_DAYS ? 'result' : 'game' }),

      nextDay: () => {
        const { seed, day, portfolio, equity } = get();
        if (day >= GAME_DAYS) return;
        const next = day + 1;
        const value = totalAssets(portfolio, pricesAt(getMarket(seed), next));
        set({ day: next, equity: [...equity, value], screen: next >= GAME_DAYS ? 'result' : 'game' });
      },

      // 成行注文：当日の終値で約定する
      placeOrder: (side, shares) => {
        const { seed, day, portfolio, selectedId, equity } = get();
        const prices = pricesAt(getMarket(seed), day);
        const fn = side === 'buy' ? buy : sell;
        const r = fn(portfolio, selectedId, shares, prices[selectedId], day);
        if (!r.ok) return r.error;
        // 手数料分だけ当日の総資産が変わるので、最新値を反映
        const newEquity = [...equity.slice(0, -1), totalAssets(r.portfolio, prices)];
        set({ portfolio: r.portfolio, equity: newEquity });
        return null;
      },

      select: (id) => set({ selectedId: id }),
      toTitle: () => set({ screen: 'title' }),
    }),
    {
      name: 'kabu-sim-save',
      version: 1,
      // 画面状態は保存しない（リロード時はタイトルから「続きから」）
      partialize: ({ seed, day, portfolio, equity, selectedId }) => ({ seed, day, portfolio, equity, selectedId }),
    },
  ),
);
