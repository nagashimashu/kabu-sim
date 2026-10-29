import { useEffect, useState } from 'react';
import { getMarket, pricesAt, useGame } from '../store/game';
import { LOT_SIZE, calcFee, maxBuyable } from '../engine/broker';
import { yen } from '../format';

type Message = { kind: 'ok' | 'error'; text: string };

export default function OrderPanel() {
  const { seed, day, selectedId, portfolio, placeOrder } = useGame();
  const market = getMarket(seed);
  const stock = market.stocks.find((s) => s.id === selectedId)!;
  const price = pricesAt(market, day)[selectedId];
  const held = portfolio.positions[selectedId]?.shares ?? 0;
  const buyable = maxBuyable(portfolio.cash, price);

  const [shares, setShares] = useState(LOT_SIZE);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => setMessage(null), [selectedId, day]);

  const amount = shares * price;
  const fee = shares > 0 ? calcFee(amount) : 0;

  const order = (side: 'buy' | 'sell') => {
    const error = placeOrder(side, shares);
    setMessage(
      error
        ? { kind: 'error', text: error }
        : { kind: 'ok', text: `${stock.name}を${shares.toLocaleString()}株${side === 'buy' ? '買い' : '売り'}ました` },
    );
  };

  return (
    <section className="panel">
      <h2 className="panel-title">注文（成行・終値で約定）</h2>
      <div className="space-y-3 p-3">
        <div className="text-sm">
          <div className="font-semibold">{stock.name}</div>
          <div className="text-slate-400">
            株価 {price.toLocaleString()}円・保有 {held.toLocaleString()}株
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-slate-400">株数（{LOT_SIZE}株単位）</span>
          <input
            type="number"
            min={LOT_SIZE}
            step={LOT_SIZE}
            value={shares}
            onChange={(e) => setShares(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-right"
          />
        </label>

        <div className="grid grid-cols-4 gap-1 text-xs">
          {[100, 1000].map((n) => (
            <button key={n} className="btn bg-slate-800 px-1 hover:bg-slate-700" onClick={() => setShares((v) => v + n)}>
              +{n.toLocaleString()}
            </button>
          ))}
          <button className="btn bg-slate-800 px-1 hover:bg-slate-700" onClick={() => setShares(buyable)}>
            最大買
          </button>
          <button className="btn bg-slate-800 px-1 hover:bg-slate-700" onClick={() => setShares(held)}>
            全株
          </button>
        </div>

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">概算約定代金</dt>
            <dd>{yen(amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">手数料</dt>
            <dd>{yen(fee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">買付余力</dt>
            <dd>{yen(portfolio.cash)}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn bg-red-500 py-2 text-white hover:bg-red-400" onClick={() => order('buy')}>
            買う
          </button>
          <button
            className="btn bg-blue-500 py-2 text-white hover:bg-blue-400"
            disabled={held === 0}
            onClick={() => order('sell')}
          >
            売る
          </button>
        </div>

        {message && (
          <p className={`text-sm ${message.kind === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>{message.text}</p>
        )}
      </div>
    </section>
  );
}
