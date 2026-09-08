import React, { useState } from 'react';
import { MarketAsset, AssetCategory } from '../types';
import { Search, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface MarketWatchProps {
  assets: MarketAsset[];
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onAnalyzeSymbol: (symbol: string) => void;
}

export const MarketWatch: React.FC<MarketWatchProps> = ({
  assets,
  activeSymbol,
  onSelectSymbol,
  onAnalyzeSymbol,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.symbol.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' ? true : a.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border border-[#1d222b] rounded-xl overflow-hidden shadow-lg font-mono-term text-xs">
      {/* Search and Category Filter Header */}
      <div className="p-2.5 border-b border-[#1a1f28] bg-[#0c0e14] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-200 font-bold">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>MARKET WATCH</span>
          </div>
          <span className="text-[10px] text-gray-500">{assets.length} ASSETS</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or name..."
            className="w-full bg-[#13161e] border border-[#212734] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[10px]">
          {['all', 'gold', 'crypto', 'forex', 'indices'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundManager.playKeypress();
                setCategory(cat);
              }}
              className={`px-2 py-0.5 rounded capitalize transition-all ${
                category === cat
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-gray-400 hover:text-gray-200 bg-[#141720]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#171b23]">
        {filtered.map((asset) => {
          const isSelected = asset.symbol === activeSymbol;
          const isUp = asset.change24h >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => {
                soundManager.playKeypress();
                onSelectSymbol(asset.symbol);
              }}
              className={`p-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.03] ${
                isSelected
                  ? 'bg-amber-500/10 border-l-2 border-amber-400'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-wide">{asset.symbol}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{asset.category}</span>
                </div>
                <div className="text-[10px] text-gray-400 truncate max-w-[130px] sm:max-w-[160px]">
                  {asset.name}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-white text-xs">
                  {asset.price >= 1000
                    ? asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.digits, maximumFractionDigits: asset.digits })
                    : asset.price.toFixed(asset.digits)}
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center justify-end ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                  {isUp ? '+' : ''}{asset.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
