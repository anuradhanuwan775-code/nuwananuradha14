import React, { useState, useRef, useEffect } from 'react';
import { askGeminiChat } from '../services/api';
import { Bot, User, Send, X, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  timeframe: string;
  contextData?: any;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  timeframe,
  contextData
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `Hello! I am your AI Market Quantitative Analyst. I have active telemetry on **${symbol}** at **$${currentPrice.toLocaleString()}** on the **${timeframe}** timeframe. How can I assist your technical evaluation, risk calculation, or market regime diagnosis today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await askGeminiChat(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        {
          symbol,
          currentPrice,
          timeframe,
          ...contextData
        }
      );

      setMessages([...newMessages, {
        role: 'model',
        content: response,
        timestamp: Date.now()
      }]);
    } catch (err) {
      setMessages([...newMessages, {
        role: 'model',
        content: 'I encountered an error analyzing the telemetry. Please verify that the server is active or try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    `Analyze market structure for ${symbol}`,
    `Explain the current funding rate and crowded positioning`,
    `What are the immediate invalidation levels for longs?`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-gray-800 rounded-2xl w-full max-w-2xl h-[650px] flex flex-col shadow-2xl text-gray-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">AI MARKET QUANT ASSISTANT</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 font-semibold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Real-time technical co-pilot for {symbol} (${currentPrice.toLocaleString()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="px-4 py-2 bg-[#0b0e14] border-b border-gray-800/80 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(q);
              }}
              className="px-2.5 py-1 rounded bg-[#141b2d] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 whitespace-nowrap transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0d111a]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'model' && (
                <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl p-3.5 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#141b2d] border border-gray-800 text-gray-200 shadow-md'
                }`}
              >
                {m.role === 'model' ? (
                  <div className="markdown-body space-y-2">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap font-sans">{m.content}</p>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs justify-start items-center">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-[#141b2d] border border-gray-800 rounded-xl p-3 flex items-center gap-2 text-gray-400 font-mono text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Synthesizing multi-indicator data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-[#111827] border-t border-gray-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about market structure, risk reward, or volume confluence..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-[#0b0e14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
