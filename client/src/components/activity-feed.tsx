import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Bot, AlertTriangle, Upload, CheckCircle } from "lucide-react";
import type { Activity } from "@shared/schema";

export function ActivityFeed() {
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['/api/activities'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = activitiesData?.activities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'calendar_added':
        return <Calendar className="text-success-green text-sm" />;
      case 'process':
        return <Bot className="text-google-blue text-sm" />;
      case 'error':
        return <AlertTriangle className="text-warning-orange text-sm" />;
      case 'upload':
        return <Upload className="text-success-green text-sm" />;
      case 'google_connected':
        return <CheckCircle className="text-success-green text-sm" />;
      default:
        return <Calendar className="text-gray-400 text-sm" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'calendar_added':
        return 'bg-green-50';
      case 'process':
        return 'bg-blue-50';
      case 'error':
        return 'bg-orange-50';
      case 'upload':
        return 'bg-green-50';
      case 'google_connected':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Button variant="ghost" className="text-sm text-gray-500 hover:text-gray-700">
            View All
          </Button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Activity will appear here as you use the app</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: Activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBgColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt.toString())}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
