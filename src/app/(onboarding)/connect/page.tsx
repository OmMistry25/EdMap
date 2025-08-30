'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getSession()
  }, [])

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

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    router.push('/auth/signin')
    return <div>Redirecting to sign in...</div>
  }

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Canvas */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-semibold">C</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Canvas</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Canvas LMS to import assignments, quizzes, and events.
                </p>
                <Button variant="outline" className="w-full">
                  Connect Canvas
                </Button>
              </div>
            </div>

            {/* Gradescope */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-semibold">G</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gradescope</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import assignments and grades from Gradescope via ICS or manual upload.
                </p>
                <Button variant="outline" className="w-full">
                  Connect Gradescope
                </Button>
              </div>
            </div>

            {/* PrairieLearn */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-semibold">P</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PrairieLearn</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect PrairieLearn for homework and assessment tracking.
                </p>
                <Button variant="outline" className="w-full">
                  Connect PrairieLearn
                </Button>
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
                <Button variant="outline" className="w-full">
                  Connect PrairieTest
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
                <Button variant="outline" className="w-full">
                  Add Manually
                </Button>
              </div>
            </div>
          </div>

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
