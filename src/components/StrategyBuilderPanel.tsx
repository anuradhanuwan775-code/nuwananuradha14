import React, { useState } from 'react';
import { CustomStrategyRule, StrategyConfig } from '../types';
import { Cpu, Plus, Trash2, CheckCircle2, Play } from 'lucide-react';

export const StrategyBuilderPanel: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([
    {
      id: 'strat_1',
      name: 'Momentum Trend Rider',
      description: 'EMA20 > EMA50 AND RSI > 50 AND Volume > Average',
      action: 'LONG',
      minConfidence: 75,
      rules: [
        { id: 'r1', indicator: 'EMA 20', operator: '>', thresholdValue: 'EMA 50' },
        { id: 'r2', indicator: 'RSI (14)', operator: '>', thresholdValue: '50' },
        { id: 'r3', indicator: 'Volume', operator: '>', thresholdValue: 'Volume SMA (20)' }
      ]
    },
    {
      id: 'strat_2',
      name: 'Mean Reversion Oversold',
      description: 'RSI < 30 AND Price > EMA 200 AND Bullish Divergence',
      action: 'LONG',
      minConfidence: 80,
      rules: [
        { id: 'r4', indicator: 'RSI (14)', operator: '<', thresholdValue: '30' },
        { id: 'r5', indicator: 'Price', operator: '>', thresholdValue: 'EMA 200' },
        { id: 'r6', indicator: 'RSI Divergence', operator: 'equals', thresholdValue: 'Bullish' }
      ]
    }
  ]);

  const [activeStrategy, setActiveStrategy] = useState<StrategyConfig>(strategies[0]);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestStrategy = () => {
    setTestResult('Strategy evaluated: 3 rules satisfied on current BTC 1H candle. Action: LONG BIAS (Confidence 78%).');
  };

  const handleAddRule = () => {
    const newRule: CustomStrategyRule = {
      id: `rule_${Date.now()}`,
      indicator: 'RSI (14)',
      operator: '>',
      thresholdValue: '55'
    };
    setActiveStrategy({
      ...activeStrategy,
      rules: [...activeStrategy.rules, newRule]
    });
  };

  const handleRemoveRule = (id: string) => {
    setActiveStrategy({
      ...activeStrategy,
      rules: activeStrategy.rules.filter(r => r.id !== id)
    });
  };

  return (
    <div className="bg-[#0f1523] border border-gray-800/80 rounded-xl p-5 shadow-xl text-gray-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white text-sm tracking-wide">STRATEGY BUILDER & RULE ENGINE</h3>
        </div>
        <button
          onClick={handleTestStrategy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          TEST ACTIVE RULE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Strategy list */}
        <div className="space-y-2">
          <span className="text-gray-400 block font-mono text-[11px]">Saved Strategies</span>
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStrategy(s);
                setTestResult(null);
              }}
              className={`w-full text-left p-3 rounded-lg border transition ${
                activeStrategy.id === s.id
                  ? 'bg-blue-600/10 border-blue-500/40 text-white'
                  : 'bg-[#141b2d] border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">{s.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  {s.action}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-2">{s.description}</p>
            </button>
          ))}
        </div>

        {/* Rule Editor */}
        <div className="md:col-span-2 bg-[#121824] p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white font-mono">{activeStrategy.name} Rules</span>
              <button
                onClick={handleAddRule}
                className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-mono text-[11px] transition"
              >
                <Plus className="w-3 h-3" /> Add Condition
              </button>
            </div>

            <div className="space-y-2">
              {activeStrategy.rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 bg-[#0b0e14] p-2 rounded-lg border border-gray-800 font-mono text-xs"
                >
                  <span className="text-gray-500 w-6">#{idx + 1}</span>
                  <input
                    type="text"
                    value={rule.indicator}
                    onChange={(e) => {
                      const updated = [...activeStrategy.rules];
                      updated[idx].indicator = e.target.value;
                      setActiveStrategy({ ...activeStrategy, rules: updated });
                    }}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs w-36"
                  />
                  <select
                    value={rule.operator}
                    onChange={(e) => {
                      const updated = [...activeStrategy.rules];
                      updated[idx].operator = e.target.value as any;
                      setActiveStrategy({ ...activeStrategy, rules: updated });
                    }}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                  >
                    <option value=">">&gt; (Greater)</option>
                    <option value="<">&lt; (Less)</option>
                    <option value="cross_above">Crosses Above</option>
                    <option value="cross_below">Crosses Below</option>
                    <option value="equals">Equals</option>
                  </select>
                  <input
                    type="text"
                    value={rule.thresholdValue}
                    onChange={(e) => {
                      const updated = [...activeStrategy.rules];
                      updated[idx].thresholdValue = e.target.value;
                      setActiveStrategy({ ...activeStrategy, rules: updated });
                    }}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs flex-1"
                  />
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {testResult && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{testResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
