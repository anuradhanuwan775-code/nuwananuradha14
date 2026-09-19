import {
  Candle,
  IndicatorValues,
  IndicatorInterpretation,
  MarketStructurePoint,
  MarketStructureBreak,
  SupportResistanceZone,
  CandlestickPattern,
  ChartPattern,
  FibonacciLevel,
  TechnicalScoreBreakdown
} from '../types';

// SMA calculation
export function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

// EMA calculation
export function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const k = 2 / (period + 1);
  let prevEMA: number | undefined;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
      continue;
    }
    if (prevEMA === undefined) {
      // First EMA is SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      prevEMA = sum / period;
      result.push(prevEMA);
    } else {
      prevEMA = data[i] * k + prevEMA * (1 - k);
      result.push(prevEMA);
    }
  }
  return result;
}

// RSI calculation with Wilder smoothing and divergence
export function calculateRSI(
  candles: Candle[],
  period: number = 14
): {
  values: (number | undefined)[];
  current: number;
  divergence: 'none' | 'bullish' | 'bearish';
  state: 'oversold' | 'weak' | 'neutral' | 'strong' | 'overbought';
} {
  const closes = candles.map(c => c.close);
  const values: (number | undefined)[] = [];
  if (closes.length <= period) {
    return { values: [], current: 50, divergence: 'none', state: 'neutral' };
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    values.push(undefined);
  }

  let firstRSI = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  values.push(firstRSI);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    values.push(rsi);
  }

  const current = values[values.length - 1] ?? 50;

  // Divergence check over last 20 candles
  let divergence: 'none' | 'bullish' | 'bearish' = 'none';
  if (candles.length >= 25 && values.length >= 25) {
    const recentCandles = candles.slice(-20);
    const recentRSI = values.slice(-20) as number[];

    // Find two prominent swing lows
    const p1Close = recentCandles[recentCandles.length - 1].close;
    const p2Close = recentCandles[recentCandles.length - 10]?.close ?? p1Close;
    const r1 = recentRSI[recentRSI.length - 1];
    const r2 = recentRSI[recentRSI.length - 10] ?? r1;

    // Bullish Divergence: Price Lower Low, RSI Higher Low
    if (p1Close < p2Close && r1 > r2 && r1 < 45) {
      divergence = 'bullish';
    }
    // Bearish Divergence: Price Higher High, RSI Lower High
    else if (p1Close > p2Close && r1 < r2 && r1 > 55) {
      divergence = 'bearish';
    }
  }

  let state: 'oversold' | 'weak' | 'neutral' | 'strong' | 'overbought' = 'neutral';
  if (current < 30) state = 'oversold';
  else if (current < 45) state = 'weak';
  else if (current <= 55) state = 'neutral';
  else if (current <= 70) state = 'strong';
  else state = 'overbought';

  return { values, current, divergence, state };
}

// MACD (12, 26, 9)
export function calculateMACD(candles: Candle[]): {
  macdLine: (number | undefined)[];
  signalLine: (number | undefined)[];
  histogram: (number | undefined)[];
  current: {
    macd: number;
    signal: number;
    histogram: number;
    crossover: 'none' | 'bullish' | 'bearish';
    expansion: 'expanding' | 'contracting';
  };
} {
  const closes = candles.map(c => c.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const macdLine: (number | undefined)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLine.push(ema12[i]! - ema26[i]!);
    } else {
      macdLine.push(undefined);
    }
  }

  // Filter valid macd points for signal line
  const validMacd = macdLine.filter((v): v is number => v !== undefined);
  const validSignal = calculateEMA(validMacd, 9);

  const signalLine: (number | undefined)[] = [];
  let signalIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === undefined) {
      signalLine.push(undefined);
    } else {
      signalLine.push(validSignal[signalIdx++]);
    }
  }

  const histogram: (number | undefined)[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== undefined && signalLine[i] !== undefined) {
      histogram.push(macdLine[i]! - signalLine[i]!);
    } else {
      histogram.push(undefined);
    }
  }

  const lastM = macdLine[macdLine.length - 1] ?? 0;
  const prevM = macdLine[macdLine.length - 2] ?? 0;
  const lastS = signalLine[signalLine.length - 1] ?? 0;
  const prevS = signalLine[signalLine.length - 2] ?? 0;
  const lastH = histogram[histogram.length - 1] ?? 0;
  const prevH = histogram[histogram.length - 2] ?? 0;

  let crossover: 'none' | 'bullish' | 'bearish' = 'none';
  if (prevM <= prevS && lastM > lastS) crossover = 'bullish';
  else if (prevM >= prevS && lastM < lastS) crossover = 'bearish';

  const expansion = Math.abs(lastH) >= Math.abs(prevH) ? 'expanding' : 'contracting';

  return {
    macdLine,
    signalLine,
    histogram,
    current: {
      macd: lastM,
      signal: lastS,
      histogram: lastH,
      crossover,
      expansion
    }
  };
}

