import { useEffect, useState } from 'react'
import Head from 'next/head'

interface Trader {
  balance: number
  position: number
  position_value: number
  entry_price: number
  total_fees: number
  num_trades: number
  current_price: number
  max_loss_reached: boolean
}

interface TradingState {
  timestamp: string
  session_start_time: string
  initial_balance: number
  emergency_stopped: boolean
  emergency_reason: string | null
  traders: { [symbol: string]: Trader }
  metrics?: {
    totalValue: number
    totalReturn: number
    totalFees: number
    totalTrades: number
    avgReturn: number
    sharpe: number
    drawdown: number
    symbolCount: number
  }
}

export default function Dashboard() {
  const [state, setState] = useState<TradingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchState = async () => {
    try {
      const response = await fetch('/api/state')
      if (!response.ok) {
        throw new Error('Failed to fetch trading state')
      }
      const data = await response.json()
      setState(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchState()
    // Refresh every 10 seconds
    const interval = setInterval(fetchState, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {error || 'Failed to load trading state'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Make sure the trading bot is running and the state file exists.
          </p>
          <button
            onClick={fetchState}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { traders, metrics, emergency_stopped, emergency_reason, initial_balance } = state

  const getPositionColor = (position: number) => {
    if (position > 0.1) return 'text-green-600 dark:text-green-400'
    if (position < -0.1) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getReturnColor = (ret: number) => {
    if (ret > 0) return 'text-green-600 dark:text-green-400'
    if (ret < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <>
      <Head>
        <title>Trading Bot Dashboard</title>
        <meta name="description" content="Safe Multi-Symbol Trading Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🛡️ Safe Trading Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date(state.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Emergency Alert */}
        {emergency_stopped && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-3xl mr-3">🚨</span>
                <div>
                  <p className="font-bold text-red-800 dark:text-red-200">EMERGENCY STOP ACTIVE</p>
                  <p className="text-red-700 dark:text-red-300">{emergency_reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Portfolio</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-sm ${getReturnColor(metrics.totalReturn)}`}>
                {metrics.totalReturn > 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Trades</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalTrades}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${metrics.totalFees.toFixed(2)} in fees
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sharpe Ratio</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.sharpe.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Risk-adjusted return
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drawdown</p>
              <p className={`text-3xl font-bold ${getReturnColor(metrics.drawdown)}`}>
                {metrics.drawdown.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                From peak
              </p>
            </div>
          </div>
        )}

        {/* Symbols Grid */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trading Positions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(traders).map(([symbol, trader]) => {
              const portfolioValue = trader.balance + trader.position_value
              const ret = (portfolioValue / initial_balance - 1) * 100

              const positionType = trader.position > 0.1 ? 'LONG' : trader.position < -0.1 ? 'SHORT' : 'FLAT'

              return (
                <div key={symbol} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{symbol}</h3>
                    {trader.max_loss_reached && <span className="text-red-500 text-2xl">🛑</span>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Price</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${trader.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Position</span>
                      <span className={`font-semibold ${getPositionColor(trader.position)}`}>
                        {positionType} {Math.abs(trader.position).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Entry</span>
                      <span className="text-gray-900 dark:text-white">
                        ${trader.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Portfolio</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Return</span>
                      <span className={`font-bold text-lg ${getReturnColor(ret)}`}>
                        {ret > 0 ? '+' : ''}{ret.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-500">{trader.num_trades} trades</span>
                      <span className="text-gray-500 dark:text-gray-500">${trader.total_fees.toFixed(2)} fees</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>Session started: {new Date(state.session_start_time).toLocaleString()}</p>
          <p className="mt-2">Auto-refreshes every 10 seconds</p>
        </div>
      </div>
    </>
  )
}
