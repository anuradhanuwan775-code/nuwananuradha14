// Core types for AI Crypto Trading Analyzer

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' | '1w';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketTicker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  lastUpdated: number;
  name?: string;
  priceChangePercent24h?: number;
  priceChange24h?: number;
}


export interface IndicatorValues {
  ema9?: number;
  ema20?: number;
  ema50?: number;
  ema100?: number;
  ema200?: number;
  sma20?: number;
  vwap?: number;
  rsi?: {
    value: number;
    divergence: 'none' | 'bullish' | 'bearish';
    state: 'oversold' | 'weak' | 'neutral' | 'strong' | 'overbought';
  };
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
    crossover: 'none' | 'bullish' | 'bearish';
    expansion: 'expanding' | 'contracting';
  };
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  atr?: number;
  adx?: {
    adx: number;
    pdi: number;
    ndi: number;
    trendStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  };
  stochastic?: {
    k: number;
    d: number;
    state: 'oversold' | 'neutral' | 'overbought';
  };
  cci?: number;
  obv?: number;
  supertrend?: {
    value: number;
    trend: 'bullish' | 'bearish';
  };
  ichimoku?: {
    tenkan: number;
    kijun: number;
    senkouA: number;
    senkouB: number;
    cloudState: 'bullish' | 'bearish' | 'neutral';
  };
}

export interface IndicatorInterpretation {
  name: string;
  currentValue: number | string;
  previousValue?: number | string;
  interpretation: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidenceContribution: number; // -10 to +10
}

export interface MarketStructurePoint {
  index: number;
  time: number;
  price: number;
  type: 'HH' | 'HL' | 'LH' | 'LL';
}

export interface MarketStructureBreak {
  type: 'BOS' | 'CHOCH';
  direction: 'bullish' | 'bearish';
  price: number;
  time: number;
  description: string;
}

export interface SupportResistanceZone {
  id: string;
  type: 'support' | 'resistance';
  min: number;
  max: number;
  mid: number;
  strength: 'weak' | 'medium' | 'strong';
  touchCount: number;
  source: 'swing' | 'volume' | 'daily_hl' | 'weekly_hl';
}

export interface CandlestickPattern {
  name: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  time: number;
  price: number;
  reliability: 'low' | 'medium' | 'high';
  description: string;
}

export interface ChartPattern {
  name: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  targetPrice?: number;
  invalidationPrice?: number;
  confidence: number;
  description: string;
}

export interface FibonacciLevel {
  ratio: number;
  price: number;
  label: string;
  isKeyLevel: boolean;
}

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  trend: 'bullish' | 'bearish' | 'neutral';
  structure: 'bullish' | 'bearish' | 'ranging';
  momentum: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  volumeBias: 'bullish' | 'bearish' | 'neutral';
  signalBias: 'LONG' | 'SHORT' | 'WAIT';
  score: number; // 0 - 100
}

export interface MultiTimeframeSummary {
  timeframes: Record<string, TimeframeAnalysis>;
  alignmentScore: number; // 0 - 100%
  dominantBias: 'bullish' | 'bearish' | 'neutral';
  confluenceDescription: string;
}

export interface FundamentalData {
  symbol: string;
  name: string;
  marketCap: number;
  fdv: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  marketCapRank: number;
  volume24h: number;
  ath: number;
  athDate?: string;
  athChangePercentage: number;
  atl: number;
  atlDate?: string;
  atlChangePercentage: number;
  score: number; // 0 - 100
  supplyInflationRisk: 'low' | 'moderate' | 'high';
  utilityAnalysis: string;
}

export interface SentimentData {
  fearAndGreed: {
    value: number;
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
    timestamp: number;
  };
  btcDominance: number;
  ethDominance: number;
  newsSentiment: {
    score: number; // -100 to +100
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    latestArticles: Array<{
      id: string;
      title: string;
      source: string;
      publishedAt: string;
      url: string;
      sentiment: 'bullish' | 'bearish' | 'neutral';
    }>;
  };
  sentimentScore: number; // 0 - 100
}

