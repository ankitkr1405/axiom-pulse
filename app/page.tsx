"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Component } from 'react';
import { 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  Rocket, 
  Filter, 
  Search, 
  TrendingUp, 
  Clock, 
  Activity,
  X,
  Wallet,
  Copy,
  Sparkles,
  FileText,
  Loader2,
  Terminal as TerminalIcon,
  PieChart,
  CandlestickChart,
  ArrowDown,
  ArrowUp,
  Settings,
  History,
  ShieldAlert,
  Coins,
  LogOut,
  AlertTriangle,
  Info
} from 'lucide-react';

/**
 * ---------------------------------------------------------------------
 * SECTION 1: TYPES & UTILITIES
 * ---------------------------------------------------------------------
 */

type TokenStatus = 'new' | 'bonding' | 'migrated';
type SortOption = 'trending' | 'newest' | 'marketcap';
type Page = 'Pulse' | 'Terminal' | 'Portfolio';

interface Token {
  id: string;
  ticker: string;
  name: string;
  imgUrl: string;
  marketCap: number;
  prevMarketCap: number;
  txns: number;
  volume: number;
  created: number;
  bondingCurve: number;
  status: TokenStatus;
  price?: number;
}

interface PortfolioItem {
  asset: string;
  amount: number;
  value: number;
  change24h: number;
  type: 'stable' | 'bluechip' | 'degen';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(value);
};

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
};

// GEMINI API UTILITY (Vercel Environment Ready)
// This allows you to set the key in Vercel Settings later!
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 

const callGemini = async (prompt: string) => {
  try {
    if (!apiKey) throw new Error("No API Key provided (Simulation Mode)");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable.";
  } catch (error) {
    console.warn("Gemini API unavailable, using simulation mode.");
    
    await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay for snappy feel

    if (prompt.includes("portfolio")) {
      return "**Degen Score: 85/100** 🎲\n\nYou're holding more meme coins than a TikTok teenager. With 82% of your portfolio in high-volatility assets like $WIF and $BONK, you are one bad tweet away from liquidation.\n\n**Recommendation:** Rotate 20% of your BONK profits into SOL immediately to secure gains while staying exposed to the ecosystem.";
    }
    
    if (prompt.includes("Market Pulse")) {
      return "**Market Sentiment: Extreme Greed (78/100)** 🚀\n\nVolumes on new pairs are surging, indicating a 'Risk-On' environment. Liquidity is rotating rapidly from blue-chips into bonding curve plays.\n\n**Advice:** High volatility expected. Bonding curves are filling 15% faster than yesterday.";
    }

    return "**Vibe Check:** This token is showing aggressive buy pressure with a healthy holder distribution. It gives off strong community takeover vibes.\n\n**Hype Score:** 8.5/10 🚀";
  }
};

/**
 * ---------------------------------------------------------------------
 * SECTION 2: UI ATOMS
 * ---------------------------------------------------------------------
 */

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden backdrop-blur-sm flex flex-col ${className}`}>
    {children}
  </div>
);

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-700 text-xs text-white rounded whitespace-nowrap z-50 shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
        </div>
      )}
    </div>
  );
};

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  icon: Icon,
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gemini' | 'buy' | 'sell';
  className?: string;
  icon?: any;
  disabled?: boolean;
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200",
    outline: "border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white bg-transparent",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    gemini: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-purple-500/20 border border-white/10",
    buy: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
    sell: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'accent' }) => {
  const colors = {
    default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    success: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50',
    warning: 'bg-amber-950/50 text-amber-400 border-amber-900/50',
    accent: 'bg-indigo-950/50 text-indigo-400 border-indigo-900/50',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border ${colors[variant]}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, colorClass }: { value: number; colorClass: string }) => (
  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
    <div 
      className={`h-full transition-all duration-500 ease-out ${colorClass}`} 
      style={{ width: `${value}%` }} 
    />
  </div>
);

const Toast = ({ message, show }: { message: string, show: boolean }) => (
  <div className={`fixed bottom-6 right-6 z-[100] transform transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
    <div className="bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
      <div className="bg-green-500/20 p-1 rounded-full">
        <CheckCircle2 size={16} className="text-green-500" />
      </div>
      <span className="font-medium text-sm">{message}</span>
    </div>
  </div>
);

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-8 text-white text-center">Application Error. Please reload.</div>;
    return this.props.children;
  }
}

