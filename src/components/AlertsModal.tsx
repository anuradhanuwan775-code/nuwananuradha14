import React, { useState } from 'react';
import { PriceAlert } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Bell, Plus, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  symbol: string;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  currentPrice,
  symbol
}) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: 'alert_1',
      symbol,
      type: 'price_above',
      targetValue: currentPrice * 1.03,
      createdAt: Date.now() - 3600000,
      active: true,
      note: 'Breakout above resistance'
    },
    {
      id: 'alert_2',
      symbol,
      type: 'rsi_oversold',
      targetValue: 30,
      createdAt: Date.now() - 7200000,
      active: true,
      note: 'RSI oversold dip entry'
    }
  ]);

  const [alertType, setAlertType] = useState<PriceAlert['type']>('price_above');
  const [targetVal, setTargetVal] = useState<number>(currentPrice * 1.02);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleAddAlert = () => {
    const newAlert: PriceAlert = {
      id: `alert_${Date.now()}`,
      symbol,
      type: alertType,
      targetValue: targetVal,
      createdAt: Date.now(),
      active: true,
      note: note || `${alertType.replace('_', ' ')} ${targetVal}`
    };
    setAlerts([newAlert, ...alerts]);
    setNote('');
  };

  const handleRemove = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleToggle = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-gray-200 relative">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">ACTIVE PRICE & INDICATOR ALERTS</h3>
              <p className="text-xs text-gray-400">Real-time alerts for {symbol} (Current: ${currentPrice.toLocaleString()})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Alert Form */}
        <div className="bg-[#141b2d] p-4 rounded-xl border border-gray-800 space-y-3 text-xs font-mono mb-4">
          <span className="font-bold text-gray-300 block">Create New Alert Condition</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 block mb-1">Trigger Condition</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as any)}
                className="w-full bg-[#0b0e14] border border-gray-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="price_above">Price Crosses Above ($)</option>
                <option value="price_below">Price Crosses Below ($)</option>
                <option value="rsi_overbought">RSI Crosses Overbought (&gt; 70)</option>
                <option value="rsi_oversold">RSI Crosses Oversold (&lt; 30)</option>
                <option value="structure_break">Market Structure Break (BOS/CHOCH)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">Target Value</label>
              <input
                type="number"
                value={targetVal}
                onChange={(e) => setTargetVal(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-gray-700 rounded px-2.5 py-1.5 text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Resistance level bounce confirmation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0b0e14] border border-gray-700 rounded px-2.5 py-1.5 text-white placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleAddAlert}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            SAVE ALERT
          </button>
        </div>

        {/* Existing Alerts List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {alerts.map((al) => (
            <div
              key={al.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#141b2d] border border-gray-800 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={al.active}
                  onChange={() => handleToggle(al.id)}
                  className="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className={`font-bold ${al.active ? 'text-white' : 'text-gray-500 line-through'}`}>
                    {al.type.replace('_', ' ').toUpperCase()} {al.targetValue}
                  </span>
                  {al.note && <span className="text-[10px] text-gray-400 block">{al.note}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">{formatDateTime(al.createdAt)}</span>
                <button
                  onClick={() => handleRemove(al.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
