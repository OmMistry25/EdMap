'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Course {
  id: string
  title: string
  code: string
  term: string
  instructor: string
  color_hex: string
  created_at: string
}

interface Source {
  id: string
  course_id: string
  provider: string
  display_name: string
  external_course_id: string | null
  status: string
  created_at: string
}

interface Item {
  id: string
  course_id: string
  source_id: string
  title: string
  type: string
  status: string
  due_at: string
  available_at: string | null
  points_possible: number
  estimated_minutes: number
  labels: string[]
  created_at: string
}

export function TestSeedData() {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true })

      if (coursesError) throw coursesError

      // Fetch sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: true })

      if (sourcesError) throw sourcesError

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('due_at', { ascending: true })

      if (itemsError) throw itemsError

      setCourses(coursesData || [])
      setSources(sourcesData || [])
      setItems(itemsData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'graded': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'bg-purple-100 text-purple-800'
      case 'quiz': return 'bg-orange-100 text-orange-800'
      case 'exam': return 'bg-red-100 text-red-800'
      case 'project': return 'bg-indigo-100 text-indigo-800'
      case 'lab': return 'bg-teal-100 text-teal-800'
      case 'reading': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎓 Seed Data Test</CardTitle>
          <CardDescription>
            Test the comprehensive demo data for the academic graph
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchAllData} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Fetch All Demo Data'}
          </Button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Courses ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="p-4 border rounded-lg"
                  style={{ borderLeftColor: course.color_hex, borderLeftWidth: '4px' }}
                >
                  <h3 className="font-semibold text-lg">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.code} • {course.term}</p>
                  <p className="text-sm text-gray-500">Instructor: {course.instructor}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔗 Sources ({sources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <div key={source.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{source.display_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {source.provider}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Course: {courses.find(c => c.id === source.course_id)?.title}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => {
                const course = courses.find(c => c.id === item.course_id)
                const source = sources.find(s => s.id === item.source_id)
                
                return (
                  <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          {course?.title} • {source?.display_name}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {item.points_possible} pts • {item.estimated_minutes} min
                          </span>
                        </div>
                        
                        {item.labels && item.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.labels.map((label, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {formatDate(item.due_at)}
                        </div>
                        <div className={`text-xs ${
                          new Date(item.due_at) < new Date() ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {getDaysUntilDue(item.due_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {courses.length > 0 && items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Summary Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                <div className="text-sm text-blue-800">Courses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sources.length}</div>
                <div className="text-sm text-green-800">Sources</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{items.length}</div>
                <div className="text-sm text-purple-800">Items</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {items.reduce((sum, item) => sum + item.points_possible, 0)}
                </div>
                <div className="text-sm text-orange-800">Total Points</div>
              </div>
            </div>
            
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Item Types:</h4>
                <div className="space-y-1">
                  {Object.entries(
                    items.reduce((acc, item) => {
                      acc[item.type] = (acc[item.type] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Item Status:</h4>
                <div className="space-y-1">
                  {Object.entries(
                    items.reduce((acc, item) => {
                      acc[item.status] = (acc[item.status] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="capitalize">{status}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
