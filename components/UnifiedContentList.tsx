'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UnifiedContentCard } from '@/components/UnifiedContentCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { Filter, Grid3X3, List, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import type { UnifiedContent } from '@/app/api/content/route'
import { getCategoryColor } from '@/lib/utils'

export function UnifiedContentList() {
  const [content, setContent] = useState<UnifiedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [visibleItems, setVisibleItems] = useState(15)
  const [includeHN, setIncludeHN] = useState(true)
  const [includeRSS, setIncludeRSS] = useState(true)
  
  // Stats and filters from API
  const [categories, setCategories] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    fetchContent()
  }, [includeHN, includeRSS])

  const fetchContent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: '50',
        includeHN: includeHN.toString(),
        includeRSS: includeRSS.toString(),
      })
      
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      
      if (selectedSource !== 'all') {
        params.set('source', selectedSource)
      }

      const response = await fetch(`/api/content?${params}`)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      const data = await response.json()
      setContent(data.content || [])
      setCategories(data.categories || [])
      setSources(data.sources || [])
      setStats(data.stats || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const filteredContent = content.filter(item => {
    if (selectedCategory !== 'all' && 
        !item.category?.toLowerCase().includes(selectedCategory.toLowerCase()) &&
        !item.sourceCategory?.toLowerCase().includes(selectedCategory.toLowerCase())) {
      return false
    }
    
    if (selectedSource !== 'all' && item.source !== selectedSource) {
      return false
    }
    
    return true
  })

  const displayedContent = filteredContent.slice(0, visibleItems)

  const loadMoreItems = () => {
    setVisibleItems(prev => prev + 15)
  }

  const handleSourceToggle = (source: 'HN' | 'RSS') => {
    if (source === 'HN') {
      setIncludeHN(!includeHN)
    } else {
      setIncludeRSS(!includeRSS)
    }
    setVisibleItems(15) // Reset pagination
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading content: {error}</p>
            <Button onClick={fetchContent} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls and stats */}
      <Card className="bg-gradient-to-r from-orange-50 via-white to-blue-50">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Latest Tech & Security News
                <Badge variant="secondary" className="ml-2">
                  {content.length} items
                </Badge>
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{stats.hackerNews || 0} HackerNews stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{stats.hackTheBox || 0} HackTheBox articles</span>
                </div>
                {selectedCategory !== 'all' && (
                  <Badge variant="outline" className="bg-white">
                    Filtered: {filteredContent.length} items
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Source toggles */}
          <div className="flex flex-wrap items-center gap-3 mt-4 p-3 bg-white rounded-lg border">
            <span className="text-sm font-medium text-gray-700">Sources:</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSourceToggle('HN')}
              className={`flex items-center gap-2 ${includeHN ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
            >
              {includeHN ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              HackerNews
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSourceToggle('RSS')}
              className={`flex items-center gap-2 ${includeRSS ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
            >
              {includeRSS ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              HackTheBox RSS
            </Button>
          </div>

          {/* Category and source filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="rounded-full"
            >
              All Categories
            </Button>
            
            {categories.slice(0, 8).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full ${selectedCategory === category ? '' : getCategoryColor(category)}`}
              >
                {category}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {content.filter(item => 
                    item.category === category || item.sourceCategory === category
                  ).length}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Source filter */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant={selectedSource === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedSource('all')}
              className="rounded-full"
            >
              All Sources
            </Button>
            
            {sources.map((source) => (
              <Button
                key={source}
                variant={selectedSource === source ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setSelectedSource(source)}
                className="rounded-full"
              >
                {source}
                <Badge variant="outline" className="ml-2 text-xs">
                  {content.filter(item => item.source === source).length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Content grid/list */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
          : 'space-y-4'
      }>
        {displayedContent.map((item, index) => (
          <UnifiedContentCard 
            key={item.id} 
            content={item} 
            rank={index + 1}
            compact={viewMode === 'grid'}
          />
        ))}
      </div>

      {/* Load more button */}
      {visibleItems < filteredContent.length && (
        <div className="text-center pt-6">
          <Button 
            onClick={loadMoreItems}
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto"
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Load More ({filteredContent.length - visibleItems} remaining)
          </Button>
        </div>
      )}

      {/* Empty state */}
      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">
              No content found for the selected filters.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedSource('all')
                }} 
                variant="outline"
              >
                Clear Filters
              </Button>
              <Button 
                onClick={() => {
                  setIncludeHN(true)
                  setIncludeRSS(true)
                  setSelectedCategory('all')
                  setSelectedSource('all')
                }} 
                variant="default"
              >
                Show All Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
