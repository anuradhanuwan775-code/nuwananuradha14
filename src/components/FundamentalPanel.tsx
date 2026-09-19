import React from 'react';
import { FundamentalData } from '../types';
import { formatCurrency, formatCompactNumber, formatPercent } from '../utils/formatters';
import { Coins, AlertOctagon, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface FundamentalPanelProps {
  fundamentals: FundamentalData | null;
}

export const FundamentalPanel: React.FC<FundamentalPanelProps> = ({ fundamentals }) => {
  if (!fundamentals) {
    return (
      <div className="bg-[#0f1523] border border-gray-800 rounded-xl p-5 animate-pulse">
        <div className="h-6 w-36 bg-gray-800 rounded mb-4" />
        <div className="h-20 bg-gray-800/50 rounded" />
      </div>
    );
  }

  const inflationColor =
    fundamentals.supplyInflationRisk === 'low'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : fundamentals.supplyInflationRisk === 'moderate'
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-red-400 border-red-500/30 bg-red-500/10';

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">
            {fundamentals.name} ({fundamentals.symbol.replace('USDT', '')}) FUNDAMENTALS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
            Rank #{fundamentals.marketCapRank}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            Score: {fundamentals.score}/100
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 font-mono">
          <span className="text-gray-400 text-[11px] block">Market Cap</span>
          <span className="text-base font-bold text-white mt-1 block">
            {formatCurrency(fundamentals.marketCap, 0)}
          </span>
          <span className="text-[10px] text-gray-500">Global valuation</span>
        </div>

        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 font-mono">
          <span className="text-gray-400 text-[11px] block">FDV (Fully Diluted)</span>
          <span className="text-base font-bold text-white mt-1 block">
            {formatCurrency(fundamentals.fdv, 0)}
          </span>
          <span className="text-[10px] text-gray-500">Max theoretical cap</span>
        </div>

        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 font-mono">
          <span className="text-gray-400 text-[11px] block">Circulating Supply</span>
          <span className="text-base font-bold text-white mt-1 block">
            {formatCompactNumber(fundamentals.circulatingSupply)}
          </span>
          <span className="text-[10px] text-gray-500">
            {fundamentals.maxSupply
              ? `${((fundamentals.circulatingSupply / fundamentals.maxSupply) * 100).toFixed(1)}% of max`
              : 'Dynamic cap'}
          </span>
        </div>

        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 font-mono">
          <span className="text-gray-400 text-[11px] block">Max / Total Supply</span>
          <span className="text-base font-bold text-white mt-1 block">
            {fundamentals.maxSupply ? formatCompactNumber(fundamentals.maxSupply) : 'Infinite'}
          </span>
          <span className="text-[10px] text-gray-500">Hard-cap limit</span>
        </div>
      </div>

      {/* ATH / ATL Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-[#121824] p-3 rounded-lg border border-gray-800 flex items-center justify-between font-mono">
          <div>
            <span className="text-gray-400 text-[11px] block">All-Time High (ATH)</span>
            <span className="text-sm font-bold text-white">{formatCurrency(fundamentals.ath)}</span>
          </div>
          <div className="text-right">
            <span className="text-red-400 font-semibold">{fundamentals.athChangePercentage}%</span>
            <span className="text-[10px] text-gray-500 block">from peak</span>
          </div>
        </div>

        <div className="bg-[#121824] p-3 rounded-lg border border-gray-800 flex items-center justify-between font-mono">
          <div>
            <span className="text-gray-400 text-[11px] block">All-Time Low (ATL)</span>
            <span className="text-sm font-bold text-white">{formatCurrency(fundamentals.atl)}</span>
          </div>
          <div className="text-right">
            <span className="text-emerald-400 font-semibold">{formatPercent(fundamentals.atlChangePercentage)}</span>
            <span className="text-[10px] text-gray-500 block">from floor</span>
          </div>
        </div>
      </div>

      {/* Tokenomics & Supply Pressure Analysis */}
      <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" /> Tokenomics & Supply Pressure
          </span>
          <span className={`px-2 py-0.5 rounded font-mono uppercase text-[10px] font-bold border ${inflationColor}`}>
            {fundamentals.supplyInflationRisk} Inflation Risk
          </span>
        </div>
        <p className="text-gray-300 leading-relaxed text-[11px]">
          {fundamentals.utilityAnalysis}
        </p>
      </div>
    </div>
  );
};
