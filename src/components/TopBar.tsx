import React from 'react';
import { CryptoAsset, UserProfile } from '../types';
import { formatCurrency, formatPercent, formatCompactNumber } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Bell,
  FileText,
  Bot,
  User,
  Activity,
  Zap,
  Radio
} from 'lucide-react';

interface TopBarProps {
  currentAsset: CryptoAsset | null;
  wsConnected: boolean;
  currentUser: UserProfile | null;
  onOpenRiskCalc: () => void;
  onOpenAlerts: () => void;
  onOpenReport: () => void;
  onOpenAssistant: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentAsset,
  wsConnected,
  currentUser,
  onOpenRiskCalc,
  onOpenAlerts,
  onOpenReport,
  onOpenAssistant,
  onOpenAuth,
  onLogout
}) => {
  const changePercent = currentAsset?.priceChangePercent24h ?? currentAsset?.change24h ?? 0;
  const isPositive = changePercent >= 0;


  return (
    <header className="bg-[#0b0e14] border-b border-[#1f2937] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Brand & Market Telemetry */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white">
                NEXUS<span className="text-blue-500">QUANT</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO AI
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{wsConnected ? 'BINANCE L2 FEED' : 'REST SYNC'}</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-800 hidden sm:block" />

        {/* Live Price & 24h Stats */}
        {currentAsset && (
          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="text-[10px] text-gray-500 block">PRICE</span>
              <span className="text-base font-bold text-white leading-none">
                {formatCurrency(currentAsset.price)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 block">24H CHANGE</span>
              <span
                className={`text-xs font-bold flex items-center gap-0.5 leading-none ${
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPercent(changePercent)}
              </span>
            </div>

            <div className="hidden md:block">
              <span className="text-[10px] text-gray-500 block">24H HIGH</span>
              <span className="text-xs text-gray-300 font-medium leading-none">
                {formatCurrency(currentAsset.high24h)}
              </span>
            </div>

            <div className="hidden md:block">
              <span className="text-[10px] text-gray-500 block">24H LOW</span>
              <span className="text-xs text-gray-300 font-medium leading-none">
                {formatCurrency(currentAsset.low24h)}
              </span>
            </div>

            <div className="hidden lg:block">
              <span className="text-[10px] text-gray-500 block">24H VOL</span>
              <span className="text-xs text-gray-300 font-medium leading-none">
                {formatCompactNumber(currentAsset.volume24h)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Utilities & Auth */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onOpenRiskCalc}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2d] hover:bg-[#1a233a] border border-gray-800 text-gray-300 hover:text-white transition font-mono"
          title="Risk & Position Sizing Calculator"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Risk Calc</span>
        </button>

        <button
          onClick={onOpenAlerts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2d] hover:bg-[#1a233a] border border-gray-800 text-gray-300 hover:text-white transition font-mono"
          title="Price & Technical Alerts"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Alerts</span>
        </button>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2d] hover:bg-[#1a233a] border border-gray-800 text-gray-300 hover:text-white transition font-mono"
          title="Generate AI Market Dossier"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">AI Report</span>
        </button>

        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition font-mono font-bold shadow-md"
          title="Chat with AI Quant Assistant"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Quant</span>
        </button>

        <div className="h-5 w-px bg-gray-800 mx-1" />

        {currentUser ? (
          <div className="flex items-center gap-2 font-mono">
            <span className="text-gray-300 font-semibold">{currentUser.username}</span>
            <button
              onClick={onLogout}
              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px]"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition font-mono"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
