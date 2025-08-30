'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'

interface CourseNodeData {
  label: string
  title?: string
  code?: string
  instructor?: string
  color?: string
}

export const NodeCourse = memo(({ data }: NodeProps<CourseNodeData>) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card 
        className="w-48 shadow-lg border-2 hover:shadow-xl transition-shadow cursor-pointer"
        style={{ 
          borderColor: data.color || '#3B82F6',
          backgroundColor: `${data.color || '#3B82F6'}10`
        }}
      >
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-1 truncate" title={data.title}>
              {data.title}
            </h3>
            {data.code && (
              <p className="text-sm text-gray-600 mb-1 font-mono">
                {data.code}
              </p>
            )}
            {data.instructor && (
              <p className="text-xs text-gray-500 truncate" title={data.instructor}>
                {data.instructor}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
})

NodeCourse.displayName = 'NodeCourse'
