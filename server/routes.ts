import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage.js";
import { processUploadedFile, validateFileType, validateFileSize } from "./services/file-processor.js";
import { extractEventsFromText } from "./services/openai.js";
import { googleCalendarService } from "./services/google-calendar.js";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (validateFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, PDF, and TXT files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const userId = 1; // TODO: Get from session/auth
      const uploadedDocuments = [];

      for (const file of req.files as Express.Multer.File[]) {
        // Validate file size
        if (!validateFileSize(file.size)) {
          return res.status(400).json({ message: `File ${file.originalname} is too large` });
        }

        // Create document record
        const document = await storage.createDocument({
          userId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          status: "uploaded"
        });

        uploadedDocuments.push(document);

        // Log activity
        await storage.createActivity({
          userId,
          type: "upload",
          description: `Uploaded "${file.originalname}"`,
          metadata: { documentId: document.id, fileSize: file.size }
        });

        // Process file asynchronously
        processFileAsync(document.id, file.path, file.mimetype);
      }

      res.json({ documents: uploadedDocuments });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get documents for user
  app.get("/api/documents", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const documents = await storage.getDocumentsByUserId(userId);
      res.json({ documents });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get events for user
  app.get("/api/events", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const events = await storage.getEventsByUserId(userId);
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update event status
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { status } = req.body;
      
      const event = await storage.updateEventStatus(eventId, status);
      res.json({ event });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add event to Google Calendar
  app.post("/api/events/:id/add-to-calendar", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = 1; // TODO: Get from session/auth
      
      const event = await storage.getEvent(eventId);
      const user = await storage.getUser(userId);
      
      if (!event || !user) {
        return res.status(404).json({ message: "Event or user not found" });
      }

      if (!user.googleAccessToken) {
        return res.status(400).json({ message: "Google Calendar not connected" });
      }

      const googleEventId = await googleCalendarService.createEvent(
        user.googleAccessToken,
        user.googleCalendarId || 'primary',
        {
          title: event.title,
          description: event.description,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate?.toISOString(),
          location: event.location
        }
      );

      await storage.updateEvent(eventId, {
        status: "added_to_calendar",
        googleEventId
      });

      await storage.createActivity({
        userId,
        type: "calendar_added",
        description: `Added "${event.title}" to Google Calendar`,
        metadata: { eventId, googleEventId }
      });

      res.json({ success: true, googleEventId });
    } catch (error) {
      console.error("Calendar error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Google OAuth flow
  app.get("/api/auth/google", (req, res) => {
    const authUrl = googleCalendarService.getAuthUrl();
    res.json({ authUrl });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: "No authorization code provided" });
      }

      const tokens = await googleCalendarService.getTokens(code as string);
      const userInfo = await googleCalendarService.getUserInfo(tokens.accessToken);
      
      const userId = 1; // TODO: Get from session/auth
      await storage.updateUserGoogleTokens(userId, tokens.accessToken, tokens.refreshToken);

      await storage.createActivity({
        userId,
        type: "google_connected",
        description: "Connected to Google Calendar",
        metadata: { email: userInfo.email }
      });

      // Redirect to frontend with success
      res.redirect('/?connected=true');
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Get user activities
  app.get("/api/activities", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const activities = await storage.getActivitiesByUserId(userId);
      res.json({ activities });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user stats
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const stats = await storage.getUserStats(userId);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Async file processing function
async function processFileAsync(documentId: number, filePath: string, mimeType: string) {
  try {
    // Update status to processing
    await storage.updateDocumentStatus(documentId, "processing");

    // Process the file
    const result = await processUploadedFile(filePath, mimeType);
    
    // Update document with extracted text
    await storage.updateDocument(documentId, {
      status: "processed",
      extractedText: result.extractedText,
      processedAt: new Date()
    });

    // Extract events from the text
    const extractedEvents = await extractEventsFromText(result.extractedText);
    
    // Create event records
    for (const eventData of extractedEvents) {
      await storage.createEvent({
        userId: 1, // TODO: Get from document
        documentId,
        title: eventData.title,
        description: eventData.description,
        startDate: new Date(eventData.startDate),
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        location: eventData.location,
        confidence: eventData.confidence,
        extractedData: eventData,
        status: eventData.confidence > 80 ? "confirmed" : "needs_review"
      });
    }

    // Log processing completion
    await storage.createActivity({
      userId: 1,
      type: "process",
      description: `Processed document and found ${extractedEvents.length} events`,
      metadata: { documentId, eventsFound: extractedEvents.length }
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("File processing error:", error);
    await storage.updateDocumentStatus(documentId, "error");
    
    // Log error
    await storage.createActivity({
      userId: 1,
      type: "error",
      description: `Failed to process document: ${error.message}`,
      metadata: { documentId, error: error.message }
    });
  }
}
