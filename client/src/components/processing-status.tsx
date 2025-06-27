import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Activity } from "lucide-react";
import type { Document } from "@shared/schema";

export function ProcessingStatus() {
  const { data: documentsData } = useQuery({
    queryKey: ['/api/documents'],
  });

  const { data: eventsData } = useQuery({
    queryKey: ['/api/events'],
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/stats'],
  });

  const documents = documentsData?.documents || [];
  const events = eventsData?.events || [];
  const stats = statsData?.stats || { documentsProcessed: 0, eventsCreated: 0, eventsAddedToCalendar: 0 };

  const isProcessing = documents.some((doc: Document) => doc.status === 'processing');
  const processedCount = documents.filter((doc: Document) => doc.status === 'processed').length;
  const totalDocuments = documents.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Processing Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-success-green animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-500">{isProcessing ? 'Active' : 'Idle'}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Processing Steps */}
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              processedCount > 0 ? 'bg-success-green' : 'bg-gray-200'
            }`}>
              {processedCount > 0 ? (
                <Check className="text-white text-xs" />
              ) : (
                <Clock className="text-gray-400 text-xs" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Text Extraction (OCR)</p>
              <p className="text-xs text-gray-500">
                {processedCount > 0 ? `Extracted text from ${processedCount} documents` : 'Waiting for documents'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isProcessing ? 'bg-google-blue' : events.length > 0 ? 'bg-success-green' : 'bg-gray-200'
            }`}>
              {isProcessing ? (
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
              ) : events.length > 0 ? (
                <Check className="text-white text-xs" />
              ) : (
                <Clock className="text-gray-400 text-xs" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Event Detection</p>
              <p className="text-xs text-gray-500">
                {isProcessing ? 'Analyzing content for calendar events...' : 
                 events.length > 0 ? `Found ${events.length} potential events` : 'Pending text extraction'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              stats.eventsAddedToCalendar > 0 ? 'bg-success-green' : 'bg-gray-200'
            }`}>
              {stats.eventsAddedToCalendar > 0 ? (
                <Check className="text-white text-xs" />
              ) : (
                <Clock className="text-gray-400 text-xs" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${stats.eventsAddedToCalendar > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                Calendar Integration
              </p>
              <p className={`text-xs ${stats.eventsAddedToCalendar > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
                {stats.eventsAddedToCalendar > 0 ? `Added ${stats.eventsAddedToCalendar} events to calendar` : 'Pending event detection'}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
            <p className="text-xs text-gray-500">Documents</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-green">{events.length}</p>
            <p className="text-xs text-gray-500">Events Found</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-google-blue">{stats.eventsAddedToCalendar}</p>
            <p className="text-xs text-gray-500">Added to Calendar</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
