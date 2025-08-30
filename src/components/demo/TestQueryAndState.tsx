'use client'

import { useQuery } from '@tanstack/react-query'
import { useUIState } from '@/state/useUIState'
import { Button } from '@/components/ui/button'

// Mock API function for demo
const fetchMockData = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay
  return { message: 'Data fetched successfully!', timestamp: new Date().toISOString() }
}

export function TestQueryAndState() {
  // TanStack Query demo
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['demo'],
    queryFn: fetchMockData,
  })

  // Zustand demo
  const { sidebarOpen, toggleSidebar } = useUIState()

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">TanStack Query & Zustand Demo</h3>
      
      {/* TanStack Query test */}
      <div className="space-y-2">
        <h4 className="font-medium">TanStack Query Test:</h4>
        {isLoading && <p className="text-blue-600">Loading...</p>}
        {error && <p className="text-red-600">Error: {error.message}</p>}
        {data && (
          <div className="text-sm">
            <p><strong>Message:</strong> {data.message}</p>
            <p><strong>Timestamp:</strong> {data.timestamp}</p>
          </div>
        )}
        <Button onClick={() => refetch()} size="sm">
          Refetch Data
        </Button>
      </div>

      {/* Zustand test */}
      <div className="space-y-2">
        <h4 className="font-medium">Zustand Test:</h4>
        <p className="text-sm">Sidebar is: <strong>{sidebarOpen ? 'Open' : 'Closed'}</strong></p>
        <Button onClick={toggleSidebar} size="sm">
          Toggle Sidebar
        </Button>
      </div>
    </div>
  )
}
