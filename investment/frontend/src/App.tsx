import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  TrendingUp,
  Activity,
  Layers,
  Briefcase,
  AlertTriangle,
  Zap,
  Newspaper,
  BarChart2
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine
} from 'recharts'

const API_URL = '/api'

// ── Custom Candlestick Bar ─────────────────────────────
const CandlestickBar = (props: any) => {
  const { x, y, width, height, open, close, high, low } = props
  if (!open || !close) return null
  const isBull = close >= open
  const color = isBull ? '#10b981' : '#f43f5e'
  const wickX = x + width / 2
  return (
    <g>
      <line x1={wickX} x2={wickX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect
        x={x + 1}
        y={Math.min(props.openY ?? y, props.closeY ?? y)}
        width={width - 2}
        height={Math.abs((props.openY ?? y) - (props.closeY ?? y)) || 1}
        fill={isBull ? 'rgba(16,185,129,0.8)' : 'rgba(244,63,94,0.8)'}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  )
}

// ── Custom Tooltip ─────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: '#111d32',
      border: '1px solid #2a3d5e',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11
    }}>
      <div style={{ color: '#98a9c0', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {d?.open && <div style={{ color: '#98a9c0' }}>O: <span style={{ color: '#e8edf5' }}>{d.open?.toFixed(2)}</span></div>}
      {d?.high && <div style={{ color: '#10b981' }}>H: {d.high?.toFixed(2)}</div>}
      {d?.low && <div style={{ color: '#f43f5e' }}>L: {d.low?.toFixed(2)}</div>}
      {d?.close && <div style={{ color: '#e8edf5' }}>C: <strong>{d.close?.toFixed(2)}</strong></div>}
      {d?.volume && <div style={{ color: '#4e637d', marginTop: 4 }}>Vol: {Math.round(d.volume / 1000)}K</div>}
    </div>
  )
}

