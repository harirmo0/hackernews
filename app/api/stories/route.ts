import { NextRequest, NextResponse } from 'next/server'

export interface HNStory {
  id: number
  title: string
  url?: string
  text?: string
  by: string
  descendants: number
  score: number
  time: number
  type: string
  kids?: number[]
}

export interface EnrichedStory extends HNStory {
  domain?: string
  timeAgo?: string
  summary?: string
  category?: string
}

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0'

// Cache stories for 5 minutes to avoid hitting API limits
let cachedStories: EnrichedStory[] | null = null
let lastFetch = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function fetchStoryById(id: number): Promise<HNStory | null> {
  try {
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Error fetching story ${id}:`, error)
    return null
  }
}

async function fetchTopStories(limit = 30): Promise<EnrichedStory[]> {
  try {
    // Check cache first
    if (cachedStories && Date.now() - lastFetch < CACHE_DURATION) {
      return cachedStories
    }

    const response = await fetch(`${HN_API_BASE}/topstories.json`)
    if (!response.ok) throw new Error('Failed to fetch top stories')
    
    const storyIds: number[] = await response.json()
    const topStoryIds = storyIds.slice(0, limit)
    
    // Fetch stories in parallel
    const storyPromises = topStoryIds.map(fetchStoryById)
    const stories = await Promise.all(storyPromises)
    
    const validStories = stories.filter((story): story is HNStory => 
      story !== null && story.type === 'story'
    )

    // Enrich stories with additional data
    const enrichedStories: EnrichedStory[] = validStories.map(story => {
      const enriched: EnrichedStory = {
        ...story,
        domain: story.url ? extractDomain(story.url) : undefined,
        timeAgo: formatTimeAgo(story.time),
        category: categorizeStory(story.title, story.url)
      }
      return enriched
    })

    // Cache the results
    cachedStories = enrichedStories
    lastFetch = Date.now()
    
    return enrichedStories
  } catch (error) {
    console.error('Error fetching stories:', error)
    return []
  }
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.startsWith('www.') ? domain.substring(4) : domain
  } catch {
    return 'unknown'
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp
  
  if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diff / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }
}

function categorizeStory(title: string, url?: string): string {
  const titleLower = title.toLowerCase()
  const domain = url ? extractDomain(url) : ''
  
  // AI/ML keywords
  if (titleLower.match(/\b(ai|artificial intelligence|machine learning|ml|gpt|chatgpt|openai|llm|neural|deep learning)\b/)) {
    return 'AI/ML'
  }
  
  // Programming/Tech keywords
  if (titleLower.match(/\b(javascript|python|rust|go|programming|code|software|framework|library|api)\b/)) {
    return 'Programming'
  }
  
  // Startups/Business
  if (titleLower.match(/\b(startup|funding|vc|venture|business|company|entrepreneur)\b/)) {
    return 'Startup'
  }
  
  // Security/Privacy
  if (titleLower.match(/\b(security|privacy|encryption|hack|breach|vulnerability|cyber)\b/)) {
    return 'Security'
  }
  
  // Science/Research
  if (titleLower.match(/\b(research|study|science|scientific|paper|university|academic)\b/) || 
      domain.includes('arxiv') || domain.includes('nature') || domain.includes('science')) {
    return 'Research'
  }
  
  // Show HN
  if (titleLower.startsWith('show hn')) {
    return 'Show HN'
  }
  
  // Ask HN
  if (titleLower.startsWith('ask hn')) {
    return 'Ask HN'
  }
  
  return 'Tech News'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30', 10)
    const category = searchParams.get('category')
    
    let stories = await fetchTopStories(Math.min(limit, 100)) // Cap at 100
    
    // Filter by category if specified
    if (category && category !== 'all') {
      stories = stories.filter(story => story.category === category)
    }
    
    return NextResponse.json({
      stories,
      total: stories.length,
      cached: Date.now() - lastFetch < CACHE_DURATION
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}