// ATR calculation
export function calculateATR(candles: Candle[], period: number = 14): {
  values: (number | undefined)[];
  current: number;
} {
  if (candles.length < 2) return { values: [], current: 0 };

  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const val = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    tr.push(val);
  }

  const values: (number | undefined)[] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      sum += tr[i];
      values.push(undefined);
    } else if (i === period - 1) {
      sum += tr[i];
      values.push(sum / period);
    } else {
      const prevATR = values[i - 1]!;
      const currentATR = (prevATR * (period - 1) + tr[i]) / period;
      values.push(currentATR);
    }
  }

  const current = values[values.length - 1] ?? (candles[candles.length - 1].high - candles[candles.length - 1].low);
  return { values, current };
}

// Bollinger Bands (20, 2)
export function calculateBollingerBands(candles: Candle[], period: number = 20, multiplier: number = 2) {
  const closes = candles.map(c => c.close);
  const sma = calculateSMA(closes, period);
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = sma[i];
    if (mid === undefined) {
      upper.push(undefined);
      lower.push(undefined);
      continue;
    }
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(closes[i - j] - mid, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(mid + stdDev * multiplier);
    lower.push(mid - stdDev * multiplier);
  }

  const lastClose = closes[closes.length - 1];
  const lastMid = sma[sma.length - 1] ?? lastClose;
  const lastUpper = upper[upper.length - 1] ?? lastClose;
  const lastLower = lower[lower.length - 1] ?? lastClose;
  const bandwidth = lastMid !== 0 ? (lastUpper - lastLower) / lastMid : 0;
  const percentB = (lastUpper - lastLower) !== 0 ? (lastClose - lastLower) / (lastUpper - lastLower) : 0.5;

  return {
    sma,
    upper,
    lower,
    current: {
      middle: lastMid,
      upper: lastUpper,
      lower: lastLower,
      bandwidth,
      percentB
    }
  };
}

// VWAP (Volume Weighted Average Price)
export function calculateVWAP(candles: Candle[]): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    result.push(cumulativeVolume > 0 ? cumulativeTypicalPriceVolume / cumulativeVolume : c.close);
  }
  return result;
}

// Supertrend calculation
export function calculateSupertrend(candles: Candle[], period: number = 10, multiplier: number = 3) {
  const { values: atrValues } = calculateATR(candles, period);
  const result: { value: number; trend: 'bullish' | 'bearish' }[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend: 'bullish' | 'bearish' = 'bullish';

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const atr = atrValues[i] ?? (c.high - c.low);
    const hl2 = (c.high + c.low) / 2;

    let basicUpper = hl2 + multiplier * atr;
    let basicLower = hl2 - multiplier * atr;

    let finalUpper = (basicUpper < prevUpper || (i > 0 && candles[i - 1].close > prevUpper)) ? basicUpper : prevUpper;
    let finalLower = (basicLower > prevLower || (i > 0 && candles[i - 1].close < prevLower)) ? basicLower : prevLower;

    let currentTrend: 'bullish' | 'bearish' = prevTrend;
    if (prevTrend === 'bullish') {
      if (c.close < finalLower) currentTrend = 'bearish';
    } else {
      if (c.close > finalUpper) currentTrend = 'bullish';
    }

    const value = currentTrend === 'bullish' ? finalLower : finalUpper;
    result.push({ value, trend: currentTrend });

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = currentTrend;
  }

  return {
    values: result,
    current: result[result.length - 1] ?? { value: candles[candles.length - 1]?.close ?? 0, trend: 'bullish' }
  };
}

