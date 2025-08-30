'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider
} from 'reactflow'
import 'reactflow/dist/style.css'

import { NodeCourse } from './NodeCourse'
import { NodeSource } from './NodeSource'
import { NodeItem } from './NodeItem'
import { GraphData, GraphNode, GraphEdge } from '@/app/api/graph/route'

const nodeTypes = {
  course: NodeCourse,
  source: NodeSource,
  item: NodeItem,
}

interface FlowCanvasProps {
  className?: string
}

export function FlowCanvas({ className = '' }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/graph')
      const responseText = await response.text()
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your academic graph')
        }
        throw new Error(`Server error: ${response.status} - ${responseText}`)
      }
      
      let graphData: GraphData
      try {
        graphData = JSON.parse(responseText)
      } catch {
        throw new Error(`Invalid response format: ${responseText}`)
      }
      
      // Convert GraphNode to ReactFlow Node
      const reactFlowNodes: Node[] = graphData.nodes.map((node: GraphNode) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      }))
      
      // Convert GraphEdge to ReactFlow Edge
      const reactFlowEdges: Edge[] = graphData.edges.map((edge: GraphEdge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      }))
      
      setNodes(reactFlowNodes)
      setEdges(reactFlowEdges)
      
    } catch (err) {
      console.error('Error fetching graph data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load graph data')
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Fetch data on mount
  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData])

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading academic graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isAuthError = error.includes('sign in')
    
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <p className="text-gray-600 mb-4">Failed to load graph data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          {isAuthError ? (
            <div className="space-y-2">
              <p className="text-sm text-blue-600">
                Please sign in to your account first
              </p>
              <a
                href="/auth/signin"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
            </div>
          ) : (
            <button
              onClick={fetchGraphData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-4">
            Connect your course systems or add manual items to see your academic graph
          </p>
          <button
            onClick={fetchGraphData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1, includeHiddenNodes: false }}
          attributionPosition="bottom-left"
          className="bg-gray-50"
        >
          <Background color="#94a3b8" gap={20} size={1} />
          <Controls />
          <MiniMap 
            nodeColor="#3b82f6"
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
