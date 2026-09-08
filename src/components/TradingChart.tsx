import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MarketAsset, Candle, TradingSignal } from '../types';
import { generateCandles } from '../data/mockMarket';
import { soundManager } from '../lib/sound';
import { TrendingUp, TrendingDown, Maximize2, Minimize2, Layers, BarChart2, Sparkles, X } from 'lucide-react';
import { TradingViewWidget } from './TradingViewWidget';

interface TradingChartProps {
  asset: MarketAsset;
  activeSignal?: TradingSignal;
  onQuickAnalyze?: (symbol: string) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  asset,
  activeSignal,
  onQuickAnalyze,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartEngine, setChartEngine] = useState<'tradingview' | 'prop'>('tradingview');
  const [goldProvider, setGoldProvider] = useState<'TVC:GOLD' | 'OANDA:XAUUSD' | 'FOREXCOM:XAUUSD' | 'COMEX:GC1!'>('TVC:GOLD');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<'5M' | '15M' | '1H' | '4H' | '1D'>('15M');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [hoverData, setHoverData] = useState<{ candle: Candle; x: number; y: number } | null>(null);
  const [showEMA, setShowEMA] = useState(true);

  // Initialize candles for the asset
  useEffect(() => {
    const generated = generateCandles(asset.price, 65, asset.category === 'crypto' ? 0.005 : 0.002);
    setCandles(generated);
  }, [asset.symbol, timeframe]);

  // Live price tick simulation: update last candle with live asset price
  useEffect(() => {
    if (candles.length === 0) return;
    setCandles((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.close = asset.price;
      last.high = Math.max(last.high, asset.price);
      last.low = Math.min(last.low, asset.price);
      copy[copy.length - 1] = last;
      return copy;
    });
  }, [asset.price]);

  // EMA Calculation helper
  const ema20 = useMemo(() => {
    if (candles.length < 20) return [];
    const k = 2 / (20 + 1);
    const ema: number[] = [];
    let prevEma = candles[0].close;
    candles.forEach((c, idx) => {
      if (idx === 0) {
        ema.push(prevEma);
      } else {
        const val = c.close * k + prevEma * (1 - k);
        ema.push(val);
        prevEma = val;
      }
    });
    return ema;
  }, [candles]);

  const ema50 = useMemo(() => {
    if (candles.length < 30) return [];
    const k = 2 / (50 + 1);
    const ema: number[] = [];
    let prevEma = candles[0].close;
    candles.forEach((c, idx) => {
      if (idx === 0) {
        ema.push(prevEma);
      } else {
        const val = c.close * k + prevEma * (1 - k);
        ema.push(val);
        prevEma = val;
      }
    });
    return ema;
  }, [candles]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, width, height);

    // Padding margins
    const paddingTop = 30;
    const paddingBottom = 45;
    const paddingRight = 65; // Price scale
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Determine min and max price
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Also factor in active signal TP and SL if present
    if (activeSignal && activeSignal.symbol === asset.symbol) {
      minPrice = Math.min(minPrice, activeSignal.stopLoss * 0.999);
      maxPrice = Math.max(maxPrice, activeSignal.tp2 * 1.001);
    }

    const priceMargin = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice;

    // Helper mapping functions
    const getY = (price: number) => {
      return paddingTop + (1 - (price - minPrice) / priceRange) * chartHeight;
    };

    const candleWidth = Math.max(4, (chartWidth / candles.length) * 0.72);
    const candleSpacing = chartWidth / candles.length;

    // Draw Grid Lines
    ctx.strokeStyle = '#161b24';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal Price grid lines
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (priceRange * i) / gridSteps;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price label on right axis
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        p >= 1000 ? p.toFixed(1) : p.toFixed(asset.digits),
        chartWidth + 6,
        y + 3
      );
    }

    // Vertical time grid lines
    for (let i = 0; i < candles.length; i += 10) {
      const x = i * candleSpacing + candleSpacing / 2;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Volume Bars at bottom
    const volMaxHeight = 45;
    candles.forEach((c, idx) => {
      const x = idx * candleSpacing + (candleSpacing - candleWidth) / 2;
      const volHeight = (c.volume / (maxVol || 1)) * volMaxHeight;
      const isUp = c.close >= c.open;
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)';
      ctx.fillRect(x, height - paddingBottom - volHeight, candleWidth, volHeight);
    });

    // Draw Candlesticks
    candles.forEach((c, idx) => {
      const x = idx * candleSpacing + (candleSpacing - candleWidth) / 2;
      const centerX = x + candleWidth / 2;
      const isUp = c.close >= c.open;

      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      const topBody = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

      const candleColor = isUp ? '#10b981' : '#ef4444';

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX, yHigh);
      ctx.lineTo(centerX, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = candleColor;
      ctx.fillRect(x, topBody, candleWidth, bodyHeight);
    });

    // Draw EMA Lines if enabled
    if (showEMA) {
      // EMA 20 (Gold / Amber)
      if (ema20.length > 0) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ema20.forEach((val, idx) => {
          const x = idx * candleSpacing + candleSpacing / 2;
          const y = getY(val);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // EMA 50 (Cyan)
      if (ema50.length > 0) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ema50.forEach((val, idx) => {
          const x = idx * candleSpacing + candleSpacing / 2;
          const y = getY(val);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }

    // Active Signal Lines (TP, SL, Entry)
    if (activeSignal && activeSignal.symbol === asset.symbol) {
      // Stop Loss line (Red)
      const slY = getY(activeSignal.stopLoss);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, slY);
      ctx.lineTo(chartWidth, slY);
      ctx.stroke();

      // Label SL
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(`SL: ${activeSignal.stopLoss}`, 8, slY - 4);

      // Entry line (Gold)
      const entryY = getY(activeSignal.entryPrice);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      ctx.fillStyle = '#eab308';
      ctx.fillText(`ENTRY: ${activeSignal.entryPrice}`, 8, entryY - 4);

      // TP 1 line (Emerald)
      const tp1Y = getY(activeSignal.tp1);
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, tp1Y);
      ctx.lineTo(chartWidth, tp1Y);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.fillText(`TP1: ${activeSignal.tp1}`, 8, tp1Y - 4);

      ctx.setLineDash([]);
    }

    // Current Price Pulsing Line
    const currentY = getY(asset.price);
    const isBull = asset.change24h >= 0;
    const priceColor = isBull ? '#10b981' : '#ef4444';

    ctx.strokeStyle = priceColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(chartWidth, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price badge on right axis
    ctx.fillStyle = priceColor;
    ctx.fillRect(chartWidth, currentY - 10, paddingRight, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      asset.price >= 1000 ? asset.price.toFixed(1) : asset.price.toFixed(asset.digits),
      chartWidth + paddingRight / 2,
      currentY + 3.5
    );

    // Crosshair if hover
    if (hoverData) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical
      ctx.beginPath();
      ctx.moveTo(hoverData.x, paddingTop);
      ctx.lineTo(hoverData.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, hoverData.y);
      ctx.lineTo(chartWidth, hoverData.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, asset.price, hoverData, showEMA, activeSignal, asset.symbol]);

  // Handle Mouse Movement for crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width - 65;
    if (x >= 0 && x <= chartWidth) {
      const candleSpacing = chartWidth / candles.length;
      const index = Math.min(candles.length - 1, Math.max(0, Math.floor(x / candleSpacing)));
      setHoverData({
        candle: candles[index],
        x: index * candleSpacing + candleSpacing / 2,
        y,
      });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <>
      <div ref={containerRef} className="flex flex-col h-full bg-[#0a0c10] border border-[#1d222b] rounded-xl overflow-hidden shadow-lg">
        {/* Chart Top Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#1b2029] bg-[#0d1015]">
          {/* Symbol Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide font-mono-term">{asset.symbol}</span>
              <span className="text-xs text-amber-300/90 font-medium hidden sm:inline">
                {asset.symbol === 'XAUUSD' ? 'CFDs on Gold (US$ / OZ)' : asset.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono-term">
              <span className="text-sm font-bold text-white">
                {asset.price >= 1000
                  ? asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.digits, maximumFractionDigits: asset.digits })
                  : asset.price.toFixed(asset.digits)}
              </span>
              <span
                className={`text-xs font-semibold flex items-center ${
                  asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Engine Selector & Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Chart Engine Switcher */}
            <div className="flex items-center bg-[#131720] p-0.5 rounded-lg border border-[#202735]">
              <button
                onClick={() => {
                  soundManager.playKeypress();
                  setChartEngine('tradingview');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono-term rounded transition-all ${
                  chartEngine === 'tradingview'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>TradingView</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playKeypress();
                  setChartEngine('prop');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono-term rounded transition-all ${
                  chartEngine === 'prop'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>ZOQIRA SMC</span>
              </button>
            </div>

            {/* If Gold & TradingView, Provider selector */}
            {chartEngine === 'tradingview' && (asset.symbol === 'XAUUSD' || asset.category === 'gold') && (
              <div className="flex items-center bg-[#131720] px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px] font-mono-term">
                <span className="text-gray-400 mr-1 text-[10px] hidden md:inline">Feed:</span>
                <select
                  value={goldProvider}
                  onChange={(e) => setGoldProvider(e.target.value as any)}
                  className="bg-transparent text-amber-300 text-[11px] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="TVC:GOLD" className="bg-[#11141b] text-white">TVC:GOLD (US$ / OZ)</option>
                  <option value="OANDA:XAUUSD" className="bg-[#11141b] text-white">OANDA:XAUUSD (CFD)</option>
                  <option value="FOREXCOM:XAUUSD" className="bg-[#11141b] text-white">FOREXCOM:XAUUSD</option>
                  <option value="COMEX:GC1!" className="bg-[#11141b] text-white">COMEX:GC1! (Futures)</option>
                </select>
              </div>
            )}

            {/* Prop Engine Controls: EMA & Timeframes */}
            {chartEngine === 'prop' && (
              <>
                <button
                  onClick={() => setShowEMA(!showEMA)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono-term border transition-all ${
                    showEMA
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'text-gray-500 border-[#222834]'
                  }`}
                >
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>EMA 20/50</span>
                </button>

                <div className="flex items-center bg-[#141820] p-0.5 rounded-lg border border-[#202632]">
                  {(['5M', '15M', '1H', '4H', '1D'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        soundManager.playKeypress();
                        setTimeframe(tf);
                      }}
                      className={`px-2 py-0.5 text-[11px] font-mono-term rounded transition-all ${
                        timeframe === tf
                          ? 'bg-amber-500 text-black font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Maximize Button */}
            <button
              onClick={() => setIsMaximized(true)}
              className="p-1 rounded text-gray-400 hover:text-amber-300 hover:bg-white/10 transition-all"
              title="Maximize chart to full screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {onQuickAnalyze && (
              <button
                onClick={() => onQuickAnalyze(asset.symbol)}
                className="text-[11px] font-mono-term font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all hidden sm:block"
              >
                Analyze
              </button>
            )}
          </div>
        </div>

        {/* Main Chart Body */}
        {chartEngine === 'tradingview' ? (
          <div className="relative flex-1 min-h-[350px] w-full bg-[#0a0c10]">
            <TradingViewWidget
              symbol={asset.symbol}
              goldProvider={goldProvider}
              isMaximized={false}
              onToggleMaximize={() => setIsMaximized(true)}
            />
          </div>
        ) : (
          <div className="relative flex-1 min-h-[280px] w-full">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full cursor-crosshair block"
            />

            {/* Hover inspection pill */}
            {hoverData && (
              <div className="absolute top-2 left-2 pointer-events-none bg-[#11141b]/90 border border-gray-700/60 rounded px-2.5 py-1 text-[11px] font-mono-term text-gray-300 flex items-center gap-3 backdrop-blur shadow-md">
                <span>O: <span className="text-white">{hoverData.candle.open.toFixed(asset.digits)}</span></span>
                <span>H: <span className="text-emerald-400">{hoverData.candle.high.toFixed(asset.digits)}</span></span>
                <span>L: <span className="text-rose-400">{hoverData.candle.low.toFixed(asset.digits)}</span></span>
                <span>C: <span className="text-amber-300">{hoverData.candle.close.toFixed(asset.digits)}</span></span>
                <span>Vol: <span className="text-gray-400">{hoverData.candle.volume}</span></span>
              </div>
            )}

            {/* Active Signal Overlay Banner */}
            {activeSignal && activeSignal.symbol === asset.symbol && (
              <div className="absolute bottom-2 left-2 bg-[#12151c]/90 border border-amber-500/40 rounded-lg p-2 text-xs font-mono-term backdrop-blur max-w-sm shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                    activeSignal.direction.includes('BUY') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {activeSignal.direction}
                  </span>
                  <span className="text-amber-400 text-[10px] font-semibold">
                    CONFIDENCE: {activeSignal.confidenceScore}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                  <div>Entry: <span className="text-white font-bold">{activeSignal.entryPrice}</span></div>
                  <div>SL: <span className="text-rose-400 font-bold">{activeSignal.stopLoss}</span></div>
                  <div>TP1: <span className="text-emerald-400 font-bold">{activeSignal.tp1}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Maximized Fullscreen Chart Modal */}
      {isMaximized && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#080a0e] text-white p-3 md:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c222d]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg font-mono-term text-white">{asset.symbol}</span>
              <span className="text-xs text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                {asset.symbol === 'XAUUSD' ? 'CFDs on Gold (US$ / OZ)' : asset.name}
              </span>
              <span className="text-sm font-mono-term text-gray-300 hidden sm:inline">
                ${asset.price.toFixed(asset.digits)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {(asset.symbol === 'XAUUSD' || asset.category === 'gold') && (
                <div className="flex items-center gap-1.5 bg-[#12161f] border border-[#232a38] px-2 py-1 rounded text-xs font-mono-term">
                  <span className="text-gray-400 text-[11px]">Gold Source:</span>
                  <select
                    value={goldProvider}
                    onChange={(e) => setGoldProvider(e.target.value as any)}
                    className="bg-transparent text-amber-300 text-xs font-semibold focus:outline-none"
                  >
                    <option value="TVC:GOLD" className="bg-[#11141b] text-white">TVC:GOLD (CFDs on Gold (US$ / OZ))</option>
                    <option value="OANDA:XAUUSD" className="bg-[#11141b] text-white">OANDA:XAUUSD (CFD)</option>
                    <option value="FOREXCOM:XAUUSD" className="bg-[#11141b] text-white">FOREXCOM:XAUUSD</option>
                    <option value="COMEX:GC1!" className="bg-[#11141b] text-white">COMEX:GC1! (Futures)</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => setIsMaximized(false)}
                className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-gray-700 text-gray-300 transition-colors"
                title="Exit Fullscreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full mt-3 rounded-xl overflow-hidden border border-[#1e2430]">
            <TradingViewWidget
              symbol={asset.symbol}
              goldProvider={goldProvider}
              isMaximized={true}
              onToggleMaximize={() => setIsMaximized(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};
