'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ManualItemForm } from '@/components/forms/ManualItemForm'
import { ICSImportForm } from '@/components/forms/ICSImportForm'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

function OnboardingContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<Array<{ id: string; provider: string; display_name: string; is_active: boolean }>>([])
  const [showCanvasForm, setShowCanvasForm] = useState(false)
  const [showPrairieLearnForm, setShowPrairieLearnForm] = useState(false)
  const [showGradescopeForm, setShowGradescopeForm] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [canvasUrl, setCanvasUrl] = useState('https://canvas.instructure.com')
  const [prairieLearnToken, setPrairieLearnToken] = useState('')
  const [prairieLearnUrl, setPrairieLearnUrl] = useState('https://prairielearn.org/pl')
  const [gradescopeEmail, setGradescopeEmail] = useState('')
  const [gradescopePassword, setGradescopePassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getSession()
  }, [])

  useEffect(() => {
    const fetchIntegrations = async () => {
      if (user) {
        const supabase = createClient()
        const { data } = await supabase
          .from('integrations')
          .select('*')
          .eq('owner_id', user.id)
          .eq('is_active', true)
        
        setIntegrations(data || [])
      }
    }
    fetchIntegrations()
  }, [user])

  const handleSkipOnboarding = async () => {
    if (!user) return

    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_done_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCanvasConnect = async () => {
    setShowCanvasForm(true)
  }

  const handleCanvasTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/integrations/canvas/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          canvasUrl
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh integrations list
        const supabase = createClient()
        const { data: newIntegrations } = await supabase
          .from('integrations')
          .select('*')
          .eq('owner_id', user?.id)
          .eq('is_active', true)
        
        setIntegrations(newIntegrations || [])
        setShowCanvasForm(false)
        setAccessToken('')
        setCanvasUrl('https://canvas.instructure.com')
        
        // Show success message
        router.push('/connect?success=canvas_connected')
      } else {
        console.error('Canvas connection failed:', data.error)
        alert(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Canvas connection error:', error)
      alert('Connection failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCanvasSync = async () => {
    setSyncing(true)
    
    try {
      const response = await fetch('/api/integrations/canvas/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Canvas sync completed successfully!\n\nStats:\n- ${data.stats.itemsCreated} items created\n- ${data.stats.itemsUpdated} items updated\n- ${data.stats.coursesCreated} courses created\n- ${data.stats.coursesUpdated} courses updated`)
        
        // Redirect to main page to see the data
        router.push('/')
      } else {
        console.error('Canvas sync failed:', data.error)
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Canvas sync error:', error)
      alert('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const handlePrairieLearnConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/integrations/prairielearn/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: prairieLearnToken,
          prairieLearnUrl
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh integrations list
        const supabase = createClient()
        const { data: newIntegrations } = await supabase
          .from('integrations')
          .select('*')
          .eq('owner_id', user?.id)
          .eq('is_active', true)
        
        setIntegrations(newIntegrations || [])
        setShowPrairieLearnForm(false)
        setPrairieLearnToken('')
        setPrairieLearnUrl('https://prairielearn.org/pl')
        
        // Show success message
        alert('PrairieLearn connected successfully!')
      } else {
        console.error('PrairieLearn connection failed:', data.error)
        alert(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      console.error('PrairieLearn connection error:', error)
      alert('Connection failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrairieLearnSync = async () => {
    setSyncing(true)
    
    try {
      const response = await fetch('/api/integrations/prairielearn/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`PrairieLearn sync completed successfully!\n\nStats:\n- ${data.stats.itemsCreated} items created\n- ${data.stats.itemsUpdated} items updated\n- ${data.stats.coursesCreated} courses created\n- ${data.stats.coursesUpdated} courses updated`)
        
        // Redirect to main page to see the data
        router.push('/')
      } else {
        console.error('PrairieLearn sync failed:', data.error)
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('PrairieLearn sync error:', error)
      alert('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const handlePrairieLearnTest = async () => {
    if (!prairieLearnToken) {
      alert('Please enter your access token first')
      return
    }
    
    try {
      const response = await fetch('/api/integrations/prairielearn/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prairieLearnUrl,
          accessToken: prairieLearnToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('PrairieLearn test results:', data)
        console.log('Raw results array:', data.results)
        
        // Show detailed results
        let message = `Test Results for: ${data.testedUrl}\n\n`
        data.results.forEach((result: Record<string, unknown>, index: number) => {
          console.log(`Processing result ${index}:`, result)
          
          if (result.error) {
            message += `❌ ${result.endpoint}: ${result.error}\n`
          } else if (result.ok) {
            message += `✅ ${result.endpoint}: ${result.status} - Working!\n`
          } else {
            // This handles HTTP error responses (401, 404, 500, etc.)
            const status = result.status as number
            const statusText = result.statusText as string
            const errorDetails = result.errorDetails as string || ''
            
            console.log(`Result ${index} - Status: ${status}, StatusText: ${statusText}, ErrorDetails: ${errorDetails}`)
            
            if (status === 401) {
              message += `🔐 ${result.endpoint}: ${status} ${statusText} - Authentication required\n`
              if (errorDetails) {
                message += `   Details: ${errorDetails}\n`
              }
            } else if (status === 404) {
              message += `🚫 ${result.endpoint}: ${status} ${statusText} - Endpoint not found\n`
              if (errorDetails) {
                message += `   Details: ${errorDetails}\n`
              }
            } else if (status >= 500) {
              message += `💥 ${result.endpoint}: ${status} ${statusText} - Server error\n`
              if (errorDetails) {
                message += `   Details: ${errorDetails}\n`
              }
            } else {
              message += `⚠️ ${result.endpoint}: ${status} ${statusText}\n`
              if (errorDetails) {
                message += `   Details: ${errorDetails}\n`
              }
            }
          }
        })
        
        console.log('Final message:', message)
        alert(message)
      } else {
        console.error('PrairieLearn test failed:', data.error)
        alert(`Test failed: ${data.error}`)
      }
    } catch (error) {
      console.error('PrairieLearn test error:', error)
      alert('Test failed. Please try again.')
    }
  }

  const handleGradescopeConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/integrations/gradescope/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: gradescopeEmail,
          password: gradescopePassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh integrations list
        const supabase = createClient()
        const { data: newIntegrations } = await supabase
          .from('integrations')
          .select('*')
          .eq('owner_id', user?.id)
          .eq('is_active', true)
        
        setIntegrations(newIntegrations || [])
        setShowGradescopeForm(false)
        setGradescopeEmail('')
        setGradescopePassword('')
        
        // Show success message
        alert('Gradescope connected successfully!')
      } else {
        console.error('Gradescope connection failed:', data.error)
        alert(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Gradescope connection error:', error)
      alert('Connection failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGradescopeSync = async () => {
    setSyncing(true)
    
    try {
      const response = await fetch('/api/integrations/gradescope/courses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Gradescope sync completed successfully!\n\nStats:\n- ${data.length} courses found`)
        
        // Redirect to main page to see the data
        router.push('/')
      } else {
        console.error('Gradescope sync failed:', data.error)
        alert(`Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Gradescope sync error:', error)
      alert('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const getStatusMessage = () => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'canvas_connected') {
      return {
        type: 'success',
        title: 'Canvas Connected Successfully!',
        message: 'Your Canvas account has been connected. You can now import your courses and assignments.'
      }
    }

    if (error) {
      const errorMessages: Record<string, { title: string; message: string }> = {
        canvas_oauth_failed: {
          title: 'Canvas Connection Failed',
          message: 'There was an error during the Canvas authorization process. Please try again.'
        },
        invalid_oauth_response: {
          title: 'Invalid Response',
          message: 'The Canvas authorization response was invalid. Please try again.'
        },
        invalid_oauth_state: {
          title: 'Security Error',
          message: 'The authorization state was invalid. Please try again.'
        },
        authentication_mismatch: {
          title: 'Authentication Error',
          message: 'Your session has changed. Please sign in again and try connecting.'
        },
        token_exchange_failed: {
          title: 'Token Exchange Failed',
          message: 'Failed to exchange the authorization code. Please try again.'
        },
        canvas_user_fetch_failed: {
          title: 'User Info Fetch Failed',
          message: 'Failed to retrieve your Canvas user information. Please try again.'
        },
        integration_creation_failed: {
          title: 'Integration Creation Failed',
          message: 'Failed to create the Canvas integration. Please try again.'
        },
        integration_update_failed: {
          title: 'Integration Update Failed',
          message: 'Failed to update the Canvas integration. Please try again.'
        },
        token_storage_failed: {
          title: 'Token Storage Failed',
          message: 'Failed to store the Canvas access token. Please try again.'
        },
        callback_processing_failed: {
          title: 'Processing Error',
          message: 'An error occurred while processing the Canvas callback. Please try again.'
        }
      }

      return {
        type: 'error',
        title: errorMessages[error]?.title || 'Connection Error',
        message: errorMessages[error]?.message || 'An unexpected error occurred. Please try again.'
      }
    }

    return null
  }

  const statusMessage = getStatusMessage()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    router.push('/auth/signin')
    return <div>Redirecting to sign in...</div>
  }

  const hasCanvasIntegration = integrations.some(i => i.provider === 'canvas')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EdMap!
          </h1>
          <p className="text-lg text-gray-600">
            Let&apos;s get you set up to connect your course systems and visualize your academic journey.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Connect Your Course Systems
            </h2>
            <p className="text-gray-600 mb-6">
              Choose the platforms you use for your courses. You can always add more later.
            </p>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              statusMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div>
                  <h3 className="font-semibold">{statusMessage.title}</h3>
                  <p className="text-sm">{statusMessage.message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Canvas */}
            <div className={`border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors ${
              hasCanvasIntegration ? 'ring-2 ring-green-500' : ''
            }`}>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-semibold">C</span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Canvas</h3>
                  {hasCanvasIntegration && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Canvas LMS to import assignments, quizzes, and events.
                </p>
                {hasCanvasIntegration ? (
                  <div className="space-y-2">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={handleCanvasConnect}
                      disabled={submitting}
                    >
                      {submitting ? 'Connecting...' : 'Reconnect Canvas'}
                    </Button>
                    <Button 
                      variant="default"
                      className="w-full"
                      onClick={handleCanvasSync}
                      disabled={syncing}
                    >
                      {syncing ? 'Syncing...' : 'Sync Canvas Data'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={handleCanvasConnect}
                    disabled={submitting}
                  >
                    {submitting ? 'Connecting...' : 'Connect Canvas'}
                  </Button>
                )}
              </div>
            </div>

            {/* Gradescope */}
            <div className={`border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors ${
              integrations.some(i => i.provider === 'gradescope') ? 'ring-2 ring-green-500' : ''
            }`}>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-semibold">G</span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Gradescope</h3>
                  {integrations.some(i => i.provider === 'gradescope') && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect to Gradescope to import assignments, grades, and course data.
                </p>
                {integrations.some(i => i.provider === 'gradescope') ? (
                  <div className="space-y-2">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowGradescopeForm(true)}
                      disabled={submitting}
                    >
                      {submitting ? 'Connecting...' : 'Reconnect Gradescope'}
                    </Button>
                    <Button 
                      variant="default"
                      className="w-full"
                      onClick={handleGradescopeSync}
                      disabled={syncing}
                    >
                      {syncing ? 'Syncing...' : 'Sync Gradescope Data'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={() => setShowGradescopeForm(true)}
                    disabled={submitting}
                  >
                    {submitting ? 'Connecting...' : 'Connect Gradescope'}
                  </Button>
                )}
              </div>
            </div>

            {/* PrairieLearn */}
            <div className={`border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors ${
              integrations.some(i => i.provider === 'prairielearn') ? 'ring-2 ring-green-500' : ''
            }`}>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-semibold">P</span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">PrairieLearn</h3>
                  {integrations.some(i => i.provider === 'prairielearn') && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect PrairieLearn for homework and assessment tracking.
                </p>
                {integrations.some(i => i.provider === 'prairielearn') ? (
                  <div className="space-y-2">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowPrairieLearnForm(true)}
                      disabled={submitting}
                    >
                      {submitting ? 'Connecting...' : 'Reconnect PrairieLearn'}
                    </Button>
                    <Button 
                      variant="default"
                      className="w-full"
                      onClick={handlePrairieLearnSync}
                      disabled={syncing}
                    >
                      {syncing ? 'Syncing...' : 'Sync PrairieLearn Data'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={() => setShowPrairieLearnForm(true)}
                    disabled={submitting}
                  >
                    {submitting ? 'Connecting...' : 'Connect PrairieLearn'}
                  </Button>
                )}
              </div>
            </div>

            {/* PrairieTest */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-semibold">T</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PrairieTest</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Track exam schedules and requirements from PrairieTest.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 font-semibold">+</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add courses and assignments manually or upload ICS files.
                </p>
                <div className="space-y-2">
                  <ManualItemForm className="w-full" />
                  <ICSImportForm className="w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Access Token Form Modal */}
          {showCanvasForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Connect Canvas</h3>
                <form onSubmit={handleCanvasTokenSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="canvasUrl">Canvas URL</Label>
                    <Input
                      id="canvasUrl"
                      type="url"
                      value={canvasUrl}
                      onChange={(e) => setCanvasUrl(e.target.value)}
                      placeholder="https://canvas.instructure.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave as default if using Canvas Instructure
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Enter your Canvas access token"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Generate this from your Canvas profile settings
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCanvasForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PrairieLearn Access Token Form Modal */}
          {showPrairieLearnForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Connect PrairieLearn</h3>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Instance:</strong> {prairieLearnUrl}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Using PrairieLearn with /pl path. If you need a different instance, please contact support.
                    </p>
                  </div>
                  <form onSubmit={handlePrairieLearnConnect} className="space-y-4">
                    <div>
                      <Label htmlFor="prairieLearnToken">Access Token</Label>
                      <Input
                        id="prairieLearnToken"
                        type="password"
                        value={prairieLearnToken}
                        onChange={(e) => setPrairieLearnToken(e.target.value)}
                        placeholder="Enter your PrairieLearn access token"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Generate this from your PrairieLearn profile settings
                      </p>
                    </div>
                    <div className="space-y-3 pt-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPrairieLearnForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="flex-1"
                        >
                          {submitting ? 'Connecting...' : 'Connect'}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrairieLearnTest}
                        disabled={submitting}
                        className="w-full"
                      >
                        Test Connection
                      </Button>
                    </div>
                  </form>
                </div>
            </div>
          )}

          {/* Gradescope Login Form Modal */}
          {showGradescopeForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Connect Gradescope</h3>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Note:</strong> This uses the unofficial Gradescope API library.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Your credentials are sent to our local API server and not stored permanently.
                  </p>
                </div>
                <form onSubmit={handleGradescopeConnect} className="space-y-4">
                  <div>
                    <Label htmlFor="gradescopeEmail">Email</Label>
                    <Input
                      id="gradescopeEmail"
                      type="email"
                      value={gradescopeEmail}
                      onChange={(e) => setGradescopeEmail(e.target.value)}
                      placeholder="Enter your Gradescope email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gradescopePassword">Password</Label>
                    <Input
                      id="gradescopePassword"
                      type="password"
                      value={gradescopePassword}
                      onChange={(e) => setGradescopePassword(e.target.value)}
                      placeholder="Enter your Gradescope password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll use this to authenticate with Gradescope
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowGradescopeForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                You can skip this step and add connections later from your dashboard.
              </p>
              <Button onClick={handleSkipOnboarding}>
                Skip & Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
