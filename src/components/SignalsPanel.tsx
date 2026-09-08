import React, { useState } from 'react';
import { TradingSignal, AssetCategory } from '../types';
import { Zap, Copy, Check, ArrowUpRight, ArrowDownRight, Target, Shield, Clock, BarChart2 } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface SignalsPanelProps {
  signals: TradingSignal[];
  onSelectSymbol: (symbol: string) => void;
  onAnalyzeSymbol: (symbol: string) => void;
}

export const SignalsPanel: React.FC<SignalsPanelProps> = ({
  signals,
  onSelectSymbol,
  onAnalyzeSymbol,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Signals' },
    { id: 'gold', label: 'Gold & Metals' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'forex', label: 'Forex' },
    { id: 'indices', label: 'Indices' },
  ];

  const filtered = signals.filter((s) => {
    if (filter === 'all') return true;
    return s.category === filter;
  });

  const handleCopy = (s: TradingSignal) => {
    const text = `ZOQIRA PRO SIGNAL: ${s.symbol} (${s.direction})\nTIMEFRAME: ${s.timeframe}\nENTRY: ${s.entryPrice}\nSL: ${s.stopLoss}\nTP1: ${s.tp1}\nTP2: ${s.tp2}\nTP3: ${s.tp3}\nRISK/REWARD: ${s.riskReward}\nCONFIDENCE: ${s.confidenceScore}%\nSMC REASON: ${s.reason}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    soundManager.playSuccess();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border border-[#1c222b] rounded-xl overflow-hidden shadow-xl font-mono-term text-xs">
      {/* Header & Category Filters */}
      <div className="p-3 border-b border-[#1b2029] bg-[#0d1015] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white text-sm">HIGH-PROBABILITY SIGNALS FEED</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            {filtered.length} ACTIVE
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#13161d] p-0.5 rounded-lg border border-[#1f2531]">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                soundManager.playKeypress();
                setFilter(c.id);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                filter === c.id
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Signals List Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.map((sig) => {
          const isBuy = sig.direction.includes('BUY');
          return (
            <div
              key={sig.id}
              className="bg-[#0e1117] border border-[#1f2532] hover:border-amber-500/40 rounded-xl p-3.5 transition-all shadow-md space-y-3 group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                    {isBuy ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base tracking-wide">{sig.symbol}</span>
                      <span className="text-gray-400 text-[11px] font-medium hidden sm:inline">{sig.assetName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                        isBuy ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {sig.direction}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {sig.timeframe} TIMEFRAME &bull; {sig.timestamp}
                    </span>
                  </div>
                </div>

                {/* Win Confidence Badge */}
                <div className="text-right">
                  <div className="text-amber-400 font-black text-sm tracking-tight">{sig.confidenceScore}%</div>
                  <span className="text-[10px] text-gray-400">WIN CONFIDENCE</span>
                </div>
              </div>

              {/* Execution Targets Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#08090d] p-2.5 rounded-lg border border-[#181d26]">
                <div>
                  <span className="text-gray-500 text-[10px] block">OPTIMAL ENTRY</span>
                  <span className="font-bold text-white text-xs">{sig.entryPrice}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5 text-rose-400" />
                    STOP LOSS (SL)
                  </span>
                  <span className="font-bold text-rose-400 text-xs">{sig.stopLoss}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block flex items-center gap-0.5">
                    <Target className="w-2.5 h-2.5 text-emerald-400" />
                    TARGET 1 (TP1)
                  </span>
                  <span className="font-bold text-emerald-400 text-xs">{sig.tp1}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">TARGET 2 (TP2)</span>
                  <span className="font-bold text-emerald-400 text-xs">{sig.tp2}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">RISK / REWARD</span>
                  <span className="font-bold text-amber-300 text-xs">{sig.riskReward}</span>
                </div>
              </div>

              {/* Model Consensus Bar Gauges */}
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-amber-400/90 font-semibold">MULTI-MODEL CONSENSUS:</span>
                  <span>Grok: {sig.modelConsensus.grok}% | Claude: {sig.modelConsensus.claude}% | GPT-4: {sig.modelConsensus.gpt4}% | DeepSeek: {sig.modelConsensus.deepseek}%</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-gray-800">
                  <div className="bg-amber-400" style={{ width: `${sig.modelConsensus.grok}%` }}></div>
                  <div className="bg-cyan-400" style={{ width: `${sig.modelConsensus.claude}%` }}></div>
                  <div className="bg-emerald-400" style={{ width: `${sig.modelConsensus.gpt4}%` }}></div>
                  <div className="bg-purple-400" style={{ width: `${sig.modelConsensus.deepseek}%` }}></div>
                </div>
              </div>

              {/* SMC Rationale & Zones */}
              <div className="text-[11px] text-gray-300 bg-[#12151d] p-2 rounded border border-[#1d232e]">
                <span className="text-cyan-400 font-semibold block mb-0.5">Smart Money Rationale:</span>
                <p className="text-gray-300 font-sans text-xs leading-relaxed">{sig.reason}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-800">
                  <span><strong className="text-gray-300">Liquidity:</strong> {sig.liquidityZone}</span>
                  <span>&bull;</span>
                  <span><strong className="text-gray-300">FVG:</strong> {sig.fairValueGap}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>STATUS: {sig.status} {sig.pipsGain ? `(+${sig.pipsGain} pips)` : ''}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(sig)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold transition-all border border-white/10"
                  >
                    {copiedId === sig.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === sig.id ? 'Copied to Clipboard' : 'Copy Parameters'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectSymbol(sig.symbol);
                      onAnalyzeSymbol(sig.symbol);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>View & Analyze</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
