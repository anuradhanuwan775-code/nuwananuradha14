import React from 'react';
import { DerivativesData, OrderBookData } from '../types';
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters';
import { CircleDollarSign, BarChart3, Scale, Layers } from 'lucide-react';

interface DerivativesPanelProps {
  derivatives: DerivativesData | null;
  orderBook: OrderBookData | null;
}

export const DerivativesPanel: React.FC<DerivativesPanelProps> = ({ derivatives, orderBook }) => {
  const fundingPercent = derivatives ? derivatives.fundingRate * 100 : 0.01;
  const isFundingPositive = fundingPercent > 0;

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">DERIVATIVES & ORDER BOOK</h3>
        </div>
        {derivatives && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
            {derivatives.crowdedState === 'crowded_long' ? 'Crowded Longs' : 'Balanced Positioning'}
          </span>
        )}
      </div>

      {/* Derivatives Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Funding Rate */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
          <span className="text-gray-400 text-[11px] block">Funding Rate (8h)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-base font-mono font-bold ${
                isFundingPositive ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {fundingPercent.toFixed(4)}%
            </span>
            <span className="text-[10px] text-gray-500">
              ({(fundingPercent * 3 * 365).toFixed(1)}% APR)
            </span>
          </div>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            {isFundingPositive ? 'Longs pay shorts' : 'Shorts pay longs'}
          </span>
        </div>

        {/* Open Interest */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
          <span className="text-gray-400 text-[11px] block">Open Interest</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-mono font-bold text-white">
              {formatCompactNumber(derivatives?.openInterest ?? 50000)}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">+2.8%</span>
          </div>
          <span className="text-[10px] text-gray-500 block mt-0.5">24h Contract Expansion</span>
        </div>

        {/* Long / Short Ratio */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
          <span className="text-gray-400 text-[11px] block">L/S Account Ratio</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-mono font-bold text-blue-400">
              {derivatives?.longShortRatio.toFixed(2) ?? '1.15'}
            </span>
            <span className="text-[10px] text-gray-400">
              ({derivatives && derivatives.longShortRatio > 1 ? '53% Long' : '50% Net'})
            </span>
          </div>
          {/* Visual Ratio Bar */}
          <div className="w-full h-1.5 bg-red-500/80 rounded-full overflow-hidden mt-1 flex">
            <div className="bg-emerald-500 h-full" style={{ width: '53%' }} />
          </div>
        </div>

        {/* Futures Basis / Spread */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
          <span className="text-gray-400 text-[11px] block">Futures Premium / Basis</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-mono font-bold text-white">
              +{derivatives?.basis.toFixed(1) ?? '12.5'} pts
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Contango Regime</span>
        </div>
      </div>

      {/* Live Order Book Depth Visualization */}
      {orderBook && (
        <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-gray-300">Order Book Depth & Liquidity Walls</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              Spread: <strong className="text-white">${orderBook.spread.toFixed(2)}</strong> ({orderBook.spreadPercentage.toFixed(3)}%)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Bids */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400 border-b border-gray-800 pb-1">
                <span>PRICE (USD)</span>
                <span>BID SIZE</span>
              </div>
              {orderBook.bids.slice(0, 4).map((b, i) => (
                <div key={i} className="relative flex justify-between font-mono text-[11px] py-0.5 px-1">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded"
                    style={{ width: `${Math.min(100, (b.amount / (orderBook.bidDepthTotal * 0.4)) * 100)}%` }}
                  />
                  <span className="relative z-10 text-emerald-400 font-semibold">{formatCurrency(b.price)}</span>
                  <span className="relative z-10 text-gray-300">{b.amount.toFixed(3)}</span>
                </div>
              ))}
            </div>

            {/* Asks */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400 border-b border-gray-800 pb-1">
                <span>PRICE (USD)</span>
                <span>ASK SIZE</span>
              </div>
              {orderBook.asks.slice(0, 4).map((a, i) => (
                <div key={i} className="relative flex justify-between font-mono text-[11px] py-0.5 px-1">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-red-500/10 rounded"
                    style={{ width: `${Math.min(100, (a.amount / (orderBook.askDepthTotal * 0.4)) * 100)}%` }}
                  />
                  <span className="relative z-10 text-red-400 font-semibold">{formatCurrency(a.price)}</span>
                  <span className="relative z-10 text-gray-300">{a.amount.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Large Walls detection */}
          {orderBook.largeWalls.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-800/80 flex flex-wrap gap-2 text-[11px]">
              <span className="text-gray-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Notable Liquidity Blocks:
              </span>
              {orderBook.largeWalls.map((w, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded font-mono font-semibold ${
                    w.type === 'bid' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                  }`}
                >
                  {w.type.toUpperCase()} Wall at {formatCurrency(w.price)} (~{formatCompactNumber(w.amount)} coins)
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
