import { useState } from 'react';
import { GAME_DAYS, INITIAL_CASH, useGame } from '../store/game';
import { randomSeed } from '../engine/rng';
import { yen } from '../format';

export default function TitlePage() {
  const { startGame, resume, seed: savedSeed, day } = useGame();
  // ?seed=XXXX で共有された相場を再現できる
  const [seed, setSeed] = useState(() => new URLSearchParams(location.search).get('seed') ?? randomSeed());
  const hasSave = savedSeed !== '' && day > 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-4 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          カブ<span className="text-red-400">シム</span>
        </h1>
        <p className="mt-2 text-slate-400">架空の株式市場で、{GAME_DAYS}営業日のうちに資産を増やせ</p>
      </header>

      <section className="panel space-y-4 p-5">
        <ul className="space-y-1 text-sm text-slate-300">
          <li>・初期資金 {yen(INITIAL_CASH)}、架空の10銘柄を売買</li>
          <li>・「次の日へ」で1営業日進む。注文はその日の終値で約定</li>
          <li>・売買は100株単位、手数料は約定代金の0.1%（最低100円）</li>
          <li>・ニュースが株価を大きく動かすことがある</li>
        </ul>

        <label className="block">
          <span className="text-xs text-slate-400">相場シード（同じシードなら同じ相場）</span>
          <div className="mt-1 flex gap-2">
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value.toUpperCase())}
              maxLength={16}
              className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono tracking-widest"
            />
            <button className="btn bg-slate-800 hover:bg-slate-700" onClick={() => setSeed(randomSeed())}>
              ランダム
            </button>
          </div>
        </label>

        <button
          className="btn w-full bg-red-500 py-2.5 text-base text-white hover:bg-red-400"
          disabled={!seed.trim()}
          onClick={() => startGame(seed.trim())}
        >
          新しくはじめる
        </button>
        {hasSave && (
          <button className="btn w-full bg-slate-800 py-2.5 text-base hover:bg-slate-700" onClick={resume}>
            続きから（シード {savedSeed}・{day}日目）
          </button>
        )}
      </section>

      <p className="text-center text-xs text-slate-500">
        本ゲームは架空の市場によるシミュレーションであり、投資助言ではありません。
      </p>
    </main>
  );
}
