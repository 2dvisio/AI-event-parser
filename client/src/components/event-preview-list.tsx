import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Edit, Check, Plus, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export function EventPreviewList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['/api/events'],
  });

  const addToCalendarMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest('POST', `/api/events/${eventId}/add-to-calendar`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Event added to calendar",
        description: "The event has been successfully added to your Google Calendar",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/events/${eventId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const events = eventsData?.events || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-success-green text-white">Confirmed</Badge>;
      case 'needs_review':
        return <Badge className="bg-warning-orange text-white">Needs Review</Badge>;
      case 'added_to_calendar':
        return <Badge className="bg-google-blue text-white">Added to Calendar</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getStatusCardClass = (status: string) => {
    switch (status) {
      case 'needs_review':
        return 'border-orange-200 bg-orange-50';
      case 'added_to_calendar':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (endDate) {
      const end = new Date(endDate);
      const endTime = end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Detected Events</h2>
          <Button variant="ghost" className="text-sm text-google-blue hover:text-blue-700 font-medium">
            <Plus className="mr-1 h-4 w-4" />
            Add Manual Event
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No events detected yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload school communications to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event: Event) => (
              <div key={event.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getStatusCardClass(event.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="text-gray-400 h-4 w-4" />
                        <span>{formatDate(event.startDate.toString())}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="text-gray-400 h-4 w-4" />
                        <span>{formatTime(event.startDate.toString(), event.endDate?.toString())}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="text-gray-400 h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.status === 'needs_review' && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="text-warning-orange h-4 w-4" />
                          <span className="text-warning-orange">Requires attention</span>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-500">{event.description}</p>
                    )}
                    {event.confidence && (
                      <p className="text-xs text-gray-400">AI Confidence: {event.confidence}%</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {event.status !== 'added_to_calendar' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 ${
                          event.status === 'confirmed' 
                            ? 'text-success-green hover:bg-green-50' 
                            : 'text-warning-orange hover:bg-orange-100'
                        }`}
                        onClick={() => {
                          if (event.status === 'confirmed') {
                            addToCalendarMutation.mutate(event.id);
                          } else {
                            updateStatusMutation.mutate({ eventId: event.id, status: 'confirmed' });
                          }
                        }}
                        disabled={addToCalendarMutation.isPending}
                      >
                        {event.status === 'confirmed' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions */}
        {events.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{events.length} events detected</p>
            <div className="flex space-x-3">
              <Button variant="outline">
                Review All
              </Button>
              <Button 
                className="bg-success-green hover:bg-green-600"
                onClick={() => {
                  const confirmedEvents = events.filter((e: Event) => e.status === 'confirmed');
                  confirmedEvents.forEach((event: Event) => {
                    addToCalendarMutation.mutate(event.id);
                  });
                }}
                disabled={addToCalendarMutation.isPending}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Add Confirmed Events
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
