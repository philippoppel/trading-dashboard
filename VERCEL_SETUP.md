# Vercel Setup Guide

## Step 1: Create Vercel Blob Storage

1. Go to https://vercel.com/dashboard
2. Select your `trading-dashboard` project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob** storage
6. Click **Create**
7. Copy the `BLOB_READ_WRITE_TOKEN` that is automatically added to your environment variables

## Step 2: Set Environment Variables

You need to set these environment variables in Vercel:

### In Vercel Dashboard:
1. Go to your project **Settings** → **Environment Variables**
2. Add the following variables:

```
BLOB_READ_WRITE_TOKEN=<automatically set when you create Blob storage>
UPLOAD_API_KEY=<generate a random secret key>
```

To generate a random API key, run:
```bash
openssl rand -hex 32
```

## Step 3: Set Local Environment Variables

Create a `.env.local` file in your trading bot directory:

```bash
# In /Users/philippoppel/Desktop/traidingbot/

export VERCEL_DASHBOARD_URL="https://trading-dashboard-5oqf34l8u-philipps-projects-0f51423d.vercel.app"
export UPLOAD_API_KEY="your-secret-key-here"  # Same as in Vercel
```

Load the environment:
```bash
source .env.local
```

## Step 4: Deploy

The dashboard will automatically redeploy when you push to GitHub. Or manually trigger:

```bash
cd trading-dashboard
vercel --prod
```

## Step 5: Upload State Data

Once deployed, upload your trading state:

```bash
# From trading bot directory
python upload_state_to_vercel.py
```

Or run continuous sync (uploads every 30 seconds):

```bash
./sync_to_vercel.sh
```

## Verifying Everything Works

1. Check your dashboard: https://trading-dashboard-5oqf34l8u-philipps-projects-0f51423d.vercel.app
2. Run the upload script
3. Refresh the dashboard - you should see your trading data!

## Troubleshooting

### Error: "Blob storage not configured"
- Make sure `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
- Redeploy after adding the variable

### Error: "Unauthorized" when uploading
- Check that `UPLOAD_API_KEY` matches in both Vercel and your local `.env.local`
- Make sure you're using the correct API key (not the default "your-secret-key-here")

### Dashboard shows "State not found"
- Run `python upload_state_to_vercel.py` to upload state for the first time
- Make sure your trading bot is running and creating state files
