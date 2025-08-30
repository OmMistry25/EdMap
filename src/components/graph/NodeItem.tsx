'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ItemNodeData {
  label: string
  title?: string
  type?: string
  status?: string
  dueAt?: string
  points?: number
  estimatedMinutes?: number
  labels?: string[]
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'assignment':
      return '📝'
    case 'quiz':
      return '❓'
    case 'exam':
      return '📋'
    case 'project':
      return '💼'
    case 'lab':
      return '🧪'
    case 'reading':
      return '📖'
    case 'survey':
      return '📊'
    case 'discussion':
      return '💬'
    default:
      return '📄'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800'
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800'
    case 'graded':
      return 'bg-green-100 text-green-800'
    case 'missed':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'assignment':
      return 'bg-purple-100 text-purple-800'
    case 'quiz':
      return 'bg-orange-100 text-orange-800'
    case 'exam':
      return 'bg-red-100 text-red-800'
    case 'project':
      return 'bg-indigo-100 text-indigo-800'
    case 'lab':
      return 'bg-teal-100 text-teal-800'
    case 'reading':
      return 'bg-pink-100 text-pink-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDueDate = (dueAt: string) => {
  const due = new Date(dueAt)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays}d`
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const NodeItem = memo(({ data }: NodeProps<ItemNodeData>) => {
  const isOverdue = data.dueAt && new Date(data.dueAt) < new Date()
  
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card 
        className={`w-44 shadow-md border hover:shadow-lg transition-shadow cursor-pointer ${
          isOverdue ? 'border-red-300 bg-red-50' : ''
        }`}
      >
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-xl mb-2">
              {getTypeIcon(data.type || '')}
            </div>
            <h4 className="font-semibold text-xs mb-2 line-clamp-2" title={data.title}>
              {data.title}
            </h4>
            
            <div className="flex flex-wrap gap-1 justify-center mb-2">
              {data.type && (
                <Badge className={`text-xs ${getTypeColor(data.type)}`}>
                  {data.type}
                </Badge>
              )}
              {data.status && (
                <Badge className={`text-xs ${getStatusColor(data.status)}`}>
                  {data.status}
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              {data.dueAt && (
                <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {formatDueDate(data.dueAt)}
                </div>
              )}
              {data.points && (
                <div>{data.points} pts</div>
              )}
              {data.estimatedMinutes && (
                <div>{data.estimatedMinutes} min</div>
              )}
            </div>
            
            {data.labels && data.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {data.labels.slice(0, 2).map((label, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {data.labels.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.labels.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
})

NodeItem.displayName = 'NodeItem'