/**
 * ---------------------------------------------------------------------
 * SECTION 3: PORTFOLIO & TERMINAL (MOVED OUTSIDE MAIN COMPONENT)
 * ---------------------------------------------------------------------
 */

const PortfolioSection = ({ walletConnected, onConnect, onDisconnect }: { walletConnected: boolean, onConnect: () => void, onDisconnect: () => void }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock Data needs to be static or memoized to prevent re-creation issues
  const mockPortfolio: PortfolioItem[] = useMemo(() => [
    { asset: 'SOL', amount: 14.5, value: 2450.00, change24h: 5.2, type: 'bluechip' },
    { asset: 'USDC', amount: 1200, value: 1200.00, change24h: 0.01, type: 'stable' },
    { asset: 'WIF', amount: 4500, value: 850.50, change24h: -12.4, type: 'degen' },
    { asset: 'BONK', amount: 15000000, value: 420.00, change24h: 8.5, type: 'degen' },
    { asset: 'PEPE', amount: 3000000, value: 300.00, change24h: -2.1, type: 'degen' }
  ], []);

  const handleAudit = async () => {
    setIsAnalyzing(true);
    const portfolioString = mockPortfolio.map(i => `${i.asset}: $${i.value} (${i.type})`).join(', ');
    const prompt = `Audit portfolio: ${portfolioString}`;
    const result = await callGemini(prompt);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  if (!walletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300 text-center">
        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-2xl max-w-md">
          <div className="p-4 bg-purple-500/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"><PieChart size={40} className="text-purple-500" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Portfolio Tracker</h2>
          <p className="text-zinc-400 mb-6">Connect your wallet to view holdings, PnL, and get AI-powered risk analysis.</p>
          <Button variant="primary" icon={Wallet} onClick={onConnect}>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full animate-in fade-in flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">My Assets</h2>
          <p className="text-zinc-400">Total Value: <span className="text-white font-mono font-bold">$5,220.50</span></p>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" icon={LogOut} onClick={onDisconnect}>Disconnect</Button>
           <Button variant="gemini" onClick={handleAudit} disabled={isAnalyzing} icon={isAnalyzing ? Loader2 : ShieldAlert}>
              {isAnalyzing ? "Auditing..." : "Audit Portfolio (AI)"}
           </Button>
        </div>
      </div>

      {analysis && (
        <div className="bg-zinc-900/80 border border-indigo-500/30 p-4 rounded-lg animate-in slide-in-from-top-4">
           <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold"><Sparkles size={16}/> AI Risk Report</div>
           <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{analysis}</p>
        </div>
      )}

      <Card className="flex-1 bg-zinc-900/30 border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/50 text-zinc-500">
            <tr>
              <th className="p-4 font-medium">Asset</th>
              <th className="p-4 font-medium">Balance</th>
              <th className="p-4 font-medium">Value</th>
              <th className="p-4 font-medium text-right">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {mockPortfolio.map((item) => (
              <tr key={item.asset} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                <td className="p-4 flex items-center gap-3 font-bold text-white">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${item.type === 'stable' ? 'bg-blue-500/20 text-blue-400' : item.type === 'bluechip' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {item.asset[0]}
                   </div>
                   {item.asset}
                   {item.type === 'degen' && <Badge variant="warning">Risk</Badge>}
                </td>
                <td className="p-4 text-zinc-300 font-mono">{item.amount.toLocaleString()}</td>
                <td className="p-4 text-white font-mono font-medium">${item.value.toLocaleString()}</td>
                <td className={`p-4 text-right font-mono ${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const TerminalChart = () => {
  const bars = useMemo(() => Array.from({ length: 40 }).map((_, i) => {
    const height = 20 + Math.random() * 60;
    const isGreen = Math.random() > 0.45;
    return { height, isGreen };
  }), []);

  return (
    <div className="flex-1 bg-zinc-900/30 border-b border-zinc-800 p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-end justify-between px-8 py-12 gap-1 opacity-80">
        {bars.map((bar, i) => (
          <div key={i} className={`w-full rounded-sm ${bar.isGreen ? 'bg-emerald-500/80' : 'bg-rose-500/80'}`} style={{ height: `${bar.height}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 border-t border-zinc-800/30 top-1/4" />
      <div className="absolute inset-0 border-t border-zinc-800/30 top-2/4" />
      <div className="absolute inset-0 border-t border-zinc-800/30 top-3/4" />
      <div className="absolute top-4 left-4 flex gap-4">
         <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">0.0042069</span>
            <span className="text-sm text-emerald-400 font-medium">+12.5%</span>
         </div>
      </div>
    </div>
  );
};

const OrderBook = () => {
  const asks = Array.from({length: 25}).map((_, i) => ({ price: 0.004210 + (i * 0.000005), size: (Math.random() * 1000).toFixed(0) })).reverse();
  const bids = Array.from({length: 25}).map((_, i) => ({ price: 0.004200 - (i * 0.000005), size: (Math.random() * 1000).toFixed(0) }));

  const Row = ({ price, size, type }: any) => (
    <div className="flex justify-between text-xs py-0.5 hover:bg-zinc-800/50 cursor-pointer px-2 relative group">
      <span className={`font-mono ${type === 'ask' ? 'text-rose-400' : 'text-emerald-400'}`}>{price.toFixed(6)}</span>
      <span className="text-zinc-400 font-mono group-hover:text-white">{size}</span>
      <div className={`absolute top-0 right-0 bottom-0 opacity-10 ${type === 'ask' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.random() * 100}%` }} />
    </div>
  );

  return (
    <div className="flex flex-col h-full border-l border-zinc-800 w-72 shrink-0 bg-zinc-900/30">
      <div className="p-3 border-b border-zinc-800 font-medium text-xs text-zinc-400 uppercase tracking-wider">Order Book</div>
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex-1 flex flex-col justify-end pb-2">
          {asks.map((ask, i) => <Row key={i} {...ask} type="ask" />)}
        </div>
        <div className="py-2 border-y border-zinc-800 bg-zinc-900/80 text-center sticky top-0 bottom-0 z-10">
           <span className="text-lg font-bold text-emerald-400">0.004206</span>
           <span className="text-xs text-zinc-500 ml-2">≈ $0.0042</span>
        </div>
        <div className="flex-1 pt-2">
          {bids.map((bid, i) => <Row key={i} {...bid} type="bid" />)}
        </div>
      </div>
    </div>
  );
};

const TradeForm = () => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  return (
    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
      <div className="flex bg-zinc-950 rounded-lg p-1 mb-4 border border-zinc-800">
        <button onClick={() => setSide('buy')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${side === 'buy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Buy</button>
        <button onClick={() => setSide('sell')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${side === 'sell' ? 'bg-rose-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Sell</button>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5"><span>Amount (SOL)</span><span className="text-indigo-400 cursor-pointer">Max: 4.20</span></div>
          <div className="relative">
            <input type="number" placeholder="0.00" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"/>
            <div className="absolute right-3 top-2.5 text-xs font-bold text-zinc-500">SOL</div>
          </div>
        </div>
        <div className="flex gap-2">{[25, 50, 75, 100].map(pct => <button key={pct} className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded text-[10px] transition-colors">{pct}%</button>)}</div>
        <Button variant={side === 'buy' ? 'buy' : 'sell'} className="w-full py-3 text-base mt-2">{side === 'buy' ? 'Buy PEPE' : 'Sell PEPE'}</Button>
      </div>
    </div>
  );
};

const RecentTrades = () => {
  const trades = Array.from({length: 15}).map((_, i) => ({
    price: 0.004200 + (Math.random() * 0.000100),
    size: (Math.random() * 5000).toFixed(0),
    time: new Date(Date.now() - i * 5000).toLocaleTimeString(),
    side: Math.random() > 0.5 ? 'buy' : 'sell'
  }));

  return (
    <div className="h-48 border-t border-zinc-800 flex flex-col">
      <div className="px-4 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400 flex justify-between"><span>Recent Trades</span><History size={14} /></div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead className="text-zinc-500 sticky top-0 bg-zinc-900"><tr><th className="pl-4 py-1 font-normal">Price</th><th className="py-1 font-normal">Size</th><th className="pr-4 py-1 font-normal text-right">Time</th></tr></thead>
          <tbody className="font-mono">
            {trades.map((t, i) => (
              <tr key={i} className="hover:bg-zinc-800/30">
                <td className={`pl-4 py-1 ${t.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.price.toFixed(6)}</td>
                <td className="py-1 text-zinc-300">{t.size}</td>
                <td className="pr-4 py-1 text-right text-zinc-500">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * ---------------------------------------------------------------------
 * SECTION 4: MOLECULES (PULSE & MODALS)
 * ---------------------------------------------------------------------
 */

const TokenCard = React.memo(({ token, onClick }: { token: Token; onClick: (t: Token) => void }) => {
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  const prevMcRef = useRef(token.marketCap);

  useEffect(() => {
    if (token.marketCap > prevMcRef.current) setFlash('green');
    else if (token.marketCap < prevMcRef.current) setFlash('red');
    prevMcRef.current = token.marketCap;
    const timer = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(timer);
  }, [token.marketCap]);

  const flashClass = flash === 'green' ? 'bg-emerald-950/30 border-emerald-900/50' 
                   : flash === 'red' ? 'bg-rose-950/30 border-rose-900/50' 
                   : 'hover:bg-zinc-800/30 border-transparent';
  const progressColor = token.status === 'new' ? 'bg-blue-500' : token.status === 'bonding' ? 'bg-purple-500' : 'bg-emerald-500';

  return (
    <div onClick={() => onClick(token)} className={`group relative p-3 border-b border-zinc-800/50 last:border-0 transition-all duration-200 cursor-pointer active:bg-zinc-800/50 ${flashClass}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img src={token.imgUrl} alt={token.ticker} className="w-10 h-10 rounded bg-zinc-800 object-cover border border-zinc-700 group-hover:shadow-lg group-hover:shadow-indigo-500/10 transition-all" />
          <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5 ring-2 ring-zinc-950">
             {token.status === 'migrated' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Zap size={12} className="text-amber-500" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-zinc-200 truncate text-sm">{token.ticker}</span>
              <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">{formatTimeAgo(token.created)}</span>
            </div>
            <div className={`font-mono text-sm font-medium transition-colors duration-300 ${flash === 'green' ? 'text-emerald-400' : flash === 'red' ? 'text-rose-400' : 'text-zinc-200'}`}>
              {formatCurrency(token.marketCap)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              <span>Vol: {formatCurrency(token.volume)}</span>
              <span>{token.txns} Txns</span>
            </div>
            <Tooltip content={`Bonding Curve: ${token.bondingCurve.toFixed(2)}%`}>
               <ProgressBar value={token.bondingCurve} colorClass={progressColor} />
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
});

const TokenDetailModal = ({ token, onClose, onTrade }: { token: Token | null; onClose: () => void; onTrade: () => void }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setAnalysis(null);
    setIsAnalyzing(false);
  }, [token]);

  const handleAnalyze = async () => {
    if (!token) return;
    setIsAnalyzing(true);
    const prompt = `Analyze Ticker: $${token.ticker}`;
    const result = await callGemini(prompt);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  if (!token) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl p-6 relative z-10 animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
        <div className="flex items-center gap-4 mb-6">
          <img src={token.imgUrl} className="w-16 h-16 rounded-lg border border-zinc-700" />
          <div><h2 className="text-xl font-bold text-white">${token.ticker}</h2><Badge>{token.status}</Badge></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-zinc-950 p-3 rounded border border-zinc-800"><p className="text-xs text-zinc-500">MC</p><p>{formatCurrency(token.marketCap)}</p></div>
           <div className="bg-zinc-950 p-3 rounded border border-zinc-800"><p className="text-xs text-zinc-500">Bonding</p><p>{token.bondingCurve.toFixed(1)}%</p></div>
        </div>
        <div className="mb-6">
          {!analysis ? (
            <Button variant="gemini" className="w-full" onClick={handleAnalyze} disabled={isAnalyzing} icon={isAnalyzing ? Loader2 : Sparkles}>
              {isAnalyzing ? "Analyzing Chain Data..." : "Analyze with Gemini AI"}
            </Button>
          ) : (
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2 text-indigo-300 font-medium text-sm"><Sparkles size={14} /> AI Analysis</div>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          )}
        </div>
        <Button className="w-full" onClick={onTrade}>Trade Now</Button>
      </div>
    </div>
  );
};

const MarketReportModal = ({ isOpen, onClose, newPairs, bondingPairs, migratedPairs }: any) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !report && newPairs && bondingPairs && migratedPairs) {
      const generateReport = async () => {
        setLoading(true);
        const prompt = `Market Pulse Report...`;
        const result = await callGemini(prompt);
        setReport(result);
        setLoading(false);
      };
      generateReport();
    }
  }, [isOpen, report, newPairs, bondingPairs, migratedPairs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-xl shadow-2xl p-6 relative z-10 animate-in fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-purple-400"/> Market Report</h2>
        <div className="bg-zinc-950/50 p-6 rounded border border-zinc-800 text-zinc-300 text-sm min-h-[150px] flex flex-col justify-center">
           {loading ? (
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
                <span>Analysing market data...</span>
              </div>
           ) : (
              <p className="leading-relaxed whitespace-pre-wrap">{report}</p>
           )}
        </div>
        <Button variant="secondary" className="w-full mt-4" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

/**
 * ---------------------------------------------------------------------
 * SECTION 5: MAIN DASHBOARD
 * ---------------------------------------------------------------------
 */

export default function PulseDashboard() {
  const [activePage, setActivePage] = useState<Page>('Pulse');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showMarketReport, setShowMarketReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [sortTick, setSortTick] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);

  const [newPairs, setNewPairs] = useState<Token[]>([]);
  const [bondingPairs, setBondingPairs] = useState<Token[]>([]);
  const [migratedPairs, setMigratedPairs] = useState<Token[]>([]);

  useEffect(() => {
    const generate = (type: TokenStatus) => Array.from({ length: 20 }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      ticker: ['PEPE', 'WIF', 'BONK', 'DOGE', 'SOL'][Math.floor(Math.random() * 5)] + (i + 1),
      name: `Token ${i}`,
      imgUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${type}${i}`,
      marketCap: 10000 + Math.random() * 500000,
      prevMarketCap: 10000,
      txns: Math.floor(Math.random() * 500),
      volume: Math.floor(Math.random() * 10000),
      created: Date.now() - Math.floor(Math.random() * 3600000),
      bondingCurve: type === 'migrated' ? 100 : Math.floor(Math.random() * 99),
      status: type
    }));
    setTimeout(() => {
      setNewPairs(generate('new'));
      setBondingPairs(generate('bonding'));
      setMigratedPairs(generate('migrated'));
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      const update = (list: Token[]) => list.map(t => Math.random() > 0.7 ? {
        ...t,
        prevMarketCap: t.marketCap,
        marketCap: Math.max(1000, t.marketCap + (Math.random() - 0.45) * 1000),
        txns: t.txns + (Math.random() > 0.8 ? 1 : 0)
      } : t);
      setNewPairs(p => update(p));
      setBondingPairs(p => update(p));
      setMigratedPairs(p => update(p));
    }, 800); 
    const sortInterval = setInterval(() => setSortTick(t => t + 1), 5000);
    return () => { clearInterval(interval); clearInterval(sortInterval); };
  }, [loading]);

  const getSortedTokens = (tokens: Token[]) => {
    const copy = [...tokens];
    switch (sortBy) {
      case 'marketcap': return copy.sort((a, b) => b.marketCap - a.marketCap);
      case 'newest': return copy.sort((a, b) => b.created - a.created);
      case 'trending': default: return copy.sort((a, b) => b.txns - a.txns);
    }
  };
  const sortedNew = useMemo(() => getSortedTokens(newPairs), [newPairs, sortBy, sortTick]);
  const sortedBonding = useMemo(() => getSortedTokens(bondingPairs), [bondingPairs, sortBy, sortTick]);
  const sortedMigrated = useMemo(() => getSortedTokens(migratedPairs), [migratedPairs, sortBy, sortTick]);

  const triggerToast = (msg: string) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 2000); };
  const handleTrade = () => { 
    triggerToast("Order placed successfully!"); 
    setSelectedToken(null); 
    setActivePage('Terminal'); 
  };

  const handleConnect = () => {
    setWalletConnected(true);
    triggerToast("Wallet Connected Successfully!");
  }

  const renderPulseView = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0 animate-in fade-in">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Live Token Discovery
              <Activity size={20} className="text-indigo-500" />
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Real-time feed sorted by {sortBy}.</p>
          </div>
          <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start md:self-auto">
            {(['trending', 'newest', 'marketcap'] as SortOption[]).map((opt) => (
              <button key={opt} onClick={() => { setSortBy(opt); setSortTick(t => t + 1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all duration-200 ${sortBy === opt ? 'bg-zinc-800 text-white shadow-sm scale-105' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>{opt}</button>
            ))}
            <div className="w-px h-auto bg-zinc-800 mx-1 my-1" />
            <button onClick={() => setShowFilters(!showFilters)} className={`px-2 rounded hover:bg-zinc-800 transition-colors ${showFilters ? 'text-indigo-400' : 'text-zinc-500'}`}><Filter size={14} /></button>
          </div>
        </div>
        {showFilters && (
          <div className="mb-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-top-2 shrink-0">
             <div className="flex items-center gap-4 text-sm text-zinc-400"><span>Filters Active:</span><Badge variant="accent">Volume &gt; $1k</Badge><Badge variant="default">No Scams</Badge></div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {[
            { title: 'New Listings', icon: Clock, data: sortedNew, color: 'text-blue-400' },
            { title: 'Final Stretch', icon: TrendingUp, data: sortedBonding, color: 'text-purple-400' },
            { title: 'Raydium Migrated', icon: Rocket, data: sortedMigrated, color: 'text-emerald-400' }
          ].map((col) => (
            <section key={col.title} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                <div className="flex items-center gap-2"><div className={`p-1.5 rounded-md bg-zinc-900 border border-zinc-800 ${col.color}`}><col.icon size={16} /></div><h3 className="font-bold text-zinc-100 tracking-tight text-sm uppercase">{col.title}</h3></div>
                <span className="bg-zinc-900 text-zinc-500 text-xs px-2 py-0.5 rounded-full border border-zinc-800 font-mono">{col.data.length}</span>
              </div>
              <Card className="h-[400px] bg-zinc-900/20 border-zinc-800/50">
                {loading ? <div className="p-4 space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-zinc-800/50 rounded animate-pulse" />)}</div> : (
                  <div className="overflow-y-auto custom-scrollbar flex-1">{col.data.map(token => <TokenCard key={token.id} token={token} onClick={setSelectedToken} />)}</div>
                )}
              </Card>
            </section>
          ))}
        </div>
    </>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
        <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 shrink-0">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-sm rotate-45" />
                AXIOM
              </div>
              <nav className="hidden md:flex gap-1">
                {(['Pulse', 'Terminal', 'Portfolio'] as Page[]).map((item) => (
                  <button key={item} onClick={() => setActivePage(item)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activePage === item ? 'text-white bg-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'}`}>{item}</button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="gemini" className="hidden sm:flex !py-1.5 !px-3 text-xs gap-2" onClick={() => setShowMarketReport(true)}><Sparkles size={12} /> Market Pulse</Button>
              <Button variant="outline" className="hidden sm:flex !py-1.5 !px-3 text-xs gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Solana</Button>
              <Button variant="primary" icon={Wallet} onClick={handleConnect}>{walletConnected ? "Connected" : "Connect"}</Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full flex flex-col min-h-0">
          {activePage === 'Pulse' && renderPulseView()}
          {activePage === 'Terminal' && <TerminalSection />}
          {activePage === 'Portfolio' && <PortfolioSection walletConnected={walletConnected} onConnect={handleConnect} onDisconnect={() => setWalletConnected(false)} />}
        </main>

        <TokenDetailModal token={selectedToken} onClose={() => setSelectedToken(null)} onTrade={handleTrade} />
        <MarketReportModal isOpen={showMarketReport} onClose={() => setShowMarketReport(false)} newPairs={newPairs} bondingPairs={bondingPairs} migratedPairs={migratedPairs} />
        <Toast message={toastMsg} show={showToast} />
        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24, 24, 27, 0.5); } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(63, 63, 70, 0.5); border-radius: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(82, 82, 91, 0.8); }`}</style>
      </div>
    </ErrorBoundary>
  );
}