// Ichimoku Cloud
export function calculateIchimoku(candles: Candle[]) {
  const getHLAvg = (slice: Candle[]) => {
    if (slice.length === 0) return 0;
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    return (Math.max(...highs) + Math.min(...lows)) / 2;
  };

  const len = candles.length;
  if (len < 52) {
    const c = candles[len - 1]?.close ?? 0;
    return { tenkan: c, kijun: c, senkouA: c, senkouB: c, cloudState: 'neutral' as const };
  }

  const tenkan = getHLAvg(candles.slice(-9));
  const kijun = getHLAvg(candles.slice(-26));
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = getHLAvg(candles.slice(-52));
  const close = candles[len - 1].close;

  let cloudState: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (close > senkouA && close > senkouB && senkouA > senkouB) cloudState = 'bullish';
  else if (close < senkouA && close < senkouB && senkouA < senkouB) cloudState = 'bearish';

  return { tenkan, kijun, senkouA, senkouB, cloudState };
}

// ADX (+DI, -DI, ADX)
export function calculateADX(candles: Candle[], period: number = 14) {
  if (candles.length <= period * 2) {
    return { adx: 25, pdi: 20, ndi: 20, trendStrength: 'moderate' as const };
  }

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close));
    trs.push(tr);

    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;

    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smooth TR and DMs
  let smoothTR = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

  const dxList: number[] = [];

  for (let i = period; i < trs.length; i++) {
    smoothTR = smoothTR - smoothTR / period + trs[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDMs[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDMs[i];

    const pdi = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const ndi = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const sum = pdi + ndi;
    const dx = sum > 0 ? (Math.abs(pdi - ndi) / sum) * 100 : 0;
    dxList.push(dx);
  }

  const lastDX = dxList[dxList.length - 1] ?? 20;
  const recentDX = dxList.slice(-period);
  const adx = recentDX.length > 0 ? recentDX.reduce((a, b) => a + b, 0) / recentDX.length : lastDX;

  let trendStrength: 'weak' | 'moderate' | 'strong' | 'very_strong' = 'moderate';
  if (adx < 20) trendStrength = 'weak';
  else if (adx < 25) trendStrength = 'moderate';
  else if (adx < 40) trendStrength = 'strong';
  else trendStrength = 'very_strong';

  const lastPlusDM = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 20;
  const lastMinusDM = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 20;

  return { adx, pdi: lastPlusDM, ndi: lastMinusDM, trendStrength };
}

// Stochastic Oscillator (%K, %D)
export function calculateStochastic(candles: Candle[], kPeriod: number = 14, dPeriod: number = 3) {
  if (candles.length < kPeriod + dPeriod) {
    return { k: 50, d: 50, state: 'neutral' as const };
  }

  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const window = candles.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...window.map(c => c.high));
    const lowest = Math.min(...window.map(c => c.low));
    const currentClose = candles[i].close;
    const k = highest !== lowest ? ((currentClose - lowest) / (highest - lowest)) * 100 : 50;
    kValues.push(k);
  }

  const recentK = kValues.slice(-dPeriod);
  const d = recentK.reduce((a, b) => a + b, 0) / recentK.length;
  const k = kValues[kValues.length - 1] ?? 50;

  let state: 'oversold' | 'neutral' | 'overbought' = 'neutral';
  if (k < 20 && d < 20) state = 'oversold';
  else if (k > 80 && d > 80) state = 'overbought';

  return { k, d, state };
}

