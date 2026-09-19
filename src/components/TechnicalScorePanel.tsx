import React from 'react';
import { TechnicalScoreBreakdown } from '../types';
import { Activity, Compass, Gauge, BarChart, Zap, Layers } from 'lucide-react';

interface TechnicalScorePanelProps {
  score: TechnicalScoreBreakdown | null;
}

export const TechnicalScorePanel: React.FC<TechnicalScorePanelProps> = ({ score }) => {
  if (!score) {
    return (
      <div className="bg-[#0f1523] border border-gray-800 rounded-xl p-5 animate-pulse">
        <div className="h-6 w-36 bg-gray-800 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-800/50 rounded" />
          <div className="h-10 bg-gray-800/50 rounded" />
          <div className="h-10 bg-gray-800/50 rounded" />
        </div>
      </div>
    );
  }

  const items = [
    {
      title: 'Trend Alignment',
      score: score.trendScore,
      max: 20,
      icon: Compass,
      color: 'text-blue-400',
      bg: 'bg-blue-500',
      detail: score.details.trend
    },
    {
      title: 'Momentum Oscillators',
      score: score.momentumScore,
      max: 20,
      icon: Gauge,
      color: 'text-amber-400',
      bg: 'bg-amber-500',
      detail: score.details.momentum
    },
    {
      title: 'Volume Participation',
      score: score.volumeScore,
      max: 10,
      icon: BarChart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500',
      detail: score.details.volume
    },
    {
      title: 'Volatility / ATR Range',
      score: score.volatilityScore,
      max: 10,
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-500',
      detail: score.details.volatility
    },
    {
      title: 'Market Structure',
      score: score.structureScore,
      max: 20,
      icon: Layers,
      color: 'text-pink-400',
      bg: 'bg-pink-500',
      detail: score.details.structure
    }
  ];

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">TECHNICAL SCORE</h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-xl font-bold text-white">{score.total}</span>
          <span className="text-xs text-gray-500">/ 80</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {items.map((item, idx) => {
          const pct = Math.round((item.score / item.max) * 100);
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-[#131a29] p-3 rounded-lg border border-gray-800/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  {item.title}
                </span>
                <span className="font-mono font-bold text-white">
                  {item.score} <span className="text-gray-500 font-normal">/ {item.max}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full ${item.bg} rounded-full transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-[11px] text-gray-400 leading-tight">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
