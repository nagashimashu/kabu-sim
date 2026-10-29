export const yen = (n: number) => `¥${Math.round(n).toLocaleString('ja-JP')}`;

export const signedYen = (n: number) => `${n > 0 ? '+' : n < 0 ? '-' : ''}${yen(Math.abs(n))}`;

export const pct = (r: number, digits = 2) => `${r > 0 ? '+' : ''}${(r * 100).toFixed(digits)}%`;

// 日本の証券サイトに合わせて上昇=赤、下落=青
export const UP_COLOR = '#ef4444';
export const DOWN_COLOR = '#3b82f6';

export const changeClass = (v: number) => (v > 0 ? 'text-red-400' : v < 0 ? 'text-blue-400' : 'text-slate-400');
