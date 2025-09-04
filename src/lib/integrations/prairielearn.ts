// PrairieLearn integration configuration
export const PRAIRIELEARN_CONFIG = {
  API_BASE_URL: process.env.PRAIRIELEARN_API_BASE_URL || 'https://prairielearn.illinois.edu',
  AUTH_TYPE: 'token', // PrairieLearn uses token-based auth
  API_ENDPOINTS: {
    COURSE_INSTANCES: '/pl/api/v1/course_instances',
    ASSESSMENTS: '/pl/api/v1/course_instances/{id}/assessments',
    COURSES: '/pl/api/v1/courses',
    USER: '/pl/api/v1/user'
  }
}

// PrairieLearn data types
export interface PrairieLearnCourse {
  id: string
  title: string
  short_name: string
  institution: string
  display_timezone: string
}

export interface PrairieLearnAssessment {
  id: string
  title: string
  type: string
  due_date?: string
  points: number
  course_id: string
}

export interface PrairieLearnTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

// Helper function to normalize PrairieLearn URLs
export function normalizePrairieLearnUrl(url: string): string {
  if (!url.endsWith('/pl')) {
    return url.endsWith('/') ? `${url}pl` : `${url}/pl`
  }
  return url
}

// Helper function to construct API URLs
export function buildPrairieLearnApiUrl(baseUrl: string, endpoint: string): string {
  const normalizedUrl = normalizePrairieLearnUrl(baseUrl)
  return `${normalizedUrl}${endpoint}`
}
