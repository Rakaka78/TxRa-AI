/**
 * ZOQIRA AI Trading Terminal - Core Type Definitions
 */

export type AssetCategory = 'gold' | 'crypto' | 'forex' | 'indices' | 'stocks';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  changeAmount: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  spread: number;
  digits: number;
}

export type SignalDirection = 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
export type SignalStatus = 'ACTIVE' | 'TARGET 1 HIT' | 'TARGET 2 HIT' | 'TARGET 3 HIT' | 'STOPPED' | 'EXPIRED';

export interface ModelConsensus {
  grok: number; // 0-100 confidence
  claude: number;
  gpt4: number;
  deepseek: number;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  assetName: string;
  category: AssetCategory;
  direction: SignalDirection;
  timeframe: '5M' | '15M' | '1H' | '4H' | '1D';
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: string;
  confidenceScore: number;
  modelConsensus: ModelConsensus;
  status: SignalStatus;
  timestamp: string;
  reason: string;
  liquidityZone: string;
  fairValueGap: string;
  pipsGain?: number;
}

export type TerminalOutputKind = 
  | 'input'
  | 'system'
  | 'output'
  | 'error'
  | 'success'
  | 'warning'
  | 'signal'
  | 'signals_table'
  | 'quote'
  | 'analysis'
  | 'backtest'
  | 'models'
  | 'risk'
  | 'help'
  | 'banner';

export interface TerminalLine {
  id: string;
  kind: TerminalOutputKind;
  text?: string;
  data?: any;
  timestamp: string;
  command?: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: string;
  timeframe: string;
  period: string;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  maxDrawdown: number;
  netProfitPercent: number;
  sharpeRatio: number;
  trades: {
    id: number;
    type: 'LONG' | 'SHORT';
    entry: number;
    exit: number;
    pnl: number;
    date: string;
  }[];
}

export interface AIModelEngine {
  id: string;
  name: string;
  model: string;
  provider: string;
  role: string;
  accuracy: string;
  latencyMs: number;
  status: 'ONLINE' | 'STANDBY' | 'SYNCING';
  lastSignal: string;
}
