'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  BarChart3, 
  Zap, 
  RefreshCw, 
  Smile, 
  Meh, 
  Frown,
  Calendar,
  Hash
} from 'lucide-react'
import { getCategoryColor } from '@/lib/utils'

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

export function TrendingTopics() {
  const [trends, setTrends] = useState<TrendAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchTrends()
  }, [])

  const fetchTrends = async () => {
    try {
      setLoading(true)
      
      // First fetch unified content (both HN and RSS)
      const contentResponse = await fetch('/api/content?limit=30')
      if (!contentResponse.ok) throw new Error('Failed to fetch content')
      
      const contentData = await contentResponse.json()
      
      // Then analyze trends with unified content
      const trendsResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trends',
          content: contentData.content
        })
      })
      
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrends(trendsData.trends)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: keyof TrendAnalysis['sentiment']) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-4 w-4 text-green-600" />
      case 'neutral': return <Meh className="h-4 w-4 text-gray-600" />
      case 'negative': return <Frown className="h-4 w-4 text-red-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!trends) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">Unable to load trending topics</p>
          <Button onClick={fetchTrends} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 leading-relaxed">
            {trends.todaysSummary}
          </p>
          {lastUpdated && (
            <p className="text-xs text-blue-600 mt-3">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Top Categories
            </CardTitle>
            <Button onClick={fetchTrends} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {trends.topCategories.map((category, index) => (
            <div key={category.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                <Badge className={getCategoryColor(category.category)} variant="outline">
                  {category.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-10 text-right">
                  {category.percentage}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emerging Topics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Trending Words
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {trends.emergingTopics.map((topic, index) => (
              <Badge 
                key={topic} 
                variant="outline" 
                className="bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 cursor-default"
              >
                <Hash className="h-3 w-3 mr-1" />
                {topic}
              </Badge>
            ))}
          </div>
          {trends.emergingTopics.length === 0 && (
            <p className="text-gray-500 text-sm">No trending topics detected</p>
          )}
        </CardContent>
      </Card>

      {/* Community Sentiment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Community Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(trends.sentiment).map(([sentiment, percentage]) => (
            <div key={sentiment} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSentimentIcon(sentiment as keyof TrendAnalysis['sentiment'])}
                <span className="text-sm font-medium capitalize">{sentiment}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      sentiment === 'positive' ? 'bg-green-500' : 
                      sentiment === 'neutral' ? 'bg-gray-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-8 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {trends.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
