import { getMarket, pricesAt, useGame } from '../store/game';
import { marketValue } from '../engine/broker';
import { changeClass, pct, signedYen, yen } from '../format';

export default function PortfolioPanel({ onSelect }: { onSelect?: () => void }) {
  const { seed, day, portfolio, select } = useGame();
  const market = getMarket(seed);
  const prices = pricesAt(market, day);
  const positions = Object.entries(portfolio.positions);
  const realized = portfolio.trades.reduce((sum, t) => sum + (t.realized ?? 0), 0);

  return (
    <section className="panel overflow-hidden">
      <h2 className="panel-title">ポートフォリオ</h2>
      <div className="grid grid-cols-3 gap-2 border-b border-slate-800 px-3 py-2 text-sm">
        <div>
          <div className="text-xs text-slate-400">現金</div>
          {yen(portfolio.cash)}
        </div>
        <div>
          <div className="text-xs text-slate-400">株式評価額</div>
          {yen(marketValue(portfolio, prices))}
        </div>
        <div>
          <div className="text-xs text-slate-400">実現損益</div>
          <span className={changeClass(realized)}>{signedYen(realized)}</span>
        </div>
      </div>

      {positions.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">保有銘柄はありません。銘柄を選んで買ってみましょう。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-normal">
                <th className="text-left">銘柄</th>
                <th className="text-right">株数</th>
                <th className="text-right">取得単価</th>
                <th className="text-right">現在値</th>
                <th className="text-right">評価額</th>
                <th className="text-right">評価損益</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(([id, pos]) => {
                const s = market.stocks.find((x) => x.id === id)!;
                const value = pos.shares * prices[id];
                const pnl = value - pos.avgCost * pos.shares;
                return (
                  <tr
                    key={id}
                    onClick={() => {
                      select(id);
                      onSelect?.();
                    }}
                    className="cursor-pointer border-t border-slate-800/60 hover:bg-slate-800/60 [&>td]:px-3 [&>td]:py-2"
                  >
                    <td>{s.name}</td>
                    <td className="text-right">{pos.shares.toLocaleString()}</td>
                    <td className="text-right">{pos.avgCost.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}</td>
                    <td className="text-right">{prices[id].toLocaleString()}</td>
                    <td className="text-right">{yen(value)}</td>
                    <td className={`text-right ${changeClass(pnl)}`}>
                      {signedYen(pnl)}
                      <div className="text-xs">{pct(prices[id] / pos.avgCost - 1)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
