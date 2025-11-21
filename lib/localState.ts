import { readFile } from 'fs/promises'
import { join } from 'path'

const STATE_FILE_PATH = join(process.cwd(), '..', 'data', 'trading_state', 'safe_multi_symbol_state.json')

export async function getLocalState() {
  try {
    const fileContent = await readFile(STATE_FILE_PATH, 'utf-8')
    const state = JSON.parse(fileContent)
    return state
  } catch (error) {
    console.error('Error reading local state file:', error)
    throw new Error('State not found. Make sure the trading bot is running and the state file exists.')
  }
}