// Market Structure: Swing Highs/Lows, HH, HL, LH, LL, BOS, CHOCH
export function detectMarketStructure(candles: Candle[]): {
  points: MarketStructurePoint[];
  breaks: MarketStructureBreak[];
  currentStructure: 'bullish' | 'bearish' | 'ranging';
  summary: string;
} {
  const points: MarketStructurePoint[] = [];
  const breaks: MarketStructureBreak[] = [];

  if (candles.length < 20) {
    return { points, breaks, currentStructure: 'ranging', summary: 'Insufficient candle data for structural analysis' };
  }

  const lookback = 3; // swing pivot order
  let lastSwingHigh: { price: number; time: number; type: 'HH' | 'LH' } | null = null;
  let lastSwingLow: { price: number; time: number; type: 'HL' | 'LL' } | null = null;
  let prevStructure: 'bullish' | 'bearish' = 'bullish';

  for (let i = lookback; i < candles.length - lookback; i++) {
    const cur = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= cur.high || candles[i + j].high > cur.high) isSwingHigh = false;
      if (candles[i - j].low <= cur.low || candles[i + j].low < cur.low) isSwingLow = false;
    }

    if (isSwingHigh) {
      let type: 'HH' | 'LH' = 'HH';
      if (lastSwingHigh) {
        type = cur.high > lastSwingHigh.price ? 'HH' : 'LH';
      }
      points.push({ index: i, time: cur.time, price: cur.high, type });

      // Check BOS or CHOCH
      if (lastSwingHigh) {
        if (cur.high > lastSwingHigh.price) {
          if (prevStructure === 'bullish') {
            breaks.push({
              type: 'BOS',
              direction: 'bullish',
              price: lastSwingHigh.price,
              time: cur.time,
              description: `Bullish Break of Structure above ${lastSwingHigh.price.toFixed(2)}`
            });
          } else {
            breaks.push({
              type: 'CHOCH',
              direction: 'bullish',
              price: lastSwingHigh.price,
              time: cur.time,
              description: `Change of Character to Bullish above ${lastSwingHigh.price.toFixed(2)}`
            });
            prevStructure = 'bullish';
          }
        }
      }
      lastSwingHigh = { price: cur.high, time: cur.time, type };
    }

    if (isSwingLow) {
      let type: 'HL' | 'LL' = 'HL';
      if (lastSwingLow) {
        type = cur.low < lastSwingLow.price ? 'LL' : 'HL';
      }
      points.push({ index: i, time: cur.time, price: cur.low, type });

      if (lastSwingLow) {
        if (cur.low < lastSwingLow.price) {
          if (prevStructure === 'bearish') {
            breaks.push({
              type: 'BOS',
              direction: 'bearish',
              price: lastSwingLow.price,
              time: cur.time,
              description: `Bearish Break of Structure below ${lastSwingLow.price.toFixed(2)}`
            });
          } else {
            breaks.push({
              type: 'CHOCH',
              direction: 'bearish',
              price: lastSwingLow.price,
              time: cur.time,
              description: `Change of Character to Bearish below ${lastSwingLow.price.toFixed(2)}`
            });
            prevStructure = 'bearish';
          }
        }
      }
      lastSwingLow = { price: cur.low, time: cur.time, type };
    }
  }

  // Determine current market structure based on latest points
  const recentPoints = points.slice(-5);
  const hhCount = recentPoints.filter(p => p.type === 'HH').length;
  const hlCount = recentPoints.filter(p => p.type === 'HL').length;
  const lhCount = recentPoints.filter(p => p.type === 'LH').length;
  const llCount = recentPoints.filter(p => p.type === 'LL').length;

  let currentStructure: 'bullish' | 'bearish' | 'ranging' = 'ranging';
  if (hhCount + hlCount >= 3) currentStructure = 'bullish';
  else if (lhCount + llCount >= 3) currentStructure = 'bearish';

  const summary = currentStructure === 'bullish'
    ? 'Bullish structure: Series of Higher Highs and Higher Lows confirmed.'
    : currentStructure === 'bearish'
    ? 'Bearish structure: Series of Lower Highs and Lower Lows confirmed.'
    : 'Ranging structure: Indecisive consolidation between swing extremes.';

  return { points, breaks, currentStructure, summary };
}

// Support and Resistance Zones Detection
export function calculateSupportResistanceZones(candles: Candle[]): SupportResistanceZone[] {
  return detectSupportResistance(candles);
}

