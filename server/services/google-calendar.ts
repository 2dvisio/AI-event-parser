import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_ENV_VAR || "default_client_id";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET_ENV_VAR || "default_client_secret";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback";

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
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!
      };
    } catch (error) {
      throw new Error("Failed to get tokens: " + error.message);
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
      const endDateTime = event.endDate ? new Date(event.endDate) : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      const calendarEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/New_York', // Default timezone, should be configurable
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
      };

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
