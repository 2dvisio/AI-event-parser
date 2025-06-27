import { FileUploadZone } from "@/components/file-upload-zone";
import { ProcessingStatus } from "@/components/processing-status";
import { EventPreviewList } from "@/components/event-preview-list";
import { CalendarConnectionStatus } from "@/components/calendar-connection-status";
import { ActivityFeed } from "@/components/activity-feed";
import { QuickStats } from "@/components/quick-stats";
import { Calendar, Settings } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-google-blue rounded-lg flex items-center justify-center">
                <Calendar className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">SchoolSync AI</h1>
                <p className="text-sm text-gray-500">Smart Calendar Integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-success-green rounded-full"></div>
                <span>Connected to Google Calendar</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Upload & Processing */}
          <div className="lg:col-span-2 space-y-6">
            <FileUploadZone />
            <ProcessingStatus />
            <EventPreviewList />
          </div>

          {/* Right Column - Calendar Integration & Activity */}
          <div className="space-y-6">
            <CalendarConnectionStatus />
            <ActivityFeed />
            <QuickStats />
          </div>
        </div>
      </main>
    </div>
  );
}