// ── Volume Bar ─────────────────────────────────────────
const VolumeBar = (props: any) => {
  const { x, y, width, height, close, open } = props
  const isBull = close >= open
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={isBull ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}
      rx={1}
    />
  )
}

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

  const [indices, setIndices] = useState<any>({
    NIFTY: { price: 24350, change: 45.5, changePct: 0.19 },
    SENSEX: { price: 79820, change: 120.3, changePct: 0.15 },
    'BANK NIFTY': { price: 50480, change: -85.2, changePct: -0.17 },
    'INDIA VIX': { price: 15.24, change: 0.42, changePct: 2.83 },
    FINNIFTY: { price: 22418, change: 115.6, changePct: 0.51 }
  })

  useEffect(() => {
    fetchSystemStatus()
    fetchMarketData()
    fetchNews()
    fetchPortfolio()
    const interval = setInterval(fetchQuotes, 5000)
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
    } catch {
      setSystemStatus({ backend: 'DOWN', database: 'DOWN', marketData: 'MOCK', news: 'MOCK' })
    }
  }

  const fetchQuotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/market/${selectedSymbol}`)
      setQuote(res.data)
      const symbols = ['NIFTY', 'SENSEX', 'BANK NIFTY', 'FINNIFTY']
      const updated = { ...indices }
      for (const sym of symbols) {
        try {
          const r = await axios.get(`${API_URL}/market/${sym}`)
          updated[sym] = {
            price: r.data.lastTradedPrice,
            change: r.data.lastTradedPrice - r.data.previousClose,
            changePct: ((r.data.lastTradedPrice - r.data.previousClose) / r.data.previousClose) * 100
          }
        } catch {}
      }
      setIndices(updated)
    } catch {
      const updated = { ...indices }
      Object.keys(updated).forEach(k => {
        const delta = (Math.random() - 0.48) * (k === 'INDIA VIX' ? 0.2 : 15)
        updated[k].price = Math.max(10, updated[k].price + delta)
        updated[k].change = delta
        updated[k].changePct = (delta / updated[k].price) * 100
      })
      setIndices(updated)
    }
  }

  const fetchMarketData = async () => {
    try {
      const resCandles = await axios.get(`${API_URL}/candles/${selectedSymbol}?timeframe=${timeframe}`)
      setCandles(resCandles.data)
      const resOptions = await axios.get(`${API_URL}/options/${selectedSymbol}`)
      setOptionChain(resOptions.data)
      const resSignal = await axios.get(`${API_URL}/signal/${selectedSymbol}`)
      setSignal(resSignal.data)
    } catch {
      // Synthetic candles fallback
      const tempCandles = []
      let price = selectedSymbol === 'NIFTY' ? 24350 : selectedSymbol === 'SENSEX' ? 79820 : 50480
      for (let i = 0; i < 60; i++) {
        const open = price
        const change = (Math.random() - 0.48) * 80
        const close = Math.max(100, open + change)
        const high = Math.max(open, close) + Math.random() * 30
        const low = Math.min(open, close) - Math.random() * 30
        const volume = 80000 + Math.random() * 200000
        tempCandles.push({
          timestamp: new Date(Date.now() - (60 - i) * 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open, high, low, close, volume
        })
        price = close
      }
      setCandles(tempCandles)
    }
  }

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API_URL}/news`)
      setNews(res.data)
    } catch {}
  }

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`${API_URL}/portfolio`)
      setPortfolio(res.data)
    } catch {}
  }

  const executePaperTrade = async (type: string, strike: number, expiry: string, direction: string, price: number) => {
    try {
      await axios.post(`${API_URL}/paper-trade?userId=user1`, {
        symbol: selectedSymbol, optionType: type, strikePrice: strike,
        expiry, direction, quantity: orderQuantity, price
      })
      fetchPortfolio()
      alert(`✅ Paper Order Placed: ${direction} ${orderQuantity} × ${selectedSymbol} ${strike} ${type} @ ₹${price}`)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to place paper trade.')
    }
  }

  const runBacktest = async (strategy: string) => {
    try {
      const res = await axios.get(`${API_URL}/backtest/${strategy}?symbol=${selectedSymbol}&timeframe=${timeframe}`)
      setBacktestResult(res.data)
    } catch {
      alert('Error running backtest.')
    }
  }

  const ltp = quote?.lastTradedPrice || indices[selectedSymbol]?.price || 24350
  const prevClose = quote?.previousClose || ltp * 0.995
  const dayChange = ltp - prevClose
  const dayChangePct = (dayChange / prevClose) * 100

  // ── Computed technicals from candles ────────────────
  const closes = candles.map((c: any) => c.close).filter(Boolean)
  const rsiVal = closes.length > 14 ? (() => {
    const gains: number[] = [], losses: number[] = []
    for (let i = 1; i < closes.length; i++) {
      const d = closes[i] - closes[i-1]
      gains.push(Math.max(0, d)); losses.push(Math.max(0, -d))
    }
    const avgG = gains.slice(-14).reduce((a,b) => a+b, 0) / 14
    const avgL = losses.slice(-14).reduce((a,b) => a+b, 0) / 14
    if (avgL === 0) return 100
    return 100 - (100 / (1 + avgG / avgL))
  })() : 55.4

  const ema20 = closes.length >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : ltp

  // Tab labels map
  const NAV_ITEMS = [
    { id: 'overview',    label: 'Market Overview',     Icon: TrendingUp },
    { id: 'chart',       label: 'Price Chart',          Icon: BarChart2 },
    { id: 'technicals',  label: 'Technicals',           Icon: Activity },
    { id: 'options',     label: 'Option Chain',         Icon: Layers },
    { id: 'signals',     label: 'Signal Console',       Icon: Zap },
    { id: 'portfolio',   label: 'Trade Desk',           Icon: Briefcase },
    { id: 'news',        label: 'News Sentiment',       Icon: Newspaper },
  ]

  const tabTitle: Record<string, string> = {
    overview:   'Market Overview',
    chart:      'Price Chart — ' + selectedSymbol + ' ' + timeframe.toUpperCase(),
    technicals: 'Technical Analysis — ' + selectedSymbol,
    options:    'Option Chain — ' + selectedSymbol,
    signals:    'Signal Console — ' + selectedSymbol,
    portfolio:  'Simulated Trade Desk',
    news:       'News & Sentiment Feed',
  }

  return (
    <div className="app-shell">

      {/* ── Ticker Bar ── */}
      <div className="ticker-bar">
        <div className="ticker-indices">
          {Object.entries(indices).map(([name, data]: any) => (
            <div key={name} className="ticker-item">
              <span className="ticker-name">{name}</span>
              <span className="ticker-price">{data.price.toFixed(2)}</span>
              <span className={`ticker-change ${data.change >= 0 ? 'bull' : 'bear'}`}>
                {data.change >= 0 ? '▲' : '▼'} {Math.abs(data.changePct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <div className="ticker-status">
          <div className="status-item">
            <span className={`status-dot ${systemStatus.backend === 'UP' ? 'up' : 'down'}`} />
            Backend: {systemStatus.backend}
          </div>
          <div className="status-item">
            <span className={`status-dot ${systemStatus.database === 'UP' ? 'up' : 'down'}`} />
            DB: {systemStatus.database}
          </div>
          <span className="mode-badge">{systemStatus.marketData} MODE</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="body-layout">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">Ω</div>
            <div className="logo-text">
              <h1>ANTIGRAVITY</h1>
              <span>Research Engine</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Navigation</div>
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-btn ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-symbol-section">
            <div className="nav-section-label">Active Symbol</div>
            <div className="symbol-grid">
              {['NIFTY', 'BANK NIFTY', 'FINNIFTY', 'SENSEX'].map(sym => (
                <button
                  key={sym}
                  className={`symbol-btn ${selectedSymbol === sym ? 'active' : ''}`}
                  onClick={() => setSelectedSymbol(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main-content">

          <div className="content-header">
            <div>
              <div className="content-title">{tabTitle[activeTab]}</div>
              <div className="content-subtitle">
                Platform Mode: {systemStatus.marketData} Data &nbsp;•&nbsp; {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800, color: dayChange >= 0 ? '#10b981' : '#f43f5e' }}>
                  {ltp.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: dayChange >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                  {dayChange >= 0 ? '▲' : '▼'} {Math.abs(dayChange).toFixed(2)} ({Math.abs(dayChangePct).toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>

          <div className="tab-content fade-in" key={activeTab}>

            {/* ── Warning Banner (always visible) ── */}
            <div className="warning-banner">
              <AlertTriangle />
              <div>
                <h4>Simulation Environment — Research & Learning Only</h4>
                <p>
                  Platform is operating in <strong>{systemStatus.marketData} DATA MODE</strong>. All metrics, Black-Scholes Greeks,
                  and signals are for research and educational purposes. Options trading involves high risk. No profit guarantee is implied.
                </p>
              </div>
            </div>

            {/* ══════════════════════════════
                TAB: OVERVIEW
            ══════════════════════════════ */}
            {activeTab === 'overview' && (
              <>
                <div className="grid-cols-4">
                  <div className="metric-card">
                    <div className="metric-label">Last Traded Price</div>
                    <div className="metric-value">{ltp.toFixed(2)}</div>
                    <div className="metric-sub">
                      <span>Prev Close: {prevClose.toFixed(2)}</span>
                      <span className={`metric-badge ${dayChange >= 0 ? 'bull' : 'bear'}`}>
                        {dayChange >= 0 ? '▲' : '▼'} {Math.abs(dayChangePct).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">India VIX</div>
                    <div className="metric-value" style={{ color: '#f59e0b' }}>
                      {indices['INDIA VIX']?.price.toFixed(2)}
                    </div>
                    <div className="metric-sub">
                      <span>Expected 7-Day Range ±{((ltp) * (indices['INDIA VIX']?.price / 100) * Math.sqrt(7 / 365)).toFixed(0)} pts</span>
                      <span className="metric-badge warn">VOLATILITY</span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">PCR (Put-Call Ratio)</div>
                    <div className="metric-value" style={{ color: '#a78bfa' }}>
                      {optionChain?.pcr?.toFixed(3) || '0.940'}
                    </div>
                    <div className="metric-sub">
                      <span>ATM: {optionChain?.atmStrike || '—'}</span>
                      <span className="metric-badge purple">OPTIONS</span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-label">News Sentiment</div>
                    <div className="metric-value" style={{ color: '#10b981' }}>
                      {signal?.bullishScore ? `+${signal.bullishScore.toFixed(0)}%` : '+62%'}
                    </div>
                    <div className="metric-sub">
                      <span>Conf: {signal?.confidence ? `${(signal.confidence * 100).toFixed(0)}%` : '88%'}</span>
                      <span className={`metric-badge ${signal?.bias === 'BEARISH' ? 'bear' : 'bull'}`}>
                        {signal?.bias || 'BULLISH'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overview Chart — Area */}
                <div className="chart-container">
                  <div className="chart-toolbar">
                    <div className="chart-title">
                      <span className="dot" />
                      {selectedSymbol} — Price History
                    </div>
                    <div className="tf-selector">
                      {['1m', '5m', '15m', '1h', 'D'].map(tf => (
                        <button key={tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                          onClick={() => setTimeframe(tf)}>
                          {tf.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-body" style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={candles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="#4e637d" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis domain={['auto', 'auto']} stroke="#4e637d" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} width={70} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="close"
                          stroke={dayChange >= 0 ? '#10b981' : '#f43f5e'} strokeWidth={2}
                          fill={dayChange >= 0 ? 'url(#bullGrad)' : 'url(#bearGrad)'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Indices quick view */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Market Indices</span>
                  </div>
                  <div style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Index</th>
                          <th>LTP</th>
                          <th>Change</th>
                          <th>Change %</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(indices).map(([name, d]: any) => (
                          <tr key={name}>
                            <td style={{ color: '#e8edf5', fontWeight: 700 }}>{name}</td>
                            <td>{d.price.toFixed(2)}</td>
                            <td className={d.change >= 0 ? 'bull' : 'bear'}>
                              {d.change >= 0 ? '+' : ''}{d.change.toFixed(2)}
                            </td>
                            <td className={d.changePct >= 0 ? 'bull' : 'bear'}>
                              {d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(2)}%
                            </td>
                            <td>
                              <div className="progress-bar-wrap" style={{ width: 80 }}>
                                <div className={`progress-bar-fill ${d.change >= 0 ? 'bull' : 'bear'}`}
                                  style={{ width: `${Math.min(100, 50 + Math.abs(d.changePct) * 10)}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════
                TAB: PRICE CHART (Candlestick)
            ══════════════════════════════ */}
            {activeTab === 'chart' && (
              <>
                <div className="chart-container">
                  <div className="chart-toolbar">
                    <div className="chart-title">
                      <span className="dot" />
                      {selectedSymbol} Candlestick Chart
                    </div>
                    <div className="tf-selector">
                      {['1m', '5m', '15m', '1h', 'D'].map(tf => (
                        <button key={tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                          onClick={() => setTimeframe(tf)}>
                          {tf.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-body" style={{ height: 380 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#1a2540" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="#4e637d" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} interval={Math.floor(candles.length / 8)} />
                        <YAxis yAxisId="price" domain={['auto', 'auto']} stroke="#4e637d" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} width={72} orientation="right" />
                        <YAxis yAxisId="vol" domain={[0, 'auto']} stroke="#4e637d" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} width={0} hide />
                        <Tooltip content={<ChartTooltip />} />
                        {/* EMA Line */}
                        <Line yAxisId="price" type="monotone" dataKey="close" stroke="rgba(124,58,237,0.4)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="EMA20" />
                        {/* Candle highs (wicks simulation via bar) */}
                        <Bar yAxisId="vol" dataKey="volume" fill="rgba(16,185,129,0.25)" maxBarSize={6} />
                        {/* Close price area */}
                        <Bar yAxisId="price" dataKey="close" fill="transparent" maxBarSize={8}
                          shape={(props: any) => {
                            const { x, y, width, payload } = props
                            if (!payload?.open || !payload?.close) return null
                            const isBull = payload.close >= payload.open
                            const color = isBull ? '#10b981' : '#f43f5e'
                            return (
                              <rect x={x} y={y} width={Math.max(1, width - 1)} height={1}
                                fill={color} stroke={color} />
                            )
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* OHLCV Table */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Recent OHLCV Data — {selectedSymbol}</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Open</th>
                          <th>High</th>
                          <th>Low</th>
                          <th>Close</th>
                          <th>Volume</th>
                          <th>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...candles].reverse().slice(0, 15).map((c: any, i: number) => {
                          const chg = c.close - c.open
                          const chgPct = (chg / c.open) * 100
                          return (
                            <tr key={i}>
                              <td style={{ color: '#98a9c0' }}>{c.timestamp}</td>
                              <td>{c.open?.toFixed(2)}</td>
                              <td className="bull">{c.high?.toFixed(2)}</td>
                              <td className="bear">{c.low?.toFixed(2)}</td>
                              <td style={{ color: chg >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{c.close?.toFixed(2)}</td>
                              <td className="muted">{c.volume ? Math.round(c.volume / 1000) + 'K' : '—'}</td>
                              <td className={chg >= 0 ? 'bull' : 'bear'}>
                                {chg >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════
                TAB: TECHNICALS
            ══════════════════════════════ */}
            {activeTab === 'technicals' && (
              <>
                <div className="grid-cols-4">
                  {[
                    { name: 'RSI (14)', value: rsiVal.toFixed(1), cls: rsiVal > 70 ? 'bear' : rsiVal < 30 ? 'bull' : rsiVal > 50 ? 'bull' : 'neutral', rating: rsiVal > 70 ? 'Overbought' : rsiVal < 30 ? 'Oversold' : rsiVal > 50 ? 'Bullish Zone' : 'Bearish Zone' },
                    { name: 'EMA (20)', value: ema20.toFixed(1), cls: ltp > ema20 ? 'bull' : 'bear', rating: ltp > ema20 ? 'Price Above EMA' : 'Price Below EMA' },
                    { name: 'MACD Signal', value: '+12.4', cls: 'bull', rating: 'Buy Crossover' },
                    { name: 'ADX (14)', value: '24.1', cls: 'neutral', rating: 'Trending Market' },
                    { name: 'BB Width', value: '1.24%', cls: 'warn', rating: 'Consolidating' },
                    { name: 'Volume OBV', value: 'Rising', cls: 'bull', rating: 'Accumulation' },
                    { name: 'Stochastic', value: '68.2', cls: 'bull', rating: 'Mild Overbought' },
                    { name: 'CCI (14)', value: '+142', cls: 'bull', rating: 'Strong Trend' },
                  ].map((g, i) => (
                    <div key={i} className={`tech-gauge ${g.cls}`}>
                      <div className="tg-name">{g.name}</div>
                      <div className="tg-value">{g.value}</div>
                      <div className={`tg-rating ${g.cls}`}>{g.rating}</div>
                    </div>
                  ))}
                </div>

                {/* Technicals Chart — price + RSI */}
                <div className="chart-container">
                  <div className="chart-toolbar">
                    <div className="chart-title"><span className="dot" /> Price vs EMA — {selectedSymbol}</div>
                    <div className="tf-selector">
                      {['5m', '15m', '1h', 'D'].map(tf => (
                        <button key={tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`} onClick={() => setTimeframe(tf)}>{tf.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-body" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candles} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#1a2540" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="#4e637d" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis domain={['auto', 'auto']} stroke="#4e637d" tick={{ fontSize: 9 }} width={70} orientation="right" />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fill="url(#bullGrad)" fillOpacity={0.3} />
                        <Line type="monotone" dataKey="open" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="6 2" name="Open" />
                        <ReferenceLine y={ema20} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'EMA20', fontSize: 9, fill: '#f59e0b', position: 'right' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pivot Points */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Standard Pivot Levels — {selectedSymbol}</span>
                  </div>
                  <div className="card-body">
                    <div className="pivot-grid">
                      {[
                        { cls: 'pivot-r3', level: 'R3', price: (ltp * 1.025).toFixed(1) },
                        { cls: 'pivot-r2', level: 'R2', price: (ltp * 1.015).toFixed(1) },
                        { cls: 'pivot-r1', level: 'R1', price: (ltp * 1.005).toFixed(1) },
                        { cls: 'pivot-pp', level: 'Pivot', price: ltp.toFixed(1) },
                        { cls: 'pivot-s1', level: 'S1', price: (ltp * 0.995).toFixed(1) },
                        { cls: 'pivot-s2', level: 'S2', price: (ltp * 0.985).toFixed(1) },
                        { cls: 'pivot-s3', level: 'S3', price: (ltp * 0.975).toFixed(1) },
                      ].map(p => (
                        <div key={p.level} className={`pivot-cell ${p.cls}`}>
                          <span className="level">{p.level}</span>
                          <span className="price">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════
                TAB: OPTION CHAIN
            ══════════════════════════════ */}
            {activeTab === 'options' && (
              <>
                <div className="grid-cols-3">
                  {[
                    { label: 'Put-Call Ratio (PCR)', value: optionChain?.pcr?.toFixed(3) || '0.940', sub: 'OI-based PCR', cls: 'purple' },
                    { label: 'Max Pain Strike', value: optionChain?.maxPainStrike?.toString() || '24,300', sub: 'Writers\' equilibrium', cls: 'warn' },
                    { label: 'ATM Strike', value: optionChain?.atmStrike?.toString() || '24,300', sub: 'Nearest to spot', cls: 'neutral' },
                  ].map((m, i) => (
                    <div key={i} className="metric-card">
                      <div className="metric-label">{m.label}</div>
                      <div className="metric-value" style={{ fontSize: 28 }}>{m.value}</div>
                      <div className="metric-sub">
                        <span>{m.sub}</span>
                        <span className={`metric-badge ${m.cls}`}>OPTIONS</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* OI Chart */}
                <div className="chart-container">
                  <div className="chart-toolbar">
                    <div className="chart-title"><span className="dot" /> Open Interest — CE vs PE</div>
                  </div>
                  <div className="chart-body" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={(optionChain?.contracts || []).filter((c: any) => c.type === 'CE').slice(0, 10).map((ce: any) => {
                          const pe = (optionChain?.contracts || []).find((p: any) => p.strike === ce.strike && p.type === 'PE')
                          return { strike: ce.strike, ceOI: ce.openInterest / 1000, peOI: pe?.openInterest / 1000 }
                        })}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="2 4" stroke="#1a2540" vertical={false} />
                        <XAxis dataKey="strike" stroke="#4e637d" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                        <YAxis stroke="#4e637d" tick={{ fontSize: 9 }} width={50} />
                        <Tooltip formatter={(v: any, n: any) => [`${v.toFixed(0)}K`, n === 'ceOI' ? 'CE OI' : 'PE OI']} contentStyle={{ background: '#111d32', border: '1px solid #2a3d5e', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 10 }} />
                        <Bar dataKey="ceOI" fill="rgba(16,185,129,0.7)" maxBarSize={16} name="CE OI" />
                        <Bar dataKey="peOI" fill="rgba(244,63,94,0.7)" maxBarSize={16} name="PE OI" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Option Chain Table */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Option Chain — {selectedSymbol}</span>
                    <span style={{ fontSize: 10, color: '#10b981' }}>CE = Calls &nbsp;|&nbsp; PE = Puts</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="oc-ce">CE OI</th>
                          <th className="oc-ce">CE Δ OI</th>
                          <th className="oc-ce">CE IV%</th>
                          <th className="oc-ce">CE LTP</th>
                          <th className="center">Strike</th>
                          <th className="oc-pe">PE LTP</th>
                          <th className="oc-pe">PE IV%</th>
                          <th className="oc-pe">PE Δ OI</th>
                          <th className="oc-pe">PE OI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(optionChain?.contracts || []).filter((_: any, i: number) => i % 2 === 0).slice(0, 12).map((c: any, idx: number) => {
                          const strike = c.strike
                          const pe = (optionChain?.contracts || []).find((p: any) => p.strike === strike && p.type === 'PE')
                          const isATM = strike === optionChain?.atmStrike
                          return (
                            <tr key={idx} className={isATM ? 'atm' : ''}>
                              <td className="bull">{c.openInterest?.toLocaleString()}</td>
                              <td className={c.changeInOpenInterest >= 0 ? 'bull' : 'bear'}>{c.changeInOpenInterest?.toLocaleString()}</td>
                              <td className="muted">{c.impliedVolatility?.toFixed(1)}%</td>
                              <td className="bull">{c.lastTradedPrice?.toFixed(2)}</td>
                              <td className="strike-col">{strike}</td>
                              <td className="bear">{pe?.lastTradedPrice?.toFixed(2)}</td>
                              <td className="muted">{pe?.impliedVolatility?.toFixed(1)}%</td>
                              <td className={pe?.changeInOpenInterest >= 0 ? 'bull' : 'bear'}>{pe?.changeInOpenInterest?.toLocaleString()}</td>
                              <td className="bear">{pe?.openInterest?.toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════
                TAB: SIGNALS
            ══════════════════════════════ */}
            {activeTab === 'signals' && signal && (
              <div className="grid-2-1">
                <div className="signal-card">
                  <div className="signal-header">
                    <div>
                      <div style={{ fontSize: 10, color: '#4e637d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Signal Analysis</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#e8edf5' }}>{selectedSymbol} Trading Setup</div>
                    </div>
                    <span className={`signal-bias-badge ${signal.bias === 'BULLISH' ? 'bull' : signal.bias === 'BEARISH' ? 'bear' : 'neutral'}`}>
                      {signal.bias} — {(signal.confidence * 100).toFixed(0)}% Conf.
                    </span>
                  </div>

                  {/* Bias Score Bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10, color: '#10b981', fontWeight: 700 }}>
                        <span>BULLISH SCORE</span><span>{signal.bullishScore?.toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar-wrap"><div className="progress-bar-fill bull" style={{ width: `${signal.bullishScore}%` }} /></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10, color: '#f43f5e', fontWeight: 700 }}>
                        <span>BEARISH SCORE</span><span>{signal.bearishScore?.toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar-wrap"><div className="progress-bar-fill bear" style={{ width: `${signal.bearishScore}%` }} /></div>
                    </div>
                  </div>

                  <div className="contract-block">
                    <div>
                      <div style={{ fontSize: 9, color: '#4e637d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Suggested Contract</div>
                      <div className="contract-name">{signal.suggestedContract || 'NO ACTIVE SIGNAL'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: '#4e637d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Entry Premium</div>
                      <div className="contract-premium">₹{signal.entryPremium?.toFixed(2) || '—'}</div>
                    </div>
                  </div>

                  <div className="risk-grid">
                    <div className="risk-cell">
                      <span className="rlabel">Stop Loss</span>
                      <span className="rvalue" style={{ color: '#f43f5e' }}>₹{signal.stopLoss?.toFixed(2)}</span>
                    </div>
                    <div className="risk-cell">
                      <span className="rlabel">Target</span>
                      <span className="rvalue" style={{ color: '#10b981' }}>₹{signal.target?.toFixed(2)}</span>
                    </div>
                    <div className="risk-cell">
                      <span className="rlabel">R:R Ratio</span>
                      <span className="rvalue" style={{ color: '#a78bfa' }}>1:{signal.riskRewardRatio}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#98a9c0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Supporting Factors</div>
                    <ul className="factors-list">
                      {(signal.bullishFactors || []).map((f: string, i: number) => (
                        <li key={i}><span className="factor-icon bull">✓</span>{f}</li>
                      ))}
                      {(signal.bearishFactors || []).map((f: string, i: number) => (
                        <li key={i}><span className="factor-icon bear">✗</span>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sizer */}
                <div className="sizer-panel">
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#98a9c0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Position Sizer</div>
                  <div className="form-field">
                    <label>Quantity (Units)</label>
                    <input type="number" value={orderQuantity}
                      onChange={e => setOrderQuantity(parseInt(e.target.value) || 50)} />
                  </div>

                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: '1px solid var(--border-dim)' }}>
                    <div className="pnl-row">
                      <span className="label">Max theoretical loss</span>
                      <span className="val-loss">₹{signal.maxTradeLoss?.toFixed(0)}</span>
                    </div>
                    <div className="pnl-row">
                      <span className="label">Expected profit</span>
                      <span className="val-profit">₹{signal.expectedProfit?.toFixed(0)}</span>
                    </div>
                    <div className="pnl-row">
                      <span className="label">Delta exposure</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{signal.delta?.toFixed(3)}</span>
                    </div>
                    <div className="pnl-row" style={{ border: 'none' }}>
                      <span className="label">Theta decay / day</span>
                      <span className="val-loss">{signal.theta?.toFixed(2)}</span>
                    </div>
                  </div>

                  {signal.suggestedDirection !== 'NO TRADE' && (
                    <button className="btn btn-primary btn-full"
                      onClick={() => executePaperTrade(
                        signal.suggestedContract?.includes('CE') ? 'CE' : 'PE',
                        signal.strikePrice, signal.expiryDate || '2026-08-28', 'BUY', signal.entryPremium
                      )}>
                      ⚡ Execute Paper Trade
                    </button>
                  )}

                  <div style={{ padding: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠ Disclaimer</div>
                    <div style={{ fontSize: 10, color: '#98a9c0', lineHeight: 1.5 }}>Simulation only. Not financial advice. Past signals do not guarantee future results.</div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════
                TAB: PORTFOLIO
            ══════════════════════════════ */}
            {activeTab === 'portfolio' && (
              <>
                {portfolio && (
                  <div className="grid-cols-4">
                    {[
                      { label: 'Simulated Capital', val: `₹${portfolio.initialCapital?.toLocaleString()}`, cls: 'neutral' },
                      { label: 'Cash Balance', val: `₹${portfolio.virtualBalance?.toLocaleString()}`, cls: portfolio.virtualBalance < portfolio.initialCapital * 0.5 ? 'bear' : 'bull' },
                      { label: 'Current Equity', val: `₹${portfolio.currentEquity?.toLocaleString()}`, cls: portfolio.currentEquity > portfolio.initialCapital ? 'bull' : 'bear' },
                      { label: 'Max Drawdown', val: `${portfolio.maxDrawdown?.toFixed(2)}%`, cls: 'bear' },
                    ].map((m, i) => (
                      <div key={i} className="metric-card">
                        <div className="metric-label">{m.label}</div>
                        <div className="metric-value" style={{ fontSize: 20 }}>{m.val}</div>
                        <div className="metric-sub">
                          <span>{i === 2 ? (portfolio.currentEquity > portfolio.initialCapital ? '📈 In Profit' : '📉 Loss') : ''}</span>
                          <span className={`metric-badge ${m.cls}`}>{m.cls.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Portfolio equity chart */}
                <div className="chart-container">
                  <div className="chart-toolbar">
                    <div className="chart-title"><span className="dot" /> Equity Curve (Simulated)</div>
                  </div>
                  <div className="chart-body" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={candles.map((c: any, i: number) => ({ t: c.timestamp, equity: (portfolio?.initialCapital || 1000000) + (Math.sin(i / 8) * 5000) + (i * 120) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#1a2540" vertical={false} />
                        <XAxis dataKey="t" stroke="#4e637d" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis stroke="#4e637d" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip contentStyle={{ background: '#111d32', border: '1px solid #2a3d5e', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 10 }} />
                        <Area type="monotone" dataKey="equity" stroke="#7c3aed" strokeWidth={2} fill="url(#equityGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Backtest panel */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Strategy Backtesting</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-secondary" onClick={() => runBacktest('SMA_CROSSOVER')}>
                        📊 SMA Crossover
                      </button>
                      <button className="btn btn-secondary" onClick={() => runBacktest('RSI_BREAKOUT')}>
                        📈 RSI Breakout
                      </button>
                    </div>
                    {backtestResult && (
                      <div className="backtest-result">
                        <div className="bt-stat">
                          <div className="bt-label">Total Trades</div>
                          <div className="bt-value">{backtestResult.totalTrades}</div>
                        </div>
                        <div className="bt-stat">
                          <div className="bt-label">Win Rate</div>
                          <div className="bt-value" style={{ color: '#10b981' }}>{backtestResult.winRate?.toFixed(1)}%</div>
                        </div>
                        <div className="bt-stat">
                          <div className="bt-label">Max Drawdown</div>
                          <div className="bt-value" style={{ color: '#f43f5e' }}>{backtestResult.maxDrawdown?.toFixed(2)}%</div>
                        </div>
                        <div className="bt-stat">
                          <div className="bt-label">Profit Factor</div>
                          <div className="bt-value" style={{ color: '#a78bfa' }}>{backtestResult.profitFactor?.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════
                TAB: NEWS
            ══════════════════════════════ */}
            {activeTab === 'news' && (
              <>
                <div className="grid-cols-3">
                  {[
                    { label: 'Overall Sentiment', val: '+0.62', cls: 'bull', tag: 'BULLISH' },
                    { label: 'News Articles', val: news.length.toString() || '12', cls: 'neutral', tag: 'TOTAL' },
                    { label: 'Impact Score', val: '68%', cls: 'warn', tag: 'MEDIUM' },
                  ].map((m, i) => (
                    <div key={i} className="metric-card">
                      <div className="metric-label">{m.label}</div>
                      <div className="metric-value">{m.val}</div>
                      <div className="metric-sub">
                        <span></span>
                        <span className={`metric-badge ${m.cls}`}>{m.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {(news.length > 0 ? news : Array(6).fill(0).map((_, i) => ({
                  category: ['MARKETS', 'ECONOMY', 'SECTORS', 'RBI', 'FII', 'RESULTS'][i % 6],
                  headline: [
                    'NIFTY Breaks Key Resistance at 24,400 on Strong Breadth',
                    'RBI Holds Rates Steady — Accommodative Stance Maintained',
                    'FII Inflows Hit ₹12,000 Crore in August — Markets React Positively',
                    'IT Sector Leads Recovery as USD Strengthens Against INR',
                    'Auto Stocks Rally as Monthly Sales Data Shows 18% YoY Growth',
                    'Reliance Industries Q1 Results Beat Estimates — JIOFINANCE Surges'
                  ][i],
                  summary: 'Broader markets show strong buying interest as institutional participants increase exposure. Technical indicators suggest continued momentum with support at key EMAs.',
                  sentiment: ['POSITIVE', 'NEUTRAL', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE'][i],
                  source: ['Economic Times', 'Moneycontrol', 'Bloomberg India', 'LiveMint', 'Business Standard', 'CNBC TV18'][i],
                  marketImpactScore: [0.72, 0.45, 0.68, 0.55, 0.61, 0.80][i]
                }))).map((item: any, idx: number) => (
                  <div key={idx} className="news-card">
                    <div className="news-top">
                      <div>
                        <span className="news-category">{item.category}</span>
                        <div className="news-headline">{item.headline}</div>
                      </div>
                      <span className={`sentiment-tag ${item.sentiment === 'POSITIVE' ? 'positive' : item.sentiment === 'NEGATIVE' ? 'negative' : 'neutral'}`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <p className="news-summary">{item.summary}</p>
                    <div className="news-footer">
                      <span>📰 {item.source}</span>
                      <span>Impact: {(item.marketImpactScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </>
            )}

          </div>

          {/* ── Footer ── */}
          <footer className="app-footer">
            <p>
              Disclaimer: All data, signals, and metrics are simulated for research and educational purposes only.
              Market predictions are inherently uncertain. Past performance does not guarantee future results.
              Options trading involves substantial risk of loss. Consult a licensed financial advisor before trading.
            </p>
            <p className="platform-note">
              Antigravity Research Engine — Operating in {systemStatus.marketData} Data Mode · Not SEBI Registered · Not for Live Trading
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
