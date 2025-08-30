'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SourceNodeData {
  label: string
  provider?: string
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'canvas':
      return '🎨'
    case 'gradescope':
      return '📊'
    case 'prairielearn':
      return '🌾'
    case 'prairietest':
      return '🧪'
    case 'manual':
      return '✏️'
    default:
      return '🔗'
  }
}

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'canvas':
      return 'bg-blue-100 text-blue-800'
    case 'gradescope':
      return 'bg-green-100 text-green-800'
    case 'prairielearn':
      return 'bg-yellow-100 text-yellow-800'
    case 'prairietest':
      return 'bg-purple-100 text-purple-800'
    case 'manual':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const NodeSource = memo(({ data }: NodeProps<SourceNodeData>) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <Card className="w-40 shadow-md border hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-2xl mb-2">
              {getProviderIcon(data.provider || '')}
            </div>
            <h4 className="font-semibold text-sm mb-2 truncate" title={data.label}>
              {data.label}
            </h4>
            {data.provider && (
              <Badge className={`text-xs ${getProviderColor(data.provider)}`}>
                {data.provider}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
})

NodeSource.displayName = 'NodeSource'
