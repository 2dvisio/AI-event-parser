import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_ENV_VAR || "default_client_id";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET_ENV_VAR || "default_client_secret";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  (process.env.REPLIT_DEV_DOMAIN ? 
    `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback` : 
    "http://localhost:5000/api/auth/google/callback");

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || ''
      };
    } catch (error) {
      console.error('OAuth token exchange error:', error);
      throw new Error("Failed to get tokens: " + (error.message || 'Unknown error'));
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials.access_token!;
    } catch (error) {
      throw new Error("Failed to refresh access token: " + error.message);
    }
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: {
      title: string;
      description?: string;
      startDate: string;
      endDate?: string;
      location?: string;
    }
  ): Promise<string> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const startDateTime = new Date(event.startDate);
      
      // Check if the startDate includes specific time (has hours/minutes)
      const hasSpecificTime = event.startDate.includes('T') || 
                             event.startDate.includes(':') || 
                             /\d{1,2}:\d{2}/.test(event.startDate);
      
      let calendarEvent: any = {
        summary: event.title,
        description: event.description,
        location: event.location,
        // Add reminders: 1 day and 2 days before
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'email', minutes: 48 * 60 }, // 2 days before
            { method: 'popup', minutes: 24 * 60 }, // 1 day before (popup)
          ]
        }
      };

      if (hasSpecificTime) {
        // Timed event
        const endDateTime = event.endDate ? new Date(event.endDate) : new Date(startDateTime.getTime() + 60 * 60 * 1000);
        calendarEvent.start = {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/New_York',
        };
        calendarEvent.end = {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/New_York',
        };
      } else {
        // All-day event (no specific time extracted)
        const startDate = startDateTime.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        const endDate = event.endDate ? 
          new Date(event.endDate).toISOString().split('T')[0] : 
          new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Next day
        
        calendarEvent.start = { date: startDate };
        calendarEvent.end = { date: endDate };
      }

      const response = await calendar.events.insert({
        calendarId: calendarId || 'primary',
        requestBody: calendarEvent,
      });

      return response.data.id!;
    } catch (error) {
      throw new Error("Failed to create calendar event: " + error.message);
    }
  }

  async getUserInfo(accessToken: string): Promise<{ email: string; name: string }> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      
      const { data } = await oauth2.userinfo.get();
      return {
        email: data.email!,
        name: data.name!
      };
    } catch (error) {
      throw new Error("Failed to get user info: " + error.message);
    }
  }

  async listCalendars(accessToken: string): Promise<Array<{ id: string; name: string }>> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.calendarList.list();
      return response.data.items?.map(cal => ({
        id: cal.id!,
        name: cal.summary!
      })) || [];
    } catch (error) {
      throw new Error("Failed to list calendars: " + error.message);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
