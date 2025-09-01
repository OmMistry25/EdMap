import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, type, dueAt, points, url, courseId } = await request.json()
    
    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    // Determine status based on due date
    let status = 'pending'
    if (dueAt) {
      const dueDate = new Date(dueAt)
      const now = new Date()
      if (dueDate < now) {
        status = 'overdue'
      }
    } else {
      status = 'no_due_date'
    }

    const itemData = {
      owner_id: user.id,
      title,
      description: description || '',
      type,
      status,
      due_at: dueAt || null,
      points: points || null,
      external_url: url || null,
      external_source: 'manual',
      metadata: {
        created_manually: true,
        course_id: courseId || null
      }
    }

    // Insert the item
    const { data: newItem, error: insertError } = await supabase
      .from('items')
      .insert(itemData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Failed to create item:', insertError)
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }

    console.log('Manual item created successfully:', newItem.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item created successfully',
      item: newItem
    })

  } catch (error) {
    console.error('Manual item creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create item', details: errorMessage }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const courseId = searchParams.get('courseId')

    // Build query
    let query = supabase
      .from('items')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Failed to fetch items:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    return NextResponse.json({ items })

  } catch (error) {
    console.error('Items fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch items', details: errorMessage }, { status: 500 })
  }
}
