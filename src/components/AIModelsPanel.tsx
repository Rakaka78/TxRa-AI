import React from 'react';
import { AIModelEngine } from '../types';
import { Sparkles, Cpu, Activity, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

interface AIModelsPanelProps {
  models: AIModelEngine[];
  onTriggerAnalyze: (modelName: string) => void;
}

export const AIModelsPanel: React.FC<AIModelsPanelProps> = ({ models, onTriggerAnalyze }) => {
  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border border-[#1c222b] rounded-xl overflow-hidden shadow-xl font-mono-term text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#1b2029] bg-[#0d1015] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white text-sm">ZOQIRA MULTI-AGENT QUANTITATIVE ENGINE</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          CONSENSUS SYNCHRONIZED
        </span>
      </div>

      {/* Grid of AI Models */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((m) => (
          <div
            key={m.id}
            className="bg-[#0e1117] border border-[#212735] hover:border-amber-500/40 rounded-xl p-4 transition-all shadow-md space-y-3 relative overflow-hidden group"
          >
            {/* Top Accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 opacity-60"></div>

            {/* Model Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm tracking-wide">{m.name}</h4>
                  <span className="text-[10px] text-cyan-400 font-semibold">{m.provider} &bull; {m.model}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {m.status}
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">{m.latencyMs}ms Latency</span>
              </div>
            </div>

            {/* Core Specialization */}
            <div className="bg-[#080a0e] p-2.5 rounded-lg border border-[#181d26] space-y-1">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Quantitative Specialization</span>
              <p className="text-gray-200 font-sans text-xs leading-relaxed">{m.role}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#12151d] p-2 rounded">
              <div>
                <span className="text-gray-500 block text-[10px]">HISTORICAL ACCURACY</span>
                <span className="font-bold text-emerald-400 text-sm">{m.accuracy}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">LATEST HIGH-EDGE SIGNAL</span>
                <span className="font-bold text-amber-300 truncate block">{m.lastSignal}</span>
              </div>
            </div>

            {/* Sub-bar */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                Institutional Zero-Leak API
              </span>
              <span className="text-gray-400">Weights: Balanced 25%</span>
            </div>
          </div>
        ))}

        {/* Global Multi-Agent Architecture Card */}
        <div className="col-span-1 md:col-span-2 bg-[#0b0e14] border border-[#1f2633] rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>HOW ZOQIRA MULTI-MODEL CONSENSUS WORKS</span>
          </div>
          <p className="text-gray-300 font-sans leading-relaxed">
            Unlike retail indicators that lag price action, Zoqira synthesizes four distinct neural weights simultaneously.
            Grok calculates social alpha and macro sentiment velocity; Claude 3.7 validates Smart Money Structure and Fair Value Gaps;
            GPT-4o computes cumulative volume delta (CVD) orderbook imbalances; and DeepSeek-R1 enforces mathematical expectancy and drawdown risk bounds.
            Signals are only broadcast when <strong>&gt;88% cross-model consensus</strong> is achieved.
          </p>
        </div>
      </div>
    </div>
  );
};
