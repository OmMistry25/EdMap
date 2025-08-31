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
    
        // Tree layout dimensions with MUCH MORE AGGRESSIVE spacing
    const COURSE_WIDTH = 300
    const SOURCE_WIDTH = 250
    const ITEM_WIDTH = 280
    const COURSE_HORIZONTAL_SPACING = 800  // Much larger space between course columns
    const SOURCE_VERTICAL_SPACING = 250    // More space from course to sources
    const ITEM_VERTICAL_SPACING = 200      // More space from source to items
    const SOURCE_HORIZONTAL_SPACING = 400  // Much larger space between sources
    const ITEM_HORIZONTAL_SPACING = 350    // Much larger space between items
    
        // Helper function to check if two rectangles overlap
    const rectanglesOverlap = (rect1: { x: number; y: number; width: number; height: number }, 
                              rect2: { x: number; y: number; width: number; height: number }) => {
      return !(rect1.x + rect1.width < rect2.x || 
               rect2.x + rect2.width < rect1.x || 
               rect1.y + rect1.height < rect2.y || 
               rect2.y + rect2.height < rect1.y)
    }

    // Helper function to find non-overlapping position
    const findNonOverlappingPosition = (x: number, y: number, width: number, height: number, 
                                       existingRects: Array<{ x: number; y: number; width: number; height: number }>) => {
      let testX = x
      let testY = y
      let attempts = 0
      const maxAttempts = 50
      
      while (attempts < maxAttempts) {
        const testRect = { x: testX, y: testY, width, height }
        let hasOverlap = false
        
        for (const existingRect of existingRects) {
          if (rectanglesOverlap(testRect, existingRect)) {
            hasOverlap = true
            break
          }
        }
        
        if (!hasOverlap) {
          return { x: testX, y: testY }
        }
        
        // Try different positions
        if (attempts % 4 === 0) {
          testX += 50
        } else if (attempts % 4 === 1) {
          testX -= 50
        } else if (attempts % 4 === 2) {
          testY += 50
        } else {
          testY -= 50
        }
        
        attempts++
      }
      
      // If we can't find a non-overlapping position, return the original with some offset
      return { x: x + attempts * 10, y: y + attempts * 10 }
    }

    // Track all placed rectangles for collision detection
    const placedRects: Array<{ x: number; y: number; width: number; height: number }> = []

    // Create hierarchical tree layout with collision detection
    courses?.forEach((course, courseIndex) => {
      const courseX = courseIndex * COURSE_HORIZONTAL_SPACING
      
      // Add course node at the top
      const courseNodeId = `course-${course.id}`
      const coursePosition = findNonOverlappingPosition(courseX, 0, COURSE_WIDTH, 100, placedRects)
      placedRects.push({ x: coursePosition.x, y: coursePosition.y, width: COURSE_WIDTH, height: 100 })
      
      nodes.push({
        id: courseNodeId,
        type: 'course',
        position: coursePosition,
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
        const baseSourceX = startSourceX + (sourceIndex * SOURCE_HORIZONTAL_SPACING)
        const baseSourceY = SOURCE_VERTICAL_SPACING
        
        const sourcePosition = findNonOverlappingPosition(baseSourceX, baseSourceY, SOURCE_WIDTH, 120, placedRects)
        placedRects.push({ x: sourcePosition.x, y: sourcePosition.y, width: SOURCE_WIDTH, height: 120 })
        
        const sourceNodeId = `source-${source.id}`
        nodes.push({
          id: sourceNodeId,
          type: 'source',
          position: sourcePosition,
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
        const startItemX = sourcePosition.x - (totalItemWidth / 2)
        
        // Add items branching out from source
        sourceItems.forEach((item, itemIndex) => {
          const baseItemX = startItemX + (itemIndex * ITEM_HORIZONTAL_SPACING)
          const baseItemY = sourcePosition.y + ITEM_VERTICAL_SPACING
          
          const itemPosition = findNonOverlappingPosition(baseItemX, baseItemY, ITEM_WIDTH, 150, placedRects)
          placedRects.push({ x: itemPosition.x, y: itemPosition.y, width: ITEM_WIDTH, height: 150 })
          
          const itemNodeId = `item-${item.id}`
          nodes.push({
            id: itemNodeId,
            type: 'item',
            position: itemPosition,
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
