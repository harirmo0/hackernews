import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { EnrichedStory } from '../stories/route'
import type { UnifiedContent } from '../content/route'

// Initialize OpenRouter client (compatible with OpenAI SDK)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://hackernews-ai-analyzer.vercel.app',
    'X-Title': 'HackerNews AI Analyzer',
  }
})

interface AnalysisResult {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keyPoints: string[]
  technicalLevel: 'beginner' | 'intermediate' | 'advanced'
  relevanceScore: number
}

interface TrendAnalysis {
  topCategories: Array<{ category: string; count: number; percentage: number }>
  emergingTopics: string[]
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  keyInsights: string[]
  todaysSummary: string
}

// Cache for AI analysis to avoid redundant API calls
const analysisCache = new Map<string, AnalysisResult>()
const trendCache = new Map<string, TrendAnalysis>()

async function analyzeUnifiedContent(content: UnifiedContent): Promise<AnalysisResult> {
  const cacheKey = `unified-${content.id}`
  
  // Check cache first
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      // Return mock analysis if no OpenRouter key
      const mockAnalysis: AnalysisResult = {
        summary: content.type === 'story' 
          ? `A HackerNews discussion about ${content.title} with ${content.score} points and ${content.comments} comments.`
          : `A ${content.source} article about ${content.title} published ${content.timeAgo}.`,
        sentiment: content.type === 'story' 
          ? (content.score && content.score > 100 ? 'positive' : content.score && content.score > 50 ? 'neutral' : 'negative')
          : 'neutral',
        keyPoints: content.type === 'story' 
          ? [
            `Popular ${content.source} story with ${content.score} points`,
            `Generated ${content.comments} comments`,
            `Posted ${content.timeAgo} by ${content.author}`
          ]
          : [
            `${content.source} article from ${content.domain}`,
            `Published ${content.timeAgo}`,
            `Category: ${content.category}`,
            content.description ? 'Includes detailed content' : 'Technical article'
          ],
        technicalLevel: content.category?.includes('Security') || content.category?.includes('Red Team') || content.category?.includes('Blue Team') ? 'advanced' : 'intermediate',
        relevanceScore: content.type === 'story' && content.score 
          ? Math.min(content.score / 100, 1)
          : 0.7
      }
      analysisCache.set(cacheKey, mockAnalysis)
      return mockAnalysis
    }

    const contentDescription = content.type === 'story'
      ? `HackerNews Story - Score: ${content.score}, Comments: ${content.comments}`
      : `${content.source} Article - ${content.description || 'Cybersecurity content'}`

    const prompt = `Analyze this ${content.source} content:

Title: ${content.title}
URL: ${content.url || 'No URL'}
Author: ${content.author}
Type: ${content.type}
Source: ${content.source}
Category: ${content.category}
Posted: ${content.timeAgo}
${content.type === 'story' ? `Score: ${content.score} points, Comments: ${content.comments}` : ''}
${content.description ? `Description: ${content.description}` : ''}

Please provide:
1. A 2-3 sentence summary of what this content is about
2. The general sentiment (positive/neutral/negative) based on the title and engagement
3. 3-4 key points about this content
4. Technical complexity level (beginner/intermediate/advanced)
5. Relevance score (0-1) for tech and security professionals

Format your response as JSON with keys: summary, sentiment, keyPoints (array), technicalLevel, relevanceScore`

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content: "You are an expert tech and cybersecurity analyst who summarizes and analyzes content from HackerNews and security blogs. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from OpenRouter')

    const analysis: AnalysisResult = JSON.parse(response)
    
    // Validate and sanitize the response
    const sanitizedAnalysis: AnalysisResult = {
      summary: analysis.summary || `Content about ${content.title}`,
      sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) 
        ? analysis.sentiment as any 
        : 'neutral',
      keyPoints: Array.isArray(analysis.keyPoints) 
        ? analysis.keyPoints.slice(0, 4) 
        : [content.source, content.category, `Published ${content.timeAgo}`],
      technicalLevel: ['beginner', 'intermediate', 'advanced'].includes(analysis.technicalLevel)
        ? analysis.technicalLevel as any
        : 'intermediate',
      relevanceScore: typeof analysis.relevanceScore === 'number' 
        ? Math.max(0, Math.min(1, analysis.relevanceScore))
        : 0.6
    }

    // Cache the result
    analysisCache.set(cacheKey, sanitizedAnalysis)
    return sanitizedAnalysis

  } catch (error) {
    console.error('Error analyzing unified content:', error)
    
    // Fallback analysis
    const fallbackAnalysis: AnalysisResult = {
      summary: `Content titled "${content.title}" from ${content.source} published ${content.timeAgo}.`,
      sentiment: 'neutral',
      keyPoints: [
        `${content.source} content`,
        `Category: ${content.category}`,
        `Posted ${content.timeAgo} by ${content.author}`,
        content.domain ? `From ${content.domain}` : 'Tech/Security content'
      ].filter(Boolean),
      technicalLevel: 'intermediate',
      relevanceScore: 0.6
    }
    
    analysisCache.set(cacheKey, fallbackAnalysis)
    return fallbackAnalysis
  }
}

