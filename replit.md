# SchoolSync AI - Replit Project Guide

## Overview

SchoolSync AI is a full-stack web application that uses AI to automatically extract events from school documents and add them to Google Calendar. The system allows users to upload documents (images, PDFs, text files), processes them using OpenAI's GPT-4o model to extract event information, and integrates with Google Calendar for seamless calendar management.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **TailwindCSS** with **shadcn/ui** components for styling
- **TanStack Query** for server state management and API caching
- **Wouter** for client-side routing
- Component-based architecture with reusable UI components

### Backend Architecture
- **Express.js** server with TypeScript
- **Node.js** runtime environment
- RESTful API design with organized route handlers
- Middleware for request logging and error handling
- File upload handling with **Multer**

### Database Architecture
- **PostgreSQL** database with **Drizzle ORM**
- **Neon Database** for serverless PostgreSQL hosting
- Type-safe database operations with schema validation
- Migration system for database versioning

## Key Components

### Database Schema
The application uses four main tables:
1. **users** - User authentication and Google OAuth tokens
2. **documents** - Uploaded file metadata and processing status
3. **events** - Extracted calendar events with AI confidence scores
4. **activities** - User activity log for tracking system interactions

### AI Processing Pipeline
1. **File Upload** - Supports PNG, JPG, PDF, and TXT files up to 10MB
2. **Text Extraction** - Uses OpenAI GPT-4o for OCR from images
3. **Event Extraction** - AI analyzes text to identify calendar events
4. **Confidence Scoring** - Each extracted event gets a confidence rating
5. **Manual Review** - Users can review and edit events before adding to calendar

### Google Calendar Integration
- **OAuth2** authentication flow for secure access
- **Google Calendar API** integration for event creation
- **Token refresh** mechanism for long-term access
- **Calendar selection** for organizing school events

### File Processing System
- **Multer** for handling multipart file uploads
- **File validation** for type and size restrictions
- **Temporary storage** in uploads directory
- **Async processing** with status tracking

## Data Flow

1. **User Authentication** - Google OAuth flow for calendar access
2. **Document Upload** - Files uploaded via drag-and-drop interface
3. **AI Processing** - OpenAI extracts text and identifies events
4. **Event Review** - Users review extracted events with confidence scores
5. **Calendar Integration** - Approved events added to Google Calendar
6. **Activity Tracking** - All actions logged for user transparency

## External Dependencies

### AI Services
- **OpenAI API** - GPT-4o model for text extraction and event parsing
- Requires `OPENAI_API_KEY` environment variable

### Google Services
- **Google Calendar API** - For calendar integration
- **Google OAuth2** - For user authentication
- Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Database
- **Neon Database** - Serverless PostgreSQL hosting
- Requires `DATABASE_URL` environment variable

### UI Framework
- **shadcn/ui** - Pre-built accessible components
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon library
- **React Icons** - Additional icon sets

## Deployment Strategy

### Development Environment
- **Replit** development environment with hot reload
- **Vite** dev server on port 5000
- **PostgreSQL** module for database access
- **Node.js 20** runtime

### Production Build
- **Vite** builds the frontend to `dist/public`
- **esbuild** bundles the server to `dist/index.js`
- **Express** serves static files in production
- **Autoscale** deployment target for dynamic scaling

### Environment Configuration
The application requires several environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API access
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL

## Changelog

- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.