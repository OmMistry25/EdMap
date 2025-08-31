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

        // Build the graph data with hierarchical layout
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    
        // Tree layout dimensions
    const COURSE_WIDTH = 300
    const SOURCE_WIDTH = 250
    const ITEM_WIDTH = 280
    const COURSE_HORIZONTAL_SPACING = 500  // Space between course columns
    const SOURCE_VERTICAL_SPACING = 200    // Space from course to sources
    const ITEM_VERTICAL_SPACING = 150      // Space from source to items
    const SOURCE_HORIZONTAL_SPACING = 300  // Space between sources under same course
    const ITEM_HORIZONTAL_SPACING = 200    // Space between items under same source
    
        // Create hierarchical tree layout
    courses?.forEach((course, courseIndex) => {
      const courseX = courseIndex * COURSE_HORIZONTAL_SPACING
      
      // Add course node at the top
      const courseNodeId = `course-${course.id}`
      nodes.push({
        id: courseNodeId,
        type: 'course',
        position: { x: courseX, y: 0 },
        data: {
          label: course.title,
          title: course.title,
          code: course.code,
          instructor: course.instructor,
          color: course.color_hex
        }
      })
      
      // Get sources for this course
      const courseSources = sources?.filter(s => s.course_id === course.id) || []
      
      // Calculate total width needed for sources
      const totalSourceWidth = (courseSources.length - 1) * SOURCE_HORIZONTAL_SPACING
      const startSourceX = courseX - (totalSourceWidth / 2)
      
      // Add sources branching out from course
      courseSources.forEach((source, sourceIndex) => {
        const sourceX = startSourceX + (sourceIndex * SOURCE_HORIZONTAL_SPACING)
        const sourceY = SOURCE_VERTICAL_SPACING
        
        const sourceNodeId = `source-${source.id}`
        nodes.push({
          id: sourceNodeId,
          type: 'source',
          position: { x: sourceX, y: sourceY },
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
        
        // Get items for this source
        const sourceItems = items?.filter(i => i.source_id === source.id) || []
        
        // Calculate total width needed for items
        const totalItemWidth = (sourceItems.length - 1) * ITEM_HORIZONTAL_SPACING
        const startItemX = sourceX - (totalItemWidth / 2)
        
        // Add items branching out from source
        sourceItems.forEach((item, itemIndex) => {
          const itemX = startItemX + (itemIndex * ITEM_HORIZONTAL_SPACING)
          const itemY = sourceY + ITEM_VERTICAL_SPACING
          
          const itemNodeId = `item-${item.id}`
          nodes.push({
            id: itemNodeId,
            type: 'item',
            position: { x: itemX, y: itemY },
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
