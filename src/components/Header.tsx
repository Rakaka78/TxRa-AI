import React from 'react';
import { Volume2, VolumeX, Terminal as TerminalIcon, Sparkles, Activity, ShieldCheck, Zap, SlidersHorizontal } from 'lucide-react';
import { MarketAsset } from '../types';
import { soundManager } from '../lib/sound';

interface HeaderProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  activeSymbol: string;
  isMuted: boolean;
  onToggleSound: () => void;
  crtEffect: boolean;
  onToggleCrt: () => void;
  onOpenRiskCalc: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  assets,
  onSelectSymbol,
  activeSymbol,
  isMuted,
  onToggleSound,
  crtEffect,
  onToggleCrt,
  onOpenRiskCalc,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-[#1f242d] bg-[#0c0e12]/95 backdrop-blur sticky top-0 z-40">
      {/* Top Ticker Bar */}
      <div className="border-b border-[#171b22] px-3 py-1.5 bg-[#08090b] flex items-center justify-between text-xs overflow-x-auto select-none">
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE TICKERS</span>
          </div>

          {assets.map((asset) => {
            const isSelected = asset.symbol === activeSymbol;
            const isUp = asset.change24h >= 0;
            return (
              <button
                key={asset.symbol}
                onClick={() => {
                  soundManager.playKeypress();
                  onSelectSymbol(asset.symbol);
                }}
                className={`flex items-center gap-2 px-2 py-0.5 rounded transition-all font-mono-term ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <span className="font-semibold text-gray-200">{asset.symbol}</span>
                <span className="text-gray-300">
                  {asset.price >= 1000
                    ? asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.digits, maximumFractionDigits: asset.digits })
                    : asset.price.toFixed(asset.digits)}
                </span>
                <span className={`text-[10px] font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{asset.change24h.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Telemetry */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-gray-400 pl-4 border-l border-[#1f242d] whitespace-nowrap">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            4/4 AI ENGINES
          </span>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-1 text-amber-300/90 font-mono-term">
            <Activity className="w-3 h-3 text-amber-400" />
            14ms LATENCY
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300 font-medium font-mono-term">
            WIN RATE: <span className="text-emerald-400 font-bold">89.4%</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-amber-400/90 font-mono-term text-[10px] border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10">
            PRO INSTITUTIONAL
          </span>
        </div>
      </div>

      {/* Main Branding & Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          {/* Logo Emblem: 3D Metallic Gold/Silver Shield with Candle chart & spark */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#24211a] via-[#15171b] to-[#0a0a0c] border border-amber-500/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/10 group cursor-pointer">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-amber-500/10 via-transparent to-white/10 pointer-events-none"></div>
            {/* Custom SVG Emblem matching Zoqira's gold & silver brand mark */}
            <svg viewBox="0 0 48 48" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
              {/* Outer orbit arcs */}
              <path d="M 8 24 A 16 16 0 0 1 40 24" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="32 10" />
              <path d="M 40 24 A 16 16 0 0 1 8 24" fill="none" stroke="url(#silverGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="32 10" />
              
              {/* Rising Candlestick bars in gold */}
              <rect x="16" y="24" width="3" height="8" rx="0.5" fill="#D4AF37" opacity="0.8" />
              <line x1="17.5" y1="20" x2="17.5" y2="34" stroke="#D4AF37" strokeWidth="1" />
              
              <rect x="22" y="19" width="3" height="11" rx="0.5" fill="#F5C86A" />
              <line x1="23.5" y1="16" x2="23.5" y2="32" stroke="#F5C86A" strokeWidth="1" />

              <rect x="28" y="14" width="3" height="13" rx="0.5" fill="#FFE082" />
              <line x1="29.5" y1="11" x2="29.5" y2="29" stroke="#FFE082" strokeWidth="1" />

              {/* Bold Z monogram with sharp bevel */}
              <path d="M 15 14 L 33 14 L 18 34 L 35 34" fill="none" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Starburst Spark at top-right peak */}
              <circle cx="34" cy="13" r="2.2" fill="#FFFFFF" />
              <line x1="34" y1="8" x2="34" y2="18" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="29" y1="13" x2="39" y2="13" stroke="#FFFFFF" strokeWidth="1.2" />

              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF1B8" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#997A15" />
                </linearGradient>
                <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#C0C5CE" />
                  <stop offset="100%" stopColor="#64748B" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Typography */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-brand font-black text-xl tracking-[0.18em] bg-gradient-to-r from-[#FFFFFF] via-[#E2E8F0] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">
                ZOQIRA
              </span>
              <span className="text-[10px] font-mono-term font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PRO v2.4
              </span>
            </div>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase font-mono-term hidden sm:block">
              AI-POWERED TRADING INTELLIGENCE &bull; REAL-TIME TERMINAL
            </p>
          </div>
        </div>

        {/* Center / Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#13171e] p-1 rounded-xl border border-[#212733]">
          <button
            onClick={() => {
              soundManager.playKeypress();
              setActiveTab('terminal');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'terminal'
                ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Interactive Terminal</span>
          </button>

          <button
            onClick={() => {
              soundManager.playKeypress();
              setActiveTab('signals');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'signals'
                ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Signals Feed</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px]">
              6 Active
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playKeypress();
              setActiveTab('models');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hidden md:flex ${
              activeTab === 'models'
                ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Brains</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Risk Calculator Trigger */}
          <button
            onClick={() => {
              soundManager.playKeypress();
              onOpenRiskCalc();
            }}
            title="Position Size / Risk Calculator"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#262c37] bg-[#12151b] hover:bg-[#1a1f27] text-gray-300 hover:text-amber-300 text-xs font-mono-term transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Risk Calc</span>
          </button>

          {/* CRT effect toggle */}
          <button
            onClick={() => {
              soundManager.playKeypress();
              onToggleCrt();
            }}
            title="Toggle CRT Scanline Effect"
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              crtEffect
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                : 'border-[#262c37] bg-[#12151b] text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="font-mono-term text-[11px] font-bold">CRT</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (isMuted) soundManager.playKeypress();
            }}
            title={isMuted ? 'Unmute Terminal Audio' : 'Mute Terminal Audio'}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              !isMuted
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-[#262c37] bg-[#12151b] text-gray-400 hover:text-gray-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
