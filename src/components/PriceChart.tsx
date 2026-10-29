import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { dataIndex, getMarket, useGame } from '../store/game';
import { dayToDate } from '../engine/market';
import { SECTOR_LABELS } from '../data/stocks';
import { DOWN_COLOR, UP_COLOR, changeClass, pct } from '../format';

export default function PriceChart() {
  const { seed, day, selectedId } = useGame();
  const market = getMarket(seed);
  const stock = market.stocks.find((s) => s.id === selectedId)!;
  const i = dataIndex(day);
  const candles = market.candles[selectedId];
  const today = candles[i];
  const change = today.close / candles[i - 1].close - 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // チャートは一度だけ生成
  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155' },
      localization: { locale: 'ja-JP' },
    });
    candleRef.current = chart.addCandlestickSeries({
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });
    volumeRef.current = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '' });
    volumeRef.current.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    chartRef.current = chart;
    return () => chart.remove();
  }, []);

  // 今日までのデータだけを渡す（未来は見せない）
  useEffect(() => {
    const visible = candles.slice(0, i + 1);
    candleRef.current!.setData(visible.map((c, d) => ({ time: dayToDate(d), ...c })));
    volumeRef.current!.setData(
      visible.map((c, d) => ({
        time: dayToDate(d),
        value: c.volume,
        color: c.close >= c.open ? `${UP_COLOR}55` : `${DOWN_COLOR}55`,
      })),
    );
  }, [candles, i]);

  // 銘柄を切り替えたら直近 90 日を表示
  useEffect(() => {
    chartRef.current!.timeScale().setVisibleLogicalRange({ from: i - 90, to: i + 3 });
  }, [selectedId]);

  return (
    <section className="panel flex min-h-[360px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-slate-800 px-3 py-2">
        <h2 className="font-semibold">
          {stock.name} <span className="text-xs text-slate-500">{stock.code}</span>
        </h2>
        <span className="text-xl font-semibold">{today.close.toLocaleString()}円</span>
        <span className={`text-sm ${changeClass(change)}`}>
          {change >= 0 ? '+' : ''}
          {(today.close - candles[i - 1].close).toLocaleString()}（{pct(change)}）
        </span>
        <span className="text-xs text-slate-400">
          {SECTOR_LABELS[stock.sector]}・β {stock.beta.toFixed(1)}
        </span>
      </div>
      <div ref={containerRef} className="min-h-[300px] flex-1" />
    </section>
  );
}
