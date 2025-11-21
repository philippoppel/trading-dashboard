import type { NextApiRequest, NextApiResponse } from 'next'
import { getLatestState } from '../../lib/blobState'

interface TradeRecord {
  timestamp: string
  symbol: string
  action_type: string
  old_position: number
  new_position: number
  position_change: number
  price: number
  trade_value: number
  fee: number
  slippage: number
  total_cost: number
  balance_before: number
  balance_after: number
  portfolio_value_before: number
  portfolio_value_after: number
  reasoning: string
  model_action: number
}

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

    // Extract trade history from all traders
    const allTrades: TradeRecord[] = []
    const traders = state.traders || {}

    Object.keys(traders).forEach((symbol) => {
      const trader = traders[symbol]
      const tradeHistory = trader.trade_history || []

      tradeHistory.forEach((trade: TradeRecord) => {
        allTrades.push({
          ...trade,
          symbol: symbol // Ensure symbol is always set
        })
      })
    })

    // Sort by timestamp (newest first)
    allTrades.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Optional: filter by symbol if provided in query
    const { symbol } = req.query
    const filteredTrades = symbol
      ? allTrades.filter(t => t.symbol === symbol)
      : allTrades

    res.status(200).json({
      trades: filteredTrades,
      total_count: filteredTrades.length,
      last_updated: state.timestamp
    })
  } catch (error) {
    console.error('Error reading trade history:', error)
    res.status(500).json({ error: 'Failed to read trade history' })
  }
}