export interface DerivativesData {
  symbol: string;
  fundingRate: number; // e.g. 0.0001 = 0.01%
  fundingTime: number;
  openInterest: number;
  openInterestChange24h: number;
  longShortRatio: number;
  markPrice: number;
  indexPrice: number;
  basis: number;
  condition: 'price_up_oi_up' | 'price_down_oi_up' | 'price_up_oi_down' | 'price_down_oi_down' | 'neutral';
  crowdedState: 'crowded_long' | 'crowded_short' | 'balanced';
  derivativesScore: number; // 0 - 100
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercentage: number;
  bidDepthTotal: number;
  askDepthTotal: number;
  imbalanceRatio: number; // >1 means bid dominant, <1 ask dominant
  largeWalls: Array<{
    type: 'bid' | 'ask';
    price: number;
    amount: number;
    significance: 'moderate' | 'heavy';
  }>;
  pressureScore: number; // 0 - 100
}

export interface TechnicalScoreBreakdown {
  trendScore: number; // max 20
  momentumScore: number; // max 20
  volumeScore: number; // max 10
  volatilityScore: number; // max 10
  structureScore: number; // max 20
  total: number; // max 80
  details: {
    trend: string;
    momentum: string;
    volume: string;
    volatility: string;
    structure: string;
  };
}

export type SignalBias = 'LONG' | 'SHORT' | 'WAIT';

export interface AISignal {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  bias: SignalBias;
  confidence: number; // 0 - 100%
  strength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  marketRegime: 'Trending Bullish' | 'Trending Bearish' | 'Range' | 'High Volatility' | 'Low Volatility';
  dataQuality: 'Excellent' | 'Good' | 'Limited' | 'Unavailable';
  
  entryZone: {
    min: number;
    max: number;
    trigger: string;
    invalidationPrice: number;
  };
  stopLoss: {
    conservative: number;
    balanced: number;
    aggressive: number;
    selected: number;
    distancePercent: number;
  };
  takeProfit: {
    tp1: number;
    tp2: number;
    tp3: number;
  };
  riskRewardRatio: number; // e.g. 2.4 (1:2.4)
  
  scores: {
    technical: number; // 0 - 100
    structure: number; // 0 - 100
    volume: number; // 0 - 100
    derivatives: number; // 0 - 100
    fundamental: number; // 0 - 100
    sentiment: number; // 0 - 100
    compositeScore: number; // 0 - 100
  };
  
  reasons: string[];
  risks: string[];
  noTradeFiltersHit?: string[];
  explanation: string;
}

export interface BacktestConfig {
  symbol: string;
  timeframe: Timeframe;
  strategy: 'ema_trend_rsi' | 'market_structure_break' | 'supertrend_vwap' | 'multi_confluence';
  initialCapital: number;
  riskPerTradePercent: number;
  stopLossType: 'balanced' | 'conservative' | 'aggressive';
  targetRR: number;
  candleLimit: number;
}

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  result: 'WIN' | 'LOSS';
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  durationCandles: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage
  profitFactor: number;
  netProfit: number;
  netProfitPercent: number;
  averageProfit: number;
  averageLoss: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  averageRR: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  equityCurve: Array<{ time: number; equity: number }>;
  trades: BacktestTrade[];
}

export interface CustomStrategyRule {
  id: string;
  indicator: string;
  operator: '>' | '<' | 'cross_above' | 'cross_below' | 'equals';
  thresholdValue: string | number;
}

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  rules: CustomStrategyRule[];
  action: 'LONG' | 'SHORT';
  minConfidence: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'rsi_above' | 'rsi_below' | 'rsi_oversold' | 'rsi_overbought' | 'structure_break' | 'bos_break' | 'signal_long' | 'signal_short' | 'high_confidence';
  targetValue: number;
  createdAt: number;
  triggered?: boolean;
  triggeredAt?: number;
  message?: string;
  active?: boolean;
  note?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  username?: string;
  token?: string;
  createdAt: string;
}

export type UserProfile = UserAccount;
export type CryptoAsset = MarketTicker;
