import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp
  
  if (diff < 60) {
    return 'just now'
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes}m ago`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diff / 86400)
    return `${days}d ago`
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'AI/ML': 'bg-purple-100 text-purple-800 border-purple-200',
    'Programming': 'bg-blue-100 text-blue-800 border-blue-200',
    'Startup': 'bg-green-100 text-green-800 border-green-200',
    'Security': 'bg-red-100 text-red-800 border-red-200',
    'Research': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Show HN': 'bg-orange-100 text-orange-800 border-orange-200',
    'Ask HN': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Tech News': 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colors[category] || colors['Tech News']
}

export function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    'positive': 'text-green-600',
    'neutral': 'text-gray-600',
    'negative': 'text-red-600'
  }
  return colors[sentiment] || colors['neutral']
}

export function getTechnicalLevelBadge(level: string): string {
  const badges: Record<string, string> = {
    'beginner': 'bg-green-50 text-green-700 border-green-200',
    'intermediate': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'advanced': 'bg-red-50 text-red-700 border-red-200'
  }
  return badges[level] || badges['intermediate']
}
