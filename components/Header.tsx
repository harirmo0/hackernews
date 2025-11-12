'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Brain, TrendingUp, RefreshCw, Zap } from 'lucide-react'

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Trigger a refresh by reloading the page or calling an API
      window.location.reload()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center animate-pulse-glow">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  Tech & Security AI
                  <Zap className="h-6 w-6 text-orange-600" />
                </h1>
                <p className="text-gray-600 text-sm">
                  AI insights from HackerNews & HackTheBox RSS feeds
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live Analysis
              </Badge>
              <Badge variant="outline" className="bg-white font-mono text-xs">
                {formatTime(currentTime)}
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white hover:bg-orange-50 border-orange-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">
            <strong>Today:</strong> {formatDate(currentTime)} • 
            Analyzing content from HackerNews and 14 HackTheBox RSS feeds with AI to provide insights, summaries, and cybersecurity trend analysis
          </p>
        </div>
      </div>
    </Card>
  )
}
