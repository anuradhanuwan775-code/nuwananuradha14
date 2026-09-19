import React, { useState } from 'react';
import { Candle, Timeframe, BacktestConfig, BacktestResult } from '../types';
import { runBacktest } from '../utils/backtesting';
import { formatCurrency, formatPercent, formatDateTime } from '../utils/formatters';
import { Play, TrendingUp, Award, AlertCircle, ShieldAlert, BarChart2 } from 'lucide-react';

interface BacktestingPanelProps {
  candles: Candle[];
  symbol: string;
  timeframe: Timeframe;
}

export const BacktestingPanel: React.FC<BacktestingPanelProps> = ({ candles, symbol, timeframe }) => {
  const [strategy, setStrategy] = useState<'ema_trend_rsi' | 'supertrend_vwap' | 'multi_confluence'>('ema_trend_rsi');
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [targetRR, setTargetRR] = useState<number>(2.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(() => {
    return candles.length > 50
      ? runBacktest(candles, {
          symbol,
          timeframe,
          strategy: 'ema_trend_rsi',
          initialCapital: 10000,
          riskPerTradePercent: 2.0,
          stopLossType: 'balanced',
          targetRR: 2.0,
          candleLimit: 250
        })
      : null;
  });

  const handleRunBacktest = () => {
    setLoading(true);
    setTimeout(() => {
      const res = runBacktest(candles, {
        symbol,
        timeframe,
        strategy,
        initialCapital,
        riskPerTradePercent: riskPercent,
        stopLossType: 'balanced',
        targetRR,
        candleLimit: candles.length
      });
      setResult(res);
      setLoading(false);
    }, 200);
  };

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">HISTORICAL BACKTESTING ENGINE</h3>
            <p className="text-[11px] text-gray-400">
              Simulating algorithmic strategies over verified Binance historical candle data
            </p>
          </div>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded-lg text-xs transition shadow-md"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'SIMULATING...' : 'RUN BACKTEST'}
        </button>
      </div>

      {/* Strategy & Risk Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <label className="text-gray-400 block mb-1">Strategy Model</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="ema_trend_rsi">EMA Trend Pullback + RSI</option>
            <option value="supertrend_vwap">Supertrend + VWAP Confluence</option>
            <option value="multi_confluence">Multi-Factor Triple Confirm</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Initial Capital ($)</label>
          <input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 1000)}
            className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Risk Per Trade (%)</label>
          <input
            type="number"
            step="0.5"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1)}
            className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Target Risk : Reward</label>
          <input
            type="number"
            step="0.1"
            value={targetRR}
            onChange={(e) => setTargetRR(parseFloat(e.target.value) || 1.5)}
            className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {result && (
        <>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs font-mono text-center">
            <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">WIN RATE</span>
              <span
                className={`text-lg font-bold block mt-0.5 ${
                  result.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {result.winRate}%
              </span>
              <span className="text-[10px] text-gray-500">
                {result.winningTrades}W / {result.losingTrades}L
              </span>
            </div>

            <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">PROFIT FACTOR</span>
              <span className="text-lg font-bold text-white block mt-0.5">
                {result.profitFactor}
              </span>
              <span className="text-[10px] text-emerald-400">&gt; 1.5 Target</span>
            </div>

            <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">NET PROFIT</span>
              <span
                className={`text-lg font-bold block mt-0.5 ${
                  result.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(result.netProfit)}
              </span>
              <span className="text-[10px] text-gray-400">{formatPercent(result.netProfitPercent)}</span>
            </div>

            <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">MAX DRAWDOWN</span>
              <span className="text-lg font-bold text-red-400 block mt-0.5">
                -{result.maxDrawdownPercent}%
              </span>
              <span className="text-[10px] text-gray-500">Peak-to-trough</span>
            </div>

            <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">SHARPE RATIO</span>
              <span className="text-lg font-bold text-blue-400 block mt-0.5">
                {result.sharpeRatio}
              </span>
              <span className="text-[10px] text-gray-500">Annualized</span>
            </div>

            <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[10px] block">TOTAL TRADES</span>
              <span className="text-lg font-bold text-white block mt-0.5">
                {result.totalTrades}
              </span>
              <span className="text-[10px] text-gray-500">Sample size</span>
            </div>
          </div>

          {/* Equity Curve Visualization (Clean SVG) */}
          <div className="bg-[#141b2d] p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-gray-300 font-mono">Simulated Capital Growth (Equity Curve)</span>
              <span className="font-mono text-emerald-400">
                Final: {formatCurrency(result.equityCurve[result.equityCurve.length - 1]?.equity ?? initialCapital)}
              </span>
            </div>

            <div className="relative w-full h-36 flex items-end">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 100">
                {/* Horizontal guide line at initial capital */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="#374151" strokeDasharray="3,3" strokeWidth="1" />
                {(() => {
                  if (result.equityCurve.length < 2) return null;
                  const equities = result.equityCurve.map(e => e.equity);
                  const min = Math.min(...equities) * 0.98;
                  const max = Math.max(...equities) * 1.02;
                  const range = max - min || 1;

                  const points = result.equityCurve.map((e, idx) => {
                    const x = (idx / (result.equityCurve.length - 1)) * 500;
                    const y = 100 - ((e.equity - min) / range) * 100;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        points={points}
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Recent Executed Trades Log */}
          <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800 text-xs">
            <h4 className="font-semibold text-gray-300 font-mono mb-2">Simulated Trade Log (Last 6 Executions)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="py-1.5 px-2">TYPE</th>
                    <th className="py-1.5 px-2">ENTRY</th>
                    <th className="py-1.5 px-2">EXIT</th>
                    <th className="py-1.5 px-2">RESULT</th>
                    <th className="py-1.5 px-2">P&L ($)</th>
                    <th className="py-1.5 px-2 text-right">R-MULTIPLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {result.trades.slice(-6).reverse().map((t) => (
                    <tr key={t.id} className="hover:bg-gray-800/30">
                      <td className="py-1.5 px-2">
                        <span
                          className={`font-bold ${
                            t.type === 'LONG' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-white">{formatCurrency(t.entryPrice)}</td>
                      <td className="py-1.5 px-2 text-gray-300">{formatCurrency(t.exitPrice)}</td>
                      <td className="py-1.5 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {t.result}
                        </span>
                      </td>
                      <td
                        className={`py-1.5 px-2 font-bold ${
                          t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {t.pnl >= 0 ? `+${formatCurrency(t.pnl)}` : `-${formatCurrency(Math.abs(t.pnl))}`}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-300">{t.rMultiple}R</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
