import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { UnifiedContentList } from '@/components/UnifiedContentList'
import { TrendingTopics } from '@/components/TrendingTopics'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <Header />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSkeleton />}>
            <UnifiedContentList />
          </Suspense>
        </div>
        
        <div className="space-y-6">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <TrendingTopics />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
