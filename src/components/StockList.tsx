import { dataIndex, getMarket, useGame } from '../store/game';
import { changeClass, pct } from '../format';

/** onSelect: 銘柄を選んだ後の処理（スマホではチャートタブへ移動） */
export default function StockList({ onSelect }: { onSelect?: () => void }) {
  const { seed, day, selectedId, select, portfolio } = useGame();
  const market = getMarket(seed);
  const i = dataIndex(day);

  return (
    <section className="panel overflow-hidden">
      <h2 className="panel-title">銘柄一覧</h2>
      <ul className="max-h-[420px] overflow-y-auto">
        {market.stocks.map((s) => {
          const c = market.candles[s.id];
          const change = c[i].close / c[i - 1].close - 1;
          const held = portfolio.positions[s.id]?.shares;
          return (
            <li key={s.id}>
              <button
                onClick={() => {
                  select(s.id);
                  onSelect?.();
                }}
                className={`flex w-full items-center justify-between gap-2 border-b border-slate-800/60 px-3 py-2 text-left hover:bg-slate-800/60 ${
                  s.id === selectedId ? 'bg-slate-800' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    {s.name}
                    {held && <span className="ml-1 rounded bg-amber-500/20 px-1 text-[10px] text-amber-300">保有</span>}
                  </div>
                  <div className="text-xs text-slate-500">{s.code}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{c[i].close.toLocaleString()}</div>
                  <div className={`text-xs ${changeClass(change)}`}>{pct(change)}</div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
