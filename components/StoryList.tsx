'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StoryCard } from '@/components/StoryCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { Filter, Grid3X3, List, ChevronDown } from 'lucide-react'
import type { EnrichedStory } from '@/app/api/stories/route'
import { getCategoryColor } from '@/lib/utils'

export function StoryList() {
  const [stories, setStories] = useState<EnrichedStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [visibleStories, setVisibleStories] = useState(10)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/stories?limit=50')
      if (!response.ok) throw new Error('Failed to fetch stories')
      
      const data = await response.json()
      setStories(data.stories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories')
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(stories.map(s => s.category))).filter(Boolean)
  const filteredStories = selectedCategory === 'all' 
    ? stories 
    : stories.filter(s => s.category === selectedCategory)

  const displayedStories = filteredStories.slice(0, visibleStories)

  const loadMoreStories = () => {
    setVisibleStories(prev => prev + 10)
  }

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading stories: {error}</p>
            <Button onClick={fetchStories} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Today's Stories
                <Badge variant="secondary" className="ml-2">
                  {stories.length} total
                </Badge>
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {selectedCategory === 'all' 
                  ? `Showing ${displayedStories.length} of ${filteredStories.length} stories` 
                  : `${filteredStories.length} stories in ${selectedCategory}`
                }
              </p>
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

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="rounded-full"
            >
              All Categories
            </Button>
            {categories.map((category) => {
              if (!category) return null
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full ${selectedCategory === category ? '' : getCategoryColor(category)}`}
                >
                  {category}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stories.filter(s => s.category === category).length}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </CardHeader>
      </Card>

      {/* Stories grid/list */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
          : 'space-y-4'
      }>
        {displayedStories.map((story, index) => (
          <StoryCard 
            key={story.id} 
            story={story} 
            rank={index + 1}
            compact={viewMode === 'grid'}
          />
        ))}
      </div>

      {/* Load more button */}
      {visibleStories < filteredStories.length && (
        <div className="text-center pt-6">
          <Button 
            onClick={loadMoreStories}
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto"
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Load More Stories ({filteredStories.length - visibleStories} remaining)
          </Button>
        </div>
      )}

      {/* Empty state */}
      {filteredStories.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No stories found for the selected category.</p>
            <Button 
              onClick={() => setSelectedCategory('all')} 
              variant="outline" 
              className="mt-4"
            >
              Show All Stories
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
