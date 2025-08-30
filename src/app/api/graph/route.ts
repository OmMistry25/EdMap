import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'

export interface GraphNode {
  id: string
  type: 'course' | 'source' | 'item'
  position: { x: number; y: number }
  data: {
    label: string
    title?: string
    code?: string
    instructor?: string
    color?: string
    provider?: string
    type?: string
    status?: string
    dueAt?: string
    points?: number
    estimatedMinutes?: number
    labels?: string[]
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'smoothstep'
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all courses for the user
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Fetch all sources for these courses
    const courseIds = courses?.map(c => c.id) || []
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .in('course_id', courseIds)
      .order('created_at', { ascending: true })

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError)
      return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
    }

    // Fetch all items for these sources
    const sourceIds = sources?.map(s => s.id) || []
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .in('source_id', sourceIds)
      .order('due_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Build the graph data
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Add course nodes (top level)
    courses?.forEach((course, courseIndex) => {
      const nodeId = `course-${course.id}`
      nodes.push({
        id: nodeId,
        type: 'course',
        position: { x: courseIndex * 300, y: 0 },
        data: {
          label: course.title,
          title: course.title,
          code: course.code,
          instructor: course.instructor,
          color: course.color_hex
        }
      })
    })

    // Add source nodes (second level)
    sources?.forEach((source) => {
      const course = courses?.find(c => c.id === source.course_id)
      if (!course) return

      const courseNodeId = `course-${course.id}`
      const sourceNodeId = `source-${source.id}`
      
      // Position sources below their course
      const courseIndex = courses?.findIndex(c => c.id === course.id) || 0
      const sourceOffset = sources?.filter(s => s.course_id === course.id).findIndex(s => s.id === source.id) || 0
      
      nodes.push({
        id: sourceNodeId,
        type: 'source',
        position: { 
          x: courseIndex * 300 + sourceOffset * 100, 
          y: 150 
        },
        data: {
          label: source.display_name,
          provider: source.provider
        }
      })

      // Add edge from course to source
      edges.push({
        id: `edge-${courseNodeId}-${sourceNodeId}`,
        source: courseNodeId,
        target: sourceNodeId,
        type: 'smoothstep'
      })
    })

    // Add item nodes (third level)
    items?.forEach((item) => {
      const source = sources?.find(s => s.id === item.source_id)
      const course = courses?.find(c => c.id === item.course_id)
      if (!source || !course) return

      const sourceNodeId = `source-${source.id}`
      const itemNodeId = `item-${item.id}`
      
      // Position items below their source
      const sourceIndex = sources?.findIndex(s => s.id === source.id) || 0
      const itemOffset = items?.filter(i => i.source_id === source.id).findIndex(i => i.id === item.id) || 0
      
      nodes.push({
        id: itemNodeId,
        type: 'item',
        position: { 
          x: sourceIndex * 100 + itemOffset * 80, 
          y: 300 
        },
        data: {
          label: item.title,
          title: item.title,
          type: item.type,
          status: item.status,
          dueAt: item.due_at,
          points: item.points_possible,
          estimatedMinutes: item.estimated_minutes,
          labels: item.labels
        }
      })

      // Add edge from source to item
      edges.push({
        id: `edge-${sourceNodeId}-${itemNodeId}`,
        source: sourceNodeId,
        target: itemNodeId,
        type: 'smoothstep'
      })
    })

    const graphData: GraphData = {
      nodes,
      edges
    }

    return NextResponse.json(graphData)

  } catch (error) {
    console.error('Error building graph:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
