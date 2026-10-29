// ニュースイベント。発生日に株価をジャンプさせ、その後数日かけて余波（ドリフト）を残す。

import type { Rng } from './rng';
import { SECTOR_LABELS, type Sector, type StockDef } from '../data/stocks';

export type EventScope = 'stock' | 'sector' | 'market';

type EventTemplate = {
  scope: EventScope;
  /** {name} / {sector} を置換 */
  text: string;
  /** 発生日の対数リターン（平均） */
  jump: number;
  /** 余波の 1 日あたり対数リターン */
  drift: number;
  /** 余波の日数 */
  days: number;
};

const TEMPLATES: readonly EventTemplate[] = [
  { scope: 'stock', text: '{name}、決算が市場予想を大幅に上回る', jump: 0.08, drift: 0.004, days: 5 },
  { scope: 'stock', text: '{name}、通期業績予想を上方修正', jump: 0.06, drift: 0.003, days: 5 },
  { scope: 'stock', text: '{name}、画期的な新製品を発表', jump: 0.05, drift: 0.005, days: 6 },
  { scope: 'stock', text: '{name}、大手企業との業務提携を発表', jump: 0.04, drift: 0.002, days: 4 },
  { scope: 'stock', text: '{name}、自社株買いを発表', jump: 0.03, drift: 0.002, days: 5 },
  { scope: 'stock', text: '{name}、決算が市場予想を下回る', jump: -0.08, drift: -0.004, days: 5 },
  { scope: 'stock', text: '{name}、業績予想を下方修正', jump: -0.07, drift: -0.003, days: 5 },
  { scope: 'stock', text: '{name}で不正会計の疑い、第三者委員会を設置', jump: -0.15, drift: -0.006, days: 7 },
  { scope: 'stock', text: '{name}、大規模リコールを発表', jump: -0.06, drift: -0.003, days: 4 },
  { scope: 'stock', text: '{name}の経営陣が交代、先行き不透明感', jump: -0.03, drift: -0.002, days: 3 },
  { scope: 'sector', text: '{sector}セクターに追い風、政府が支援策を発表', jump: 0.04, drift: 0.003, days: 5 },
  { scope: 'sector', text: '{sector}セクターで規制強化の動き', jump: -0.04, drift: -0.003, days: 5 },
  { scope: 'sector', text: '{sector}セクターの需要が急拡大との調査結果', jump: 0.03, drift: 0.002, days: 4 },
  { scope: 'market', text: '中央銀行が利下げを決定、市場に安心感', jump: 0.025, drift: 0.002, days: 5 },
  { scope: 'market', text: '中央銀行が予想外の利上げ、株式市場に動揺', jump: -0.03, drift: -0.002, days: 5 },
  { scope: 'market', text: '海外市場が急落、リスク回避の売りが広がる', jump: -0.04, drift: -0.003, days: 4 },
  { scope: 'market', text: '景気指標が予想を上回り、買いが優勢に', jump: 0.02, drift: 0.001, days: 3 },
];

// 1 営業日あたりの発生確率
const PROBABILITY: Record<EventScope, number> = { stock: 0.06, sector: 0.015, market: 0.01 };

export type NewsItem = {
  day: number;
  text: string;
  scope: EventScope;
  /** 影響を受ける銘柄 ID */
  targets: string[];
  /** 好材料なら true */
  positive: boolean;
};

export type ActiveEffect = { targets: string[]; drift: number; remaining: number };

/** その日のイベントを抽選し、ニュースと各銘柄への対数リターンの寄与を返す */
export function rollEvents(
  rng: Rng,
  day: number,
  stocks: readonly StockDef[],
  active: ActiveEffect[],
): { news: NewsItem[]; impact: Record<string, number>; active: ActiveEffect[] } {
  const impact: Record<string, number> = {};
  const add = (ids: string[], v: number) => ids.forEach((id) => (impact[id] = (impact[id] ?? 0) + v));

  // 既存の余波を適用
  const nextActive: ActiveEffect[] = [];
  for (const e of active) {
    add(e.targets, e.drift);
    if (e.remaining > 1) nextActive.push({ ...e, remaining: e.remaining - 1 });
  }

  const news: NewsItem[] = [];
  for (const scope of ['market', 'sector', 'stock'] as const) {
    if (rng.next() >= PROBABILITY[scope]) continue;
    const t = rng.pick(TEMPLATES.filter((x) => x.scope === scope));

    let targets: string[];
    let text = t.text;
    if (scope === 'stock') {
      const s = rng.pick(stocks);
      targets = [s.id];
      text = text.replace('{name}', s.name);
    } else if (scope === 'sector') {
      const sector: Sector = rng.pick(stocks).sector;
      targets = stocks.filter((s) => s.sector === sector).map((s) => s.id);
      text = text.replace('{sector}', SECTOR_LABELS[sector]);
    } else {
      targets = stocks.map((s) => s.id);
    }

    // 影響の大きさは毎回ばらつかせる（0.5〜1.5 倍）
    const scale = 0.5 + rng.next();
    add(targets, t.jump * scale);
    nextActive.push({ targets, drift: t.drift * scale, remaining: t.days });
    news.push({ day, text, scope, targets, positive: t.jump > 0 });
  }

  return { news, impact, active: nextActive };
}
