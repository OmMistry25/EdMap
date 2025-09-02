'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Link, FileText } from 'lucide-react'

interface ICSImportFormProps {
  className?: string
}

export function ICSImportForm({ className = '' }: ICSImportFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    sourceName: '',
    url: '',
    file: null as File | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('sourceName', formData.sourceName || 'ICS Import')
      
      if (importMethod === 'file' && formData.file) {
        data.append('file', formData.file)
      } else if (importMethod === 'url' && formData.url) {
        data.append('url', formData.url)
      } else {
        alert('Please provide either a file or URL')
        setSubmitting(false)
        return
      }

      const response = await fetch('/api/integrations/ical', {
        method: 'POST',
        body: data
      })

      const result = await response.json()

      if (response.ok) {
        // Reset form
        setFormData({
          sourceName: '',
          url: '',
          file: null
        })
        setShowForm(false)
        
        // Show success message with stats
        alert(`ICS import completed successfully!\n\nStats:\n- ${result.stats.itemsCreated} items created\n- ${result.stats.itemsSkipped} items skipped\n- ${result.stats.totalEvents} total events processed`)
        
        // Refresh the page to show new items
        window.location.reload()
      } else {
        console.error('ICS import failed:', result.error)
        alert(`Import failed: ${result.error}`)
      }
    } catch (error) {
      console.error('ICS import error:', error)
      alert('Import failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className={className}>
      {!showForm ? (
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import ICS
        </Button>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Import ICS Calendar</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sourceName">Source Name</Label>
                <Input
                  id="sourceName"
                  value={formData.sourceName}
                  onChange={(e) => handleInputChange('sourceName', e.target.value)}
                  placeholder="e.g., Gradescope, Course Calendar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be the name of the source in your graph
                </p>
              </div>

              <div>
                <Label>Import Method</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={importMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setImportMethod('file')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    File Upload
                  </Button>
                  <Button
                    type="button"
                    variant={importMethod === 'url' ? 'default' : 'outline'}
                    onClick={() => setImportMethod('url')}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    URL Import
                  </Button>
                </div>
              </div>

              {importMethod === 'file' ? (
                <div>
                  <Label htmlFor="file">ICS File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".ics"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload an .ics calendar file
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="url">Calendar URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="https://example.com/calendar.ics"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the URL of an ICS calendar feed
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2">What gets imported:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Calendar events with titles become items</li>
                  <li>• Event types are auto-detected (assignment, quiz, exam, etc.)</li>
                  <li>• Due dates are set from event end times</li>
                  <li>• Duplicate events are automatically skipped</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Importing...' : 'Import Calendar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
