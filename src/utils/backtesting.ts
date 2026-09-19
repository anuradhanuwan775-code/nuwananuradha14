import { Candle, BacktestConfig, BacktestResult, BacktestTrade } from '../types';
import { calculateEMA, calculateRSI, calculateATR, calculateSupertrend, calculateVWAP } from './indicators';

export function runBacktest(candles: Candle[], config: BacktestConfig): BacktestResult {
  const {
    initialCapital = 10000,
    riskPerTradePercent = 2,
    targetRR = 2.0,
    strategy = 'ema_trend_rsi'
  } = config;

  if (candles.length < 50) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      profitFactor: 1,
      netProfit: 0,
      netProfitPercent: 0,
      averageProfit: 0,
      averageLoss: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      averageRR: targetRR,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      equityCurve: [{ time: candles[0]?.time ?? Date.now() / 1000, equity: initialCapital }],
      trades: []
    };
  }

  const closes = candles.map(c => c.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const { values: rsiValues } = calculateRSI(candles, 14);
  const { values: atrValues } = calculateATR(candles, 14);
  const { values: supertrendValues } = calculateSupertrend(candles, 10, 3);
  const vwapValues = calculateVWAP(candles);

  let currentCapital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const trades: BacktestTrade[] = [];
  const equityCurve: Array<{ time: number; equity: number }> = [
    { time: candles[0].time, equity: initialCapital }
  ];

  let currentTrade: {
    type: 'LONG' | 'SHORT';
    entryIndex: number;
    entryTime: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskAmount: number;
  } | null = null;

  for (let i = 50; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];

    // If currently in trade, check exit
    if (currentTrade) {
      let exitPrice: number | null = null;
      let result: 'WIN' | 'LOSS' = 'LOSS';

      if (currentTrade.type === 'LONG') {
        if (c.low <= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss;
          result = 'LOSS';
        } else if (c.high >= currentTrade.takeProfit) {
          exitPrice = currentTrade.takeProfit;
          result = 'WIN';
        }
      } else {
        if (c.high >= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss;
          result = 'LOSS';
        } else if (c.low <= currentTrade.takeProfit) {
          exitPrice = currentTrade.takeProfit;
          result = 'WIN';
        }
      }

      if (exitPrice !== null) {
        const risk = Math.abs(currentTrade.entryPrice - currentTrade.stopLoss);
        const gainLoss = currentTrade.type === 'LONG'
          ? (exitPrice - currentTrade.entryPrice)
          : (currentTrade.entryPrice - exitPrice);

        const rMultiple = risk > 0 ? gainLoss / risk : 0;
        const pnl = currentTrade.riskAmount * rMultiple;

        currentCapital += pnl;
        if (currentCapital > peakCapital) peakCapital = currentCapital;
        const dd = peakCapital - currentCapital;
        const ddPct = (dd / peakCapital) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
        if (ddPct > maxDrawdownPercent) maxDrawdownPercent = ddPct;

        trades.push({
          id: `trade_${trades.length + 1}`,
          entryTime: currentTrade.entryTime,
          exitTime: c.time,
          type: currentTrade.type,
          entryPrice: currentTrade.entryPrice,
          exitPrice,
          stopLoss: currentTrade.stopLoss,
          takeProfit: currentTrade.takeProfit,
          result,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(((pnl / (currentCapital - pnl)) * 100).toFixed(2)),
          rMultiple: Number(rMultiple.toFixed(2)),
          durationCandles: i - currentTrade.entryIndex
        });

        equityCurve.push({ time: c.time, equity: Number(currentCapital.toFixed(2)) });
        currentTrade = null;
      }
    }

    // If not in trade, look for new entry setup
    if (!currentTrade && i < candles.length - 1) {
      const e20 = ema20[i];
      const e50 = ema50[i];
      const e200 = ema200[i];
      const rsi = rsiValues[i];
      const atr = atrValues[i] ?? (c.high - c.low);
      const st = supertrendValues[i];
      const vwap = vwapValues[i] ?? c.close;

      let signal: 'LONG' | 'SHORT' | null = null;

      if (strategy === 'ema_trend_rsi') {
        // Trend pullbacks: Price > 200 EMA, 20 EMA > 50 EMA, RSI crosses above 45
        if (e20 && e50 && e200 && rsi) {
          if (c.close > e200 && e20 > e50 && rsi > 45 && rsi < 65 && prevC.close <= (e20 ?? 0) && c.close > (e20 ?? 0)) {
            signal = 'LONG';
          } else if (c.close < e200 && e20 < e50 && rsi < 55 && rsi > 35 && prevC.close >= (e20 ?? 0) && c.close < (e20 ?? 0)) {
            signal = 'SHORT';
          }
        }
      } else if (strategy === 'supertrend_vwap') {
        if (st) {
          if (st.trend === 'bullish' && c.close > vwap && prevC.close <= vwap) {
            signal = 'LONG';
          } else if (st.trend === 'bearish' && c.close < vwap && prevC.close >= vwap) {
            signal = 'SHORT';
          }
        }
      } else {
        // Multi-confluence
        if (e20 && e50 && rsi && st) {
          if (c.close > e50 && st.trend === 'bullish' && rsi > 50) {
            signal = 'LONG';
          } else if (c.close < e50 && st.trend === 'bearish' && rsi < 50) {
            signal = 'SHORT';
          }
        }
      }

      if (signal) {
        const riskAmount = currentCapital * (riskPerTradePercent / 100);
        const stopDistance = Math.max(atr * 1.5, c.close * 0.008);

        let stopLoss = 0;
        let takeProfit = 0;

        if (signal === 'LONG') {
          stopLoss = c.close - stopDistance;
          takeProfit = c.close + stopDistance * targetRR;
        } else {
          stopLoss = c.close + stopDistance;
          takeProfit = c.close - stopDistance * targetRR;
        }

        currentTrade = {
          type: signal,
          entryIndex: i,
          entryTime: c.time,
          entryPrice: c.close,
          stopLoss,
          takeProfit,
          riskAmount
        };
      }
    }
  }

  const winningTrades = trades.filter(t => t.result === 'WIN');
  const losingTrades = trades.filter(t => t.result === 'LOSS');
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

  const totalGains = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? 99 : 1;

  const netProfit = currentCapital - initialCapital;
  const netProfitPercent = (netProfit / initialCapital) * 100;

  const averageProfit = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  const returns = trades.map(t => t.pnlPercent);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnStdDev = returns.length > 1
    ? Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / (returns.length - 1))
    : 1;
  const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0;

  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let curWins = 0;
  let curLosses = 0;

  for (const t of trades) {
    if (t.result === 'WIN') {
      curWins++;
      curLosses = 0;
      if (curWins > maxConsecWins) maxConsecWins = curWins;
    } else {
      curLosses++;
      curWins = 0;
      if (curLosses > maxConsecLosses) maxConsecLosses = curLosses;
    }
  }

  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    netProfitPercent: Number(netProfitPercent.toFixed(2)),
    averageProfit: Number(averageProfit.toFixed(2)),
    averageLoss: Number(averageLoss.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    averageRR: targetRR,
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    consecutiveWins: maxConsecWins,
    consecutiveLosses: maxConsecLosses,
    equityCurve,
    trades
  };
}
