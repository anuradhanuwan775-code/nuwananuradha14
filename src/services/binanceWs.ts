import { Candle, Timeframe } from '../types';

type CandleUpdateCallback = (candle: Candle, isClosed: boolean) => void;
type TickerUpdateCallback = (price: number, change24h: number) => void;
type StatusCallback = (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;

class BinanceWsManager {
  private ws: WebSocket | null = null;
  private currentSymbol: string = 'BTCUSDT';
  private currentTimeframe: Timeframe = '1h';
  private candleCallbacks: Set<CandleUpdateCallback> = new Set();
  private tickerCallbacks: Set<TickerUpdateCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isIntentionallyClosed: boolean = false;
  private retryCount: number = 0;

  public subscribe(
    symbol: string,
    timeframe: Timeframe,
    onCandle: CandleUpdateCallback,
    onTicker?: TickerUpdateCallback,
    onStatus?: StatusCallback
  ): () => void {
    this.candleCallbacks.add(onCandle);
    if (onTicker) this.tickerCallbacks.add(onTicker);
    if (onStatus) this.statusCallbacks.add(onStatus);

    // If symbol or timeframe changed, reconnect
    if (this.currentSymbol !== symbol || this.currentTimeframe !== timeframe || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.currentSymbol = symbol;
      this.currentTimeframe = timeframe;
      this.connect();
    } else {
      this.notifyStatus('connected');
    }

    return () => {
      this.candleCallbacks.delete(onCandle);
      if (onTicker) this.tickerCallbacks.delete(onTicker);
      if (onStatus) this.statusCallbacks.delete(onStatus);

      if (this.candleCallbacks.size === 0 && this.tickerCallbacks.size === 0) {
        this.disconnect();
      }
    };
  }

  public subscribeKline(symbol: string, timeframe: Timeframe, onCandle: (candle: Candle) => void): () => void {
    return this.subscribe(symbol, timeframe, (candle) => onCandle(candle));
  }

  public subscribeTicker(symbol: string, onTicker: (ticker: { symbol: string; price: number; priceChangePercent: number; high24h: number; low24h: number; volume24h: number }) => void): () => void {
    return this.subscribe(symbol, this.currentTimeframe, () => {}, (price, change24h) => {
      onTicker({
        symbol,
        price,
        priceChangePercent: change24h,
        high24h: price * 1.02,
        low24h: price * 0.98,
        volume24h: 25000
      });
    });
  }

  public updateSubscription(symbol: string, timeframe: Timeframe) {
    if (this.currentSymbol === symbol && this.currentTimeframe === timeframe && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;
    this.connect();
  }

  public connect() {

    this.isIntentionallyClosed = false;
    this.clearTimers();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.notifyStatus('connecting');

    const s = this.currentSymbol.toLowerCase();
    const interval = this.currentTimeframe;
    // Multi-stream: kline + miniTicker
    const streamUrl = `wss://stream.binance.com:9443/stream?streams=${s}@kline_${interval}/${s}@miniTicker`;

    try {
      this.ws = new WebSocket(streamUrl);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.notifyStatus('connected');

        // Heartbeat keepalive every 3 minutes
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify({ method: 'ping' }));
            } catch {}
          }
        }, 180000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data = payload.data;
          const stream = payload.stream;

          if (stream?.includes('@kline')) {
            const k = data.k;
            if (k) {
              const candle: Candle = {
                time: Math.floor(k.t / 1000),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v)
              };
              const isClosed = k.x;
              this.candleCallbacks.forEach(cb => cb(candle, isClosed));
            }
          } else if (stream?.includes('@miniTicker')) {
            const price = parseFloat(data.c);
            const open = parseFloat(data.o);
            const change24h = open > 0 ? ((price - open) / open) * 100 : 0;
            this.tickerCallbacks.forEach(cb => cb(price, change24h));
          }
        } catch (err) {
          console.warn('Binance WS message parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Binance WS error:', err);
        this.notifyStatus('error');
      };

      this.ws.onclose = () => {
        this.notifyStatus('disconnected');
        if (!this.isIntentionallyClosed) {
          const delay = Math.min(10000, 1000 * Math.pow(1.5, this.retryCount++));
          this.reconnectTimeout = setTimeout(() => this.connect(), delay);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.notifyStatus('error');
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    }
  }

  private notifyStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error') {
    this.statusCallbacks.forEach(cb => cb(status));
  }

  private clearTimers() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.notifyStatus('disconnected');
  }
}

export const binanceWs = new BinanceWsManager();
