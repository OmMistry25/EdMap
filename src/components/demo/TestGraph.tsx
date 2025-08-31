'use client'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlowCanvas } from '@/components/graph/FlowCanvas'
import { CalendarView } from '@/components/calendar/CalendarView'
import { BarChart3, Calendar } from 'lucide-react'

export function TestGraph() {
  const [showView, setShowView] = useState<'none' | 'graph' | 'calendar'>('none')
  const [viewMode, setViewMode] = useState<'graph' | 'calendar'>('graph')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Academic Data Visualization</CardTitle>
        <CardDescription>View your academic data in either a flowchart or calendar format</CardDescription>
      </CardHeader>
      <CardContent>
        {showView === 'none' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => {
                  setViewMode('graph')
                  setShowView('graph')
                }} 
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <BarChart3 className="h-8 w-8" />
                <span>Flowchart View</span>
                <span className="text-xs opacity-75">Interactive graph layout</span>
              </Button>
              <Button 
                onClick={() => {
                  setViewMode('calendar')
                  setShowView('calendar')
                }} 
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <Calendar className="h-8 w-8" />
                <span>Calendar View</span>
                <span className="text-xs opacity-75">Traditional calendar layout</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  {viewMode === 'graph' ? 'Academic Graph Visualization' : 'Academic Calendar View'}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'graph' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('graph')}
                    className="flex items-center gap-1"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Graph
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    Calendar
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowView('none')}>Close View</Button>
            </div>
            
            {viewMode === 'graph' ? (
              <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <FlowCanvas />
              </div>
            ) : (
              <CalendarView />
            )}
            
            <div className="text-sm text-gray-600">
              <p><strong>Instructions:</strong></p>
              {viewMode === 'graph' ? (
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Drag nodes to reposition them</li>
                  <li>Use mouse wheel to zoom in/out</li>
                  <li>Drag the background to pan around</li>
                  <li>Use the controls in the bottom-left to reset view</li>
                  <li>Use the minimap in the bottom-right for navigation</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Navigate between months using the arrow buttons</li>
                  <li>Click &quot;Today&quot; to return to current month</li>
                  <li>Hover over items to see full details</li>
                  <li>Overdue items are highlighted in red</li>
                  <li>Today&apos;s date is highlighted with a blue ring</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
