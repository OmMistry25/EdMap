import { createServerComponentClient } from '../supabaseClient'

export interface Profile {
  id: string
  full_name: string | null
  school_email: string | null
  timezone: string
  onboarding_done_at: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  owner_id: string
  title: string
  code: string | null
  term: string | null
  instructor: string | null
  color_hex: string
  created_at: string
  updated_at: string
}

export interface Source {
  id: string
  course_id: string
  provider: 'canvas' | 'gradescope' | 'prairielearn' | 'prairietest' | 'manual'
  display_name: string
  external_course_id: string | null
  connected_at: string
  status: 'active' | 'inactive' | 'error'
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  course_id: string
  source_id: string | null
  title: string
  type: 'assignment' | 'quiz' | 'exam' | 'project' | 'lab' | 'reading' | 'survey' | 'discussion'
  status: 'upcoming' | 'submitted' | 'graded' | 'missed' | 'cancelled'
  due_at: string | null
  available_at: string | null
  points_possible: number | null
  url: string | null
  estimated_minutes: number | null
  labels: string[] | null
  raw_ref: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Profile queries
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

export async function createProfile(userId: string, profile: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, ...profile })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  return data
}

// Course queries
export async function getCourses(userId: string): Promise<Course[]> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }

  return data || []
}

export async function createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single()

  if (error) {
    console.error('Error creating course:', error)
    return null
  }

  return data
}

// Source queries
export async function getSources(courseId: string): Promise<Source[]> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sources:', error)
    return []
  }

  return data || []
}

export async function createSource(source: Omit<Source, 'id' | 'created_at' | 'updated_at'>): Promise<Source | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('sources')
    .insert(source)
    .select()
    .single()

  if (error) {
    console.error('Error creating source:', error)
    return null
  }

  return data
}

// Item queries
export async function getItems(courseId?: string, sourceId?: string): Promise<Item[]> {
  const supabase = await createServerComponentClient()
  
  let query = supabase.from('items').select('*')
  
  if (courseId) {
    query = query.eq('course_id', courseId)
  }
  
  if (sourceId) {
    query = query.eq('source_id', sourceId)
  }
  
  const { data, error } = await query.order('due_at', { ascending: true })

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  return data || []
}

export async function createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single()

  if (error) {
    console.error('Error creating item:', error)
    return null
  }

  return data
}

export async function updateItemStatus(itemId: string, status: Item['status']): Promise<Item | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('items')
    .update({ status })
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating item status:', error)
    return null
  }

  return data
}
