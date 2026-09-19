import React from 'react';
import { SentimentData } from '../types';
import { formatDateTime } from '../utils/formatters';
import { Compass, Newspaper, PieChart, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';

interface SentimentPanelProps {
  sentiment: SentimentData | null;
}

export const SentimentPanel: React.FC<SentimentPanelProps> = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="bg-[#0f1523] border border-gray-800 rounded-xl p-5 animate-pulse">
        <div className="h-6 w-36 bg-gray-800 rounded mb-4" />
        <div className="h-20 bg-gray-800/50 rounded" />
      </div>
    );
  }

  const fngVal = sentiment.fearAndGreed.value;
  const fngClass = sentiment.fearAndGreed.classification;

  const fngColor =
    fngVal >= 75
      ? 'text-emerald-400'
      : fngVal >= 55
      ? 'text-emerald-300'
      : fngVal >= 45
      ? 'text-yellow-400'
      : fngVal >= 25
      ? 'text-amber-400'
      : 'text-red-400';

  const fngBg =
    fngVal >= 75
      ? 'bg-emerald-500'
      : fngVal >= 55
      ? 'bg-emerald-400'
      : fngVal >= 45
      ? 'bg-yellow-400'
      : fngVal >= 25
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">SENTIMENT & MARKET MACRO</h3>
        </div>
        <span className="text-xs text-gray-400 font-mono">Live API Feed</span>
      </div>

      {/* Metrics Row: Fear & Greed + Dominance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Fear & Greed Index */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-gray-400 text-[11px] block">Crypto Fear & Greed Index</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-mono font-extrabold ${fngColor}`}>{fngVal}</span>
              <span className={`font-semibold uppercase tracking-wider text-xs ${fngColor}`}>
                {fngClass}
              </span>
            </div>
          </div>
          {/* Visual Slider Meter */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-3 relative">
            <div
              className={`h-full ${fngBg} rounded-full transition-all duration-500`}
              style={{ width: `${fngVal}%` }}
            />
          </div>
        </div>

        {/* BTC Dominance */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-gray-400 text-[11px] block">Bitcoin Dominance (BTC.D)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono font-extrabold text-amber-400">
                {sentiment.btcDominance.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-400">Macro Share</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            Higher dominance favors Bitcoin strength; altcoins consolidate.
          </p>
        </div>

        {/* ETH Dominance & Sentiment Bias */}
        <div className="bg-[#141b2d] p-3 rounded-lg border border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-gray-400 text-[11px] block">Ethereum Dominance (ETH.D)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono font-extrabold text-blue-400">
                {sentiment.ethDominance.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-400">Layer 1 Lead</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-gray-400">Composite:</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
              {sentiment.sentimentScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* News & Intelligence Stream */}
      <div className="bg-[#121824] p-3.5 rounded-lg border border-gray-800 text-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-300">Market Intelligence Headlines</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-emerald-400">{sentiment.newsSentiment.bullishCount} Bullish</span>
            <span className="text-gray-500">•</span>
            <span className="text-red-400">{sentiment.newsSentiment.bearishCount} Bearish</span>
          </div>
        </div>

        {sentiment.newsSentiment.latestArticles.length > 0 ? (
          <div className="space-y-2">
            {sentiment.newsSentiment.latestArticles.map((article) => (
              <div
                key={article.id}
                className="bg-[#0b0e14] p-2.5 rounded border border-gray-800/80 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-white text-xs leading-snug">
                    {article.title}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 ${
                      article.sentiment === 'bullish'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : article.sentiment === 'bearish'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {article.sentiment}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
                  <span>{article.source}</span>
                  <span>{formatDateTime(article.publishedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs italic">News data streaming unavailable.</p>
        )}
      </div>
    </div>
  );
};