export function detectSupportResistance(candles: Candle[]): SupportResistanceZone[] {

  if (candles.length < 30) return [];
  const zones: SupportResistanceZone[] = [];

  const currentPrice = candles[candles.length - 1].close;
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const range = maxPrice - minPrice;
  const clusterTolerance = range * 0.015; // 1.5% cluster zone

  // Collect swing points
  const swingLevels: { price: number; isHigh: boolean }[] = [];
  for (let i = 2; i < candles.length - 2; i++) {
    if (candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high) {
      swingLevels.push({ price: candles[i].high, isHigh: true });
    }
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) {
      swingLevels.push({ price: candles[i].low, isHigh: false });
    }
  }

  // Cluster nearby levels
  const visited = new Set<number>();
  for (let i = 0; i < swingLevels.length; i++) {
    if (visited.has(i)) continue;
    const base = swingLevels[i];
    const cluster: number[] = [base.price];
    visited.add(i);

    for (let j = i + 1; j < swingLevels.length; j++) {
      if (visited.has(j)) continue;
      if (Math.abs(swingLevels[j].price - base.price) <= clusterTolerance) {
        cluster.push(swingLevels[j].price);
        visited.add(j);
      }
    }

    if (cluster.length >= 2) {
      const avg = cluster.reduce((a, b) => a + b, 0) / cluster.length;
      const zoneMin = Math.min(...cluster) * 0.998;
      const zoneMax = Math.max(...cluster) * 1.002;
      const touchCount = cluster.length;
      const strength: 'weak' | 'medium' | 'strong' = touchCount >= 4 ? 'strong' : touchCount >= 3 ? 'medium' : 'weak';

      zones.push({
        id: `sr_${Math.round(avg)}`,
        type: avg > currentPrice ? 'resistance' : 'support',
        min: zoneMin,
        max: zoneMax,
        mid: avg,
        strength,
        touchCount,
        source: 'swing'
      });
    }
  }

  // Add Previous Day High / Low
  if (candles.length >= 24) {
    const prevDay = candles.slice(-24, -1);
    const pdh = Math.max(...prevDay.map(c => c.high));
    const pdl = Math.min(...prevDay.map(c => c.low));

    zones.push({
      id: `sr_pdh_${Math.round(pdh)}`,
      type: pdh > currentPrice ? 'resistance' : 'support',
      min: pdh * 0.998,
      max: pdh * 1.002,
      mid: pdh,
      strength: 'medium',
      touchCount: 3,
      source: 'daily_hl'
    });

    zones.push({
      id: `sr_pdl_${Math.round(pdl)}`,
      type: pdl > currentPrice ? 'resistance' : 'support',
      min: pdl * 0.998,
      max: pdl * 1.002,
      mid: pdl,
      strength: 'medium',
      touchCount: 3,
      source: 'daily_hl'
    });
  }

  return zones.sort((a, b) => a.mid - b.mid);
}

