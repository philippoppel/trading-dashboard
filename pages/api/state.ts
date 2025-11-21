import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Path to state file - adjust this to point to your trading bot state
  const statePath = path.join(process.cwd(), '..', 'data', 'trading_state', 'safe_multi_symbol_state.json')

  try {
    if (!fs.existsSync(statePath)) {
      return res.status(404).json({ error: 'State file not found. Start the trading bot first.' })
    }

    const stateData = fs.readFileSync(statePath, 'utf-8')
    const state = JSON.parse(stateData)

    // Calculate additional metrics
    const traders = state.traders || {}
    const initialBalance = state.initial_balance || 10000

    const symbols = Object.keys(traders)
    let totalValue = 0
    let totalFees = 0
    let totalTrades = 0
    const returns: number[] = []

    symbols.forEach((symbol) => {
      const trader = traders[symbol]
      const portfolioValue = trader.balance + trader.position_value
      totalValue += portfolioValue
      totalFees += trader.total_fees
      totalTrades += trader.num_trades

      const ret = (portfolioValue / initialBalance - 1) * 100
      returns.push(ret)
    })

    const totalInitial = initialBalance * symbols.length
    const totalReturn = (totalValue / totalInitial - 1) * 100

    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
    const stdDev = returns.length > 1
      ? Math.sqrt(returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length)
      : 0
    const sharpe = stdDev > 0 ? avgReturn / stdDev : 0

    // Calculate drawdown
    const maxValues = symbols.map(s => traders[s].highest_value)
    const currentValues = symbols.map(s => traders[s].balance + traders[s].position_value)
    const totalMax = maxValues.reduce((a, b) => a + b, 0)
    const totalCurrent = currentValues.reduce((a, b) => a + b, 0)
    const drawdown = (totalCurrent / totalMax - 1) * 100

    res.status(200).json({
      ...state,
      metrics: {
        totalValue,
        totalReturn,
        totalFees,
        totalTrades,
        avgReturn,
        sharpe,
        drawdown,
        symbolCount: symbols.length
      }
    })
  } catch (error) {
    console.error('Error reading state:', error)
    res.status(500).json({ error: 'Failed to read trading state' })
  }
}
