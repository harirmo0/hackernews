import { NextRequest, NextResponse } from 'next/server'
import type { EnrichedStory } from '../stories/route'
import type { RSSArticle } from '../rss/route'

export interface UnifiedContent {
  id: string
  title: string
  url?: string
  description?: string
  author: string
  score?: number // Only for HN stories
  comments?: number // Only for HN stories
  timeAgo: string
  category: string
  source: 'HackerNews' | 'HackTheBox'
  sourceCategory?: string // RSS feed category
  type: 'story' | 'article'
  pubDate: string
  domain?: string
}

// Cache for unified content
let cachedUnifiedContent: UnifiedContent[] | null = null
let lastUnifiedFetch = 0
const UNIFIED_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function convertHNStoryToUnified(story: EnrichedStory): UnifiedContent {
  return {
    id: `hn-${story.id}`,
    title: story.title,
    url: story.url,
    author: story.by,
    score: story.score,
    comments: story.descendants,
    timeAgo: story.timeAgo || '',
    category: story.category || 'Tech News',
    source: 'HackerNews',
    type: 'story',
    pubDate: new Date(story.time * 1000).toISOString(),
    domain: story.domain
  }
}

function convertRSSArticleToUnified(article: RSSArticle): UnifiedContent {
  return {
    id: `rss-${article.id}`,
    title: article.title,
    url: article.url,
    description: article.description,
    author: article.author || 'HackTheBox',
    timeAgo: article.timeAgo || '',
    category: article.category || article.sourceCategory,
    source: 'HackTheBox',
    sourceCategory: article.sourceCategory,
    type: 'article',
    pubDate: article.pubDate,
    domain: article.url ? extractDomain(article.url) : 'hackthebox.com'
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

async function fetchUnifiedContent(options: {
  includeHN?: boolean
  includeRSS?: boolean
  rssFeeds?: string[]
  limit?: number
}): Promise<UnifiedContent[]> {
  const { includeHN = true, includeRSS = true, rssFeeds = [], limit = 30 } = options

  // Check cache first
  if (cachedUnifiedContent && Date.now() - lastUnifiedFetch < UNIFIED_CACHE_DURATION) {
    return cachedUnifiedContent.slice(0, limit)
  }

  const contentPromises: Promise<UnifiedContent[]>[] = []

  // Direct imports to avoid fetch during build
  if (includeHN) {
    try {
      // Import and call the stories API function directly
      const { GET: getStories } = await import('../stories/route')
      const mockRequest = new Request(`http://localhost:3000/api/stories?limit=20`)
      const storiesResponse = await getStories(mockRequest as any)
      const storiesData = await storiesResponse.json()
      
      if (storiesData.stories) {
        contentPromises.push(Promise.resolve(storiesData.stories.map(convertHNStoryToUnified)))
      }
    } catch (error) {
      console.error('Error fetching HN stories:', error)
      contentPromises.push(Promise.resolve([]))
    }
  }

  // Fetch RSS articles
  if (includeRSS) {
    try {
      const { GET: getRSS } = await import('../rss/route')
      const rssParams = rssFeeds.length > 0 ? `?feeds=${rssFeeds.join(',')}` : '?limit=25'
      const mockRequest = new Request(`http://localhost:3000/api/rss${rssParams}`)
      const rssResponse = await getRSS(mockRequest as any)
      const rssData = await rssResponse.json()
      
      if (rssData.articles) {
        contentPromises.push(Promise.resolve(rssData.articles.map(convertRSSArticleToUnified)))
      }
    } catch (error) {
      console.error('Error fetching RSS articles:', error)
      contentPromises.push(Promise.resolve([]))
    }
  }

  try {
    const results = await Promise.all(contentPromises)
    const allContent = results.flat()

    // Sort by publication date (most recent first)
    const sortedContent = allContent.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime()
      const dateB = new Date(b.pubDate).getTime()
      return dateB - dateA
    })

    // Cache the results
    cachedUnifiedContent = sortedContent
    lastUnifiedFetch = Date.now()

    return sortedContent.slice(0, limit)
  } catch (error) {
    console.error('Error fetching unified content:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const includeHN = searchParams.get('includeHN') !== 'false'
    const includeRSS = searchParams.get('includeRSS') !== 'false'
    const rssFeeds = searchParams.get('rssFeeds')?.split(',').filter(Boolean) || []
    const limit = parseInt(searchParams.get('limit') || '30', 10)
    const category = searchParams.get('category')
    const source = searchParams.get('source') as 'HackerNews' | 'HackTheBox' | undefined

    let content = await fetchUnifiedContent({
      includeHN,
      includeRSS,
      rssFeeds,
      limit: Math.min(limit * 2, 100) // Fetch more to allow for filtering
    })

    // Apply filters
    if (source) {
      content = content.filter(item => item.source === source)
    }

    if (category && category !== 'all') {
      content = content.filter(item => 
        item.category?.toLowerCase().includes(category.toLowerCase()) ||
        item.sourceCategory?.toLowerCase().includes(category.toLowerCase())
      )
    }

    // Final limit
    content = content.slice(0, limit)

    // Get all unique categories for filtering UI
    const allCategories = Array.from(new Set([
      ...content.map(item => item.category).filter(Boolean),
      ...content.map(item => item.sourceCategory).filter(Boolean)
    ]))

    const sources = Array.from(new Set(content.map(item => item.source)))

    return NextResponse.json({
      content,
      total: content.length,
      cached: Date.now() - lastUnifiedFetch < UNIFIED_CACHE_DURATION,
      categories: allCategories.sort(),
      sources,
      stats: {
        hackerNews: content.filter(item => item.source === 'HackerNews').length,
        hackTheBox: content.filter(item => item.source === 'HackTheBox').length,
        totalStories: content.filter(item => item.type === 'story').length,
        totalArticles: content.filter(item => item.type === 'article').length
      }
    })
  } catch (error) {
    console.error('Unified Content API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unified content' },
      { status: 500 }
    )
  }
}
