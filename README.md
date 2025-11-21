# Trading Bot Dashboard

Real-time web dashboard for monitoring your multi-symbol cryptocurrency trading bot.

## Features

- Real-time portfolio metrics (total value, return, Sharpe ratio, drawdown)
- Individual symbol position tracking
- Emergency stop alerts
- Auto-refresh every 10 seconds
- Dark mode support
- Responsive design

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## State File Configuration

The dashboard reads from: `../data/trading_state/safe_multi_symbol_state.json`

If your state file is in a different location, update the path in `pages/api/state.ts`:
```typescript
const statePath = path.join(process.cwd(), '..', 'data', 'trading_state', 'safe_multi_symbol_state.json')
```

## Deploying to Vercel

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

### Option 2: Deploy with Git Integration

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to https://vercel.com/new

3. Import your repository

4. Vercel will auto-detect Next.js and configure the build

### Important Note for Production

The dashboard needs access to the trading state file. For Vercel deployment, you have two options:

1. **API Integration**: Modify the API endpoint to fetch state from your trading bot server via HTTP
2. **Periodic Sync**: Set up a cron job to sync the state file to Vercel's filesystem

For production use, it's recommended to expose the trading state via a REST API endpoint rather than reading from a file.

## Build for Production

```bash
npm run build
npm start
```

## Environment

- Next.js 14.0.4
- React 18
- TypeScript
- Tailwind CSS
