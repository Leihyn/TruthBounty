import { useState } from 'react'
import './App.css'

// API Base URL
const API_BASE = 'http://localhost:3001'

// Types
interface Signal {
  epoch: number
  platform: string
  consensus: string
  confidence: number
  weightedBullPercent: number
  participatingTraders: number
  diamondTraderCount: number
  platinumTraderCount: number
  totalVolumeWei: string
  signalStrength: string
  topTraderAgreement: number
  timestamp: string
}

interface Trader {
  address: string
  truthScore: number
  tier: string
  totalBets: number
  wins: number
  losses: number
  winRate: number
  totalVolume: string
}

interface UnifiedTrader {
  primaryAddress: string
  displayName?: string
  unifiedScore: number
  overallRoi: number
  totalVolume: number
  totalBets: number
  wins: number
  losses: number
  winRate: number
  tier: string
  activePlatforms: string[]
  platformScores: PlatformScore[]
}

interface PlatformScore {
  platform: string
  score: number
  tier: string
  winRate: number
  volume: number
}

interface TrendingTopic {
  topic: string
  normalizedTopic: string
  score: number
  velocity: number
  totalVolume: number
  totalMarkets: number
  category?: string
  platforms: PlatformPresence[]
}

interface PlatformPresence {
  platform: string
  marketCount: number
  volume: number
  topMarkets: MarketSummary[]
}

interface MarketSummary {
  id: string
  title: string
  probability: number
  volume: number
}

interface CrossPlatformSignal {
  topic: string
  normalizedTopic: string
  consensus: string
  confidence: number
  volumeWeightedProbability: number
  smartMoneyAgreement: number
  platforms: PlatformSignal[]
  totalVolume: number
  marketCount: number
}

interface PlatformSignal {
  platform: string
  marketId: string
  marketTitle: string
  probability: number
  volume: number
}

interface PlatformStatus {
  platform: string
  status: string
  leaderboardCount: number
  marketsCount: number
  lastLeaderboardSync?: string
  errorMessage?: string
}

interface BacktestResult {
  totalReturn: number
  annualizedReturn: number
  maxDrawdown: number
  sharpeRatio: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  profitFactor: number
  finalPortfolioValue: number
}

interface Alert {
  id: number
  type: string
  severity: string
  wallets: string[]
  status: string
  createdAt: string
}

interface WalletAnalysis {
  address: string
  riskScore: number
  patterns: {
    washTradingScore: number
    sybilScore: number
    anomalyScore: number
    collusionScore: number
  }
}

interface HealthStatus {
  status: string
  timestamp: string
  bots: object
}

