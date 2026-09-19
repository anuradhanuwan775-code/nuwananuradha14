import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Calculator, X, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntry?: number;
  defaultSL?: number;
  defaultTP?: number;
  symbol?: string;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultEntry = 60000,
  defaultSL = 58500,
  defaultTP = 63500,
  symbol = 'BTCUSDT'
}) => {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [entryPrice, setEntryPrice] = useState<number>(defaultEntry);
  const [stopLoss, setStopLoss] = useState<number>(defaultSL);
  const [takeProfit, setTakeProfit] = useState<number>(defaultTP);
  const [leverage, setLeverage] = useState<number>(3);

  if (!isOpen) return null;

  const riskAmount = balance * (riskPercent / 100);
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const stopDistancePercent = entryPrice > 0 ? (stopDistance / entryPrice) * 100 : 0;
  
  // Position size in USD based on risk amount and stop distance
  const positionSizeUSD = stopDistancePercent > 0 ? (riskAmount / (stopDistancePercent / 100)) : 0;
  const quantity = entryPrice > 0 ? positionSizeUSD / entryPrice : 0;
  const marginRequired = leverage > 0 ? positionSizeUSD / leverage : positionSizeUSD;

  const rewardDistance = Math.abs(takeProfit - entryPrice);
  const rewardDistancePercent = entryPrice > 0 ? (rewardDistance / entryPrice) * 100 : 0;
  const potentialProfit = quantity * rewardDistance;
  const potentialLoss = riskAmount;
  const riskRewardRatio = stopDistance > 0 ? (rewardDistance / stopDistance).toFixed(2) : '0';

  const isExcessiveLeverage = leverage > 10;
  const isHighRiskPercent = riskPercent > 3.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-gray-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-gray-200 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">QUANTITATIVE RISK CALCULATOR</h3>
              <p className="text-xs text-gray-400">Position Sizing & Capital Preservation Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono mb-5">
          <div>
            <label className="text-gray-400 block mb-1">Account Balance ($)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Risk Per Trade (%)</label>
            <input
              type="number"
              step="0.25"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Entry Price ($)</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Stop Loss ($)</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-3 py-2 text-red-400 font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Take Profit ($)</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Leverage (x)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value) || 1)}
              className="w-full bg-[#141b2d] border border-gray-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Calculated Results */}
        <div className="bg-[#141b2d] border border-gray-800 rounded-xl p-4 space-y-3 font-mono text-xs mb-5">
          <div className="flex justify-between items-center py-1 border-b border-gray-800">
            <span className="text-gray-400">Total Position Value:</span>
            <span className="text-white font-bold text-sm">{formatCurrency(positionSizeUSD)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-800">
            <span className="text-gray-400">Coin Quantity:</span>
            <span className="text-white font-bold">
              {quantity.toFixed(4)} {symbol.replace('USDT', '')}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-800">
            <span className="text-gray-400">Margin Collateral Required:</span>
            <span className="text-blue-400 font-bold">{formatCurrency(marginRequired)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-800">
            <span className="text-gray-400">Risk Amount (1R):</span>
            <span className="text-red-400 font-bold">
              -{formatCurrency(potentialLoss)} ({riskPercent}%)
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-gray-800">
            <span className="text-gray-400">Potential Profit:</span>
            <span className="text-emerald-400 font-bold">+{formatCurrency(potentialProfit)}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400">Risk / Reward Ratio:</span>
            <span className="text-amber-400 font-bold text-sm">1 : {riskRewardRatio}</span>
          </div>
        </div>

        {/* Warnings & Best Practices */}
        {isExcessiveLeverage && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              <strong>Warning:</strong> High leverage ({leverage}x) exponentially magnifies liquidation risk. Institutional risk management recommends 2x - 5x max.
            </span>
          </div>
        )}

        {isHighRiskPercent && (
          <div className="p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Risking {riskPercent}% exceeds standard 1-2% institutional risk guidelines.
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition text-xs font-mono"
        >
          CONFIRM RISK PARAMETERS
        </button>
      </div>
    </div>
  );
};
