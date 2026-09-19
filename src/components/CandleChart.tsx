import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  Time,
  createSeriesMarkers
} from 'lightweight-charts';
import { Candle, Timeframe, AISignal, SupportResistanceZone, MarketStructurePoint, MarketStructureBreak } from '../types';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateVWAP,
  calculateSupertrend,
  calculateRSI,
  calculateMACD
} from '../utils/indicators';
import { Maximize2, Minimize2, Eye, EyeOff, BarChart2, RefreshCw } from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: Timeframe;
  signal?: AISignal | null;
  srZones?: SupportResistanceZone[];
  structurePoints?: MarketStructurePoint[];
  structureBreaks?: MarketStructureBreak[];
  onTimeframeChange: (tf: Timeframe) => void;
  className?: string;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  symbol,
  timeframe,
  signal,
  srZones = [],
  structurePoints = [],
  structureBreaks = [],
  onTimeframeChange,
  className = ''
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Indicator series refs
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema100SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const supertrendSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Price lines refs
  const priceLinesRef = useRef<any[]>([]);

  // Toggles for UI
  const [showEMA9, setShowEMA9] = useState(false);
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA100, setShowEMA100] = useState(false);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showSMA, setShowSMA] = useState(false);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showTradeLines, setShowTradeLines] = useState(true);
  const [showSRZones, setShowSRZones] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<'none' | 'rsi' | 'macd'>('rsi');

  // Hovered candle info
  const [hoverData, setHoverData] = useState<{
    time?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  const timeframes: Timeframe[] = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w'];

  // Initialize and rebuild chart when container mounts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e14' },
        textColor: '#848e9c'
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: LineStyle.Dashed
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: LineStyle.Dashed
        }
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartRef.current = chart;

    // Main Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });
    candleSeriesRef.current = candleSeries;

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: '#26a69a'
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    // Indicator Line Series
    ema9SeriesRef.current = chart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 1, title: 'EMA 9' });
    ema20SeriesRef.current = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, title: 'EMA 20' });
    ema50SeriesRef.current = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, title: 'EMA 50' });
    ema100SeriesRef.current = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1, title: 'EMA 100' });
    ema200SeriesRef.current = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 2, title: 'EMA 200' });
    sma20SeriesRef.current = chart.addSeries(LineSeries, { color: '#14b8a6', lineWidth: 1, title: 'SMA 20' });
    vwapSeriesRef.current = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, lineStyle: LineStyle.Dotted, title: 'VWAP' });

    bbUpperSeriesRef.current = chart.addSeries(LineSeries, { color: '#6366f1', lineWidth: 1, lineStyle: LineStyle.Dashed });
    bbMiddleSeriesRef.current = chart.addSeries(LineSeries, { color: '#6366f1', lineWidth: 1 });
    bbLowerSeriesRef.current = chart.addSeries(LineSeries, { color: '#6366f1', lineWidth: 1, lineStyle: LineStyle.Dashed });

    supertrendSeriesRef.current = chart.addSeries(LineSeries, { color: '#10b981', lineWidth: 2, title: 'Supertrend' });

    // Crosshair hover listener
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }
      const cData = param.seriesData.get(candleSeries) as any;
      const vData = param.seriesData.get(volumeSeries) as any;
      if (cData) {
        setHoverData({
          time: Number(param.time),
          open: cData.open,
          high: cData.high,
          low: cData.low,
          close: cData.close,
          volume: vData?.value
        });
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update Data and Indicators whenever candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    // Filter duplicates and sort ascending
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const uniqueMap = new Map<number, Candle>();
    for (const c of sorted) {
      uniqueMap.set(c.time, c);
    }
    const clean = Array.from(uniqueMap.values());

    // 1. Candlesticks
    const candleData = clean.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));
    candleSeriesRef.current.setData(candleData);

    // 2. Volume
    if (showVolume) {
      const volumeData = clean.map(c => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'
      }));
      volumeSeriesRef.current.setData(volumeData);
    } else {
      volumeSeriesRef.current.setData([]);
    }

    const closes = clean.map(c => c.close);

    // 3. EMAs
    if (showEMA9 && ema9SeriesRef.current) {
      const vals = calculateEMA(closes, 9);
      ema9SeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (ema9SeriesRef.current) {
      ema9SeriesRef.current.setData([]);
    }

    if (showEMA20 && ema20SeriesRef.current) {
      const vals = calculateEMA(closes, 20);
      ema20SeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (ema20SeriesRef.current) {
      ema20SeriesRef.current.setData([]);
    }

    if (showEMA50 && ema50SeriesRef.current) {
      const vals = calculateEMA(closes, 50);
      ema50SeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (ema50SeriesRef.current) {
      ema50SeriesRef.current.setData([]);
    }

    if (showEMA100 && ema100SeriesRef.current) {
      const vals = calculateEMA(closes, 100);
      ema100SeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (ema100SeriesRef.current) {
      ema100SeriesRef.current.setData([]);
    }

    if (showEMA200 && ema200SeriesRef.current) {
      const vals = calculateEMA(closes, 200);
      ema200SeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (ema200SeriesRef.current) {
      ema200SeriesRef.current.setData([]);
    }

    // 4. SMA
    if (showSMA && sma20SeriesRef.current) {
      const vals = calculateSMA(closes, 20);
      sma20SeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (sma20SeriesRef.current) {
      sma20SeriesRef.current.setData([]);
    }

    // 5. VWAP
    if (showVWAP && vwapSeriesRef.current) {
      const vals = calculateVWAP(clean);
      vwapSeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: vals[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else if (vwapSeriesRef.current) {
      vwapSeriesRef.current.setData([]);
    }

    // 6. Bollinger Bands
    if (showBB && bbUpperSeriesRef.current && bbMiddleSeriesRef.current && bbLowerSeriesRef.current) {
      const bb = calculateBollingerBands(clean, 20, 2);
      bbUpperSeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: bb.upper[i] ?? c.close })).filter(d => d.value !== undefined)
      );
      bbMiddleSeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: bb.sma[i] ?? c.close })).filter(d => d.value !== undefined)
      );
      bbLowerSeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: bb.lower[i] ?? c.close })).filter(d => d.value !== undefined)
      );
    } else {
      bbUpperSeriesRef.current?.setData([]);
      bbMiddleSeriesRef.current?.setData([]);
      bbLowerSeriesRef.current?.setData([]);
    }

    // 7. Supertrend
    if (showSupertrend && supertrendSeriesRef.current) {
      const st = calculateSupertrend(clean, 10, 3);
      supertrendSeriesRef.current.setData(
        clean.map((c, i) => ({ time: c.time as Time, value: st.values[i]?.value ?? c.close }))
      );
    } else if (supertrendSeriesRef.current) {
      supertrendSeriesRef.current.setData([]);
    }

    // 8. Markers for Structure & Signals
    if (candleSeriesRef.current) {
      const markers: any[] = [];

      // Structure points
      for (const p of structurePoints.slice(-10)) {
        markers.push({
          time: p.time as Time,
          position: p.type === 'HH' || p.type === 'LH' ? 'aboveBar' : 'belowBar',
          color: p.type === 'HH' || p.type === 'HL' ? '#10b981' : '#ef4444',
          shape: p.type === 'HH' || p.type === 'LH' ? 'arrowDown' : 'arrowUp',
          text: p.type,
          size: 1
        });
      }

      // Structure breaks (BOS / CHOCH)
      for (const b of structureBreaks.slice(-4)) {
        markers.push({
          time: b.time as Time,
          position: b.direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: b.type === 'CHOCH' ? '#f59e0b' : b.direction === 'bullish' ? '#3b82f6' : '#a855f7',
          shape: 'circle',
          text: `${b.type} (${b.direction === 'bullish' ? '↑' : '↓'})`,
          size: 1.5
        });
      }

      // Signal marker
      if (signal && signal.bias !== 'WAIT' && clean.length > 0) {
        const lastTime = clean[clean.length - 1].time;
        markers.push({
          time: lastTime as Time,
          position: signal.bias === 'LONG' ? 'belowBar' : 'aboveBar',
          color: signal.bias === 'LONG' ? '#10b981' : '#ef4444',
          shape: signal.bias === 'LONG' ? 'arrowUp' : 'arrowDown',
          text: `${signal.bias} (${signal.confidence}%)`,
          size: 2
        });
      }

      // Sort markers chronologically
      markers.sort((a, b) => (Number(a.time) - Number(b.time)));
      createSeriesMarkers(candleSeriesRef.current, markers);
    }

    // 9. Update Price Lines (Entry, SL, TP, S/R)
    if (candleSeriesRef.current) {
      // Remove old lines
      priceLinesRef.current.forEach(l => {
        try {
          candleSeriesRef.current?.removePriceLine(l);
        } catch {}
      });
      priceLinesRef.current = [];

      // Trade Lines
      if (showTradeLines && signal && signal.bias !== 'WAIT') {
        const entryMid = (signal.entryZone.min + signal.entryZone.max) / 2;
        const entryLine = candleSeriesRef.current.createPriceLine({
          price: entryMid,
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ENTRY $${entryMid.toLocaleString()}`
        });
        priceLinesRef.current.push(entryLine);

        const slLine = candleSeriesRef.current.createPriceLine({
          price: signal.stopLoss.selected,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL $${signal.stopLoss.selected.toLocaleString()}`
        });
        priceLinesRef.current.push(slLine);

        const tp1Line = candleSeriesRef.current.createPriceLine({
          price: signal.takeProfit.tp1,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP1 $${signal.takeProfit.tp1.toLocaleString()}`
        });
        priceLinesRef.current.push(tp1Line);

        const tp2Line = candleSeriesRef.current.createPriceLine({
          price: signal.takeProfit.tp2,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP2 $${signal.takeProfit.tp2.toLocaleString()}`
        });
        priceLinesRef.current.push(tp2Line);
      }

      // S/R Zones Lines
      if (showSRZones && srZones.length > 0) {
        for (const zone of srZones.slice(0, 4)) {
          const srLine = candleSeriesRef.current.createPriceLine({
            price: zone.mid,
            color: zone.type === 'support' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
            lineWidth: zone.strength === 'strong' ? 2 : 1,
            lineStyle: LineStyle.LargeDashed,
            axisLabelVisible: true,
            title: `${zone.type === 'support' ? 'SUP' : 'RES'} (${zone.strength})`
          });
          priceLinesRef.current.push(srLine);
        }
      }
    }
  }, [
    candles,
    showEMA9,
    showEMA20,
    showEMA50,
    showEMA100,
    showEMA200,
    showSMA,
    showVWAP,
    showBB,
    showSupertrend,
    showVolume,
    showTradeLines,
    showSRZones,
    signal,
    srZones,
    structurePoints,
    structureBreaks
  ]);

  // Handle fit content / auto-scale
  const handleFitContent = () => {
    chartRef.current?.timeScale().fitContent();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Sub-panel calculations (RSI, MACD) for visual display
  const subPanelData = useMemo(() => {
    if (candles.length < 20) return null;
    if (activeSubPanel === 'rsi') {
      const rsi = calculateRSI(candles, 14);
      return { rsi };
    }
    if (activeSubPanel === 'macd') {
      const macd = calculateMACD(candles);
      return { macd };
    }
    return null;
  }, [candles, activeSubPanel]);

  const latestCandle = candles[candles.length - 1];

  return (
    <div
      id="chart-terminal-wrapper"
      className={`relative flex flex-col bg-[#0b0e14] border border-[#1f2937] rounded-xl overflow-hidden shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-full min-h-[580px]'
      } ${className}`}
    >
      {/* Chart Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#111827]/80 border-b border-[#1f2937] text-xs">
        {/* Symbol & Timeframe buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sm tracking-wider text-white px-2 py-0.5 bg-[#1f2937] rounded border border-gray-700">
            {symbol}
          </span>

          <div className="flex items-center bg-[#0b0e14] p-0.5 rounded-lg border border-gray-800">
            {timeframes.map((tf) => (
              <button
                key={tf}
                id={`btn-tf-${tf}`}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 rounded font-mono text-[11px] font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Quick Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              showEMA20 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-semibold' : 'border-gray-800 text-gray-500'
            }`}
          >
            EMA 20
          </button>
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              showEMA50 ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 font-semibold' : 'border-gray-800 text-gray-500'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              showEMA200 ? 'bg-pink-500/20 border-pink-500/40 text-pink-400 font-semibold' : 'border-gray-800 text-gray-500'
            }`}
          >
            EMA 200
          </button>
          <button
            onClick={() => setShowVWAP(!showVWAP)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              showVWAP ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 font-semibold' : 'border-gray-800 text-gray-500'
            }`}
          >
            VWAP
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              showBB ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 font-semibold' : 'border-gray-800 text-gray-500'
            }`}
          >
            BB
          </button>
          <button
            onClick={() => setShowSupertrend(!showSupertrend)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              showSupertrend ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-semibold' : 'border-gray-800 text-gray-500'
            }`}
          >
            Supertrend
          </button>

          <div className="h-4 w-px bg-gray-800 mx-1" />

          {/* Trade lines & SR toggles */}
          <button
            onClick={() => setShowTradeLines(!showTradeLines)}
            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 border transition ${
              showTradeLines ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-gray-800 text-gray-500'
            }`}
            title="Toggle Entry / SL / TP Lines"
          >
            {showTradeLines ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Trade Lines
          </button>

          <button
            onClick={() => setShowSRZones(!showSRZones)}
            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 border transition ${
              showSRZones ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-gray-800 text-gray-500'
            }`}
            title="Toggle Support / Resistance Zones"
          >
            S/R Zones
          </button>

          <button
            onClick={handleFitContent}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            title="Auto Scale Chart"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Crosshair / Candle Stats Bar */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-[#0e131d] border-b border-[#1f2937]/60 text-[11px] font-mono text-gray-400 overflow-x-auto">
        <div>
          O: <span className="text-white font-semibold">${hoverData?.open?.toFixed(2) ?? latestCandle?.open?.toFixed(2) ?? '0.00'}</span>
        </div>
        <div>
          H: <span className="text-emerald-400 font-semibold">${hoverData?.high?.toFixed(2) ?? latestCandle?.high?.toFixed(2) ?? '0.00'}</span>
        </div>
        <div>
          L: <span className="text-red-400 font-semibold">${hoverData?.low?.toFixed(2) ?? latestCandle?.low?.toFixed(2) ?? '0.00'}</span>
        </div>
        <div>
          C: <span className="text-white font-semibold">${hoverData?.close?.toFixed(2) ?? latestCandle?.close?.toFixed(2) ?? '0.00'}</span>
        </div>
        <div>
          Vol: <span className="text-gray-200">{hoverData?.volume?.toFixed(2) ?? latestCandle?.volume?.toFixed(2) ?? '0'}</span>
        </div>

        {signal && (
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                signal.bias === 'LONG'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : signal.bias === 'SHORT'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              SIGNAL: {signal.bias} ({signal.confidence}%)
            </span>
          </div>
        )}
      </div>

      {/* Main Canvas Container */}
      <div className="relative flex-1 w-full min-h-[420px]" ref={chartContainerRef} />

      {/* Sub-Oscillator Panel (RSI or MACD) */}
      <div className="border-t border-[#1f2937] bg-[#0d111a] px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-blue-400" />
              Sub-Oscillator:
            </span>
            <button
              onClick={() => setActiveSubPanel('rsi')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                activeSubPanel === 'rsi' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setActiveSubPanel('macd')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                activeSubPanel === 'macd' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              MACD (12, 26, 9)
            </button>
            <button
              onClick={() => setActiveSubPanel('none')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                activeSubPanel === 'none' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'
              }`}
            >
              Hide
            </button>
          </div>

          {activeSubPanel === 'rsi' && subPanelData?.rsi && (
            <div className="text-[11px] font-mono flex items-center gap-3">
              <span>
                Value:{' '}
                <strong
                  className={
                    subPanelData.rsi.current > 70
                      ? 'text-red-400'
                      : subPanelData.rsi.current < 30
                      ? 'text-emerald-400'
                      : 'text-yellow-400'
                  }
                >
                  {subPanelData.rsi.current.toFixed(1)}
                </strong>
              </span>
              <span className="text-gray-400">State: <strong className="text-white capitalize">{subPanelData.rsi.state}</strong></span>
              {subPanelData.rsi.divergence !== 'none' && (
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  {subPanelData.rsi.divergence.toUpperCase()} DIVERGENCE
                </span>
              )}
            </div>
          )}

          {activeSubPanel === 'macd' && subPanelData?.macd && (
            <div className="text-[11px] font-mono flex items-center gap-3">
              <span>MACD: <strong className="text-blue-400">{subPanelData.macd.current.macd.toFixed(2)}</strong></span>
              <span>Signal: <strong className="text-amber-400">{subPanelData.macd.current.signal.toFixed(2)}</strong></span>
              <span>
                Hist:{' '}
                <strong
                  className={
                    subPanelData.macd.current.histogram >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }
                >
                  {subPanelData.macd.current.histogram.toFixed(2)}
                </strong>
              </span>
              {subPanelData.macd.current.crossover !== 'none' && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                  {subPanelData.macd.current.crossover.toUpperCase()} CROSS
                </span>
              )}
            </div>
          )}
        </div>

        {/* Visual Mini Oscillator Bar */}
        {activeSubPanel === 'rsi' && subPanelData?.rsi && (
          <div className="relative w-full h-4 bg-gray-900 rounded-full overflow-hidden flex items-center border border-gray-800">
            {/* Zones: 0-30 green, 30-70 yellow, 70-100 red */}
            <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-emerald-500/10 border-r border-emerald-500/30" />
            <div className="absolute right-0 top-0 bottom-0 w-[30%] bg-red-500/10 border-l border-red-500/30" />
            <div
              className="absolute h-full w-2 bg-blue-400 rounded-full shadow-lg transition-all duration-300"
              style={{ left: `calc(${Math.min(100, Math.max(0, subPanelData.rsi.current))}% - 4px)` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
