import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  TrendingUp,
  Activity,
  Layers,
  FileText,
  Briefcase,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Info,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Newspaper
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts'

// API base path — uses relative path so it works both locally (via Vite proxy)
// and in production (served from the same Spring Boot server on Render)
const API_URL = '/api'

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY')
  const [timeframe, setTimeframe] = useState('15m')
  const [quote, setQuote] = useState<any>(null)
  const [candles, setCandles] = useState<any[]>([])
  const [optionChain, setOptionChain] = useState<any>(null)
  const [news, setNews] = useState<any[]>([])
  const [signal, setSignal] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [orderQuantity, setOrderQuantity] = useState<number>(50)
  const [backtestResult, setBacktestResult] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    marketData: 'MOCK',
    news: 'MOCK'
  })

  // Simulated live ticker rates
  const [indices, setIndices] = useState<any>({
    NIFTY: { price: 24350, change: 45.5, changePct: 0.19 },
    SENSEX: { price: 79820, change: 120.3, changePct: 0.15 },
    'BANK NIFTY': { price: 50480, change: -85.2, changePct: -0.17 },
    'INDIA VIX': { price: 15.24, change: 0.42, changePct: 2.83 }
  })

  // Fetch initial quotes and state
  useEffect(() => {
    fetchSystemStatus()
    fetchMarketData()
    fetchNews()
    fetchPortfolio()
    
    // Interval for quotes ticks
    const interval = setInterval(() => {
      fetchQuotes()
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedSymbol, timeframe])

  const fetchSystemStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/health`)
      setSystemStatus({
        backend: 'UP',
        database: res.data.database || 'UP',
        marketData: res.data.marketDataProvider || 'MOCK',
        news: res.data.newsProvider || 'MOCK'
      })
    } catch (e) {
      setSystemStatus({
        backend: 'DOWN',
        database: 'DOWN',
        marketData: 'MOCK',
        news: 'MOCK'
      })
    }
  }

  const fetchQuotes = async () => {
    try {
      const symbols = ['NIFTY', 'SENSEX', 'BANK NIFTY', 'FINNIFTY']
      const updated = { ...indices }
      
      // Update selected quote
      const res = await axios.get(`${API_URL}/market/${selectedSymbol}`)
      setQuote(res.data)

      // Update indices strip
      for (const sym of symbols) {
        try {
          const r = await axios.get(`${API_URL}/market/${sym}`)
          updated[sym] = {
            price: r.data.lastTradedPrice,
            change: r.data.lastTradedPrice - r.data.previousClose,
            changePct: ((r.data.lastTradedPrice - r.data.previousClose) / r.data.previousClose) * 100
          }
        } catch (err) {}
      }
      setIndices(updated)
    } catch (e) {
      // Mock fallback increments
      const updated = { ...indices }
      Object.keys(updated).forEach(k => {
        const change = (Math.random() - 0.48) * (k === 'INDIA VIX' ? 0.2 : 15)
        updated[k].price = Math.max(10, updated[k].price + change)
        updated[k].change = change
        updated[k].changePct = (change / updated[k].price) * 100
      })
      setIndices(updated)
    }
  }

  const fetchMarketData = async () => {
    try {
      // Fetch historical candles
      const resCandles = await axios.get(`${API_URL}/candles/${selectedSymbol}?timeframe=${timeframe}`)
      setCandles(resCandles.data)

      // Fetch options chain
      const resOptions = await axios.get(`${API_URL}/options/${selectedSymbol}`)
      setOptionChain(resOptions.data)

      // Fetch signals
      const resSignal = await axios.get(`${API_URL}/signal/${selectedSymbol}`)
      setSignal(resSignal.data)
    } catch (e) {
      // Fallback synthetic candles
      const tempCandles = []
      let price = selectedSymbol === 'NIFTY' ? 24350 : 50480
      for (let i = 0; i < 40; i++) {
        price += (Math.random() - 0.5) * 40
        tempCandles.push({
          timestamp: new Date(Date.now() - (40 - i) * 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          close: price,
          open: price - (Math.random() - 0.5) * 20,
          high: price + Math.random() * 20,
          low: price - Math.random() * 20,
          volume: 120000 + Math.random() * 50000
        })
      }
      setCandles(tempCandles)
    }
  }

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API_URL}/news`)
      setNews(res.data)
    } catch (e) {}
  }

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`${API_URL}/portfolio`)
      setPortfolio(res.data)
    } catch (e) {}
  }

  const executePaperTrade = async (type: string, strike: number, expiry: string, direction: string, price: number) => {
    try {
      await axios.post(`${API_URL}/paper-trade?userId=user1`, {
        symbol: selectedSymbol,
        optionType: type,
        strikePrice: strike,
        expiry: expiry,
        direction: direction,
        quantity: orderQuantity,
        price: price
      })
      fetchPortfolio()
      alert(`Simulation Order Placed Successfully: ${direction} ${orderQuantity} units of ${selectedSymbol} ${strike} ${type}`)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to place paper trade.')
    }
  }

  const runBacktest = async (strategy: string) => {
    try {
      const res = await axios.get(`${API_URL}/backtest/${strategy}?symbol=${selectedSymbol}&timeframe=${timeframe}`)
      setBacktestResult(res.data)
    } catch (e) {
      alert('Error conducting strategy backtest.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Ticker bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs px-4 py-2 flex justify-between items-center overflow-x-auto whitespace-nowrap">
        <div className="flex gap-6 items-center">
          {Object.entries(indices).map(([name, data]: any) => (
            <div key={name} className="flex gap-2 items-center">
              <span className="font-semibold text-slate-400">{name}</span>
              <span className="font-bold">{data.price.toFixed(2)}</span>
              <span className={`flex items-center font-medium ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.change >= 0 ? '▲' : '▼'} {Math.abs(data.changePct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>

        {/* System Status Indicators */}
        <div className="flex gap-4 items-center pl-6 border-l border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Backend:</span>
            <span className={`w-2 h-2 rounded-full ${systemStatus.backend === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <span className="font-bold">{systemStatus.backend}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Database:</span>
            <span className={`w-2 h-2 rounded-full ${systemStatus.database === 'UP' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
            <span className="font-bold">{systemStatus.database}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
              {systemStatus.marketData} DATA MODE
            </span>
          </div>
        </div>
      </div>

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col md:flex-row">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-slate-900/50 border-r border-slate-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20">
                Ω
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white m-0 leading-none">ANTIGRAVITY</h1>
                <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold">Research Engine</span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {[
                { id: 'overview', name: 'Market Overview', icon: TrendingUp },
                { id: 'technicals', name: 'Technicals Chart', icon: Activity },
                { id: 'options', name: 'Option Chain', icon: Layers },
                { id: 'signals', name: 'Signal Console', icon: Zap },
                { id: 'portfolio', name: 'Simulated Trade Desk', icon: Briefcase },
                { id: 'news', name: 'News Sentiment', icon: Newspaper }
              ].map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 text-purple-300 border-l-4 border-purple-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2 font-bold">Active Symbol</span>
            <div className="grid grid-cols-2 gap-2">
              {['NIFTY', 'BANK NIFTY', 'FINNIFTY', 'SENSEX'].map(sym => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`px-2 py-1.5 rounded text-xs font-bold transition-all border ${
                    selectedSymbol === sym
                      ? 'bg-purple-950/40 border-purple-600 text-purple-400'
                      : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Dashboard Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Alert Callouts */}
          <div className="bg-slate-900/60 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">Simulation Environment & Market Warning</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Platform is operating in <strong>{systemStatus.marketData} DATA MODE</strong>. Calculated metrics, Black-Scholes Greeks, 
                and signals are for research and learning. Options trading is high risk. No guarantee of profit is implied.
              </p>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric Card */}
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">LTP Status</span>
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-3xl font-black">{quote?.lastTradedPrice?.toFixed(2) || '24,350.00'}</h2>
                    <span className="text-xs font-bold text-slate-500">INR</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex justify-between text-xs text-slate-400">
                    <span>Prev Close: {quote?.previousClose || '24,200'}</span>
                    <span>Volume: {quote?.volume || '230,000'}</span>
                  </div>
                </div>

                {/* VIX Card */}
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Implied Volatility Index</span>
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-3xl font-black">{indices['INDIA VIX'].price.toFixed(2)}</h2>
                    <span className="text-xs text-amber-500 font-bold">India VIX</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex justify-between text-xs text-slate-400">
                    <span>Expected Range Limit: ~{((quote?.lastTradedPrice || 24000) * 0.15 * Math.sqrt(7/365)).toFixed(1)} (7 Days)</span>
                  </div>
                </div>

                {/* Sentiment card */}
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">News Sentiment Score</span>
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-3xl font-black text-purple-400">+0.62</h2>
                    <span className="text-xs text-emerald-400 font-bold">BULLISH BIAS</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex justify-between text-xs text-slate-400">
                    <span>Confidence Score: 88%</span>
                    <span>Impact: MEDIUM</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Historical Price Wave</h3>
                  <div className="flex gap-2">
                    {['1m', '5m', '15m', '1h', 'D'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          timeframe === tf ? 'bg-purple-600 text-white' : 'bg-slate-850 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tf.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={candles}>
                      <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(v) => v} />
                      <YAxis domain={['auto', 'auto']} stroke="#64748b"/>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Area type="monotone" dataKey="close" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICALS */}
          {activeTab === 'technicals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Gauge parameters */}
                {[
                  { name: 'RSI (14)', value: '62.4', rating: 'Bullish', color: 'text-emerald-400' },
                  { name: 'MACD (12, 26)', value: '+12.4', rating: 'Buy Crossover', color: 'text-emerald-400' },
                  { name: 'ADX (14)', value: '24.1', rating: 'Strong Trend', color: 'text-purple-400' },
                  { name: 'Bollinger Band Width', value: '1.24%', rating: 'Consolidating', color: 'text-blue-400' }
                ].map((g, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                    <span className="text-xs text-slate-500 block font-semibold">{g.name}</span>
                    <h3 className="text-2xl font-black">{g.value}</h3>
                    <span className={`text-xs font-bold ${g.color}`}>{g.rating}</span>
                  </div>
                ))}
              </div>

              {/* Pivot Points Matrix */}
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Standard Pivot Points Levels</h3>
                <div className="grid grid-cols-7 gap-3 text-center text-xs">
                  <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded">
                    <span className="text-rose-500 font-bold block mb-1">R3</span>
                    <span className="font-semibold">{(quote?.lastTradedPrice * 1.025 || 24900).toFixed(1)}</span>
                  </div>
                  <div className="bg-rose-950/10 border border-rose-900/30 p-2.5 rounded">
                    <span className="text-rose-400 font-bold block mb-1">R2</span>
                    <span className="font-semibold">{(quote?.lastTradedPrice * 1.015 || 24700).toFixed(1)}</span>
                  </div>
                  <div className="bg-rose-950/5 border border-rose-900/20 p-2.5 rounded">
                    <span className="text-rose-300 font-bold block mb-1">R1</span>
                    <span className="font-semibold">{(quote?.lastTradedPrice * 1.005 || 24500).toFixed(1)}</span>
                  </div>
                  
                  <div className="bg-purple-950/20 border border-purple-800/40 p-2.5 rounded font-black">
                    <span className="text-purple-400 block mb-1">Pivot Point</span>
                    <span>{(quote?.lastTradedPrice || 24350).toFixed(1)}</span>
                  </div>

                  <div className="bg-emerald-950/5 border border-emerald-900/20 p-2.5 rounded">
                    <span className="text-emerald-300 font-bold block mb-1">S1</span>
                    <span className="font-semibold">{(quote?.lastTradedPrice * 0.995 || 24200).toFixed(1)}</span>
                  </div>
                  <div className="bg-emerald-950/10 border border-emerald-900/30 p-2.5 rounded">
                    <span className="text-emerald-400 font-bold block mb-1">S2</span>
                    <span className="font-semibold">{(quote?.lastTradedPrice * 0.985 || 24000).toFixed(1)}</span>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded">
                    <span className="text-emerald-500 font-bold block mb-1">S3</span>
                    <span className="font-semibold">{(quote?.lastTradedPrice * 0.975 || 23800).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPTION CHAIN */}
          {activeTab === 'options' && (
            <div className="space-y-6">
              
              {/* Option Metrics */}
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-500 font-semibold block mb-1">Put-Call Ratio (PCR)</span>
                  <h4 className="text-xl font-bold">{optionChain?.pcr?.toFixed(3) || '0.940'}</h4>
                  <span className="text-slate-400">Neutral to Bullish buildup</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-500 font-semibold block mb-1">Max Pain Strike</span>
                  <h4 className="text-xl font-bold text-purple-400">{optionChain?.maxPainStrike || '24,300'}</h4>
                  <span className="text-slate-400">Writer loss minimized</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-500 font-semibold block mb-1">ATM Strike</span>
                  <h4 className="text-xl font-bold">{optionChain?.atmStrike || '24,300'}</h4>
                  <span className="text-slate-400">Spot price nearest target</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-850">
                    <tr>
                      <th className="p-3">CE OI</th>
                      <th className="p-3">CE Change OI</th>
                      <th className="p-3">CE IV</th>
                      <th className="p-3">CE LTP</th>
                      <th className="p-3 text-center bg-slate-850/50">Strike Price</th>
                      <th className="p-3">PE LTP</th>
                      <th className="p-3">PE IV</th>
                      <th className="p-3">PE Change OI</th>
                      <th className="p-3">PE OI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(optionChain?.contracts || []).filter((_: any, idx: number) => idx % 2 === 0).slice(0, 10).map((c: any, index: number) => {
                      const strike = c.strike
                      const correspondingPe = (optionChain?.contracts || []).find((p: any) => p.strike === strike && p.type === 'PE')
                      const isATM = strike === optionChain?.atmStrike;
                      
                      return (
                        <tr key={index} className={`border-b border-slate-900 hover:bg-slate-900/60 ${isATM ? 'bg-purple-950/20' : ''}`}>
                          <td className="p-3 text-slate-300">{c.openInterest}</td>
                          <td className={`p-3 ${c.changeInOpenInterest >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {c.changeInOpenInterest}
                          </td>
                          <td className="p-3 text-slate-500">{c.impliedVolatility?.toFixed(1)}%</td>
                          <td className="p-3 font-semibold text-emerald-400">{c.lastTradedPrice?.toFixed(1)}</td>
                          <td className={`p-3 text-center font-bold ${isATM ? 'bg-purple-900/40 text-purple-300' : 'bg-slate-900/30'}`}>
                            {strike}
                          </td>
                          <td className="p-3 font-semibold text-rose-400">
                            {correspondingPe?.lastTradedPrice?.toFixed(1)}
                          </td>
                          <td className="p-3 text-slate-500">{correspondingPe?.impliedVolatility?.toFixed(1)}%</td>
                          <td className={`p-3 ${correspondingPe?.changeInOpenInterest >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {correspondingPe?.changeInOpenInterest}
                          </td>
                          <td className="p-3 text-slate-300">{correspondingPe?.openInterest}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SIGNALS */}
          {activeTab === 'signals' && (
            <div className="space-y-6">
              {signal && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Signal Decision Card */}
                  <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Recommendation setup</span>
                        <h3 className="text-xl font-bold">{selectedSymbol} Trading Setup</h3>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold bg-gradient-to-r ${
                        signal.bias === 'BULLISH' ? 'from-emerald-600 to-teal-600 text-white' : 'from-rose-600 to-red-600 text-white'
                      }`}>
                        {signal.bias} ({ (signal.confidence * 100).toFixed(0) }% Model Conf)
                      </span>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">SUGGESTED OPTION CONTRACT</span>
                        <h4 className="text-lg font-black text-purple-400">{signal.suggestedContract || 'NO ACTIVE SIGNAL'}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">ENTRY TARGET PREMIUM</span>
                        <h4 className="text-lg font-black text-emerald-400">₹{signal.entryPremium?.toFixed(1) || '0.0'}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-900/60 p-3 rounded border border-slate-850">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Stop Loss Limit</span>
                        <span className="font-bold text-rose-400">₹{signal.stopLoss?.toFixed(1)}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded border border-slate-850">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Target Price</span>
                        <span className="font-bold text-emerald-400">₹{signal.target?.toFixed(1)}</span>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded border border-slate-850">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">R:R Ratio</span>
                        <span className="font-bold text-purple-300">1 : {signal.riskRewardRatio}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Supporting Evidence factors</h4>
                      <ul className="space-y-1.5 text-xs text-slate-400">
                        {signal.bullishFactors.map((f: string, i: number) => (
                          <li key={i} className="flex gap-2 items-center">
                            <span className="text-emerald-400">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Execution Sizer */}
                  <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Execution Position Size Calculator</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 font-bold block mb-1">Simulation Position Units</label>
                        <input
                          type="number"
                          value={orderQuantity}
                          onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 50)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm font-bold"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-4 rounded border border-slate-800/80 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Max theoretical trade loss:</span>
                          <span className="font-bold text-rose-400">₹{signal.maxTradeLoss?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expected net payout:</span>
                          <span className="font-bold text-emerald-400">₹{signal.expectedProfit?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>

                      {signal.suggestedDirection !== 'NO TRADE' && (
                        <button
                          onClick={() => executePaperTrade(
                            signal.suggestedContract.includes('CE') ? 'CE' : 'PE',
                            signal.strikePrice,
                            signal.expiryDate || '2026-08-20',
                            'BUY',
                            signal.entryPremium
                          )}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold p-3 rounded-lg text-sm shadow-lg shadow-purple-500/20 transition-all duration-200"
                        >
                          Execute Paper Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              
              {/* Stats */}
              {portfolio && (
                <div className="grid grid-cols-4 gap-6 text-center text-xs">
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-500 block mb-1">Simulated Capital</span>
                    <h4 className="text-xl font-bold">₹{portfolio.initialCapital?.toLocaleString()}</h4>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-500 block mb-1">Cash Balance</span>
                    <h4 className="text-xl font-bold">₹{portfolio.virtualBalance?.toLocaleString()}</h4>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-500 block mb-1">Current Equity Valuation</span>
                    <h4 className="text-xl font-bold text-purple-400">₹{portfolio.currentEquity?.toLocaleString()}</h4>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-500 block mb-1">Max Simulation Drawdown</span>
                    <h4 className="text-xl font-bold text-rose-500">{portfolio.maxDrawdown?.toFixed(2)}%</h4>
                  </div>
                </div>
              )}

              {/* Strategy simulation run panel */}
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Run Strategy Backtest</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => runBacktest('SMA_CROSSOVER')}
                    className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold px-4 py-2.5 rounded border border-slate-700"
                  >
                    SMA Crossover Strategy
                  </button>
                  <button
                    onClick={() => runBacktest('RSI_BREAKOUT')}
                    className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold px-4 py-2.5 rounded border border-slate-700"
                  >
                    RSI Breakout Strategy
                  </button>
                </div>

                {backtestResult && (
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg grid grid-cols-4 gap-4 text-xs mt-4">
                    <div>
                      <span className="text-slate-500 block">Total trades simulated:</span>
                      <span className="font-bold text-slate-200">{backtestResult.totalTrades}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Simulated Win Rate:</span>
                      <span className="font-bold text-emerald-400">{backtestResult.winRate?.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Max Drawdown:</span>
                      <span className="font-bold text-rose-400">{backtestResult.maxDrawdown?.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Profit Factor:</span>
                      <span className="font-bold text-purple-300">{backtestResult.profitFactor?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: NEWS */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Analyzed Sentiment Feed</h3>
              <div className="grid grid-cols-1 gap-4">
                {news.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{item.headline}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${
                        item.sentiment === 'POSITIVE' ? 'bg-emerald-950 text-emerald-400' :
                        item.sentiment === 'NEGATIVE' ? 'bg-rose-950 text-rose-400' : 'bg-slate-950 text-slate-400'
                      }`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.summary}</p>
                    <div className="pt-2 border-t border-slate-850 flex justify-between text-[10px] text-slate-500">
                      <span>Source: {item.source}</span>
                      <span>Market Impact: {(item.marketImpactScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Disclaimer */}
          <footer className="pt-6 border-t border-slate-900 text-center space-y-2">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Disclaimer: Analysis and indices generated are for research and decision-support. Market predictions are uncertain. 
              No trade suggestions guarantee yield. Past results do not assure future outcomes.
            </p>
            <p className="text-[10px] text-purple-500 font-semibold">
              Platform strictly operates in Simulation/Mock mode for local developers. Real trading executions are disabled.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
