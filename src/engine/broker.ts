// 注文・約定・手数料。金額はすべて整数（円）で扱う。

export const LOT_SIZE = 100;

export type Position = { shares: number; /** 平均取得単価（円、小数可） */ avgCost: number };

export type Trade = {
  day: number;
  stockId: string;
  side: 'buy' | 'sell';
  shares: number;
  price: number;
  fee: number;
  /** 売却時の実現損益（手数料控除後） */
  realized?: number;
};

export type Portfolio = {
  cash: number;
  positions: Record<string, Position>;
  trades: Trade[];
};

export type OrderResult = { ok: true; portfolio: Portfolio; trade: Trade } | { ok: false; error: string };

/** 約定代金の 0.1%（最低 100 円） */
export function calcFee(amount: number): number {
  return Math.max(100, Math.round(amount * 0.001));
}

export function createPortfolio(cash: number): Portfolio {
  return { cash, positions: {}, trades: [] };
}

function validateShares(shares: number): string | null {
  if (!Number.isInteger(shares) || shares <= 0) return '株数を入力してください';
  if (shares % LOT_SIZE !== 0) return `株数は${LOT_SIZE}株単位で指定してください`;
  return null;
}

export function buy(p: Portfolio, stockId: string, shares: number, price: number, day: number): OrderResult {
  const err = validateShares(shares);
  if (err) return { ok: false, error: err };

  const amount = shares * price;
  const fee = calcFee(amount);
  if (amount + fee > p.cash) return { ok: false, error: '現金が不足しています' };

  const pos = p.positions[stockId] ?? { shares: 0, avgCost: 0 };
  const newShares = pos.shares + shares;
  // 手数料は取得単価に含める
  const avgCost = (pos.shares * pos.avgCost + amount + fee) / newShares;
  const trade: Trade = { day, stockId, side: 'buy', shares, price, fee };

  return {
    ok: true,
    trade,
    portfolio: {
      cash: p.cash - amount - fee,
      positions: { ...p.positions, [stockId]: { shares: newShares, avgCost } },
      trades: [...p.trades, trade],
    },
  };
}

export function sell(p: Portfolio, stockId: string, shares: number, price: number, day: number): OrderResult {
  const err = validateShares(shares);
  if (err) return { ok: false, error: err };

  const pos = p.positions[stockId];
  if (!pos || pos.shares < shares) return { ok: false, error: '保有株数が不足しています' };

  const amount = shares * price;
  const fee = calcFee(amount);
  const realized = Math.round(amount - fee - pos.avgCost * shares);
  const trade: Trade = { day, stockId, side: 'sell', shares, price, fee, realized };

  const positions = { ...p.positions };
  if (pos.shares === shares) delete positions[stockId];
  else positions[stockId] = { shares: pos.shares - shares, avgCost: pos.avgCost };

  return {
    ok: true,
    trade,
    portfolio: { cash: p.cash + amount - fee, positions, trades: [...p.trades, trade] },
  };
}

/** 手数料込みで買える最大株数（単元株単位） */
export function maxBuyable(cash: number, price: number): number {
  let lots = Math.floor(cash / (price * LOT_SIZE));
  while (lots > 0 && lots * LOT_SIZE * price + calcFee(lots * LOT_SIZE * price) > cash) lots--;
  return lots * LOT_SIZE;
}

export function marketValue(p: Portfolio, prices: Record<string, number>): number {
  return Object.entries(p.positions).reduce((sum, [id, pos]) => sum + pos.shares * prices[id], 0);
}

export function totalAssets(p: Portfolio, prices: Record<string, number>): number {
  return p.cash + marketValue(p, prices);
}
