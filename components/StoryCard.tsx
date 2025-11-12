'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  MessageCircle, 
  TrendingUp, 
  User, 
  Clock, 
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3
} from 'lucide-react'
import type { EnrichedStory } from '@/app/api/stories/route'
import { formatNumber, getCategoryColor, getSentimentColor, getTechnicalLevelBadge } from '@/lib/utils'

interface StoryCardProps {
  story: EnrichedStory
  rank: number
  compact?: boolean
}

interface AnalysisResult {
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keyPoints: string[]
  technicalLevel: 'beginner' | 'intermediate' | 'advanced'
  relevanceScore: number
}

export function StoryCard({ story, rank, compact = false }: StoryCardProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const fetchAnalysis = async () => {
    if (analysis || loadingAnalysis) return

    setLoadingAnalysis(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'story',
          stories: [story],
          storyId: story.id
        })
      })

      if (!response.ok) throw new Error('Analysis failed')
      
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Failed to analyze story:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const handleAnalysisToggle = () => {
    if (!showAnalysis && !analysis) {
      fetchAnalysis()
    }
    setShowAnalysis(!showAnalysis)
  }

  const getDomainFavicon = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-orange-200">
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Rank and title */}
            <div className="flex items-start gap-3">
              <Badge 
                variant="outline" 
                className="text-orange-600 border-orange-200 bg-orange-50 font-mono shrink-0"
              >
                #{rank}
              </Badge>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 leading-tight hover:text-orange-600 transition-colors">
                  {story.url ? (
                    <a 
                      href={story.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {story.title}
                    </a>
                  ) : (
                    <a 
                      href={`https://news.ycombinator.com/item?id=${story.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {story.title}
                    </a>
                  )}
                </h3>
                
                {/* Domain and external link */}
                {story.domain && (
                  <div className="flex items-center gap-2 mt-2">
                    <img 
                      src={getDomainFavicon(story.domain)} 
                      alt="" 
                      className="w-4 h-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <span className="text-sm text-gray-500">{story.domain}</span>
                    {story.url && (
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-orange-600 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category badge */}
          <Badge className={getCategoryColor(story.category || 'Tech News')}>
            {story.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? 'pt-0 pb-4' : 'pt-0'}>
        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">{formatNumber(story.score)}</span>
              <span>points</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{formatNumber(story.descendants || 0)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{story.by}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{story.timeAgo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalysisToggle}
              className="hover:bg-purple-50 hover:border-purple-200"
            >
              {loadingAnalysis ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                  {showAnalysis ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </>
              )}
            </Button>

            <a
              href={`https://news.ycombinator.com/item?id=${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Discuss
              </Button>
            </a>
          </div>
        </div>

        {/* AI Analysis Section */}
        {showAnalysis && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            {loadingAnalysis ? (
              <div className="space-y-3">
                <div className="h-4 bg-purple-100 rounded animate-pulse" />
                <div className="h-4 bg-purple-100 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-purple-100 rounded w-1/2 animate-pulse" />
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {/* Analysis header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">AI Analysis</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTechnicalLevelBadge(analysis.technicalLevel)}>
                      {analysis.technicalLevel}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      {Math.round(analysis.relevanceScore * 100)}% relevant
                    </Badge>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Sentiment and key points */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">Sentiment:</span>
                      <Badge 
                        variant="outline" 
                        className={`${getSentimentColor(analysis.sentiment)} bg-white capitalize`}
                      >
                        {analysis.sentiment}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Key Points:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.keyPoints.slice(0, 3).map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Failed to load analysis</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
