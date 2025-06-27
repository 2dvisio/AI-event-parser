import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, Clock } from "lucide-react";

export function QuickStats() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = statsData?.stats || {
    documentsProcessed: 0,
    eventsCreated: 0,
    eventsAddedToCalendar: 0
  };

  // Calculate estimated time saved (assuming 5 minutes per manual event entry)
  const timeSaved = (stats.eventsAddedToCalendar * 5) / 60; // Convert minutes to hours

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <FileText className="text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{stats.documentsProcessed}</p>
                <p className="text-sm text-gray-500">Documents Processed</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="text-google-blue" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{stats.eventsCreated}</p>
                <p className="text-sm text-gray-500">Events Created</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Clock className="text-success-green" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{timeSaved.toFixed(1)} hrs</p>
                <p className="text-sm text-gray-500">Time Saved</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
