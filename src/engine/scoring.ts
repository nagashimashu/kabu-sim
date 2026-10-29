// 成績指標

/** 最大ドローダウン（0〜1、例: 0.25 = 高値から 25% 下落） */
export function maxDrawdown(equity: readonly number[]): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const v of equity) {
    peak = Math.max(peak, v);
    if (peak > 0) mdd = Math.max(mdd, (peak - v) / peak);
  }
  return mdd;
}

export function returnRate(start: number, end: number): number {
  return start === 0 ? 0 : end / start - 1;
}

/** 年率換算シャープレシオ（無リスク金利 0 とする） */
export function sharpeRatio(equity: readonly number[], periodsPerYear = 250): number {
  if (equity.length < 3) return 0;
  const rets = equity.slice(1).map((v, i) => v / equity[i] - 1);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1));
  return sd === 0 ? 0 : (mean / sd) * Math.sqrt(periodsPerYear);
}

export type Rank = { label: string; minReturn: number };

const RANKS: readonly Rank[] = [
  { label: '伝説の相場師', minReturn: 1.0 },
  { label: '凄腕トレーダー', minReturn: 0.5 },
  { label: '一流投資家', minReturn: 0.2 },
  { label: '堅実な投資家', minReturn: 0.05 },
  { label: '見習い投資家', minReturn: -0.05 },
  { label: '修行が必要', minReturn: -0.3 },
  { label: '退場寸前', minReturn: -Infinity },
];

export function rankFor(ret: number): string {
  return RANKS.find((r) => ret >= r.minReturn)!.label;
}
