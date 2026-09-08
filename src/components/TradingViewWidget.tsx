import React, { useEffect, useRef, useState, memo } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface TradingViewWidgetProps {
  symbol: string;
  goldProvider?: string;
  height?: string | number;
  className?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

// Map internal symbols to TradingView symbols
export const getTradingViewSymbol = (internalSymbol: string, goldProvider: string = 'TVC:GOLD'): string => {
  const s = internalSymbol.toUpperCase();
  if (s === 'XAUUSD' || s === 'GOLD' || s.includes('XAU')) {
    return goldProvider || 'TVC:GOLD';
  }
  if (s === 'BTCUSD' || s === 'BTC') return 'BINANCE:BTCUSDT';
  if (s === 'ETHUSD' || s === 'ETH') return 'BINANCE:ETHUSDT';
  if (s === 'SOLUSD' || s === 'SOL') return 'BINANCE:SOLUSDT';
  if (s === 'EURUSD') return 'FX:EURUSD';
  if (s === 'GBPUSD') return 'FX:GBPUSD';
  if (s === 'USDJPY') return 'FX:USDJPY';
  if (s === 'NAS100') return 'FOREXCOM:NAS100';
  if (s === 'US30') return 'FOREXCOM:DJI';
  return `TVC:${s}`;
};

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(({
  symbol,
  goldProvider = 'TVC:GOLD',
  className = '',
  isMaximized = false,
  onToggleMaximize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const tvSymbol = getTradingViewSymbol(symbol, goldProvider);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const widgetConfig = {
      autosize: true,
      symbol: tvSymbol,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      backgroundColor: 'rgba(10, 12, 16, 1)',
      gridColor: 'rgba(23, 27, 34, 0.7)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      studies: [
        'STD;EMA',
        'STD;RSI'
      ],
      support_host: 'https://www.tradingview.com'
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    script.onload = () => {
      setIsLoading(false);
    };

    // If script finishes injection
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    container.appendChild(script);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [tvSymbol, reloadKey]);

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className={`relative flex flex-col w-full h-full bg-[#0a0c10] overflow-hidden ${className}`}>
      {/* Top Banner when Gold is selected */}
      {(symbol.toUpperCase() === 'XAUUSD' || symbol.toUpperCase() === 'GOLD') && (
        <div className="bg-[#0e1117] border-b border-[#1b2029] px-3 py-1.5 flex items-center justify-between text-xs font-mono-term">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold text-amber-300">CFDs on Gold (US$ / OZ)</span>
            <span className="text-[10px] text-gray-400 border border-amber-500/30 px-1.5 py-0.2 rounded bg-amber-500/10 hidden sm:inline">
              TradingView: {tvSymbol}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <a
              href={`https://www.tradingview.com/symbols/${tvSymbol.replace(':', '-')}/`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1 text-gray-400 hover:text-amber-300 transition-colors"
              title="Open full chart on TradingView.com"
            >
              <span>TradingView.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleRefresh}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
              title="Reload TradingView widget"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            {onToggleMaximize && (
              <button
                onClick={onToggleMaximize}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title={isMaximized ? 'Minimize Chart' : 'Maximize Chart'}
              >
                {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TradingView Container */}
      <div className="relative flex-1 w-full h-full min-h-[350px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0c10]/80 backdrop-blur-sm text-xs font-mono-term text-amber-300">
            <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2"></span>
            <span>Loading TradingView {tvSymbol}...</span>
            <span className="text-[10px] text-gray-500 mt-1">CFDs on Gold (US$ / OZ)</span>
          </div>
        )}

        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
});
