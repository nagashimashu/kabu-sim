import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { HISTORY_DAYS, INITIAL_CASH, dataIndex, getMarket, useGame } from '../store/game';
import { dayToDate } from '../engine/market';
import { maxDrawdown, rankFor, returnRate, sharpeRatio } from '../engine/scoring';
import { changeClass, pct, signedYen, yen } from '../format';

export default function ResultPage() {
  const { seed, day, equity, portfolio, startGame, toTitle } = useGame();
  const market = getMarket(seed);
  const final = equity[equity.length - 1];
  const ret = returnRate(INITIAL_CASH, final);
  const indexRet = market.index[dataIndex(day)] / 1000 - 1;
  const [copied, setCopied] = useState(false);

  const chartEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chart = createChart(chartEl.current!, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { visible: false }, horzLines: { color: '#1e293b' } },
      localization: { locale: 'ja-JP' },
    });
    // 資産と指数をどちらも開始時 = 100 に揃えて比較
    chart
      .addLineSeries({ color: '#ef4444', lineWidth: 2, title: 'あなた' })
      .setData(equity.map((v, d) => ({ time: dayToDate(HISTORY_DAYS + d), value: (v / INITIAL_CASH) * 100 })));
    chart
      .addLineSeries({ color: '#64748b', lineWidth: 1, title: '指数' })
      .setData(equity.map((_, d) => ({ time: dayToDate(HISTORY_DAYS + d), value: market.index[dataIndex(d)] / 10 })));
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [equity, market]);

  const shareUrl = `${location.origin}${location.pathname}?seed=${encodeURIComponent(seed)}`;

  const stats: [string, string, string?][] = [
    ['最終資産', yen(final)],
    ['損益', signedYen(final - INITIAL_CASH), changeClass(ret)],
    ['リターン', pct(ret), changeClass(ret)],
    ['指数リターン', pct(indexRet), changeClass(indexRet)],
    ['最大ドローダウン', pct(-maxDrawdown(equity)), 'text-blue-400'],
    ['シャープレシオ', sharpeRatio(equity).toFixed(2)],
    ['取引回数', `${portfolio.trades.length}回`],
    ['支払手数料', yen(portfolio.trades.reduce((s, t) => s + t.fee, 0))],
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <header className="text-center">
        <p className="text-sm text-slate-400">シード {seed}・{day}営業日の成績</p>
        <h1 className="mt-1 text-3xl font-bold">{rankFor(ret)}</h1>
        <p className={`mt-2 text-lg ${ret >= indexRet ? 'text-red-400' : 'text-slate-400'}`}>
          {ret >= indexRet ? '指数に勝ちました！' : '指数には届きませんでした'}
        </p>
      </header>

      <section className="panel grid grid-cols-2 gap-px overflow-hidden bg-slate-800 sm:grid-cols-4">
        {stats.map(([label, value, cls]) => (
          <div key={label} className="bg-slate-900 p-3">
            <div className="text-xs text-slate-400">{label}</div>
            <div className={`font-semibold ${cls ?? ''}`}>{value}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2 className="panel-title">資産推移（開始時 = 100）</h2>
        <div ref={chartEl} className="h-64" />
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn bg-red-500 text-white hover:bg-red-400" onClick={() => startGame(seed)}>
          同じ相場で再挑戦
        </button>
        <button
          className="btn bg-slate-800 hover:bg-slate-700"
          onClick={() => navigator.clipboard.writeText(shareUrl).then(() => setCopied(true))}
        >
          {copied ? 'コピーしました' : 'この相場のURLをコピー'}
        </button>
        <button className="btn bg-slate-800 hover:bg-slate-700" onClick={toTitle}>
          タイトルへ
        </button>
      </div>
    </main>
  );
}
