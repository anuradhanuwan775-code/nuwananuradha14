import React, { useState } from 'react';
import { AISignal } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Target,
  ArrowRight
} from 'lucide-react';

interface SignalCardProps {
  signal: AISignal | null;
  loading?: boolean;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, loading = false }) => {
  const [slMode, setSlMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  if (loading || !signal) {
    return (
      <div className="bg-[#0f1523] border border-gray-800 rounded-xl p-6 animate-pulse flex flex-col gap-4">
        <div className="h-6 w-32 bg-gray-800 rounded" />
        <div className="h-12 w-full bg-gray-800 rounded" />
        <div className="h-24 w-full bg-gray-800 rounded" />
      </div>
    );
  }

  const isLong = signal.bias === 'LONG';
  const isShort = signal.bias === 'SHORT';
  const isWait = signal.bias === 'WAIT';

  const badgeColor = isLong
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    : isShort
    ? 'bg-red-500/20 text-red-400 border-red-500/40'
    : 'bg-amber-500/20 text-amber-400 border-amber-500/40';

  const biasIcon = isLong ? (
    <TrendingUp className="w-6 h-6 text-emerald-400" />
  ) : isShort ? (
    <TrendingDown className="w-6 h-6 text-red-400" />
  ) : (
    <Clock className="w-6 h-6 text-amber-400" />
  );

  const activeSL = signal.stopLoss[slMode];

  return (
    <div
      id="ai-signal-card"
      className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl flex flex-col gap-5 text-gray-200"
    >
      {/* Header: Symbol, Bias & Confidence */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${badgeColor}`}>{biasIcon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-wide">{signal.symbol}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-gray-800 text-gray-300">
                {signal.timeframe}
              </span>
              <span className="text-xs text-gray-400 capitalize">({signal.marketRegime})</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Strength: <strong className="text-white font-medium">{signal.strength}</strong> • Data:{' '}
              <strong className="text-emerald-400 font-medium">{signal.dataQuality}</strong>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs text-gray-400 font-medium">Confidence:</span>
            <span className="text-xl font-mono font-bold text-white">{signal.confidence}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-28 h-2 bg-gray-800 rounded-full mt-1.5 overflow-hidden ml-auto">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isLong ? 'bg-emerald-500' : isShort ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trade Execution Plan (Entry, SL, TP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Entry Zone */}
        <div className="bg-[#141b2d] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> ENTRY ZONE
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Confluence</span>
          </div>
          <div className="text-base font-mono font-bold text-white">
            {formatCurrency(signal.entryZone.min)} - {formatCurrency(signal.entryZone.max)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-snug">
            {signal.entryZone.trigger}
          </p>
        </div>

        {/* Stop Loss with Mode Selector */}
        <div className="bg-[#141b2d] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-red-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> STOP LOSS
            </span>
            {/* Conservative / Balanced / Aggressive toggle */}
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setSlMode('aggressive')}
                className={`px-1 py-0.5 rounded transition ${
                  slMode === 'aggressive' ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
                title="Aggressive (Tight SL, ATR 1.2)"
              >
                Agg
              </button>
              <button
                onClick={() => setSlMode('balanced')}
                className={`px-1 py-0.5 rounded transition ${
                  slMode === 'balanced' ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
                title="Balanced (Swing level & ATR 1.8)"
              >
                Bal
              </button>
              <button
                onClick={() => setSlMode('conservative')}
                className={`px-1 py-0.5 rounded transition ${
                  slMode === 'conservative' ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
                title="Conservative (Wide SL, ATR 2.5)"
              >
                Cons
              </button>
            </div>
          </div>
          <div className="text-base font-mono font-bold text-red-400">
            {formatCurrency(activeSL)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Distance: -{signal.stopLoss.distancePercent}% • Invalidation
          </p>
        </div>

        {/* Take Profit Targets & R:R */}
        <div className="bg-[#141b2d] border border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-semibold">TAKE PROFIT TARGETS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
              1 : {signal.riskRewardRatio} R:R
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs font-mono mt-1">
            <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 block">TP1</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(signal.takeProfit.tp1)}</span>
            </div>
            <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 block">TP2</span>
              <span className="text-emerald-300 font-bold">{formatCurrency(signal.takeProfit.tp2)}</span>
            </div>
            <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 block">TP3</span>
              <span className="text-white font-bold">{formatCurrency(signal.takeProfit.tp3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Factor Weighted Confluence Breakdown */}
      <div className="bg-[#121824] p-3 rounded-lg border border-gray-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" /> Multi-Factor Confluence (Total 100%)
          </span>
          <span className="font-mono font-bold text-white">Score: {signal.scores.compositeScore}/100</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono text-[11px]">
          <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Tech (40%)</span>
            <strong className={signal.scores.technical >= 60 ? 'text-emerald-400' : 'text-gray-200'}>
              {signal.scores.technical}
            </strong>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Structure (20%)</span>
            <strong className={signal.scores.structure >= 60 ? 'text-emerald-400' : 'text-gray-200'}>
              {signal.scores.structure}
            </strong>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Volume (10%)</span>
            <strong className={signal.scores.volume >= 60 ? 'text-emerald-400' : 'text-gray-200'}>
              {signal.scores.volume}
            </strong>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Derivs (10%)</span>
            <strong className={signal.scores.derivatives >= 60 ? 'text-emerald-400' : 'text-gray-200'}>
              {signal.scores.derivatives}
            </strong>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Fund (10%)</span>
            <strong className="text-gray-200">{signal.scores.fundamental}</strong>
          </div>
          <div className="bg-[#0b0e14] p-1.5 rounded border border-gray-800">
            <span className="text-[10px] text-gray-400 block">Sentiment (10%)</span>
            <strong className="text-gray-200">{signal.scores.sentiment}</strong>
          </div>
        </div>
      </div>

      {/* Reasons & Risks side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Reasons */}
        <div className="bg-[#111928] p-3 rounded-lg border border-emerald-900/30">
          <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4" /> Supporting Confluence ({signal.reasons.length})
          </h4>
          <ul className="space-y-1.5 text-gray-300">
            {signal.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="bg-[#111928] p-3 rounded-lg border border-red-900/30">
          <h4 className="font-semibold text-red-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4" /> Key Risk Factors ({signal.risks.length})
          </h4>
          <ul className="space-y-1.5 text-gray-300">
            {signal.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-red-500 font-bold mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Safety / No-Trade Filter Alert if present */}
      {signal.noTradeFiltersHit && signal.noTradeFiltersHit.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Safety Filter Triggered:</strong> {signal.noTradeFiltersHit.join(' • ')}. Strict capital preservation active.
          </span>
        </div>
      )}

      {/* Regulatory / Financial Safety Disclaimer */}
      <div className="text-[11px] text-gray-500 text-center border-t border-gray-800/80 pt-3 flex items-center justify-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span>
          Trading involves significant risk. This tool provides quantitative market analysis and does not constitute financial advice.
        </span>
      </div>
    </div>
  );
};
