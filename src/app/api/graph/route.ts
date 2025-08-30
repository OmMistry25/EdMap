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
    
        // Node dimensions and spacing
    const COURSE_WIDTH = 250
    const SOURCE_WIDTH = 200
    const ITEM_WIDTH = 220
    const HORIZONTAL_SPACING = 120
    const VERTICAL_SPACING = 200
    const ITEM_VERTICAL_SPACING = 250

    // Calculate total layout dimensions
    const courseCount = courses?.length || 0
    const totalWidth = courseCount * (COURSE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING
    
    // Calculate maximum height needed for any course
    let maxCourseHeight = 0
    courses?.forEach((course) => {
      const courseSources = sources?.filter(s => s.course_id === course.id) || []
      let courseHeight = VERTICAL_SPACING // Space for course node
      
      courseSources.forEach((source) => {
        const sourceItems = items?.filter(i => i.source_id === source.id) || []
        courseHeight += VERTICAL_SPACING // Space for source node
        
        // Calculate items height
        const maxItemsPerRow = 2
        const itemRows = Math.ceil(sourceItems.length / maxItemsPerRow)
        courseHeight += itemRows * ITEM_VERTICAL_SPACING
      })
      
      maxCourseHeight = Math.max(maxCourseHeight, courseHeight)
    })
    
        // Create nodes with simple grid layout
    courses?.forEach((course, courseIndex) => {
      const courseX = courseIndex * (COURSE_WIDTH + HORIZONTAL_SPACING)
      
      // Add course node
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
      
      // Add sources and items for this course
      const courseSources = sources?.filter(s => s.course_id === course.id) || []
      let currentY = VERTICAL_SPACING
      
      courseSources.forEach((source, sourceIndex) => {
        // Add source node
        const sourceNodeId = `source-${source.id}`
        nodes.push({
          id: sourceNodeId,
          type: 'source',
          position: { x: courseX, y: currentY },
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
        
        currentY += VERTICAL_SPACING
        
        // Add items for this source
        const sourceItems = items?.filter(i => i.source_id === source.id) || []
        const maxItemsPerRow = 2
        
        sourceItems.forEach((item, itemIndex) => {
          const row = Math.floor(itemIndex / maxItemsPerRow)
          const col = itemIndex % maxItemsPerRow
          
          const itemX = courseX + (col * (ITEM_WIDTH + 50)) // Smaller horizontal spacing for items
          const itemY = currentY + (row * ITEM_VERTICAL_SPACING)
          
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
        
        // Move to next source position
        const itemRows = Math.ceil(sourceItems.length / maxItemsPerRow)
        currentY += itemRows * ITEM_VERTICAL_SPACING + VERTICAL_SPACING
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
