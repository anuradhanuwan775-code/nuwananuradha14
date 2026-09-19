import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CryptoAsset,
  Candle,
  Timeframe,
  AISignal,
  TechnicalScoreBreakdown,
  DerivativesData,
  OrderBookData,
  SentimentData,
  FundamentalData,
  UserProfile,
  SupportResistanceZone,
  MarketStructurePoint,
  MarketStructureBreak,
  CandlestickPattern,
  ChartPattern,
  FibonacciLevel
} from './types';
import {
  fetchCandles,
  fetchTickers,
  fetchDerivativesData,
  fetchOrderBook,
  fetchSentimentData,
  fetchFundamentalData,
  getCurrentUser
} from './services/api';
import { binanceWs } from './services/binanceWs';
import {
  detectMarketStructure,
  calculateSupportResistanceZones,
  detectCandlestickPatterns,
  detectChartPatterns,
  calculateFibonacciLevels,
  calculateTechnicalScore
} from './utils/indicators';
import { generateAISignal } from './utils/signalEngine';

// Components
import { TopBar } from './components/TopBar';
import { CandleChart } from './components/CandleChart';
import { SignalCard } from './components/SignalCard';
import { TechnicalScorePanel } from './components/TechnicalScorePanel';
import { MarketStructurePanel } from './components/MarketStructurePanel';
import { MultiTimeframePanel } from './components/MultiTimeframePanel';
import { DerivativesPanel } from './components/DerivativesPanel';
import { SentimentPanel } from './components/SentimentPanel';
import { FundamentalPanel } from './components/FundamentalPanel';
import { BacktestingPanel } from './components/BacktestingPanel';
import { StrategyBuilderPanel } from './components/StrategyBuilderPanel';
import { WatchlistPanel } from './components/WatchlistPanel';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { AlertsModal } from './components/AlertsModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AiReportModal } from './components/AiReportModal';
import { AuthModal } from './components/AuthModal';

