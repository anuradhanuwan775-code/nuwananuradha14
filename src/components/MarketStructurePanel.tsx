import React from 'react';
import {
  MarketStructurePoint,
  MarketStructureBreak,
  SupportResistanceZone,
  CandlestickPattern,
  ChartPattern,
  FibonacciLevel
} from '../types';
import { formatCurrency, formatTimestamp } from '../utils/formatters';
import { Layers, Shield, Sparkles, Shapes, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketStructurePanelProps {
  structure: {
    points: MarketStructurePoint[];
    breaks: MarketStructureBreak[];
    currentStructure: 'bullish' | 'bearish' | 'ranging';
    summary: string;
  } | null;
  supportResistance: SupportResistanceZone[];
  candlestickPatterns: CandlestickPattern[];
  chartPatterns: ChartPattern[];
  fibonacci: FibonacciLevel[];
}

export const MarketStructurePanel: React.FC<MarketStructurePanelProps> = ({
  structure,
  supportResistance,
  candlestickPatterns,
  chartPatterns,
  fibonacci
}) => {
  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">MARKET STRUCTURE & CONFLUENCE</h3>
        </div>
        {structure && (
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
              structure.currentStructure === 'bullish'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : structure.currentStructure === 'bearish'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {structure.currentStructure} PHASE
          </span>
        )}
      </div>

      {structure && (
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 text-xs">
          <p className="text-gray-300 leading-relaxed font-medium">{structure.summary}</p>
        </div>
      )}

      {/* Grid: BOS/CHOCH Breaks + S/R Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* BOS & CHOCH Structural Shifts */}
        <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800">
          <h4 className="font-semibold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Recent Structural Breaks (BOS / CHOCH)
          </h4>
          {structure && structure.breaks.length > 0 ? (
            <div className="space-y-2">
              {structure.breaks.slice(-4).map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#0b0e14] p-2 rounded border border-gray-800/80 font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        b.type === 'CHOCH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {b.type}
                    </span>
                    <span className="text-gray-300">{b.direction === 'bullish' ? 'Bullish' : 'Bearish'}</span>
                  </div>
                  <span className="text-white font-bold">{formatCurrency(b.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No recent structural breaks detected within range.</p>
          )}
        </div>

        {/* Support & Resistance Zones */}
        <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800">
          <h4 className="font-semibold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Key Support & Resistance Zones
          </h4>
          {supportResistance.length > 0 ? (
            <div className="space-y-1.5">
              {supportResistance.slice(0, 4).map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between bg-[#0b0e14] p-2 rounded border border-gray-800/80 font-mono text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        zone.type === 'support' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {zone.type}
                    </span>
                    <span className="text-gray-400">
                      {zone.strength} ({zone.touchCount}x)
                    </span>
                  </div>
                  <span className="text-white font-bold">
                    {formatCurrency(zone.min)} - {formatCurrency(zone.max)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Calculating price cluster levels...</p>
          )}
        </div>
      </div>

      {/* Grid: Patterns (Candle + Chart) & Fibonacci */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Candlestick & Chart Patterns */}
        <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800">
          <h4 className="font-semibold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Shapes className="w-3.5 h-3.5 text-pink-400" /> Pattern Recognition
          </h4>
          <div className="space-y-2">
            {candlestickPatterns.length > 0 ? (
              candlestickPatterns.slice(-2).map((p, i) => (
                <div key={i} className="bg-[#0b0e14] p-2 rounded border border-gray-800">
                  <div className="flex items-center justify-between font-mono mb-1">
                    <span className="font-bold text-white">{p.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        p.bias === 'bullish' ? 'text-emerald-400' : p.bias === 'bearish' ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {p.bias} ({p.reliability})
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">{p.description}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-[11px] italic">No high-confidence single candlestick patterns detected.</p>
            )}

            {chartPatterns.length > 0 ? (
              chartPatterns.map((cp, i) => (
                <div key={i} className="bg-[#0b0e14] p-2 rounded border border-gray-800">
                  <div className="flex items-center justify-between font-mono mb-1">
                    <span className="font-bold text-purple-300">{cp.name}</span>
                    <span className="text-[10px] text-gray-400">Conf: {cp.confidence}%</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">{cp.description}</p>
                </div>
              ))
            ) : null}
          </div>
        </div>

        {/* Fibonacci Retracement */}
        <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800">
          <h4 className="font-semibold text-gray-300 flex items-center gap-1.5 mb-2.5">
            <Percent className="w-3.5 h-3.5 text-amber-400" /> Fibonacci Retracement Levels
          </h4>
          <div className="space-y-1.5 font-mono text-[11px]">
            {fibonacci.map((fib, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-1.5 rounded border ${
                  fib.isKeyLevel
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 font-bold'
                    : 'bg-[#0b0e14] border-gray-800/80 text-gray-300'
                }`}
              >
                <span>{fib.label}</span>
                <span className="text-white font-semibold">{formatCurrency(fib.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