async function analyzeStory(story: EnrichedStory): Promise<AnalysisResult> {
  const cacheKey = `story-${story.id}`
  
  // Check cache first
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!
  }

    try {
      if (!process.env.OPENROUTER_API_KEY) {
      // Return mock analysis if no OpenAI key
      const mockAnalysis: AnalysisResult = {
        summary: `A discussion about ${story.title} with ${story.score} points and ${story.descendants} comments.`,
        sentiment: story.score > 100 ? 'positive' : story.score > 50 ? 'neutral' : 'negative',
        keyPoints: [
          `Popular story with ${story.score} points`,
          `Generated ${story.descendants} comments`,
          `Posted ${story.timeAgo} by ${story.by}`
        ],
        technicalLevel: story.category === 'Programming' ? 'advanced' : 'intermediate',
        relevanceScore: Math.min(story.score / 100, 1)
      }
      analysisCache.set(cacheKey, mockAnalysis)
      return mockAnalysis
    }

    const prompt = `Analyze this Hacker News story:

Title: ${story.title}
URL: ${story.url || 'No URL'}
Author: ${story.by}
Score: ${story.score} points
Comments: ${story.descendants}
Category: ${story.category}
Posted: ${story.timeAgo}

Please provide:
1. A 2-3 sentence summary of what this story is about
2. The general sentiment (positive/neutral/negative) based on the title and engagement
3. 3-4 key points about this story
4. Technical complexity level (beginner/intermediate/advanced)
5. Relevance score (0-1) for tech professionals

Format your response as JSON with keys: summary, sentiment, keyPoints (array), technicalLevel, relevanceScore`

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content: "You are an expert tech analyst who summarizes and analyzes Hacker News stories. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from OpenAI')

    const analysis: AnalysisResult = JSON.parse(response)
    
    // Validate and sanitize the response
    const sanitizedAnalysis: AnalysisResult = {
      summary: analysis.summary || `A story about ${story.title}`,
      sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) 
        ? analysis.sentiment as any 
        : 'neutral',
      keyPoints: Array.isArray(analysis.keyPoints) 
        ? analysis.keyPoints.slice(0, 4) 
        : [`${story.score} points`, `${story.descendants} comments`],
      technicalLevel: ['beginner', 'intermediate', 'advanced'].includes(analysis.technicalLevel)
        ? analysis.technicalLevel as any
        : 'intermediate',
      relevanceScore: typeof analysis.relevanceScore === 'number' 
        ? Math.max(0, Math.min(1, analysis.relevanceScore))
        : 0.5
    }

    // Cache the result
    analysisCache.set(cacheKey, sanitizedAnalysis)
    return sanitizedAnalysis

  } catch (error) {
    console.error('Error analyzing story:', error)
    
    // Fallback analysis
    const fallbackAnalysis: AnalysisResult = {
      summary: `A story titled "${story.title}" with ${story.score} points and ${story.descendants} comments.`,
      sentiment: 'neutral',
      keyPoints: [
        `${story.score} points on Hacker News`,
        `${story.descendants} comments from the community`,
        `Posted by ${story.by} ${story.timeAgo}`,
        story.domain ? `From ${story.domain}` : 'Discussion post'
      ].filter(Boolean),
      technicalLevel: 'intermediate',
      relevanceScore: 0.5
    }
    
    analysisCache.set(cacheKey, fallbackAnalysis)
    return fallbackAnalysis
  }
}

