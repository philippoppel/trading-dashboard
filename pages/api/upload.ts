import type { NextApiRequest, NextApiResponse } from 'next'
import { put, del, list } from '@vercel/blob'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = req.headers['x-api-key']
  const expectedApiKey = process.env.UPLOAD_API_KEY || 'your-secret-key-here'

  if (apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const stateData = req.body

    if (!stateData || typeof stateData !== 'object') {
      return res.status(400).json({ error: 'Invalid state data' })
    }

    // Delete existing blob if it exists
    try {
      const { blobs } = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN!,
        prefix: 'trading-state.json',
      })

      if (blobs.length > 0) {
        await del(blobs[0].url, {
          token: process.env.BLOB_READ_WRITE_TOKEN!,
        })
      }
    } catch (deleteError) {
      // Ignore delete errors, blob might not exist
      console.log('No existing blob to delete or delete failed:', deleteError)
    }

    const blob = await put('trading-state.json', JSON.stringify(stateData), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      addRandomSuffix: false,
    })

    console.log('State uploaded to Blob:', blob.url)

    res.status(200).json({
      success: true,
      url: blob.url,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error uploading state:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      error: 'Failed to upload state',
      details: errorMessage,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    })
  }
}
