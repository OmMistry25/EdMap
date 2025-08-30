'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import type { Course, Source, Item } from '@/lib/db/queries'

export function TestCoreTables() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchCourses = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage('No user logged in')
        return
      }

      // Fetch courses
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setCourses(data || [])
        setMessage(`Found ${data?.length || 0} courses`)
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createTestCourse = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage('No user logged in')
        return
      }

      // Create a test course
      const { error } = await supabase
        .from('courses')
        .insert({
          owner_id: user.id,
          title: 'Test Course',
          code: 'TEST101',
          term: 'Fall 2024',
          instructor: 'Test Instructor',
          color_hex: '#10B981'
        })
        .select()
        .single()

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Test course created successfully!')
        fetchCourses() // Refresh the list
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchSources = async (courseId: string) => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setSources(data || [])
        setMessage(`Found ${data?.length || 0} sources for course`)
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createTestSource = async (courseId: string) => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('sources')
        .insert({
          course_id: courseId,
          provider: 'manual',
          display_name: 'Manual Source',
          external_course_id: null
        })
        .select()
        .single()

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Test source created successfully!')
        fetchSources(courseId) // Refresh the list
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async (courseId?: string) => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      let query = supabase.from('items').select('*').order('due_at', { ascending: true })
      
      if (courseId) {
        query = query.eq('course_id', courseId)
      }
      
      const { data, error } = await query

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setItems(data || [])
        setMessage(`Found ${data?.length || 0} items`)
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createTestItem = async (courseId: string, sourceId?: string) => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('items')
        .insert({
          course_id: courseId,
          source_id: sourceId,
          title: 'Test Assignment',
          type: 'assignment',
          status: 'upcoming',
          due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          points_possible: 100,
          estimated_minutes: 120
        })
        .select()
        .single()

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Test item created successfully!')
        fetchItems(courseId) // Refresh the list
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Core Tables Test</h3>
      
      <div className="space-y-4">
        {/* Courses Section */}
        <div className="space-y-2">
          <h4 className="font-medium">Courses:</h4>
          <div className="flex gap-2">
            <Button onClick={fetchCourses} disabled={loading} size="sm">
              {loading ? 'Loading...' : 'Fetch Courses'}
            </Button>
            <Button onClick={createTestCourse} disabled={loading} size="sm" variant="outline">
              Create Test Course
            </Button>
          </div>
          {courses.length > 0 && (
            <div className="text-sm space-y-1">
              {courses.map(course => (
                <div key={course.id} className="p-2 bg-gray-50 rounded">
                  <strong>{course.title}</strong> ({course.code}) - {course.instructor}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sources Section */}
        {courses.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Sources:</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => fetchSources(courses[0].id)} 
                disabled={loading} 
                size="sm"
              >
                Fetch Sources
              </Button>
              <Button 
                onClick={() => createTestSource(courses[0].id)} 
                disabled={loading} 
                size="sm" 
                variant="outline"
              >
                Create Test Source
              </Button>
            </div>
            {sources.length > 0 && (
              <div className="text-sm space-y-1">
                {sources.map(source => (
                  <div key={source.id} className="p-2 bg-gray-50 rounded">
                    <strong>{source.display_name}</strong> ({source.provider}) - {source.status}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items Section */}
        {courses.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Items:</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => fetchItems(courses[0].id)} 
                disabled={loading} 
                size="sm"
              >
                Fetch Items
              </Button>
              <Button 
                onClick={() => createTestItem(courses[0].id, sources[0]?.id)} 
                disabled={loading} 
                size="sm" 
                variant="outline"
              >
                Create Test Item
              </Button>
            </div>
            {items.length > 0 && (
              <div className="text-sm space-y-1">
                {items.map(item => (
                  <div key={item.id} className="p-2 bg-gray-50 rounded">
                    <strong>{item.title}</strong> ({item.type}) - {item.status} - Due: {item.due_at ? new Date(item.due_at).toLocaleDateString() : 'No due date'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className={`text-sm p-3 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
