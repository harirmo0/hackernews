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
  BarChart3,
  Globe,
  FileText,
  Shield
} from 'lucide-react'
import type { UnifiedContent } from '@/app/api/content/route'
import { formatNumber, getCategoryColor, getSentimentColor, getTechnicalLevelBadge } from '@/lib/utils'

interface UnifiedContentCardProps {
  content: UnifiedContent
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

export function UnifiedContentCard({ content, rank, compact = false }: UnifiedContentCardProps) {
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
          type: 'unified',
          content: [content],
          contentId: content.id
        })
      })

      if (!response.ok) throw new Error('Analysis failed')
      
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Failed to analyze content:', error)
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

  const getSourceIcon = () => {
    if (content.source === 'HackerNews') {
      return <TrendingUp className="h-4 w-4 text-orange-600" />
    }
    return <Shield className="h-4 w-4 text-blue-600" />
  }

  const getSourceColor = () => {
    return content.source === 'HackerNews' 
      ? 'bg-orange-50 text-orange-800 border-orange-200' 
      : 'bg-blue-50 text-blue-800 border-blue-200'
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-orange-200">
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Rank, Source, and title */}
            <div className="flex items-start gap-3">
              <Badge 
                variant="outline" 
                className="text-orange-600 border-orange-200 bg-orange-50 font-mono shrink-0"
              >
                #{rank}
              </Badge>
              
              <div className="flex-1 min-w-0">
                {/* Source badge */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getSourceColor()}>
                    {getSourceIcon()}
                    <span className="ml-1">{content.source}</span>
                  </Badge>
                  {content.sourceCategory && (
                    <Badge variant="outline" className="text-xs">
                      {content.sourceCategory}
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 leading-tight hover:text-orange-600 transition-colors">
                  <a 
                    href={content.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {content.title}
                  </a>
                </h3>
                
                {/* Description for RSS articles */}
                {content.type === 'article' && content.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {content.description}
                  </p>
                )}
                
                {/* Domain and external link */}
                {content.domain && (
                  <div className="flex items-center gap-2 mt-2">
                    <img 
                      src={getDomainFavicon(content.domain)} 
                      alt="" 
                      className="w-4 h-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <span className="text-sm text-gray-500">{content.domain}</span>
                    {content.url && (
                      <a
                        href={content.url}
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
          <Badge className={getCategoryColor(content.category)}>
            {content.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? 'pt-0 pb-4' : 'pt-0'}>
        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {/* Show different stats based on content type */}
            {content.type === 'story' ? (
              <>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">{formatNumber(content.score || 0)}</span>
                  <span>points</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{formatNumber(content.comments || 0)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Article</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{content.author}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{content.timeAgo}</span>
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

            {/* Different action buttons based on content type */}
            {content.type === 'story' ? (
              <a
                href={`https://news.ycombinator.com/item?id=${content.id.replace('hn-', '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Discuss
                </Button>
              </a>
            ) : (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Read Full
                </Button>
              </a>
            )}
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
