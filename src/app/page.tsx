import { Button } from "@/components/ui/button"
import { TestQueryAndState } from "@/components/demo/TestQueryAndState"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EdMap Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Visual Academic Planner - Connect your course systems and see your semester as an interactive flowchart
          </p>
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-500 mb-4">
              Dashboard placeholder - Course connections and graph will appear here
            </p>
            <Button className="mb-6">Test shadcn/ui Button</Button>
            
            {/* Demo component for TanStack Query and Zustand */}
            <TestQueryAndState />
          </div>
        </div>
      </div>
    </div>
  );
}
