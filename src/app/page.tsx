import { Button } from "@/components/ui/button"
import { TestGraph } from "@/components/demo/TestGraph"
import { ManualItemForm } from "@/components/forms/ManualItemForm"
import { ICSImportForm } from "@/components/forms/ICSImportForm"
import { getServerSession, signOut } from "@/lib/auth"
import { getProfile } from "@/lib/db/queries"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await getServerSession()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EdMap
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Visual Academic Planner - Connect your course systems and see your semester as an interactive flowchart
          </p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    )
  }

  // Check if user has completed onboarding
  const profile = await getProfile(user.id)
  if (!profile?.onboarding_done_at) {
    redirect('/connect')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              EdMap Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Signed in as: {user.email}
              </span>
              <form action={async () => { 'use server'; await signOut() }}>
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
          
          <p className="text-lg text-gray-600 mb-8">
            Visual Academic Planner - Connect your course systems and see your semester as an interactive flowchart
          </p>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Academic Dashboard</h2>
              <div className="flex gap-2">
                <ICSImportForm />
                <ManualItemForm />
              </div>
            </div>
            
            {/* Main content */}
            <div className="space-y-6">
              <TestGraph />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
