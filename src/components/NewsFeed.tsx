import { dataIndex, getMarket, useGame } from '../store/game';
import { dayToDate } from '../engine/market';

const SCOPE_LABELS = { stock: '個別', sector: '業種', market: '市場' } as const;

export default function NewsFeed() {
  const { seed, day } = useGame();
  const market = getMarket(seed);
  const i = dataIndex(day);
  const items = market.news.filter((n) => n.day <= i).slice(-40).reverse();

  return (
    <section className="panel overflow-hidden">
      <h2 className="panel-title">ニュース</h2>
      <ul className="max-h-[300px] overflow-y-auto">
        {items.map((n, k) => (
          <li
            key={`${n.day}-${k}`}
            className={`border-b border-slate-800/60 px-3 py-2 text-sm ${n.day === i ? 'bg-amber-500/10' : ''}`}
          >
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{dayToDate(n.day)}</span>
              <span className="rounded bg-slate-800 px-1">{SCOPE_LABELS[n.scope]}</span>
              {n.day === i && <span className="text-amber-400">NEW</span>}
            </div>
            <div>{n.text}</div>
          </li>
        ))}
        {items.length === 0 && <li className="p-4 text-sm text-slate-500">ニュースはまだありません。</li>}
      </ul>
    </section>
  );
}
