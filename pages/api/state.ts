import type { NextApiRequest, NextApiResponse } from 'next'
import { getLatestState } from '../../lib/blobState'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not configured')
      return res.status(500).json({ error: 'Blob storage not configured' })
    }

    const state = await getLatestState(token)

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
      const tradeCount = (trader.trade_history?.length ?? trader.num_trades ?? 0)
      totalTrades += tradeCount

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
    const maxValues = symbols.map(s => traders[s].highest_value ?? traders[s].balance + traders[s].position_value)
    const currentValues = symbols.map(s => traders[s].balance + traders[s].position_value)
    const totalMax = Math.max(maxValues.reduce((a, b) => a + b, 0), 1e-6)
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
