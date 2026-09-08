import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InteractiveTerminal } from './components/InteractiveTerminal';
import { TradingChart } from './components/TradingChart';
import { MarketWatch } from './components/MarketWatch';
import { SignalsPanel } from './components/SignalsPanel';
import { AIModelsPanel } from './components/AIModelsPanel';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { INITIAL_ASSETS, INITIAL_SIGNALS, AI_MODELS } from './data/mockMarket';
import { MarketAsset, TradingSignal } from './types';
import { soundManager } from './lib/sound';

export default function App() {
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [signals, setSignals] = useState<TradingSignal[]>(INITIAL_SIGNALS);
  const [activeSymbol, setActiveSymbol] = useState<string>('XAUUSD');
  const [activeTab, setActiveTab] = useState<string>('terminal');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [crtEffect, setCrtEffect] = useState<boolean>(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState<boolean>(false);

  // Live real-time tick simulation (simulates live market data ticks)
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prev) => {
        return prev.map((asset) => {
          // Micro tick: 30% chance each asset ticks
          if (Math.random() > 0.35) return asset;

          const pctChange = (Math.random() - 0.49) * 0.0008;
          const newPrice = asset.price * (1 + pctChange);
          const diff = newPrice - asset.price;

          return {
            ...asset,
            price: newPrice,
            change24h: asset.change24h + pctChange * 10,
            high24h: Math.max(asset.high24h, newPrice),
            low24h: Math.min(asset.low24h, newPrice),
            rsi: Math.min(88, Math.max(22, asset.rsi + (Math.random() - 0.5) * 0.4)),
          };
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const activeAsset = assets.find((a) => a.symbol === activeSymbol) || assets[0];
  const activeSignal = signals.find((s) => s.symbol === activeSymbol);

  const handleSelectSymbol = (symbol: string) => {
    setActiveSymbol(symbol);
  };

  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.enabled = !next;
  };

  const handleAnalyzeSymbol = (symbol: string) => {
    setActiveSymbol(symbol);
    setActiveTab('terminal');
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#07080b] text-[#e2e8f0] ${crtEffect ? 'crt-effect' : ''}`}>
      {/* Top Global Navigation & Ticker Header */}
      <Header
        assets={assets}
        activeSymbol={activeSymbol}
        onSelectSymbol={handleSelectSymbol}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        crtEffect={crtEffect}
        onToggleCrt={() => setCrtEffect(!crtEffect)}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col">
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
            {/* Left Watchlist (Hidden on mobile or stacked) */}
            <div className="lg:col-span-3 h-[280px] lg:h-[calc(100vh-130px)]">
              <MarketWatch
                assets={assets}
                activeSymbol={activeSymbol}
                onSelectSymbol={handleSelectSymbol}
                onAnalyzeSymbol={handleAnalyzeSymbol}
              />
            </div>

            {/* Center: Interactive Real-Time Terminal */}
            <div className="lg:col-span-5 h-[520px] lg:h-[calc(100vh-130px)]">
              <InteractiveTerminal
                assets={assets}
                signals={signals}
                models={AI_MODELS}
                activeSymbol={activeSymbol}
                onSelectSymbol={handleSelectSymbol}
              />
            </div>

            {/* Right: Live Trading Candlestick Chart & Signal Highlights */}
            <div className="lg:col-span-4 flex flex-col gap-3 h-[480px] lg:h-[calc(100vh-130px)]">
              <div className="flex-1 min-h-[320px]">
                <TradingChart
                  asset={activeAsset}
                  activeSignal={activeSignal}
                  onQuickAnalyze={handleAnalyzeSymbol}
                />
              </div>

              {/* Active Signal Quick Glance */}
              {activeSignal && (
                <div className="bg-[#0b0e14] border border-amber-500/30 rounded-xl p-3 font-mono-term text-xs space-y-2 shadow-lg shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{activeSignal.symbol}</span>
                      <span className="text-[10px] text-gray-400">({activeSignal.assetName})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeSignal.direction.includes('BUY') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {activeSignal.direction} &bull; {activeSignal.confidenceScore}% WIN
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] bg-[#07080c] p-2 rounded border border-[#161a23]">
                    <div>
                      <span className="text-gray-500 text-[10px] block">ENTRY</span>
                      <span className="font-bold text-white">{activeSignal.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">SL</span>
                      <span className="font-bold text-rose-400">{activeSignal.stopLoss}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">TP1</span>
                      <span className="font-bold text-emerald-400">{activeSignal.tp1}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 line-clamp-2">
                    <span className="text-cyan-400 font-semibold">Edge: </span>
                    {activeSignal.reason}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="flex-1 h-[calc(100vh-130px)]">
            <SignalsPanel
              signals={signals}
              onSelectSymbol={handleSelectSymbol}
              onAnalyzeSymbol={handleAnalyzeSymbol}
            />
          </div>
        )}

        {activeTab === 'models' && (
          <div className="flex-1 h-[calc(100vh-130px)]">
            <AIModelsPanel
              models={AI_MODELS}
              onTriggerAnalyze={(model) => {
                setActiveTab('terminal');
              }}
            />
          </div>
        )}
      </main>

      {/* Risk Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        activeSymbol={activeSymbol}
      />
    </div>
  );
}