// Candlestick Pattern Detection
export function detectCandlestickPatterns(candles: Candle[]): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  if (candles.length < 5) return patterns;

  const len = candles.length;
  const cur = candles[len - 1];
  const prev = candles[len - 2];
  const pprev = candles[len - 3];

  const body = Math.abs(cur.close - cur.open);
  const upperShadow = cur.high - Math.max(cur.close, cur.open);
  const lowerShadow = Math.min(cur.close, cur.open) - cur.low;
  const candleRange = cur.high - cur.low;

  // Bullish Engulfing
  if (prev.close < prev.open && cur.close > cur.open && cur.close >= prev.open && cur.open <= prev.close) {
    patterns.push({
      name: 'Bullish Engulfing',
      bias: 'bullish',
      time: cur.time,
      price: cur.close,
      reliability: 'high',
      description: 'Strong buyer takeover engulfing previous bearish body.'
    });
  }

  // Bearish Engulfing
  if (prev.close > prev.open && cur.close < cur.open && cur.close <= prev.open && cur.open >= prev.close) {
    patterns.push({
      name: 'Bearish Engulfing',
      bias: 'bearish',
      time: cur.time,
      price: cur.close,
      reliability: 'high',
      description: 'Sellers overwhelmed buyers, completely absorbing previous candle.'
    });
  }

  // Hammer (bullish rejection at support)
  if (lowerShadow >= 2 * body && upperShadow <= 0.2 * body && candleRange > 0) {
    patterns.push({
      name: 'Hammer',
      bias: 'bullish',
      time: cur.time,
      price: cur.low,
      reliability: 'medium',
      description: 'Long lower wick shows strong price rejection by aggressive buyers.'
    });
  }

  // Shooting Star
  if (upperShadow >= 2 * body && lowerShadow <= 0.2 * body && candleRange > 0) {
    patterns.push({
      name: 'Shooting Star',
      bias: 'bearish',
      time: cur.time,
      price: cur.high,
      reliability: 'medium',
      description: 'Upper shadow exhaustion shows sellers pushing back higher prices.'
    });
  }

  // Morning Star (3 candle bullish reversal)
  if (pprev.close < pprev.open && Math.abs(prev.close - prev.open) < (pprev.high - pprev.low) * 0.3 && cur.close > cur.open && cur.close > (pprev.open + pprev.close) / 2) {
    patterns.push({
      name: 'Morning Star',
      bias: 'bullish',
      time: cur.time,
      price: cur.close,
      reliability: 'high',
      description: 'Three-bar bottom reversal confirming exhaustion and fresh demand.'
    });
  }

  // Doji
  if (body <= candleRange * 0.1 && candleRange > 0) {
    patterns.push({
      name: 'Doji',
      bias: 'neutral',
      time: cur.time,
      price: cur.close,
      reliability: 'low',
      description: 'Equilibrium between buyers and sellers; market pausing at equilibrium.'
    });
  }

  return patterns;
}

// Chart Pattern Detection (Double Top/Bottom, Triangles, Head & Shoulders)
export function detectChartPatterns(candles: Candle[]): ChartPattern[] {
  const patterns: ChartPattern[] = [];
  if (candles.length < 40) return patterns;

  const currentPrice = candles[candles.length - 1].close;
  const recent = candles.slice(-30);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  // Find two highest peaks in recent window
  const sortedHighs = [...highs].sort((a, b) => b - a);
  const h1 = sortedHighs[0];
  const h2 = sortedHighs[1];

  // Double Top
  if (Math.abs(h1 - h2) / h1 < 0.005 && currentPrice < (h1 + sortedHighs[sortedHighs.length - 1]) / 2) {
    patterns.push({
      name: 'Double Top',
      bias: 'bearish',
      targetPrice: currentPrice * 0.97,
      invalidationPrice: h1 * 1.005,
      confidence: 72,
      description: 'Twin resistance test failing to break higher, showing exhaustion.'
    });
  }

  // Double Bottom
  const sortedLows = [...lows].sort((a, b) => a - b);
  const l1 = sortedLows[0];
  const l2 = sortedLows[1];
  if (Math.abs(l1 - l2) / l1 < 0.005 && currentPrice > (l1 + sortedHighs[0]) / 2) {
    patterns.push({
      name: 'Double Bottom',
      bias: 'bullish',
      targetPrice: currentPrice * 1.03,
      invalidationPrice: l1 * 0.995,
      confidence: 75,
      description: 'Twin support test rejecting lower lows, suggesting buyer accumulation.'
    });
  }

  return patterns;
}

// Fibonacci Retracement Levels
export function calculateFibonacci(candles: Candle[]): FibonacciLevel[] {
  return calculateFibonacciLevels(candles);
}

export function calculateFibonacciLevels(candles: Candle[]): FibonacciLevel[] {

  if (candles.length < 20) return [];
  const slice = candles.slice(-50);
  const highs = slice.map(c => c.high);
  const lows = slice.map(c => c.low);
  const swingHigh = Math.max(...highs);
  const swingLow = Math.min(...lows);
  const diff = swingHigh - swingLow;

  const ratios = [
    { ratio: 0, label: '0.0 (Swing High)', key: false },
    { ratio: 0.236, label: '0.236', key: false },
    { ratio: 0.382, label: '0.382 (Pullback)', key: true },
    { ratio: 0.5, label: '0.500 (Equilibrium)', key: true },
    { ratio: 0.618, label: '0.618 (Golden Pocket)', key: true },
    { ratio: 0.786, label: '0.786 (Deep Retrace)', key: false },
    { ratio: 1.0, label: '1.0 (Swing Low)', key: false }
  ];

  return ratios.map(r => ({
    ratio: r.ratio,
    price: swingHigh - diff * r.ratio,
    label: r.label,
    isKeyLevel: r.key
  }));
}

