// 架空銘柄マスタ。mu: 年率期待リターン、sigma: 年率ボラティリティ、beta: 市場連動度

export type Sector = 'tech' | 'finance' | 'consumer' | 'energy' | 'health' | 'industrial';

export const SECTOR_LABELS: Record<Sector, string> = {
  tech: 'テクノロジー',
  finance: '金融',
  consumer: '消費財',
  energy: 'エネルギー',
  health: 'ヘルスケア',
  industrial: '工業',
};

export type StockDef = {
  id: string;
  code: string;
  name: string;
  sector: Sector;
  initialPrice: number;
  mu: number;
  sigma: number;
  beta: number;
};

export const STOCKS: readonly StockDef[] = [
  { id: 'NOVA', code: '9101', name: 'ノヴァ半導体', sector: 'tech', initialPrice: 4200, mu: 0.12, sigma: 0.45, beta: 1.5 },
  { id: 'CLDX', code: '9102', name: 'クラウデックス', sector: 'tech', initialPrice: 2850, mu: 0.1, sigma: 0.38, beta: 1.3 },
  { id: 'SKBK', code: '8201', name: 'さくら銀行', sector: 'finance', initialPrice: 1150, mu: 0.04, sigma: 0.22, beta: 1.1 },
  { id: 'TKSE', code: '8202', name: '東京証券ホールディングス', sector: 'finance', initialPrice: 980, mu: 0.05, sigma: 0.3, beta: 1.4 },
  { id: 'MRFD', code: '2301', name: 'みらいフーズ', sector: 'consumer', initialPrice: 3600, mu: 0.05, sigma: 0.16, beta: 0.6 },
  { id: 'HKRT', code: '2302', name: 'ひかりリテール', sector: 'consumer', initialPrice: 1820, mu: 0.06, sigma: 0.24, beta: 0.9 },
  { id: 'AOEN', code: '5001', name: 'あおぞらエナジー', sector: 'energy', initialPrice: 2400, mu: 0.06, sigma: 0.32, beta: 0.8 },
  { id: 'MDCR', code: '4501', name: 'メディクロス製薬', sector: 'health', initialPrice: 5100, mu: 0.08, sigma: 0.34, beta: 0.7 },
  { id: 'YMTH', code: '6301', name: 'やまと重工', sector: 'industrial', initialPrice: 1560, mu: 0.05, sigma: 0.26, beta: 1.0 },
  { id: 'SORA', code: '7201', name: 'ソラ・モビリティ', sector: 'industrial', initialPrice: 760, mu: 0.15, sigma: 0.55, beta: 1.2 },
];
