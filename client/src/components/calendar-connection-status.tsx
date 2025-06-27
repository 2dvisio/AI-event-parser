import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export function CalendarConnectionStatus() {
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      // Open OAuth in a new window to avoid iframe restrictions
      const popup = window.open(
        data.authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        // Fallback if popup is blocked
        window.location.href = data.authUrl;
        return;
      }

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Refresh the page to check if OAuth was successful
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initiate Google OAuth:', error);
    }
  };

  const isConnected = userData?.user?.googleAccessToken;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Calendar Integration</h3>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-green' : 'bg-gray-300'}`}></div>
        </div>
        
        <div className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <SiGoogle className="text-google-blue text-lg" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userData.user.email}</p>
                  <p className="text-sm text-gray-500">Connected to Google Calendar</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target Calendar:</span>
                  <span className="font-medium text-gray-900">
                    {userData.user.googleCalendarId || 'Primary Calendar'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <SiGoogle className="text-gray-400 text-lg" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Not Connected</p>
                  <p className="text-sm text-gray-500">Connect your Google Calendar</p>
                </div>
              </div>
              
              <Button 
                onClick={handleConnectGoogle}
                className="w-full bg-google-blue hover:bg-blue-700"
              >
                <SiGoogle className="mr-2 h-4 w-4" />
                Connect Google Calendar
              </Button>
            </>
          )}

          <Button 
            variant="outline" 
            className="w-full text-sm"
            disabled={!isConnected}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Calendar Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
