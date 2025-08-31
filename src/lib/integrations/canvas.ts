// Canvas OAuth configuration
export const CANVAS_CONFIG = {
  // These will be set via environment variables
  CLIENT_ID: process.env.CANVAS_CLIENT_ID || '',
  CLIENT_SECRET: process.env.CANVAS_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.CANVAS_REDIRECT_URI || 'http://localhost:3000/api/integrations/canvas/callback',
  AUTH_URL: process.env.CANVAS_AUTH_URL || 'https://canvas.instructure.com/login/oauth2/auth',
  TOKEN_URL: process.env.CANVAS_TOKEN_URL || 'https://canvas.instructure.com/login/oauth2/token',
  API_BASE_URL: process.env.CANVAS_API_BASE_URL || 'https://canvas.instructure.com/api/v1',
}

export interface CanvasOAuthState {
  userId: string
  provider: string
  timestamp: number
}

export interface CanvasTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
}

export interface CanvasUser {
  id: number
  name: string
  email: string
  login_id: string
}

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  enrollment_state: string
  start_at?: string
  end_at?: string
}

export interface CanvasAssignment {
  id: number
  name: string
  description?: string
  due_at?: string
  points_possible?: number
  assignment_group_id: number
  course_id: number
  submission_types: string[]
  published: boolean
}

export interface CanvasQuiz {
  id: number
  title: string
  description?: string
  due_at?: string
  points_possible?: number
  course_id: number
  quiz_type: string
  published: boolean
}

export interface CanvasEvent {
  id: number
  title: string
  description?: string
  start_at: string
  end_at?: string
  course_id?: number
  context_code: string
}

// Generate OAuth state for security
export function generateCanvasOAuthState(userId: string): string {
  const state: CanvasOAuthState = {
    userId,
    provider: 'canvas',
    timestamp: Date.now()
  }
  return Buffer.from(JSON.stringify(state)).toString('base64')
}

// Parse OAuth state
export function parseCanvasOAuthState(state: string): CanvasOAuthState | null {
  try {
    const decoded = Buffer.from(state, 'base64').toString()
    return JSON.parse(decoded) as CanvasOAuthState
  } catch {
    return null
  }
}

// Generate Canvas OAuth URL
export function generateCanvasOAuthUrl(userId: string): string {
  const state = generateCanvasOAuthState(userId)
  const params = new URLSearchParams({
    client_id: CANVAS_CONFIG.CLIENT_ID,
    response_type: 'code',
    redirect_uri: CANVAS_CONFIG.REDIRECT_URI,
    state,
    scope: 'url:GET|/api/v1/courses url:GET|/api/v1/users/self url:GET|/api/v1/courses/:course_id/assignments url:GET|/api/v1/courses/:course_id/quizzes url:GET|/api/v1/calendar_events'
  })
  
  return `${CANVAS_CONFIG.AUTH_URL}?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCanvasCode(code: string): Promise<CanvasTokenResponse> {
  const response = await fetch(CANVAS_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CANVAS_CONFIG.CLIENT_ID,
      client_secret: CANVAS_CONFIG.CLIENT_SECRET,
      code,
      redirect_uri: CANVAS_CONFIG.REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Canvas token exchange failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

// Get Canvas user info
export async function getCanvasUser(accessToken: string): Promise<CanvasUser> {
  const response = await fetch(`${CANVAS_CONFIG.API_BASE_URL}/users/self`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Canvas user: ${response.status}`)
  }

  return response.json()
}

// Get Canvas courses
export async function getCanvasCourses(accessToken: string): Promise<CanvasCourse[]> {
  const response = await fetch(`${CANVAS_CONFIG.API_BASE_URL}/courses?enrollment_state=active&include[]=course_image`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Canvas courses: ${response.status}`)
  }

  return response.json()
}

// Get Canvas assignments for a course
export async function getCanvasAssignments(accessToken: string, courseId: number): Promise<CanvasAssignment[]> {
  const response = await fetch(`${CANVAS_CONFIG.API_BASE_URL}/courses/${courseId}/assignments?per_page=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Canvas assignments: ${response.status}`)
  }

  return response.json()
}

// Get Canvas quizzes for a course
export async function getCanvasQuizzes(accessToken: string, courseId: number): Promise<CanvasQuiz[]> {
  const response = await fetch(`${CANVAS_CONFIG.API_BASE_URL}/courses/${courseId}/quizzes?per_page=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Canvas quizzes: ${response.status}`)
  }

  return response.json()
}

// Get Canvas calendar events
export async function getCanvasEvents(accessToken: string, startDate?: string, endDate?: string): Promise<CanvasEvent[]> {
  const params = new URLSearchParams({
    per_page: '100',
    type: 'event',
  })
  
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  const response = await fetch(`${CANVAS_CONFIG.API_BASE_URL}/calendar_events?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Canvas events: ${response.status}`)
  }

  return response.json()
}
