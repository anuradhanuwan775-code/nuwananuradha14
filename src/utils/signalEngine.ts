import {
  Candle,
  Timeframe,
  AISignal,
  SignalBias,
  DerivativesData,
  FundamentalData,
  SentimentData,
  SupportResistanceZone
} from '../types';
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateSMA,
  detectMarketStructure,
  detectSupportResistance,
  calculateFibonacci
} from './indicators';

export interface SignalEngineInputs {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  derivatives?: DerivativesData | null;
  fundamentals?: FundamentalData | null;
  sentiment?: SentimentData | null;
}

export function generateAISignal(
  inputsOrCandles: SignalEngineInputs | Candle[],
  posSymbol?: string,
  posTimeframe?: Timeframe,
  posDerivatives?: DerivativesData | null,
  posSentiment?: SentimentData | null,
  posFundamentals?: FundamentalData | null
): AISignal {
  let symbol: string;
  let timeframe: Timeframe;
  let candles: Candle[];
  let derivatives: DerivativesData | null | undefined;
  let fundamentals: FundamentalData | null | undefined;
  let sentiment: SentimentData | null | undefined;

  if (Array.isArray(inputsOrCandles)) {
    candles = inputsOrCandles;
    symbol = posSymbol || 'BTCUSDT';
    timeframe = posTimeframe || '1h';
    derivatives = posDerivatives;
    sentiment = posSentiment;
    fundamentals = posFundamentals;
  } else {
    symbol = inputsOrCandles.symbol;
    timeframe = inputsOrCandles.timeframe;
    candles = inputsOrCandles.candles;
    derivatives = inputsOrCandles.derivatives;
    fundamentals = inputsOrCandles.fundamentals;
    sentiment = inputsOrCandles.sentiment;
  }

  const currentPrice = candles[candles.length - 1]?.close ?? 1;
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  const reasons: string[] = [];
  const risks: string[] = [];
  const noTradeFiltersHit: string[] = [];

  // Data Quality check
  let dataQuality: 'Excellent' | 'Good' | 'Limited' | 'Unavailable' = 'Good';
  if (candles.length < 50) {
    dataQuality = 'Limited';
    noTradeFiltersHit.push('Insufficient candle history (< 50 bars)');
  } else if (candles.length >= 200 && derivatives && fundamentals && sentiment) {
    dataQuality = 'Excellent';
  }

  // 1. Technical Analysis Score (0 - 100, weight 40%)
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);

  const ema20 = ema20Arr[ema20Arr.length - 1] ?? currentPrice;
  const ema50 = ema50Arr[ema50Arr.length - 1] ?? currentPrice;
  const ema200 = ema200Arr[ema200Arr.length - 1] ?? currentPrice;

  const { current: rsi, divergence: rsiDiv } = calculateRSI(candles, 14);
  const { current: macd } = calculateMACD(candles);
  const { current: atr } = calculateATR(candles, 14);

  let technicalScore = 50;

  // Trend checks
  if (currentPrice > ema200) {
    technicalScore += 12;
    reasons.push(`Price ($${currentPrice.toLocaleString()}) is comfortably above the 200 EMA baseline ($${ema200.toLocaleString()})`);
  } else {
    technicalScore -= 12;
    risks.push(`Price is trading below the key 200 EMA resistance ($${ema200.toLocaleString()})`);
  }

  if (ema20 > ema50) {
    technicalScore += 8;
    reasons.push('Short-term 20 EMA is trending above 50 EMA (bullish alignment)');
  } else {
    technicalScore -= 8;
    risks.push('20 EMA is below 50 EMA indicating short-term bearish pressure');
  }

  // RSI checks
  if (rsi >= 50 && rsi <= 68) {
    technicalScore += 10;
    reasons.push(`RSI at ${rsi.toFixed(1)} indicates healthy bullish expansion without being overbought`);
  } else if (rsi > 70) {
    technicalScore -= 5;
    risks.push(`RSI at ${rsi.toFixed(1)} is in overbought territory (>70), elevating pullback risk`);
  } else if (rsi < 30) {
    technicalScore += 2;
    risks.push(`RSI at ${rsi.toFixed(1)} is heavily oversold (<30)`);
  } else {
    technicalScore -= 8;
    risks.push(`RSI at ${rsi.toFixed(1)} indicates weak relative momentum (<50)`);
  }

  if (rsiDiv === 'bullish') {
    technicalScore += 12;
    reasons.push('Confirmed Bullish RSI Divergence on recent swing lows');
  } else if (rsiDiv === 'bearish') {
    technicalScore -= 12;
    risks.push('Confirmed Bearish RSI Divergence: Momentum weakening despite price highs');
  }

  // MACD checks
  if (macd.macd > macd.signal && macd.histogram > 0) {
    technicalScore += 10;
    reasons.push('Positive MACD crossover with expanding positive histogram');
  } else if (macd.macd < macd.signal) {
    technicalScore -= 10;
    risks.push('Bearish MACD crossover with negative momentum');
  }

  technicalScore = Math.max(0, Math.min(100, technicalScore));

  // 2. Market Structure Score (0 - 100, weight 20%)
  const { currentStructure, breaks } = detectMarketStructure(candles);
  let structureScore = 50;

  if (currentStructure === 'bullish') {
    structureScore = 85;
    reasons.push('Price maintaining Higher Highs (HH) and Higher Lows (HL) structure');
  } else if (currentStructure === 'bearish') {
    structureScore = 15;
    risks.push('Market structure is Bearish with confirmed Lower Highs and Lower Lows');
  } else {
    structureScore = 50;
    reasons.push('Consolidation structure within established range boundaries');
  }

  // Check recent BOS / CHOCH
  const recentBreaks = breaks.slice(-2);
  for (const b of recentBreaks) {
    if (b.direction === 'bullish') {
      structureScore = Math.min(100, structureScore + 10);
      reasons.push(`Recent ${b.type}: Bullish structural breakout confirmed`);
    } else {
      structureScore = Math.max(0, structureScore - 10);
      risks.push(`Recent ${b.type}: Bearish structural breakdown observed`);
    }
  }

  // 3. Volume Score (0 - 100, weight 10%)
  const volSmaArr = calculateSMA(volumes, 20);
  const curVol = volumes[volumes.length - 1] ?? 0;
  const avgVol = volSmaArr[volSmaArr.length - 1] ?? curVol;
  let volumeScore = 50;

  if (curVol > avgVol * 1.5) {
    volumeScore = 85;
    reasons.push(`Strong volume expansion (${(curVol / avgVol).toFixed(1)}x relative to 20-period average)`);
  } else if (curVol > avgVol) {
    volumeScore = 65;
    reasons.push('Volume exceeds 20-period moving average');
  } else {
    volumeScore = 40;
    risks.push('Sub-average volume suggests lack of institutional conviction');
  }

  // 4. Derivatives Score (0 - 100, weight 10%)
  let derivativesScore = 50;
  if (derivatives) {
    if (derivatives.fundingRate > 0.0005) {
      derivativesScore -= 20;
      risks.push(`Elevated positive funding rate (${(derivatives.fundingRate * 100).toFixed(4)}%) indicates crowded longs`);
    } else if (derivatives.fundingRate < -0.0002) {
      derivativesScore += 20;
      reasons.push(`Negative funding (${(derivatives.fundingRate * 100).toFixed(4)}%) creates short squeeze potential`);
    }

    if (derivatives.condition === 'price_up_oi_up') {
      derivativesScore += 15;
      reasons.push('Price rising accompanied by expanding Open Interest confirms genuine spot/perp demand');
    } else if (derivatives.condition === 'price_down_oi_up') {
      derivativesScore -= 15;
      risks.push('Price falling with expanding Open Interest indicates aggressive short positioning');
    }
  }
  derivativesScore = Math.max(0, Math.min(100, derivativesScore));

  // 5. Fundamental Score (0 - 100, weight 10%)
  let fundamentalScore = 60;
  if (fundamentals) {
    fundamentalScore = fundamentals.score;
    if (fundamentals.supplyInflationRisk === 'high') {
      risks.push('High supply inflation risk based on circulating vs maximum token supply');
    } else {
      reasons.push(`Robust fundamental ranking (#${fundamentals.marketCapRank || 'Top'}) with solid liquidity`);
    }
  }

  // 6. Sentiment Score (0 - 100, weight 10%)
  let sentimentScore = 50;
  if (sentiment) {
    sentimentScore = sentiment.sentimentScore;
    if (sentiment.fearAndGreed.classification === 'Extreme Greed') {
      risks.push(`Market sentiment is at Extreme Greed (${sentiment.fearAndGreed.value}/100)`);
    } else if (sentiment.fearAndGreed.classification === 'Fear' || sentiment.fearAndGreed.classification === 'Extreme Fear') {
      reasons.push(`Contrarian opportunity: Sentiment in ${sentiment.fearAndGreed.classification} (${sentiment.fearAndGreed.value}/100)`);
    }
  }

  // Composite Weighted Score
  const compositeScore = Math.round(
    technicalScore * 0.40 +
    structureScore * 0.20 +
    volumeScore * 0.10 +
    derivativesScore * 0.10 +
    fundamentalScore * 0.10 +
    sentimentScore * 0.10
  );

  // Determine Bias
  let bias: SignalBias = 'WAIT';
  if (compositeScore >= 68) {
    bias = 'LONG';
  } else if (compositeScore <= 36) {
    bias = 'SHORT';
  } else {
    bias = 'WAIT';
  }

  // Confidence is normalized distance from neutral 50
  const confidence = Math.min(94, Math.max(52, Math.round(Math.abs(compositeScore - 50) * 1.5 + 45)));

  let strength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong' = 'Moderate';
  if (confidence >= 82) strength = 'Very Strong';
  else if (confidence >= 72) strength = 'Strong';
  else if (confidence >= 60) strength = 'Moderate';
  else strength = 'Weak';

  // Market Regime
  let marketRegime: 'Trending Bullish' | 'Trending Bearish' | 'Range' | 'High Volatility' | 'Low Volatility' = 'Range';
  const atrPercent = (atr / currentPrice) * 100;
  if (atrPercent > 4.5) marketRegime = 'High Volatility';
  else if (atrPercent < 1.0) marketRegime = 'Low Volatility';
  else if (currentStructure === 'bullish' && technicalScore > 60) marketRegime = 'Trending Bullish';
  else if (currentStructure === 'bearish' && technicalScore < 40) marketRegime = 'Trending Bearish';

  // Safety / No-trade filters
  if (atrPercent > 6.0) {
    noTradeFiltersHit.push(`Abnormal market volatility (ATR is ${atrPercent.toFixed(2)}% of asset price)`);
  }
  if (compositeScore > 45 && compositeScore < 55) {
    noTradeFiltersHit.push('Equilibrium state: Indicators showing conflicting directional confluence');
  }

  if (noTradeFiltersHit.length > 0 && bias !== 'WAIT') {
    bias = 'WAIT';
    risks.push(`Safety trigger: Switched to WAIT due to ${noTradeFiltersHit[0]}`);
  }

  // Confluence Zones for Entry, SL, TP
  const srZones = detectSupportResistance(candles);
  const nearestSupport = srZones.filter(z => z.type === 'support').sort((a, b) => b.mid - a.mid)[0];
  const nearestResistance = srZones.filter(z => z.type === 'resistance').sort((a, b) => a.mid - b.mid)[0];

  let entryMin = currentPrice;
  let entryMax = currentPrice;
  let slConservative = currentPrice;
  let slBalanced = currentPrice;
  let slAggressive = currentPrice;
  let tp1 = currentPrice;
  let tp2 = currentPrice;
  let tp3 = currentPrice;

  if (bias === 'LONG') {
    entryMin = Math.min(currentPrice * 0.996, nearestSupport ? nearestSupport.max : currentPrice * 0.995);
    entryMax = currentPrice * 1.001;

    slAggressive = currentPrice - atr * 1.2;
    slBalanced = nearestSupport ? nearestSupport.min * 0.997 : currentPrice - atr * 1.8;
    slConservative = currentPrice - atr * 2.5;

    const riskDistance = currentPrice - slBalanced;
    tp1 = currentPrice + riskDistance * 1.5;
    tp2 = nearestResistance ? nearestResistance.min : currentPrice + riskDistance * 2.5;
    tp3 = currentPrice + riskDistance * 3.8;
  } else if (bias === 'SHORT') {
    entryMin = currentPrice * 0.999;
    entryMax = Math.max(currentPrice * 1.004, nearestResistance ? nearestResistance.min : currentPrice * 1.005);

    slAggressive = currentPrice + atr * 1.2;
    slBalanced = nearestResistance ? nearestResistance.max * 1.003 : currentPrice + atr * 1.8;
    slConservative = currentPrice + atr * 2.5;

    const riskDistance = slBalanced - currentPrice;
    tp1 = currentPrice - riskDistance * 1.5;
    tp2 = nearestSupport ? nearestSupport.max : currentPrice - riskDistance * 2.5;
    tp3 = currentPrice - riskDistance * 3.8;
  } else {
    // WAIT mode levels
    entryMin = currentPrice * 0.99;
    entryMax = currentPrice * 1.01;
    slBalanced = currentPrice - atr * 1.8;
    slConservative = currentPrice - atr * 2.5;
    slAggressive = currentPrice - atr * 1.2;
    tp1 = currentPrice * 1.02;
    tp2 = currentPrice * 1.04;
    tp3 = currentPrice * 1.07;
  }

  const risk = Math.abs(currentPrice - slBalanced);
  const reward = Math.abs(tp2 - currentPrice);
  const riskRewardRatio = risk > 0 ? Number((reward / risk).toFixed(2)) : 2.0;

  const trigger = bias === 'LONG'
    ? `${timeframe.toUpperCase()} bullish rejection candle holding above $${entryMin.toFixed(2)} with volume confirmation`
    : bias === 'SHORT'
    ? `${timeframe.toUpperCase()} bearish rejection wick below $${entryMax.toFixed(2)} with momentum divergence`
    : 'Waiting for clean breakout of key structure boundaries before executing new positioning';

  const explanation = bias === 'LONG'
    ? `Constructive long bias driven by technical score of ${technicalScore}/100 and ${currentStructure} market structure. Confluence is reinforced by EMA alignment and stable volume.`
    : bias === 'SHORT'
    ? `Defensive short bias indicated by composite score of ${compositeScore}/100 and negative momentum expansion below key resistance levels.`
    : `Market is in an indecisive ${marketRegime} regime. No-trade filters recommend capital preservation until directional confluence exceeds 68%.`;

  return {
    id: `sig_${symbol}_${timeframe}_${Date.now()}`,
    symbol,
    timeframe,
    timestamp: Date.now(),
    bias,
    confidence,
    strength,
    marketRegime,
    dataQuality,
    entryZone: {
      min: Number(entryMin.toFixed(2)),
      max: Number(entryMax.toFixed(2)),
      trigger,
      invalidationPrice: Number(slBalanced.toFixed(2))
    },
    stopLoss: {
      conservative: Number(slConservative.toFixed(2)),
      balanced: Number(slBalanced.toFixed(2)),
      aggressive: Number(slAggressive.toFixed(2)),
      selected: Number(slBalanced.toFixed(2)),
      distancePercent: Number((Math.abs(currentPrice - slBalanced) / currentPrice * 100).toFixed(2))
    },
    takeProfit: {
      tp1: Number(tp1.toFixed(2)),
      tp2: Number(tp2.toFixed(2)),
      tp3: Number(tp3.toFixed(2))
    },
    riskRewardRatio,
    scores: {
      technical: technicalScore,
      structure: structureScore,
      volume: volumeScore,
      derivatives: derivativesScore,
      fundamental: fundamentalScore,
      sentiment: sentimentScore,
      compositeScore
    },
    reasons,
    risks,
    noTradeFiltersHit: noTradeFiltersHit.length > 0 ? noTradeFiltersHit : undefined,
    explanation
  };
}
