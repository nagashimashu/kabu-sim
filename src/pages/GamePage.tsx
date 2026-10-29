import { useEffect, useState } from 'react';
import { GAME_DAYS, INITIAL_CASH, dataIndex, getMarket, useGame } from '../store/game';
import { REGIME_LABELS, dayToDate } from '../engine/market';
import { changeClass, pct, yen } from '../format';
import StockList from '../components/StockList';
import PriceChart from '../components/PriceChart';
import OrderPanel from '../components/OrderPanel';
import PortfolioPanel from '../components/PortfolioPanel';
import NewsFeed from '../components/NewsFeed';

const AUTO_PLAY_MS = 800;

// スマホ幅（lg 未満）ではタブで 1 パネルずつ表示する
type Tab = 'list' | 'chart' | 'order' | 'portfolio' | 'news';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'list', label: '銘柄', icon: '☰' },
  { id: 'chart', label: 'チャート', icon: '📈' },
  { id: 'order', label: '注文', icon: '¥' },
  { id: 'portfolio', label: '保有', icon: '💼' },
  { id: 'news', label: 'ニュース', icon: '📰' },
];

export default function GamePage() {
  const { seed, day, equity, portfolio, nextDay, toTitle } = useGame();
  const market = getMarket(seed);
  const [autoPlay, setAutoPlay] = useState(false);
  const [tab, setTab] = useState<Tab>('chart');
  const pane = (t: Tab) => `min-w-0 flex-col lg:flex [&>section]:flex-1 ${tab === t ? 'flex' : 'hidden'}`;
  const toChart = () => setTab('chart');

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(nextDay, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [autoPlay, nextDay]);

  const total = equity[equity.length - 1] ?? INITIAL_CASH;
  const ret = total / INITIAL_CASH - 1;
  const i = dataIndex(day);
  const indexValue = market.index[i];
  const indexChange = indexValue / market.index[i - 1] - 1;
  const badges: Partial<Record<Tab, string | null>> = {
    portfolio: Object.keys(portfolio.positions).length ? String(Object.keys(portfolio.positions).length) : null,
    news: market.news.some((n) => n.day === i) ? 'NEW' : null,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-3 pb-20 sm:p-4 sm:pb-20 lg:pb-4">
      <header className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div>
          <div className="text-xs text-slate-400">
            {dayToDate(i)}・シード {seed}
          </div>
          <div className="font-semibold">
            {day} / {GAME_DAYS} 日目
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">総資産</div>
          <div className="font-semibold">
            {yen(total)} <span className={`text-sm ${changeClass(ret)}`}>{pct(ret)}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">カブシム指数</div>
          <div className="font-semibold">
            {indexValue.toFixed(2)} <span className={`text-sm ${changeClass(indexChange)}`}>{pct(indexChange)}</span>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="text-xs text-slate-400">地合い</div>
          <div className="font-semibold">{REGIME_LABELS[market.regimes[i]]}</div>
        </div>

        <div className="ml-auto flex gap-2">
          <button className="btn bg-slate-800 hover:bg-slate-700" onClick={toTitle}>
            中断
          </button>
          <button
            className={`btn ${autoPlay ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700'}`}
            onClick={() => setAutoPlay((v) => !v)}
          >
            {autoPlay ? '■ 停止' : '▶▶ 自動'}
          </button>
          <button className="btn bg-red-500 text-white hover:bg-red-400" onClick={nextDay}>
            次の日へ ▶
          </button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[260px_1fr_280px]">
        <div className={pane('list')}>
          <StockList onSelect={toChart} />
        </div>
        <div className={pane('chart')}>
          <PriceChart />
        </div>
        <div className={pane('order')}>
          <OrderPanel />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
        <div className={pane('portfolio')}>
          <PortfolioPanel onSelect={toChart} />
        </div>
        <div className={pane('news')}>
          <NewsFeed />
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-slate-800 bg-slate-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              tab === t.id ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
            {badges[t.id] && (
              <span className="absolute right-[18%] top-1 rounded-full bg-amber-500 px-1 text-[9px] font-semibold leading-tight text-slate-950">
                {badges[t.id]}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