function App() {
  const [activeTab, setActiveTab] = useState('trends')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for different sections
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null)
  const [signalHistory, setSignalHistory] = useState<Signal[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [unifiedTraders, setUnifiedTraders] = useState<UnifiedTrader[]>([])
  const [trends, setTrends] = useState<TrendingTopic[]>([])
  const [crossSignals, setCrossSignals] = useState<CrossPlatformSignal[]>([])
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [walletAnalysis, setWalletAnalysis] = useState<WalletAnalysis | null>(null)

  // Form states
  const [backtestLeader, setBacktestLeader] = useState('')
  const [backtestDays, setBacktestDays] = useState('30')
  const [analyzeWallet, setAnalyzeWallet] = useState('')

  const fetchApi = async (endpoint: string, options?: RequestInit) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev',
          ...options?.headers,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API Error')
      return data
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // API Functions
  const checkHealth = async () => {
    const data = await fetchApi('/health')
    if (data) setHealth(data)
  }

  // Trends
  const getTrends = async () => {
    const data = await fetchApi('/api/trends?limit=50')
    if (data?.data) setTrends(data.data)
  }

  // Cross-Platform Signals
  const getCrossSignals = async () => {
    const data = await fetchApi('/api/cross-signals?limit=30')
    if (data?.data) setCrossSignals(data.data)
  }

  // Unified Leaderboard
  const getUnifiedLeaderboard = async () => {
    const data = await fetchApi('/api/leaderboard/unified?limit=50')
    if (data?.data) setUnifiedTraders(data.data)
  }

  // Platform Status
  const getPlatformStatuses = async () => {
    const data = await fetchApi('/api/platforms/status')
    if (data?.data) setPlatformStatuses(data.data)
  }

  // Legacy endpoints
  const getCurrentSignal = async () => {
    const data = await fetchApi('/api/signals/current/pancakeswap')
    if (data?.data) setCurrentSignal(data.data)
  }

  const getSignalHistory = async () => {
    const data = await fetchApi('/api/signals/history?limit=20')
    if (data?.data) setSignalHistory(data.data)
  }

  const getTraders = async () => {
    const data = await fetchApi('/api/signals/traders')
    if (data?.data) setTraders(data.data)
  }

  const runBacktest = async () => {
    if (!backtestLeader) {
      setError('Please enter a leader address')
      return
    }
    const endDate = new Date()
    const startDate = new Date(Date.now() - parseInt(backtestDays) * 24 * 60 * 60 * 1000)

    const data = await fetchApi('/api/backtest', {
      method: 'POST',
      body: JSON.stringify({
        leader: backtestLeader,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        initialCapital: 1,
        allocationPercent: 0.1,
        compounding: true,
      }),
    })
    if (data?.data) setBacktestResult(data.data)
  }

  const getAlerts = async () => {
    const data = await fetchApi('/api/alerts/pending')
    if (data?.data) setAlerts(data.data)
  }

  const analyzeWalletAddress = async () => {
    if (!analyzeWallet) {
      setError('Please enter a wallet address')
      return
    }
    const data = await fetchApi(`/api/wallet/${analyzeWallet}/analyze`)
    if (data?.data) setWalletAnalysis(data.data)
  }

  const dismissAlert = async (id: number) => {
    await fetchApi(`/api/alerts/${id}/dismiss`, { method: 'POST', body: JSON.stringify({}) })
    getAlerts()
  }

  const confirmAlert = async (id: number) => {
    await fetchApi(`/api/alerts/${id}/confirm`, { method: 'POST', body: JSON.stringify({}) })
    getAlerts()
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toFixed(0)
  }

  const formatBnb = (wei: string) => {
    try {
      return (Number(BigInt(wei)) / 1e18).toFixed(4)
    } catch {
      return parseFloat(wei).toFixed(2)
    }
  }

  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`
  const formatPercentRaw = (n: number) => `${n.toFixed(1)}%`

  const getConsensusColor = (consensus: string) => {
    if (consensus.includes('STRONG_YES')) return 'strong-yes'
    if (consensus.includes('LEAN_YES')) return 'lean-yes'
    if (consensus.includes('STRONG_NO')) return 'strong-no'
    if (consensus.includes('LEAN_NO')) return 'lean-no'
    return 'mixed'
  }

  const tabs = [
    { id: 'trends', label: 'Trends' },
    { id: 'cross-signals', label: 'Cross Signals' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'signals', label: 'PancakeSwap' },
    { id: 'backtest', label: 'Backtest' },
    { id: 'anti-gaming', label: 'Anti-Gaming' },
  ]

  return (
    <div className="dashboard">
      <header className="header">
        <h1>TruthBOT Multi-Platform Dashboard</h1>
        <button onClick={checkHealth} disabled={loading}>
          {health?.status === 'ok' ? 'Connected' : 'Check Connection'}
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {/* TRENDS TAB */}
        {activeTab === 'trends' && (
          <div className="panel">
            <h2>Trending Topics Across All Platforms</h2>
            <button onClick={getTrends} disabled={loading}>
              Load Trends
            </button>

            {trends.length > 0 && (
              <div className="trends-grid">
                {trends.map((trend) => (
                  <div key={trend.normalizedTopic} className="trend-card">
                    <div className="trend-header">
                      <h3>{trend.topic}</h3>
                      <span className="trend-score">{trend.score.toFixed(0)}</span>
                    </div>
                    <div className="trend-meta">
                      <span className="category">{trend.category || 'General'}</span>
                      <span className="velocity">
                        {trend.velocity > 0 ? '📈' : trend.velocity < 0 ? '📉' : '➡️'}
                      </span>
                    </div>
                    <div className="trend-stats">
                      <div>
                        <span>Markets</span>
                        <strong>{trend.totalMarkets}</strong>
                      </div>
                      <div>
                        <span>Volume</span>
                        <strong>${formatNumber(trend.totalVolume)}</strong>
                      </div>
                      <div>
                        <span>Platforms</span>
                        <strong>{trend.platforms?.length || 0}</strong>
                      </div>
                    </div>
                    <div className="platform-badges">
                      {trend.platforms?.slice(0, 4).map((p) => (
                        <span key={p.platform} className="platform-badge">
                          {p.platform}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CROSS-SIGNALS TAB */}
        {activeTab === 'cross-signals' && (
          <div className="panel">
            <h2>Cross-Platform Consensus Signals</h2>
            <button onClick={getCrossSignals} disabled={loading}>
              Load Signals
            </button>

            {crossSignals.length > 0 && (
              <div className="signals-list">
                {crossSignals.map((signal, i) => (
                  <div key={i} className={`signal-card ${getConsensusColor(signal.consensus)}`}>
                    <div className="signal-header">
                      <h3>{signal.topic}</h3>
                      <span className={`consensus-badge ${getConsensusColor(signal.consensus)}`}>
                        {signal.consensus.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="signal-stats">
                      <div>
                        <span>Confidence</span>
                        <strong>{signal.confidence.toFixed(0)}%</strong>
                      </div>
                      <div>
                        <span>Probability</span>
                        <strong>{formatPercent(signal.volumeWeightedProbability)}</strong>
                      </div>
                      <div>
                        <span>Markets</span>
                        <strong>{signal.marketCount}</strong>
                      </div>
                      <div>
                        <span>Volume</span>
                        <strong>${formatNumber(signal.totalVolume)}</strong>
                      </div>
                    </div>
                    <div className="platform-breakdown">
                      {signal.platforms?.map((p) => (
                        <div key={p.platform} className="platform-signal">
                          <span className="platform-name">{p.platform}</span>
                          <span className="platform-prob">{formatPercent(p.probability)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UNIFIED LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="panel">
            <h2>Unified Cross-Platform Leaderboard</h2>
            <button onClick={getUnifiedLeaderboard} disabled={loading}>
              Load Leaderboard
            </button>

            {unifiedTraders.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Address</th>
                      <th>Score</th>
                      <th>Tier</th>
                      <th>Win Rate</th>
                      <th>Volume</th>
                      <th>Platforms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedTraders.map((t, i) => (
                      <tr key={t.primaryAddress}>
                        <td>#{i + 1}</td>
                        <td className="address">
                          {t.primaryAddress.slice(0, 8)}...{t.primaryAddress.slice(-6)}
                        </td>
                        <td className="score">{t.unifiedScore}</td>
                        <td className={`tier ${t.tier.toLowerCase()}`}>{t.tier}</td>
                        <td>{formatPercent(t.winRate)}</td>
                        <td>${formatNumber(t.totalVolume)}</td>
                        <td>
                          <div className="platform-badges small">
                            {t.activePlatforms?.slice(0, 3).map((p) => (
                              <span key={p} className="platform-badge">{p}</span>
                            ))}
                            {(t.activePlatforms?.length || 0) > 3 && (
                              <span className="platform-badge more">
                                +{t.activePlatforms.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PLATFORMS STATUS TAB */}
        {activeTab === 'platforms' && (
          <div className="panel">
            <h2>Platform Status</h2>
            <button onClick={getPlatformStatuses} disabled={loading}>
              Check Status
            </button>

            {platformStatuses.length > 0 && (
              <div className="platforms-grid">
                {platformStatuses.map((p) => (
                  <div key={p.platform} className={`platform-card ${p.status}`}>
                    <h3>{p.platform}</h3>
                    <div className={`status-indicator ${p.status}`}>
                      {p.status === 'ok' ? '✓' : p.status === 'error' ? '✗' : '?'}
                    </div>
                    <div className="platform-stats">
                      <div>
                        <span>Traders</span>
                        <strong>{p.leaderboardCount}</strong>
                      </div>
                      <div>
                        <span>Markets</span>
                        <strong>{p.marketsCount}</strong>
                      </div>
                    </div>
                    {p.lastLeaderboardSync && (
                      <div className="last-sync">
                        Last sync: {new Date(p.lastLeaderboardSync).toLocaleTimeString()}
                      </div>
                    )}
                    {p.errorMessage && (
                      <div className="error-msg">{p.errorMessage}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANCAKESWAP SIGNALS TAB */}
        {activeTab === 'signals' && (
          <div className="panel">
            <h2>PancakeSwap Smart Money Signals</h2>
            <div className="actions">
              <button onClick={getCurrentSignal} disabled={loading}>
                Get Current Signal
              </button>
              <button onClick={getSignalHistory} disabled={loading}>
                Load History
              </button>
              <button onClick={getTraders} disabled={loading}>
                Load Traders
              </button>
            </div>

            {currentSignal && (
              <div className="card signal-card">
                <h3>Current Signal - Epoch {currentSignal.epoch}</h3>
                <div className={`consensus ${currentSignal.consensus.toLowerCase()}`}>
                  {currentSignal.consensus}
                </div>
                <div className="stats">
                  <div>
                    <span>Confidence</span>
                    <strong>{formatPercentRaw(currentSignal.confidence)}</strong>
                  </div>
                  <div>
                    <span>Bull %</span>
                    <strong>{formatPercentRaw(currentSignal.weightedBullPercent)}</strong>
                  </div>
                  <div>
                    <span>Traders</span>
                    <strong>{currentSignal.participatingTraders}</strong>
                  </div>
                  <div>
                    <span>Strength</span>
                    <strong>{currentSignal.signalStrength}</strong>
                  </div>
                </div>
              </div>
            )}

            {signalHistory.length > 0 && (
              <div className="table-container">
                <h3>Signal History</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Epoch</th>
                      <th>Consensus</th>
                      <th>Confidence</th>
                      <th>Traders</th>
                      <th>Strength</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signalHistory.map((s) => (
                      <tr key={s.epoch}>
                        <td>{s.epoch}</td>
                        <td className={s.consensus.toLowerCase()}>{s.consensus}</td>
                        <td>{formatPercentRaw(s.confidence)}</td>
                        <td>{s.participatingTraders}</td>
                        <td>{s.signalStrength}</td>
                        <td>{new Date(s.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {traders.length > 0 && (
              <div className="table-container">
                <h3>Tracked Traders</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Tier</th>
                      <th>Score</th>
                      <th>Win Rate</th>
                      <th>Total Bets</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traders.slice(0, 20).map((t) => (
                      <tr key={t.address}>
                        <td className="address">{t.address.slice(0, 8)}...{t.address.slice(-6)}</td>
                        <td className={`tier ${t.tier.toLowerCase()}`}>{t.tier}</td>
                        <td>{t.truthScore}</td>
                        <td>{formatPercent(t.winRate)}</td>
                        <td>{t.totalBets}</td>
                        <td>{formatBnb(t.totalVolume)} BNB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BACKTEST TAB */}
        {activeTab === 'backtest' && (
          <div className="panel">
            <h2>Backtesting Engine</h2>
            <div className="form">
              <div className="form-group">
                <label>Leader Address</label>
                <input
                  type="text"
                  value={backtestLeader}
                  onChange={(e) => setBacktestLeader(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className="form-group">
                <label>Days</label>
                <select value={backtestDays} onChange={(e) => setBacktestDays(e.target.value)}>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
              </div>
              <button onClick={runBacktest} disabled={loading}>
                Run Backtest
              </button>
            </div>

            {backtestResult && (
              <div className="card backtest-result">
                <h3>Backtest Results</h3>
                <div className="stats">
                  <div>
                    <span>Total Return</span>
                    <strong className={backtestResult.totalReturn >= 0 ? 'positive' : 'negative'}>
                      {formatPercentRaw(backtestResult.totalReturn * 100)}
                    </strong>
                  </div>
                  <div>
                    <span>Win Rate</span>
                    <strong>{formatPercentRaw(backtestResult.winRate)}</strong>
                  </div>
                  <div>
                    <span>Total Trades</span>
                    <strong>{backtestResult.totalTrades}</strong>
                  </div>
                  <div>
                    <span>Max Drawdown</span>
                    <strong className="negative">{formatPercentRaw(backtestResult.maxDrawdown)}</strong>
                  </div>
                  <div>
                    <span>Sharpe Ratio</span>
                    <strong>{backtestResult.sharpeRatio.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Profit Factor</span>
                    <strong>{backtestResult.profitFactor.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANTI-GAMING TAB */}
        {activeTab === 'anti-gaming' && (
          <div className="panel">
            <h2>Anti-Gaming Detector</h2>

            <div className="section">
              <h3>Pending Alerts</h3>
              <button onClick={getAlerts} disabled={loading}>
                Load Alerts
              </button>

              {alerts.length > 0 ? (
                <div className="alerts-list">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`alert-item ${alert.severity.toLowerCase()}`}>
                      <div className="alert-header">
                        <span className="type">{alert.type}</span>
                        <span className="severity">{alert.severity}</span>
                      </div>
                      <div className="wallets">
                        {alert.wallets.map((w) => (
                          <code key={w}>{w.slice(0, 10)}...</code>
                        ))}
                      </div>
                      <div className="alert-actions">
                        <button onClick={() => dismissAlert(alert.id)}>Dismiss</button>
                        <button onClick={() => confirmAlert(alert.id)} className="danger">
                          Confirm
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty">No pending alerts</p>
              )}
            </div>

            <div className="section">
              <h3>Wallet Analysis</h3>
              <div className="form inline">
                <input
                  type="text"
                  value={analyzeWallet}
                  onChange={(e) => setAnalyzeWallet(e.target.value)}
                  placeholder="Enter wallet address..."
                />
                <button onClick={analyzeWalletAddress} disabled={loading}>
                  Analyze
                </button>
              </div>

              {walletAnalysis && (
                <div className="card analysis-result">
                  <h4>{walletAnalysis.address.slice(0, 10)}...{walletAnalysis.address.slice(-8)}</h4>
                  <div className={`risk-score ${walletAnalysis.riskScore > 50 ? 'high' : walletAnalysis.riskScore > 25 ? 'medium' : 'low'}`}>
                    Risk Score: {walletAnalysis.riskScore}/100
                  </div>
                  <div className="patterns">
                    <div>
                      <span>Wash Trading</span>
                      <div className="bar">
                        <div style={{ width: `${walletAnalysis.patterns.washTradingScore}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <span>Sybil</span>
                      <div className="bar">
                        <div style={{ width: `${walletAnalysis.patterns.sybilScore}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <span>Anomaly</span>
                      <div className="bar">
                        <div style={{ width: `${walletAnalysis.patterns.anomalyScore}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <span>Collusion</span>
                      <div className="bar">
                        <div style={{ width: `${walletAnalysis.patterns.collusionScore}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {loading && <div className="loading">Loading...</div>}
    </div>
  )
}

export default App