async function analyzeTrends(stories: EnrichedStory[]): Promise<TrendAnalysis> {
  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `trends-${today}`
  
  if (trendCache.has(cacheKey)) {
    return trendCache.get(cacheKey)!
  }

  try {
    // Analyze categories
    const categoryCount = new Map<string, number>()
    stories.forEach(story => {
      const category = story.category || 'Tech News'
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
    })

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / stories.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Simple sentiment analysis based on scores
    let positive = 0, neutral = 0, negative = 0
    stories.forEach(story => {
      if (story.score > 100) positive++
      else if (story.score > 50) neutral++
      else negative++
    })

    // Extract emerging topics from titles
    const titleWords = stories
      .flatMap(story => story.title.toLowerCase().split(/\s+/))
      .filter(word => word.length > 4 && !['show', 'ask', 'the', 'and', 'for', 'with'].includes(word))
    
    const wordCount = new Map<string, number>()
    titleWords.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    const emergingTopics = Array.from(wordCount.entries())
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)

    const trendAnalysis: TrendAnalysis = {
      topCategories,
      emergingTopics,
      sentiment: {
        positive: Math.round((positive / stories.length) * 100),
        neutral: Math.round((neutral / stories.length) * 100),
        negative: Math.round((negative / stories.length) * 100)
      },
      keyInsights: [
        `${stories.length} stories analyzed from today's front page`,
        `Most popular category: ${topCategories[0]?.category || 'Tech News'} (${topCategories[0]?.percentage || 0}%)`,
        `Average score: ${Math.round(stories.reduce((sum, s) => sum + s.score, 0) / stories.length)}`,
        `Total comments: ${stories.reduce((sum, s) => sum + s.descendants, 0).toLocaleString()}`
      ],
      todaysSummary: `Today's Hacker News features ${stories.length} top stories with ${topCategories[0]?.category || 'various topics'} dominating the discussion. The community seems ${positive > neutral + negative ? 'engaged and positive' : positive + neutral > negative ? 'moderately engaged' : 'selective'} with an average of ${Math.round(stories.reduce((sum, s) => sum + s.descendants, 0) / stories.length)} comments per story.`
    }

    trendCache.set(cacheKey, trendAnalysis)
    return trendAnalysis

  } catch (error) {
    console.error('Error analyzing trends:', error)
    
    // Fallback trend analysis
    const fallbackTrends: TrendAnalysis = {
      topCategories: [{ category: 'Tech News', count: stories.length, percentage: 100 }],
      emergingTopics: ['technology', 'software', 'programming'],
      sentiment: { positive: 40, neutral: 50, negative: 10 },
      keyInsights: [
        `${stories.length} stories from Hacker News`,
        'Mixed topics and discussions',
        'Active community engagement'
      ],
      todaysSummary: `Today's Hacker News features ${stories.length} stories covering various technology topics with active community discussion.`
    }
    
    trendCache.set(cacheKey, fallbackTrends)
    return fallbackTrends
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, stories, storyId, content, contentId } = body

    // Handle unified content analysis
    if (type === 'unified' && contentId) {
      const targetContent = content?.find((c: UnifiedContent) => c.id === contentId)
      if (!targetContent) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }

      const analysis = await analyzeUnifiedContent(targetContent)
      return NextResponse.json({ analysis })
    }

    // Handle legacy HN story analysis
    if (type === 'story' && storyId) {
      const story = stories?.find((s: EnrichedStory) => s.id === storyId)
      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 })
      }

      const analysis = await analyzeStory(story)
      return NextResponse.json({ analysis })
    }

    // Handle trends analysis (works with both stories and unified content)
    if (type === 'trends') {
      let analysisData = stories
      
      // If we have unified content, convert to stories format for trend analysis
      if (content && Array.isArray(content)) {
        analysisData = content.map((c: UnifiedContent) => ({
          id: c.id.replace(/^(hn-|rss-)/, ''),
          title: c.title,
          score: c.score || 50, // Default score for articles
          descendants: c.comments || 5, // Default comments for articles
          category: c.category,
          timeAgo: c.timeAgo
        }))
      }
      
      if (Array.isArray(analysisData)) {
        const trendAnalysis = await analyzeTrends(analysisData)
        return NextResponse.json({ trends: trendAnalysis })
      }
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    
  } catch (error) {
    console.error('Analysis API Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    )
  }
}
