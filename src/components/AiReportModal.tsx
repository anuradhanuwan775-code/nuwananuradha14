import React, { useState } from 'react';
import { generateMarketReport } from '../services/api';
import { FileText, Download, Copy, Check, X, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  timeframe: string;
  contextData: any;
}

export const AiReportModal: React.FC<AiReportModalProps> = ({
  isOpen,
  onClose,
  symbol,
  timeframe,
  contextData
}) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateMarketReport({
        symbol,
        timeframe,
        ...contextData
      });
      setReport(res.report);
    } catch (e) {
      setReport('Failed to generate institutional report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}_Institutional_Market_Report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-gray-800 rounded-2xl w-full max-w-3xl h-[700px] flex flex-col shadow-2xl text-gray-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">INSTITUTIONAL MARKET DOSSIER</h3>
              <p className="text-xs text-gray-400 font-mono">
                Executive Intelligence & Technical Report for {symbol} ({timeframe})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono transition"
                  title="Copy Report"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono transition"
                  title="Download Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save MD
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#0d111a]">
          {!report && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="text-lg font-bold text-white">Generate Comprehensive Market Dossier</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Synthesizes technical trend indicators, S/R liquidity blocks, order book bias, derivatives open interest, and macro sentiment into an executive-ready trading report.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                GENERATE REPORT NOW
              </button>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-xs font-mono text-gray-300">
                Aggregating technical matrix and formulating institutional synthesis...
              </p>
            </div>
          ) : (
            <div className="markdown-body text-xs leading-relaxed space-y-3 prose prose-invert max-w-none">
              <ReactMarkdown>{report || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
