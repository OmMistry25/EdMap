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
    const HORIZONTAL_SPACING = 100
    const VERTICAL_SPACING = 150
    
    // Track positions for each course column
    const courseColumns: { [courseId: string]: { 
      x: number; 
      sources: { id: string; items: typeof items; x: number; y: number; height: number }[];
      maxSourceWidth: number;
      totalHeight: number;
    } } = {}
    
    let currentX = 0
    
    // First pass: calculate layout for each course
    courses?.forEach((course) => {
      const courseSources = sources?.filter(s => s.course_id === course.id) || []
      const sourceLayouts = courseSources.map((source, sourceIndex) => {
        const sourceItems = items?.filter(i => i.source_id === source.id) || []
        const sourceX = sourceIndex * (SOURCE_WIDTH + HORIZONTAL_SPACING)
        const sourceY = VERTICAL_SPACING
        
        // Calculate height needed for this source's items
        const maxItemsPerRow = 2
        const itemRows = Math.ceil(sourceItems.length / maxItemsPerRow)
        const sourceHeight = VERTICAL_SPACING + (itemRows * 200) // 200px per row of items
        
        return { 
          id: source.id, 
          items: sourceItems, 
          x: sourceX, 
          y: sourceY,
          height: sourceHeight
        }
      })
      
      // Calculate width needed for this course column
      const sourceCount = sourceLayouts.length
      const maxSourceWidth = Math.max(
        SOURCE_WIDTH, // Minimum source width
        sourceCount * (SOURCE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING // Width needed for sources
      )
      
      // Calculate total height needed for this course
      const totalHeight = Math.max(...sourceLayouts.map(s => s.height)) + VERTICAL_SPACING
      
      courseColumns[course.id] = {
        x: currentX,
        sources: sourceLayouts,
        maxSourceWidth: maxSourceWidth,
        totalHeight: totalHeight
      }
      
      currentX += Math.max(COURSE_WIDTH, maxSourceWidth) + HORIZONTAL_SPACING
    })
    
    // Second pass: create nodes with calculated positions
    courses?.forEach((course) => {
      const column = courseColumns[course.id]
      if (!column) return
      
      // Add course node
      const courseNodeId = `course-${course.id}`
      nodes.push({
        id: courseNodeId,
        type: 'course',
        position: { x: column.x, y: 0 },
        data: {
          label: course.title,
          title: course.title,
          code: course.code,
          instructor: course.instructor,
          color: course.color_hex
        }
      })
      
             // Add source nodes for this course
       column.sources.forEach((sourceLayout) => {
         const source = sources?.find(s => s.id === sourceLayout.id)
         if (!source) return
         
         const sourceX = column.x + sourceLayout.x
         const sourceY = sourceLayout.y
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
         
         // Add item nodes for this source
         const maxItemsPerRow = 2
         const ITEM_VERTICAL_SPACING = 200 // Large spacing for items
         sourceLayout.items.forEach((item, itemIndex) => {
           const row = Math.floor(itemIndex / maxItemsPerRow)
           const col = itemIndex % maxItemsPerRow
           
           const itemX = sourceX + (col * (ITEM_WIDTH + HORIZONTAL_SPACING))
           const itemY = sourceY + VERTICAL_SPACING + (row * ITEM_VERTICAL_SPACING)
          
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
