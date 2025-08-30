'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlowCanvas } from '@/components/graph/FlowCanvas'

export function TestGraph() {
  const [showGraph, setShowGraph] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 React Flow Graph Test</CardTitle>
        <CardDescription>
          Test the interactive academic graph visualization with React Flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showGraph ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Click the button below to load and display your academic graph visualization.
              The graph will show courses, sources, and items in an interactive flowchart.
            </p>
            <Button onClick={() => setShowGraph(true)}>
              Load Academic Graph
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Academic Graph Visualization</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowGraph(false)}
              >
                Hide Graph
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <FlowCanvas />
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Drag nodes to reposition them</li>
                <li>Use mouse wheel to zoom in/out</li>
                <li>Drag the background to pan around</li>
                <li>Use the controls in the bottom-left to reset view</li>
                <li>Use the minimap in the bottom-right for navigation</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
