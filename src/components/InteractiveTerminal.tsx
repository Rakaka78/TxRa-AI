import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TermIcon,
  Play,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Download,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { MarketAsset, TradingSignal, TerminalLine, AIModelEngine, BacktestResult } from '../types';
import { soundManager } from '../lib/sound';
import { BACKTEST_PRESETS } from '../data/mockMarket';

interface InteractiveTerminalProps {
  assets: MarketAsset[];
  signals: TradingSignal[];
  models: AIModelEngine[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onExecuteTrade?: (signal: TradingSignal) => void;
}

const COMMAND_SUGGESTIONS = [
  'help',
  'signals',
  'signals gold',
  'signals crypto',
  'signals forex',
  'analyze XAUUSD',
  'analyze BTCUSD',
  'analyze EURUSD',
  'analyze NAS100',
  'quote XAUUSD',
  'quote BTCUSD',
  'scan',
  'scan crypto',
  'scan forex',
  'backtest XAUUSD',
  'backtest BTCUSD',
  'risk 10000 1 20',
  'models',
  'news',
  'clear',
  'export',
];

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  assets,
  signals,
  models,
  activeSymbol,
  onSelectSymbol,
  onExecuteTrade,
}) => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial banner on mount
  useEffect(() => {
    const initialLines: TerminalLine[] = [
      {
        id: 'init-banner',
        kind: 'banner',
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: 'init-sys',
        kind: 'system',
        text: 'ZOQIRA Core OS [Version 2.4.0-PRO] (x86_64-institutional)\nConnected to neural latency nodes in Tokyo, New York, Frankfurt.\nType "help" to see available terminal commands or "signals" for active setups.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
    setLines(initialLines);
  }, []);

  // Auto scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll]);

  // Keep input focused
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Autocomplete on Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    soundManager.playKeypress();

    if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim().toLowerCase();
      if (!current) return;
      const match = COMMAND_SUGGESTIONS.find((cmd) => cmd.toLowerCase().startsWith(current));
      if (match) {
        setInputVal(match);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(history[nextIndex]);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSubmit(inputVal);
    }
  };

  // Command Execution Router
  const handleCommandSubmit = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    soundManager.playEnter();

    // Add to history
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');

    const timestamp = new Date().toLocaleTimeString();
    const cmdLine: TerminalLine = {
      id: `in-${Date.now()}`,
      kind: 'input',
      command: cmd,
      timestamp,
    };

    setLines((prev) => [...prev, cmdLine]);

    const parts = cmd.split(' ').filter(Boolean);
    const primary = parts[0].toLowerCase();
    const arg1 = parts[1]?.toUpperCase();
    const arg2 = parts[2];
    const arg3 = parts[3];

    // Clear command
    if (primary === 'clear' || primary === 'cls') {
      setLines([]);
      soundManager.playSuccess();
      return;
    }

    // Help command
    if (primary === 'help') {
      setLines((prev) => [
        ...prev,
        {
          id: `help-${Date.now()}`,
          kind: 'help',
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Signals command
    if (primary === 'signals' || primary === 'signal') {
      let filtered = [...signals];
      if (arg1) {
        const cat = arg1.toLowerCase();
        filtered = signals.filter(
          (s) =>
            s.category.toLowerCase() === cat ||
            s.symbol.toUpperCase().includes(arg1)
        );
      }
      setLines((prev) => [
        ...prev,
        {
          id: `sig-${Date.now()}`,
          kind: 'signals_table',
          data: filtered,
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Models command
    if (primary === 'models' || primary === 'model') {
      setLines((prev) => [
        ...prev,
        {
          id: `models-${Date.now()}`,
          kind: 'models',
          data: models,
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Quote / Price command
    if (primary === 'quote' || primary === 'price') {
      const sym = arg1 || activeSymbol;
      const asset = assets.find((a) => a.symbol.toUpperCase() === sym);
      if (!asset) {
        setLines((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            kind: 'error',
            text: `Asset symbol "${sym}" not found in current watch matrix. Try XAUUSD, BTCUSD, EURUSD, NAS100.`,
            timestamp,
          },
        ]);
        soundManager.playAlert();
        return;
      }

      onSelectSymbol(asset.symbol);
      setLines((prev) => [
        ...prev,
        {
          id: `quote-${Date.now()}`,
          kind: 'quote',
          data: asset,
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Scan command
    if (primary === 'scan') {
      const category = arg1 ? arg1.toLowerCase() : 'all';
      setLines((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          kind: 'system',
          text: `[SCANNING] Running quantitative filters across ${category.toUpperCase()} instruments...\nScanning 15M/1H order block mitigation, RSI momentum divergence, volume delta...`,
          timestamp,
        },
      ]);

      setTimeout(() => {
        const matching = signals.filter((s) =>
          category === 'all' ? true : s.category === category
        );
        setLines((prev) => [
          ...prev,
          {
            id: `scan-res-${Date.now()}`,
            kind: 'signals_table',
            data: matching,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        soundManager.playSuccess();
      }, 700);
      return;
    }

    // Backtest command
    if (primary === 'backtest') {
      const sym = arg1 || activeSymbol;
      const preset = BACKTEST_PRESETS[sym] || BACKTEST_PRESETS['XAUUSD'];
      setLines((prev) => [
        ...prev,
        {
          id: `bt-${Date.now()}`,
          kind: 'backtest',
          data: preset,
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Risk calculator command: risk <balance> <risk%> <stop_loss_pips>
    if (primary === 'risk' || primary === 'calc') {
      const balance = parseFloat(arg1) || 10000;
      const riskPct = parseFloat(arg2) || 1.0;
      const pips = parseFloat(arg3) || 20;

      const riskUsd = (balance * riskPct) / 100;
      // Pip value for standard lot = $10 / pip
      const lotSize = (riskUsd / (pips * 10)).toFixed(2);

      setLines((prev) => [
        ...prev,
        {
          id: `risk-${Date.now()}`,
          kind: 'risk',
          data: {
            balance,
            riskPct,
            pips,
            riskUsd,
            lotSize,
          },
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // News command
    if (primary === 'news') {
      const newsItems = [
        { title: 'US Federal Reserve holds rates steady; signals quantitative easing shift', impact: 'HIGH', time: '12m ago' },
        { title: 'Gold surges to near all-time high amid safe-haven institutional inflows', impact: 'HIGH', time: '28m ago' },
        { title: 'Bitcoin ETFs record +$480M net institutional inflow in single trading session', impact: 'HIGH', time: '1h ago' },
        { title: 'ECB comments point to potential 25bps rate reduction next month', impact: 'MEDIUM', time: '2h ago' },
      ];
      setLines((prev) => [
        ...prev,
        {
          id: `news-${Date.now()}`,
          kind: 'output',
          text: `=== BREAKING INSTITUTIONAL WIRE ===\n` +
            newsItems.map((n) => `[${n.impact}] ${n.title} (${n.time})`).join('\n'),
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Export command
    if (primary === 'export') {
      const logText = lines
        .map((l) => `[${l.timestamp}] ${l.kind.toUpperCase()}: ${l.text || l.command || JSON.stringify(l.data || '')}`)
        .join('\n');
      const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zoqira_terminal_log_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      setLines((prev) => [
        ...prev,
        {
          id: `exp-${Date.now()}`,
          kind: 'success',
          text: `Terminal session log downloaded successfully.`,
          timestamp,
        },
      ]);
      soundManager.playSuccess();
      return;
    }

    // Analyze command OR Natural Language AI Prompting!
    const targetSymbol = primary === 'analyze' && arg1 ? arg1 : activeSymbol;
    const isExplicitAnalyze = primary === 'analyze';
    const targetAsset = assets.find((a) => a.symbol.toUpperCase() === targetSymbol.toUpperCase()) || assets[0];

    onSelectSymbol(targetAsset.symbol);
    setIsLoadingAI(true);

    const loadingId = `load-${Date.now()}`;
    setLines((prev) => [
      ...prev,
      {
        id: loadingId,
        kind: 'system',
        text: `[ZOQIRA NEURAL ENGINE] Synthesizing orderbook depth, SMC liquidity zones & multi-agent consensus for ${targetAsset.symbol}...`,
        timestamp,
      },
    ]);

    try {
      const response = await fetch('/api/terminal/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: isExplicitAnalyze ? undefined : cmd,
          symbol: targetAsset.symbol,
          currentPrice: targetAsset.price,
          technicals: {
            rsi: targetAsset.rsi,
            macd: targetAsset.macd,
            ema20: targetAsset.ema20,
            ema50: targetAsset.ema50,
            ema200: targetAsset.ema200,
            trend: targetAsset.trend,
          },
        }),
      });

      const json = await response.json();
      setIsLoadingAI(false);

      if (json && json.analysis) {
        setLines((prev) => [
          ...prev.filter((l) => l.id !== loadingId),
          {
            id: `ai-${Date.now()}`,
            kind: 'analysis',
            text: json.analysis,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        soundManager.playSuccess();
      } else {
        throw new Error('No analysis data received');
      }
    } catch (err: any) {
      setIsLoadingAI(false);
      setLines((prev) => [
        ...prev.filter((l) => l.id !== loadingId),
        {
          id: `err-${Date.now()}`,
          kind: 'error',
          text: `Unable to query AI engine: ${err.message || 'Server timeout'}.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      soundManager.playAlert();
    }
  };

  // Quick Action Pill Click
  const handleQuickCommand = (cmd: string) => {
    handleCommandSubmit(cmd);
  };

  // Copy trade setup to clipboard
  const handleCopyTrade = (signal: TradingSignal) => {
    const text = `ZOQIRA SIGNAL: ${signal.symbol} (${signal.direction})\nENTRY: ${signal.entryPrice}\nSL: ${signal.stopLoss}\nTP1: ${signal.tp1}\nTP2: ${signal.tp2}\nTP3: ${signal.tp3}\nR:R: ${signal.riskReward}\nCONFIDENCE: ${signal.confidenceScore}%`;
    navigator.clipboard.writeText(text);
    setCopiedId(signal.id);
    soundManager.playSuccess();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      onClick={handleTerminalClick}
      className="flex flex-col h-full bg-[#080a0e] border border-[#1d222b] rounded-xl overflow-hidden shadow-2xl font-mono-term text-xs select-text cursor-text"
    >
      {/* Terminal Top Window Titlebar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1c212a] bg-[#0c0e14] select-none">
        <div className="flex items-center gap-2">
          {/* Mac-style traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80 hover:opacity-100 transition-opacity"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80 hover:opacity-100 transition-opacity"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80 hover:opacity-100 transition-opacity"></span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
            <TermIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>ZOQIRA TERMINAL &bull; zoqira@pro:~$</span>
          </div>
        </div>

        {/* Terminal Window Action Controls */}
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playKeypress();
              setAutoScroll(!autoScroll);
            }}
            title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
            className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
              autoScroll
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-gray-700 text-gray-500'
            }`}
          >
            Auto-Scroll
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCommandSubmit('clear');
            }}
            title="Clear terminal screen"
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCommandSubmit('export');
            }}
            title="Export session logs"
            className="p-1 rounded hover:bg-white/10 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Scrollable Stream Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin">
        {lines.map((line) => {
          if (line.kind === 'banner') {
            return (
              <div key={line.id} className="text-amber-400/90 whitespace-pre font-bold leading-tight py-2 border-b border-[#1b2029]">
{`   _______  ____  ____  ________  ___      ___
  /       // __ \\/ __ \\/  _/ __ \\/   |    /   |
 / /  / / / / / / / / // // /_/ / /| |   / /| |
/ /  / / / /_/ / /_/ // // _, _/ ___ |  / ___ |
\\/__/\\__/ \\____/\\___\\_\\___/_/ |_/_/  |_| /_/  |_|
  [ INSTITUTIONAL QUANTITATIVE TRADING TERMINAL ]
  [ VERSION 2.4.0 • GOLD • FOREX • CRYPTO • INDICES ]`}
              </div>
            );
          }

          if (line.kind === 'input') {
            return (
              <div key={line.id} className="flex items-center gap-2 text-gray-200">
                <span className="text-amber-400 font-bold">zoqira@pro:~$</span>
                <span className="text-white font-semibold">{line.command}</span>
                <span className="text-[10px] text-gray-500 ml-auto font-normal">{line.timestamp}</span>
              </div>
            );
          }

          if (line.kind === 'system') {
            return (
              <div key={line.id} className="text-cyan-400/90 whitespace-pre-wrap pl-2 border-l-2 border-cyan-500/40 py-0.5">
                {line.text}
              </div>
            );
          }

          if (line.kind === 'error') {
            return (
              <div key={line.id} className="flex items-start gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded p-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="whitespace-pre-wrap">{line.text}</div>
              </div>
            );
          }

          if (line.kind === 'success') {
            return (
              <div key={line.id} className="text-emerald-400 pl-2 border-l-2 border-emerald-500/40">
                {line.text}
              </div>
            );
          }

          if (line.kind === 'help') {
            return (
              <div key={line.id} className="bg-[#0f1219] border border-[#212735] rounded-lg p-3 text-gray-300 space-y-2.5">
                <div className="text-amber-400 font-bold flex items-center gap-1.5 border-b border-[#212735] pb-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>ZOQIRA COMMAND REFERENCE</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-amber-300 font-bold">signals [market]</span>
                    <p className="text-gray-400">List live signals (e.g. signals gold, signals crypto)</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">analyze &lt;symbol&gt;</span>
                    <p className="text-gray-400">Deep AI SMC order flow breakdown (e.g. analyze XAUUSD)</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">quote &lt;symbol&gt;</span>
                    <p className="text-gray-400">Instant price quote & technical indicators</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">scan [category]</span>
                    <p className="text-gray-400">Scan markets for high probability setups</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">backtest &lt;symbol&gt;</span>
                    <p className="text-gray-400">Run institutional backtest & Sharpe ratio</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">risk &lt;bal&gt; &lt;risk%&gt; &lt;pips&gt;</span>
                    <p className="text-gray-400">Position size / lot size calculator (e.g. risk 10000 1 20)</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">models</span>
                    <p className="text-gray-400">Check Grok, Claude, GPT-4, DeepSeek status</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">news</span>
                    <p className="text-gray-400">Live institutional financial headlines</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">clear</span>
                    <p className="text-gray-400">Clear terminal screen</p>
                  </div>
                  <div>
                    <span className="text-amber-300 font-bold">export</span>
                    <p className="text-gray-400">Download session logs to text file</p>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 pt-1 border-t border-[#212735]">
                  💡 Tip: You can also type natural language questions directly into this terminal.
                </div>
              </div>
            );
          }

          if (line.kind === 'quote') {
            const a = line.data as MarketAsset;
            return (
              <div key={line.id} className="bg-[#0e1117] border border-amber-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1f2633] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{a.symbol}</span>
                    <span className="text-gray-400">{a.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>Price: <span className="text-white font-bold">{a.price.toFixed(a.digits)}</span></div>
                  <div>24h High: <span className="text-emerald-400">{a.high24h.toFixed(a.digits)}</span></div>
                  <div>24h Low: <span className="text-rose-400">{a.low24h.toFixed(a.digits)}</span></div>
                  <div>24h Vol: <span className="text-gray-300">{a.volume24h}</span></div>
                  <div>RSI (14): <span className="text-amber-300">{a.rsi.toFixed(1)}</span></div>
                  <div>EMA (20): <span className="text-gray-300">{a.ema20.toFixed(a.digits)}</span></div>
                  <div>EMA (50): <span className="text-gray-300">{a.ema50.toFixed(a.digits)}</span></div>
                  <div>Trend: <span className={a.trend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>{a.trend}</span></div>
                </div>
              </div>
            );
          }

          if (line.kind === 'signals_table') {
            const list = line.data as TradingSignal[];
            return (
              <div key={line.id} className="space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-[#212735] pb-1">
                  <span>ACTIVE HIGH-PROBABILITY SIGNALS ({list.length})</span>
                  <span className="text-[10px] text-gray-500">REAL-TIME CONSENSUS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {list.map((sig) => {
                    const isBuy = sig.direction.includes('BUY');
                    return (
                      <div
                        key={sig.id}
                        className="bg-[#0d1017] border border-[#212735] hover:border-amber-500/40 rounded-lg p-2.5 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{sig.symbol}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {sig.direction}
                            </span>
                            <span className="text-[10px] text-gray-400">{sig.timeframe}</span>
                          </div>
                          <span className="text-amber-400 font-bold text-xs">{sig.confidenceScore}% WIN</span>
                        </div>

                        {/* Trade Parameters Matrix */}
                        <div className="grid grid-cols-4 gap-1 text-[10px] bg-[#07090c] p-1.5 rounded border border-[#181d26]">
                          <div>
                            <span className="text-gray-500 block">ENTRY</span>
                            <span className="font-bold text-white">{sig.entryPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">SL</span>
                            <span className="font-bold text-rose-400">{sig.stopLoss}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">TP1</span>
                            <span className="font-bold text-emerald-400">{sig.tp1}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">R:R</span>
                            <span className="font-bold text-amber-300">{sig.riskReward}</span>
                          </div>
                        </div>

                        {/* SMC Liquidity rationale */}
                        <div className="text-[10px] text-gray-400 line-clamp-2">
                          <span className="text-cyan-400 font-medium">SMC: </span>
                          {sig.reason}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#1a1f29]">
                          <span className="text-[10px] text-gray-500">{sig.timestamp}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyTrade(sig)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] transition-all"
                            >
                              {copiedId === sig.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === sig.id ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              onClick={() => {
                                onSelectSymbol(sig.symbol);
                                handleCommandSubmit(`analyze ${sig.symbol}`);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-semibold border border-amber-500/30 transition-all"
                            >
                              Analyze
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (line.kind === 'models') {
            const modelList = line.data as AIModelEngine[];
            return (
              <div key={line.id} className="bg-[#0e1117] border border-[#222836] rounded-lg p-3 space-y-2">
                <div className="text-amber-400 font-bold border-b border-[#222836] pb-1">
                  PROP-AI MULTI-MODEL QUANT ENGINES
                </div>
                <div className="space-y-2">
                  {modelList.map((m) => (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-[#080a0e] rounded border border-[#1b2029]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{m.name}</span>
                          <span className="text-[10px] text-cyan-400 border border-cyan-500/30 px-1 rounded">{m.provider}</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {m.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">{m.role}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <div>Accuracy: <span className="text-emerald-400 font-bold">{m.accuracy}</span></div>
                        <div>Latency: <span className="text-amber-300 font-bold">{m.latencyMs}ms</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (line.kind === 'backtest') {
            const bt = line.data as BacktestResult;
            return (
              <div key={line.id} className="bg-[#0d1017] border border-[#232938] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#232938] pb-1.5">
                  <div>
                    <span className="font-bold text-amber-400 text-sm">BACKTEST SIMULATION: {bt.symbol}</span>
                    <span className="text-gray-400 text-[10px] block">{bt.strategy} ({bt.period})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    +{bt.netProfitPercent}% PROFIT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#07090d] p-2 rounded border border-[#1a202c]">
                  <div>Win Rate: <span className="text-emerald-400 font-bold">{bt.winRate}%</span></div>
                  <div>Total Trades: <span className="text-white font-bold">{bt.totalTrades}</span></div>
                  <div>Profit Factor: <span className="text-amber-300 font-bold">{bt.profitFactor}</span></div>
                  <div>Sharpe Ratio: <span className="text-cyan-400 font-bold">{bt.sharpeRatio}</span></div>
                  <div>Max Drawdown: <span className="text-rose-400 font-bold">{bt.maxDrawdown}%</span></div>
                  <div>Wins / Losses: <span className="text-gray-300">{bt.winningTrades}W / {bt.losingTrades}L</span></div>
                </div>

                <div className="text-[10px] text-gray-400">
                  <span className="text-white font-bold block mb-1">Recent Executed Simulation Trades:</span>
                  <div className="space-y-1">
                    {bt.trades.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-[#11141c] px-2 py-1 rounded">
                        <span className={t.type === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>{t.type} @ {t.entry}</span>
                        <span>Exit: {t.exit}</span>
                        <span className={t.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                        </span>
                        <span className="text-gray-500">{t.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (line.kind === 'risk') {
            const r = line.data;
            return (
              <div key={line.id} className="bg-[#0e1219] border border-amber-500/30 rounded-lg p-3 space-y-2">
                <div className="text-amber-400 font-bold border-b border-[#212735] pb-1">
                  POSITION SIZING & RISK SPECIFICATION
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>Account Balance: <span className="text-white font-bold">${r.balance.toLocaleString()}</span></div>
                  <div>Risk Percentage: <span className="text-amber-400 font-bold">{r.riskPct}%</span></div>
                  <div>Stop Loss Pips: <span className="text-rose-400 font-bold">{r.pips} pips</span></div>
                  <div>Max Loss in USD: <span className="text-rose-400 font-bold">${r.riskUsd.toFixed(2)}</span></div>
                  <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/30 p-1 rounded">
                    Recommended Lot Size: <span className="text-amber-300 font-black text-sm">{r.lotSize} Lots</span>
                  </div>
                </div>
              </div>
            );
          }

          if (line.kind === 'analysis') {
            return (
              <div key={line.id} className="bg-[#0b0e14] border border-[#252c3c] rounded-lg p-3 text-gray-200 space-y-2 shadow-inner">
                <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-[#212735] pb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ZOQIRA AI INSTITUTIONAL REASONING</span>
                  <span className="text-[10px] text-gray-500 ml-auto font-normal">{line.timestamp}</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans text-gray-300">
                  {line.text}
                </div>
              </div>
            );
          }

          return (
            <div key={line.id} className="text-gray-300 whitespace-pre-wrap">
              {line.text}
            </div>
          );
        })}

        {isLoadingAI && (
          <div className="flex items-center gap-2 text-amber-400 py-1 font-mono-term">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Neural engines thinking & computing liquidity sweeps...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Command Action Pills */}
      <div className="px-3 py-1.5 border-t border-[#1b2029] bg-[#0c0e14] flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none">
        <span className="text-[10px] text-gray-500 font-bold uppercase shrink-0">QUICK:</span>
        <button
          onClick={() => handleQuickCommand('signals')}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ signals ]
        </button>
        <button
          onClick={() => handleQuickCommand(`analyze ${activeSymbol}`)}
          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] border border-amber-500/30 shrink-0 transition-all font-semibold"
        >
          [ analyze {activeSymbol} ]
        </button>
        <button
          onClick={() => handleQuickCommand('scan gold')}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ scan gold ]
        </button>
        <button
          onClick={() => handleQuickCommand('scan crypto')}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ scan crypto ]
        </button>
        <button
          onClick={() => handleQuickCommand(`quote ${activeSymbol}`)}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ quote {activeSymbol} ]
        </button>
        <button
          onClick={() => handleQuickCommand(`backtest ${activeSymbol}`)}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ backtest ]
        </button>
        <button
          onClick={() => handleQuickCommand('risk 10000 1 20')}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ risk calc ]
        </button>
        <button
          onClick={() => handleQuickCommand('models')}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-gray-300 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ models ]
        </button>
        <button
          onClick={() => handleQuickCommand('clear')}
          className="px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-gray-400 text-[10px] border border-white/10 shrink-0 transition-all"
        >
          [ clear ]
        </button>
      </div>

      {/* Terminal Command Input Box */}
      <div className="p-2 border-t border-[#1c212a] bg-[#090b10] flex items-center gap-2">
        <span className="text-amber-400 font-bold shrink-0 flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
          <span>zoqira@pro:~$</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type a command ("help", "signals", "analyze XAUUSD") or prompt AI directly...'
          className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none font-mono-term text-xs"
        />
        <button
          onClick={() => handleCommandSubmit(inputVal)}
          disabled={!inputVal.trim()}
          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] disabled:opacity-40 disabled:hover:bg-amber-500 transition-all flex items-center gap-1 shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span className="hidden sm:inline">Exec</span>
        </button>
      </div>
    </div>
  );
};