// Technical Score Breakdown (max 80 points)
export function calculateTechnicalScore(candles: Candle[]): TechnicalScoreBreakdown {
  const currentPrice = candles[candles.length - 1]?.close ?? 0;
  const closes = candles.map(c => c.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema100 = calculateEMA(closes, 100);
  const ema200 = calculateEMA(closes, 200);

  const e20 = ema20[ema20.length - 1] ?? currentPrice;
  const e50 = ema50[ema50.length - 1] ?? currentPrice;
  const e100 = ema100[ema100.length - 1] ?? currentPrice;
  const e200 = ema200[ema200.length - 1] ?? currentPrice;

  // 1. Trend Score (max 20)
  let trendScore = 10;
  if (currentPrice > e200) trendScore += 4; else trendScore -= 4;
  if (e20 > e50) trendScore += 3; else trendScore -= 3;
  if (e50 > e200) trendScore += 3; else trendScore -= 3;
  trendScore = Math.max(0, Math.min(20, trendScore));

  // 2. Momentum Score (max 20) via RSI + MACD
  const { current: rsiVal } = calculateRSI(candles, 14);
  const { current: macdCur } = calculateMACD(candles);
  let momentumScore = 10;
  if (rsiVal >= 50 && rsiVal <= 70) momentumScore += 4;
  else if (rsiVal > 70) momentumScore += 1;
  else if (rsiVal < 35) momentumScore -= 4;

  if (macdCur.macd > macdCur.signal) momentumScore += 3; else momentumScore -= 3;
  if (macdCur.histogram > 0) momentumScore += 3; else momentumScore -= 3;
  momentumScore = Math.max(0, Math.min(20, momentumScore));

  // 3. Volume Score (max 10)
  const volumes = candles.map(c => c.volume);
  const avgVol = calculateSMA(volumes, 20);
  const curVol = volumes[volumes.length - 1] ?? 0;
  const recentAvg = avgVol[avgVol.length - 1] ?? curVol;
  let volumeScore = 5;
  if (curVol > recentAvg * 1.5) volumeScore = 9;
  else if (curVol > recentAvg) volumeScore = 7;
  else volumeScore = 4;

  // 4. Volatility Score (max 10)
  const { current: atr } = calculateATR(candles, 14);
  const atrPct = currentPrice > 0 ? (atr / currentPrice) * 100 : 1;
  let volatilityScore = 6;
  if (atrPct >= 1.5 && atrPct <= 4) volatilityScore = 8;
  else if (atrPct > 4) volatilityScore = 5; // excessive volatility
  else volatilityScore = 5;

  // 5. Structure Score (max 20)
  const { currentStructure } = detectMarketStructure(candles);
  let structureScore = 10;
  if (currentStructure === 'bullish') structureScore = 17;
  else if (currentStructure === 'bearish') structureScore = 4;
  else structureScore = 10;

  const total = trendScore + momentumScore + volumeScore + volatilityScore + structureScore;

  return {
    trendScore,
    momentumScore,
    volumeScore,
    volatilityScore,
    structureScore,
    total,
    details: {
      trend: currentPrice > e200 ? 'Bullish alignment above EMA 200' : 'Bearish alignment below EMA 200',
      momentum: `RSI ${rsiVal.toFixed(1)} with ${macdCur.macd > macdCur.signal ? 'bullish' : 'bearish'} MACD`,
      volume: curVol > recentAvg ? 'Above average participation' : 'Normal / sub-average volume',
      volatility: `ATR ${atr.toFixed(2)} (${atrPct.toFixed(2)}% of asset price)`,
      structure: `${currentStructure.toUpperCase()} structural phase`
    }
  };
}
