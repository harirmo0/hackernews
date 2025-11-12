import { NextRequest, NextResponse } from 'next/server'

// This endpoint will be called by Vercel's cron job
export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by Vercel cron (optional security measure)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Trigger a refresh of the stories cache by calling our stories API
    const baseUrl = request.nextUrl.origin
    const storiesResponse = await fetch(`${baseUrl}/api/stories`, {
      method: 'GET',
      headers: {
        'User-Agent': 'HN-AI-Analyzer-Cron/1.0'
      }
    })

    if (!storiesResponse.ok) {
      throw new Error(`Failed to refresh stories: ${storiesResponse.status}`)
    }

    const storiesData = await storiesResponse.json()
    
    // Optionally trigger trend analysis for the fetched stories
    if (storiesData.stories && storiesData.stories.length > 0) {
      try {
        await fetch(`${baseUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HN-AI-Analyzer-Cron/1.0'
          },
          body: JSON.stringify({
            type: 'trends',
            stories: storiesData.stories.slice(0, 20) // Analyze top 20 stories
          })
        })
      } catch (error) {
        console.error('Failed to trigger trend analysis:', error)
        // Don't fail the entire cron job if trend analysis fails
      }
    }

    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] Cron job completed: refreshed ${storiesData.stories?.length || 0} stories`)

    return NextResponse.json({
      success: true,
      timestamp,
      storiesRefreshed: storiesData.stories?.length || 0,
      cached: storiesData.cached || false
    })

  } catch (error) {
    console.error('Cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
