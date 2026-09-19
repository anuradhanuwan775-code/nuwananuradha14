import React, { useState } from 'react';
import { CryptoAsset } from '../types';
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters';
import { Search, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface WatchlistPanelProps {
  assets: CryptoAsset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  onRefresh,
  loading = false
}) => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);

  const toggleFav = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (favorites.includes(symbol)) {
      setFavorites(favorites.filter(f => f !== symbol));
    } else {
      setFavorites([...favorites, symbol]);
    }
  };

  const filteredAssets = assets.filter(a =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) ||
    (a.name ? a.name.toLowerCase().includes(search.toLowerCase()) : false)
  );

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-4 shadow-xl text-gray-200 flex flex-col h-full">
      {/* Header with Search & Refresh */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm tracking-wide font-mono">WATCHLIST</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            title="Refresh Watchlist"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
        <input
          type="text"
          placeholder="Filter symbol (BTC, ETH...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#141b2d] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
        />
      </div>

      {/* Asset List */}
      <div className="space-y-1 overflow-y-auto max-h-[520px] pr-1 divide-y divide-gray-800/40">
        {filteredAssets.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const isFav = favorites.includes(asset.symbol);
          const chg = asset.priceChangePercent24h ?? asset.change24h ?? 0;
          const isPositive = chg >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              className={`pt-2 pb-2 px-2.5 rounded-lg cursor-pointer transition flex items-center justify-between ${
                isSelected
                  ? 'bg-blue-600/15 border border-blue-500/40'
                  : 'hover:bg-gray-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleFav(e, asset.symbol)}
                  className="text-gray-500 hover:text-amber-400"
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs font-mono">
                      {asset.symbol.replace('USDT', '')}
                    </span>
                    <span className="text-[10px] text-gray-400">/USDT</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block truncate max-w-[80px]">
                    {asset.name || asset.baseAsset}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-white block">
                  {formatCurrency(asset.price)}
                </span>
                <span
                  className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {formatPercent(chg)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

};
