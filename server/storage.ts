import { 
  users, documents, events, activities,
  type User, type InsertUser,
  type Document, type InsertDocument,
  type Event, type InsertEvent,
  type Activity, type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserGoogleTokens(userId: number, accessToken: string, refreshToken: string): Promise<void>;

  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  updateDocumentStatus(id: number, status: string): Promise<void>;

  // Event methods
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByUserId(userId: number): Promise<Event[]>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event>;
  updateEventStatus(id: number, status: string): Promise<Event>;

  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUserId(userId: number): Promise<Activity[]>;

  // Stats methods
  getUserStats(userId: number): Promise<{
    documentsProcessed: number;
    eventsCreated: number;
    eventsAddedToCalendar: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private events: Map<number, Event>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentDocumentId: number;
  private currentEventId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.events = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentEventId = 1;
    this.currentActivityId = 1;

    // Create a default user for testing
    this.users.set(1, {
      id: 1,
      username: "testuser",
      password: "password",
      email: "parent@email.com",
      googleAccessToken: null,
      googleRefreshToken: null,
      googleCalendarId: null
    });
    this.currentUserId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleCalendarId: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserGoogleTokens(userId: number, accessToken: string, refreshToken: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.googleAccessToken = accessToken;
      user.googleRefreshToken = refreshToken;
      this.users.set(userId, user);
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      extractedText: null,
      uploadedAt: new Date(),
      processedAt: null
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.userId === userId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error("Document not found");
    }
    const updated = { ...document, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async updateDocumentStatus(id: number, status: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.status = status;
      this.documents.set(id, document);
    }
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByUserId(userId: number): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error("Event not found");
    }
    const updated = { ...event, ...updates, updatedAt: new Date() };
    this.events.set(id, updated);
    return updated;
  }

  async updateEventStatus(id: number, status: string): Promise<Event> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error("Event not found");
    }
    event.status = status;
    event.updatedAt = new Date();
    this.events.set(id, event);
    return event;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivitiesByUserId(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // Return last 10 activities
  }

  async getUserStats(userId: number): Promise<{
    documentsProcessed: number;
    eventsCreated: number;
    eventsAddedToCalendar: number;
  }> {
    const userDocuments = Array.from(this.documents.values()).filter(doc => doc.userId === userId);
    const userEvents = Array.from(this.events.values()).filter(event => event.userId === userId);
    
    return {
      documentsProcessed: userDocuments.filter(doc => doc.status === "processed").length,
      eventsCreated: userEvents.length,
      eventsAddedToCalendar: userEvents.filter(event => event.status === "added_to_calendar").length
    };
  }
}

export const storage = new MemStorage();
