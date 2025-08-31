'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarItem {
  id: string
  title: string
  type: string
  status: string
  dueAt: string | null
  points: number | null
  estimatedMinutes: number | null
  labels: string[] | null
  courseTitle: string
  sourceName: string
}

interface CalendarViewProps {
  className?: string
}

export function CalendarView({ className = '' }: CalendarViewProps) {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get current month's start and end dates
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get calendar grid dates
  const startOfWeek = new Date(startOfMonth)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  
  const endOfWeek = new Date(endOfMonth)
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()))

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/graph')
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your academic calendar')
        }
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform graph data to calendar items
      const calendarItems: CalendarItem[] = []
      
      data.nodes.forEach((node: Record<string, unknown>) => {
        if (node.type === 'item' && (node.data as Record<string, unknown>).dueAt) {
          const nodeData = node.data as Record<string, unknown>
          calendarItems.push({
            id: node.id as string,
            title: nodeData.title as string,
            type: nodeData.type as string,
            status: nodeData.status as string,
            dueAt: nodeData.dueAt as string,
            points: nodeData.points as number,
            estimatedMinutes: nodeData.estimatedMinutes as number,
            labels: nodeData.labels as string[],
            courseTitle: '', // Will be filled from edges
            sourceName: ''   // Will be filled from edges
          })
        }
      })

      // Find course and source names for each item
      data.edges.forEach((edge: Record<string, unknown>) => {
        const sourceNode = data.nodes.find((n: Record<string, unknown>) => n.id === edge.source)
        const targetNode = data.nodes.find((n: Record<string, unknown>) => n.id === edge.target)
        
        if (targetNode?.type === 'item') {
          const item = calendarItems.find(i => i.id === targetNode.id)
          if (item) {
            if (sourceNode?.type === 'course') {
              item.courseTitle = sourceNode.data.title
            } else if (sourceNode?.type === 'source') {
              item.sourceName = sourceNode.data.label
            }
          }
        }
      })

      setItems(calendarItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendarData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'quiz': return '❓'
      case 'exam': return '📖'
      case 'assignment': return '📝'
      case 'project': return '💻'
      case 'lab': return '🧪'
      case 'reading': return '📚'
      case 'homework': return '📋'
      default: return '📄'
    }
  }



  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'quiz': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'exam': return 'bg-red-100 text-red-800 border-red-200'
      case 'assignment': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'project': return 'bg-green-100 text-green-800 border-green-200'
      case 'lab': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reading': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'homework': return 'bg-teal-100 text-teal-800 border-teal-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date()
  }

  const getItemsForDate = (date: Date) => {
    return items.filter(item => {
      if (!item.dueAt) return false
      const itemDate = new Date(item.dueAt)
      return itemDate.toDateString() === date.toDateString()
    })
  }

  const generateCalendarDays = () => {
    const days = []
    const current = new Date(startOfWeek)
    
    while (current <= endOfWeek) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
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
          <p className="text-gray-600 mb-4">Failed to load calendar data</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          {isAuthError ? (
            <div className="space-y-2">
              <p className="text-sm text-blue-600">Please sign in to your account first</p>
              <a href="/auth/signin" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Sign In</a>
            </div>
          ) : (
            <Button onClick={fetchCalendarData} variant="outline">Retry</Button>
          )}
        </div>
      </div>
    )
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Academic Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-lg font-semibold text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-sm text-gray-600 bg-gray-50 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()
              const dayItems = getItemsForDate(date)
              
              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border rounded ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        className={`p-1 rounded text-xs cursor-pointer hover:bg-gray-100 transition-colors ${
                          isOverdue(item.dueAt!) ? 'bg-red-50 border-l-2 border-red-400' : 'bg-blue-50 border-l-2 border-blue-400'
                        }`}
                        title={`${item.title} - ${item.courseTitle} - ${formatDate(item.dueAt!)}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span>{getTypeIcon(item.type)}</span>
                          <span className="font-medium truncate">{item.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                            {item.type}
                          </Badge>
                          {item.points && (
                            <Badge variant="outline" className="text-xs">
                              {item.points} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
