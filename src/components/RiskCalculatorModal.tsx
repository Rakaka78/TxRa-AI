import React, { useState } from 'react';
import { X, ShieldCheck, DollarSign, Percent, ArrowRight } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol: string;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  activeSymbol,
}) => {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [stopLossPips, setStopLossPips] = useState<number>(25);
  const [leverage, setLeverage] = useState<number>(100);

  if (!isOpen) return null;

  const riskAmount = (balance * riskPercent) / 100;
  // Standard forex/gold lot: 1 pip = ~$10 for 1 standard lot
  const isGold = activeSymbol.includes('XAU') || activeSymbol.includes('GOLD');
  const pipValuePerLot = isGold ? 10 : 10;
  const calculatedLots = stopLossPips > 0 ? (riskAmount / (stopLossPips * pipValuePerLot)).toFixed(2) : '0.00';
  const positionValue = (parseFloat(calculatedLots) * 100000).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1117] border border-[#232936] rounded-2xl max-w-md w-full p-5 shadow-2xl font-mono-term text-xs space-y-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2330] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">INSTITUTIONAL POSITION SIZER</h3>
              <p className="text-[10px] text-gray-400">Fixed Fractional Risk Model &bull; {activeSymbol}</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playKeypress();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 block mb-1">Account Balance ($ USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#131620] border border-[#232936] rounded-lg pl-7 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 block mb-1">Risk Percentage (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#131620] border border-[#232936] rounded-lg pl-3 pr-7 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500/50"
                />
                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
              </div>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">Stop Loss Distance (Pips)</label>
              <input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#131620] border border-[#232936] rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Account Leverage</label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full bg-[#131620] border border-[#232936] rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value={30}>1:30 (Tier 1 Regulated)</option>
              <option value={50}>1:50 (Standard)</option>
              <option value={100}>1:100 (Institutional)</option>
              <option value={200}>1:200 (High Alpha)</option>
              <option value={500}>1:500 (Prop Firm Classic)</option>
            </select>
          </div>
        </div>

        {/* Computation Results */}
        <div className="bg-[#090b10] border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Capital at Risk:</span>
            <span className="font-bold text-rose-400 text-sm">${riskAmount.toFixed(2)} USD</span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-2">
            <span className="text-gray-400">Position Notional Value:</span>
            <span className="text-gray-200 font-medium">${positionValue} USD</span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-2 bg-amber-500/10 -mx-4 -mb-4 p-4 rounded-b-xl border-t border-amber-500/20">
            <div>
              <span className="text-amber-400 font-bold block text-[11px]">RECOMMENDED LOT SIZE</span>
              <span className="text-[10px] text-gray-400">Exact contract volume to execute</span>
            </div>
            <div className="text-2xl font-black text-amber-300 tracking-tight">
              {calculatedLots} <span className="text-xs font-normal text-amber-400">Lots</span>
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={() => {
            soundManager.playKeypress();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shadow-amber-500/20"
        >
          Done & Return to Terminal
        </button>
      </div>
    </div>
  );
};