import {
  LayoutDashboard,
  Layers,
  Scale,
  Compass,
  BarChart2,
  Cpu,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'terminal' | 'structure' | 'derivatives' | 'sentiment' | 'backtest' | 'strategy'>('terminal');

  // Selected asset and timeframe
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');

  // Market data states
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [derivatives, setDerivatives] = useState<DerivativesData | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);

  // Connection & User
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingCandles, setLoadingCandles] = useState<boolean>(false);

  // Modals
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Initial user check
  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  // Initial tickers load
  const loadTickers = useCallback(async () => {
    try {
      const data = await fetchTickers();
      setAssets(data);
    } catch (e) {
      console.warn('Could not load tickers:', e);
    }
  }, []);

  useEffect(() => {
    loadTickers();
    const interval = setInterval(loadTickers, 30000);
    return () => clearInterval(interval);
  }, [loadTickers]);

  // Load candle history for symbol + timeframe
  const loadCandles = useCallback(async (symbol: string, tf: Timeframe) => {
    setLoadingCandles(true);
    try {
      const data = await fetchCandles(symbol, tf, 250);
      setCandles(data);
    } catch (e) {
      console.error('Failed to fetch candles:', e);
    } finally {
      setLoadingCandles(false);
    }
  }, []);

  // Load secondary analytical feeds
  const loadAuxiliaryData = useCallback(async (symbol: string) => {
    try {
      const [deriv, ob, sent, fund] = await Promise.all([
        fetchDerivativesData(symbol),
        fetchOrderBook(symbol),
        fetchSentimentData(),
        fetchFundamentalData(symbol)
      ]);
      setDerivatives(deriv);
      setOrderBook(ob);
      setSentiment(sent);
      setFundamentals(fund);
    } catch (e) {
      console.warn('Error fetching auxiliary data:', e);
    }
  }, []);

  // Reload when symbol or timeframe changes
  useEffect(() => {
    loadCandles(selectedSymbol, selectedTimeframe);
    loadAuxiliaryData(selectedSymbol);
  }, [selectedSymbol, selectedTimeframe, loadCandles, loadAuxiliaryData]);

  // Subscribe to live WebSocket updates
  useEffect(() => {
    binanceWs.connect();
    setWsConnected(true);

    const unsubKline = binanceWs.subscribeKline(selectedSymbol, selectedTimeframe, (klineCandle) => {
      setCandles(prev => {
        if (prev.length === 0) return [klineCandle];
        const last = prev[prev.length - 1];
        if (last.time === klineCandle.time) {
          // Update current candle in real time
          return [...prev.slice(0, -1), klineCandle];
        } else if (klineCandle.time > last.time) {
          // Append new candle
          return [...prev.slice(-249), klineCandle];
        }
        return prev;
      });
    });

    const unsubTicker = binanceWs.subscribeTicker(selectedSymbol, (liveData) => {
      setAssets(prev =>
        prev.map(a =>
          a.symbol === liveData.symbol
            ? {
                ...a,
                price: liveData.price,
                priceChangePercent24h: liveData.priceChangePercent,
                high24h: liveData.high24h,
                low24h: liveData.low24h,
                volume24h: liveData.volume24h
              }
            : a
        )
      );
    });

    return () => {
      unsubKline();
      unsubTicker();
    };
  }, [selectedSymbol, selectedTimeframe]);

  // Technical Calculations & Signal Generation
  const technicalAnalysis = useMemo(() => {
    if (candles.length < 20) {
      return {
        structure: null,
        supportResistance: [],
        candlestickPatterns: [],
        chartPatterns: [],
        fibonacci: [],
        techScore: null,
        signal: null
      };
    }

    const structure = detectMarketStructure(candles);
    const supportResistance = calculateSupportResistanceZones(candles);
    const candlestickPatterns = detectCandlestickPatterns(candles);
    const chartPatterns = detectChartPatterns(candles);
    const fibonacci = calculateFibonacciLevels(candles);
    const techScore = calculateTechnicalScore(candles);

    const signal = generateAISignal(
      candles,
      selectedSymbol,
      selectedTimeframe,
      derivatives,
      sentiment,
      fundamentals
    );

    return {
      structure,
      supportResistance,
      candlestickPatterns,
      chartPatterns,
      fibonacci,
      techScore,
      signal
    };
  }, [candles, selectedSymbol, selectedTimeframe, derivatives, sentiment, fundamentals]);

  const currentAsset = useMemo(() => {
    return (
      assets.find(a => a.symbol === selectedSymbol) || {
        symbol: selectedSymbol,
        baseAsset: selectedSymbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        name: selectedSymbol.replace('USDT', ''),
        price: candles[candles.length - 1]?.close ?? 100000,
        change24h: 2.35,
        priceChange24h: 1250,
        priceChangePercent24h: 2.35,
        high24h: (candles[candles.length - 1]?.close ?? 100000) * 1.02,
        low24h: (candles[candles.length - 1]?.close ?? 100000) * 0.98,
        volume24h: 28500,
        quoteVolume24h: 28500 * (candles[candles.length - 1]?.close ?? 100000),
        lastUpdated: Date.now()
      }

    );
  }, [assets, selectedSymbol, candles]);

  const latestPrice = candles[candles.length - 1]?.close ?? currentAsset.price;

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Institutional Top Bar */}
      <TopBar
        currentAsset={currentAsset}
        wsConnected={wsConnected}
        currentUser={currentUser}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          localStorage.removeItem('jwt_token');
          setCurrentUser(null);
        }}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Watchlist Sidebar (Left on Desktop) */}
        <aside className="w-full lg:w-64 shrink-0 p-3 lg:border-r border-[#1f2937] bg-[#090d15]/90">
          <WatchlistPanel
            assets={assets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
            onRefresh={loadTickers}
          />
        </aside>

        {/* Central Terminal / Analytics Core */}
        <main className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto max-h-[calc(100vh-50px)]">
          {/* Navigation Mode Tabs */}
          <div className="flex items-center justify-between gap-2 bg-[#0e131d] p-1.5 rounded-xl border border-gray-800 text-xs overflow-x-auto">
            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'terminal'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>TERMINAL</span>
              </button>

              <button
                onClick={() => setActiveTab('structure')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'structure'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>STRUCTURE & MTF</span>
              </button>

              <button
                onClick={() => setActiveTab('derivatives')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'derivatives'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>DERIVATIVES & L2</span>
              </button>

              <button
                onClick={() => setActiveTab('sentiment')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'sentiment'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>SENTIMENT & FUNDAMENTALS</span>
              </button>

              <button
                onClick={() => setActiveTab('backtest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'backtest'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>BACKTESTING</span>
              </button>

              <button
                onClick={() => setActiveTab('strategy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'strategy'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>STRATEGY BUILDER</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pr-2 text-[11px] font-mono text-gray-400">
              <span>{candles.length} Candlesticks</span>
              <button
                onClick={() => loadCandles(selectedSymbol, selectedTimeframe)}
                className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                title="Force Reload Data"
              >
                <RefreshCw className={`w-3 h-3 ${loadingCandles ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* TAB 1: TERMINAL (CHART + SIGNAL CARD + SCORE) */}
          {activeTab === 'terminal' && (
            <div className="space-y-3">
              {/* TradingView Lightweight Chart */}
              <CandleChart
                candles={candles}
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                signal={technicalAnalysis.signal}
                srZones={technicalAnalysis.supportResistance}
                structurePoints={technicalAnalysis.structure?.points}
                structureBreaks={technicalAnalysis.structure?.breaks}
                onTimeframeChange={(tf) => setSelectedTimeframe(tf)}
              />

              {/* Signals & Score Panels Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="xl:col-span-2">
                  <SignalCard signal={technicalAnalysis.signal} loading={loadingCandles} />
                </div>
                <div>
                  <TechnicalScorePanel score={technicalAnalysis.techScore} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARKET STRUCTURE & MTF MATRIX */}
          {activeTab === 'structure' && (
            <div className="space-y-3">
              <MultiTimeframePanel symbol={selectedSymbol} />
              <MarketStructurePanel
                structure={technicalAnalysis.structure}
                supportResistance={technicalAnalysis.supportResistance}
                candlestickPatterns={technicalAnalysis.candlestickPatterns}
                chartPatterns={technicalAnalysis.chartPatterns}
                fibonacci={technicalAnalysis.fibonacci}
              />
            </div>
          )}

          {/* TAB 3: DERIVATIVES & ORDER BOOK */}
          {activeTab === 'derivatives' && (
            <div className="space-y-3">
              <DerivativesPanel derivatives={derivatives} orderBook={orderBook} />
            </div>
          )}

          {/* TAB 4: SENTIMENT & FUNDAMENTALS */}
          {activeTab === 'sentiment' && (
            <div className="space-y-3">
              <SentimentPanel sentiment={sentiment} />
              <FundamentalPanel fundamentals={fundamentals} />
            </div>
          )}

          {/* TAB 5: BACKTESTING ENGINE */}
          {activeTab === 'backtest' && (
            <div className="space-y-3">
              <BacktestingPanel
                candles={candles}
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
              />
            </div>
          )}

          {/* TAB 6: STRATEGY BUILDER */}
          {activeTab === 'strategy' && (
            <div className="space-y-3">
              <StrategyBuilderPanel />
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* Risk Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        defaultEntry={technicalAnalysis.signal?.entryZone.min ?? latestPrice}
        defaultSL={technicalAnalysis.signal?.stopLoss.selected ?? latestPrice * 0.98}
        defaultTP={technicalAnalysis.signal?.takeProfit.tp1 ?? latestPrice * 1.04}
        symbol={selectedSymbol}
      />

      {/* Price Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        currentPrice={latestPrice}
        symbol={selectedSymbol}
      />

      {/* AI Quant Assistant Modal */}
      <AiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        symbol={selectedSymbol}
        currentPrice={latestPrice}
        timeframe={selectedTimeframe}
        contextData={{
          signal: technicalAnalysis.signal,
          score: technicalAnalysis.techScore,
          derivatives,
          structure: technicalAnalysis.structure
        }}
      />

      {/* AI Market Dossier Report Modal */}
      <AiReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        symbol={selectedSymbol}
        timeframe={selectedTimeframe}
        contextData={{
          currentPrice: latestPrice,
          signal: technicalAnalysis.signal,
          techScore: technicalAnalysis.techScore,
          derivatives,
          sentiment,
          fundamentals
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
export default App;
