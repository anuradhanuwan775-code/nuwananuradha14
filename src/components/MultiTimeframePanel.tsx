import React, { useState, useEffect } from 'react';
import { Timeframe, TimeframeAnalysis, MultiTimeframeSummary } from '../types';
import { fetchCandles } from '../services/api';
import { calculateEMA, calculateRSI, detectMarketStructure } from '../utils/indicators';
import { Network, Check, ArrowUpRight, ArrowDownRight, Minus, RefreshCw } from 'lucide-react';

interface MultiTimeframePanelProps {
  symbol: string;
}

export const MultiTimeframePanel: React.FC<MultiTimeframePanelProps> = ({ symbol }) => {
  const [loading, setLoading] = useState(false);
  const [mtfData, setMtfData] = useState<Record<string, TimeframeAnalysis>>({});
  const [alignmentScore, setAlignmentScore] = useState<number>(75);

  const timeframes: Timeframe[] = ['1d', '4h', '1h', '15m', '5m'];

  const analyzeAllTimeframes = async () => {
    setLoading(true);
    try {
      const results: Record<string, TimeframeAnalysis> = {};
      let bullishCount = 0;
      let bearishCount = 0;

      for (const tf of timeframes) {
        try {
          const candles = await fetchCandles(symbol, tf, 100);
          if (candles.length < 20) continue;

          const currentPrice = candles[candles.length - 1].close;
          const closes = candles.map(c => c.close);
          const ema50 = calculateEMA(closes, 50);
          const ema200 = calculateEMA(closes, 200);
          const e50 = ema50[ema50.length - 1] ?? currentPrice;
          const e200 = ema200[ema200.length - 1] ?? currentPrice;

          const { current: rsi } = calculateRSI(candles, 14);
          const { currentStructure } = detectMarketStructure(candles);

          const isBull = currentPrice > e50 && currentStructure === 'bullish';
          const isBear = currentPrice < e50 && currentStructure === 'bearish';

          if (isBull) bullishCount++;
          else if (isBear) bearishCount++;

          results[tf] = {
            timeframe: tf,
            trend: currentPrice > e50 ? 'bullish' : 'bearish',
            structure: currentStructure,
            momentum: rsi > 60 ? 'strong_bullish' : rsi > 50 ? 'bullish' : rsi < 40 ? 'strong_bearish' : 'bearish',
            volumeBias: 'bullish',
            signalBias: isBull ? 'LONG' : isBear ? 'SHORT' : 'WAIT',
            score: Math.round((currentPrice > e50 ? 50 : 20) + (currentStructure === 'bullish' ? 30 : 10) + (rsi > 50 ? 20 : 0))
          };
        } catch (e) {
          console.warn(`MTF fetch failed for ${tf}:`, e);
        }
      }

      setMtfData(results);
      const total = Object.keys(results).length;
      const dominant = Math.max(bullishCount, bearishCount);
      const score = total > 0 ? Math.round((dominant / total) * 100) : 50;
      setAlignmentScore(score);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeAllTimeframes();
  }, [symbol]);

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">MULTI-TIMEFRAME MATRIX</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-gray-400">MTF Alignment: </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{alignmentScore}%</span>
          </div>
          <button
            onClick={analyzeAllTimeframes}
            disabled={loading}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            title="Refresh MTF"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 font-mono text-[11px]">
              <th className="py-2 px-3">TIMEFRAME</th>
              <th className="py-2 px-3">TREND</th>
              <th className="py-2 px-3">STRUCTURE</th>
              <th className="py-2 px-3">MOMENTUM</th>
              <th className="py-2 px-3 text-right">SIGNAL BIAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {timeframes.map((tf) => {
              const item = mtfData[tf];
              if (!item) {
                return (
                  <tr key={tf}>
                    <td className="py-2.5 px-3 font-bold text-white uppercase">{tf}</td>
                    <td colSpan={4} className="py-2.5 px-3 text-gray-500 text-center">
                      Loading candle stream...
                    </td>
                  </tr>
                );
              }

              const isBull = item.trend === 'bullish';
              return (
                <tr key={tf} className="hover:bg-gray-800/30 transition">
                  <td className="py-2.5 px-3 font-bold text-white uppercase">{tf}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isBull ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isBull ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {item.trend.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        item.structure === 'bullish'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : item.structure === 'bearish'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {item.structure}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-300 capitalize">
                    {item.momentum.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.signalBias === 'LONG'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : item.signalBias === 'SHORT'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {item.signalBias}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
