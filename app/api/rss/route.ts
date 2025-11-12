import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

export interface RSSArticle {
  id: string
  title: string
  url: string
  content?: string
  description?: string
  pubDate: string
  author?: string
  source: string
  sourceCategory: string
  category?: string
  timeAgo?: string
}

export interface RSSFeedConfig {
  name: string
  url: string
  category: string
}

// HackTheBox RSS Feeds Configuration
const RSS_FEEDS: RSSFeedConfig[] = [
  { name: 'All Content', url: 'https://www.hackthebox.com/rss/blog/all', category: 'All' },
  { name: 'Red Teaming', url: 'https://www.hackthebox.com/rss/blog/red-teaming', category: 'Red Team' },
  { name: 'Blue Teaming', url: 'https://www.hackthebox.com/rss/blog/blue-teaming', category: 'Blue Team' },
  { name: 'Cyber Teams', url: 'https://www.hackthebox.com/rss/blog/cyber-teams', category: 'Cyber Teams' },
  { name: 'Education', url: 'https://www.hackthebox.com/rss/blog/education', category: 'Education' },
  { name: 'CISO Diaries', url: 'https://www.hackthebox.com/rss/blog/ciso-diaries', category: 'CISO' },
  { name: 'Customer Stories', url: 'https://www.hackthebox.com/rss/blog/customer-stories', category: 'Case Studies' },
  { name: 'Write-Ups', url: 'https://www.hackthebox.com/rss/blog/write-ups', category: 'Write-ups' },
  { name: 'News', url: 'https://www.hackthebox.com/rss/blog/news', category: 'Cyber News' },
  { name: 'Career Stories', url: 'https://www.hackthebox.com/rss/blog/career-stories', category: 'Career' },
  { name: 'Humans of HTB', url: 'https://www.hackthebox.com/rss/blog/humans-of-htb', category: 'Community' },
  { name: 'Artificial Intelligence', url: 'https://www.hackthebox.com/rss/blog/artificial-intelligence', category: 'AI/Security' },
  { name: 'Threat Intelligence', url: 'https://www.hackthebox.com/rss/blog/threat-intelligence', category: 'Threat Intel' },
  { name: 'Security 101', url: 'https://www.hackthebox.com/rss/blog/security-101', category: 'Security Basics' }
]

// Cache RSS articles for 10 minutes
let cachedArticles: RSSArticle[] | null = null
let lastRSSFetch = 0
const RSS_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

const parser = new Parser({
  customFields: {
    feed: ['language', 'copyright'],
    item: ['description', 'content:encoded', 'dc:creator']
  }
})

async function fetchRSSFeed(feed: RSSFeedConfig): Promise<RSSArticle[]> {
  try {
    const feedData = await parser.parseURL(feed.url)
    
    return feedData.items.map((item, index) => {
      // Generate a unique ID for RSS articles
      const id = `rss-${feed.category.toLowerCase().replace(/\s+/g, '-')}-${index}-${Date.parse(item.pubDate || item.isoDate || '0')}`
      
      const article: RSSArticle = {
        id,
        title: item.title || 'Untitled',
        url: item.link || item.guid || '',
        content: item['content:encoded'] || item.contentSnippet || '',
        description: item.summary || item.description || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        author: item['dc:creator'] || item.creator || 'HackTheBox',
        source: 'HackTheBox',
        sourceCategory: feed.category,
        timeAgo: formatTimeAgo(new Date(item.pubDate || item.isoDate || Date.now())),
        category: categorizeRSSContent(item.title || '', item.summary || '', feed.category)
      }
      
      return article
    }).filter(article => article.url) // Only include articles with URLs
  } catch (error) {
    console.error(`Error fetching RSS feed ${feed.name}:`, error)
    return []
  }
}

function formatTimeAgo(date: Date): string {
  const now = Date.now()
  const diff = Math.floor((now - date.getTime()) / 1000)
  
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

function categorizeRSSContent(title: string, description: string, sourceCategory: string): string {
  const content = `${title} ${description}`.toLowerCase()
  
  // Use source category as primary categorization
  if (sourceCategory !== 'All') {
    return sourceCategory
  }
  
  // Fallback categorization based on content
  if (content.match(/\b(red team|penetration|exploit|attack|offensive)\b/)) {
    return 'Red Team'
  }
  
  if (content.match(/\b(blue team|defense|detection|monitoring|soc)\b/)) {
    return 'Blue Team'
  }
  
  if (content.match(/\b(ai|artificial intelligence|machine learning|ml)\b/)) {
    return 'AI/Security'
  }
  
  if (content.match(/\b(threat|intel|apt|malware|vulnerability)\b/)) {
    return 'Threat Intel'
  }
  
  if (content.match(/\b(ciso|governance|compliance|risk)\b/)) {
    return 'CISO'
  }
  
  if (content.match(/\b(writeup|ctf|challenge|solution)\b/)) {
    return 'Write-ups'
  }
  
  if (content.match(/\b(career|job|interview|skill)\b/)) {
    return 'Career'
  }
  
  return 'Cyber Security'
}

async function fetchAllRSSFeeds(selectedFeeds?: string[]): Promise<RSSArticle[]> {
  // Check cache first
  if (cachedArticles && Date.now() - lastRSSFetch < RSS_CACHE_DURATION) {
    return cachedArticles
  }

  try {
    // Filter feeds based on selection or use specific feeds to avoid too much data
    const feedsToFetch = selectedFeeds && selectedFeeds.length > 0
      ? RSS_FEEDS.filter(feed => selectedFeeds.includes(feed.category))
      : RSS_FEEDS.filter(feed => 
          ['Red Team', 'Blue Team', 'AI/Security', 'Threat Intel', 'Cyber News', 'Write-ups'].includes(feed.category)
        )

    console.log(`Fetching ${feedsToFetch.length} RSS feeds...`)

    // Fetch feeds in parallel with a reasonable limit
    const feedPromises = feedsToFetch.slice(0, 8).map(feed => fetchRSSFeed(feed))
    const feedResults = await Promise.all(feedPromises)
    
    // Flatten and sort by date
    const allArticles = feedResults
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 50) // Limit to 50 most recent articles

    // Cache results
    cachedArticles = allArticles
    lastRSSFetch = Date.now()
    
    console.log(`Fetched ${allArticles.length} total RSS articles`)
    return allArticles

  } catch (error) {
    console.error('Error fetching RSS feeds:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedFeeds = searchParams.get('feeds')?.split(',').filter(Boolean)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    
    const articles = await fetchAllRSSFeeds(selectedFeeds)
    
    return NextResponse.json({
      articles: articles.slice(0, Math.min(limit, 50)),
      total: articles.length,
      cached: Date.now() - lastRSSFetch < RSS_CACHE_DURATION,
      availableFeeds: RSS_FEEDS.map(feed => ({
        name: feed.name,
        category: feed.category
      }))
    })
  } catch (error) {
    console.error('RSS API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds' },
      { status: 500 }
    )
  }
}
