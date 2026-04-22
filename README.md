# SchoolSync AI

![SchoolSync AI Banner](attached_assets/schoolsync-banner.png)

SchoolSync AI is a full-stack web application that uses AI to automatically extract events from school communications (images, screenshots, PDFs, text files) and add them to your Google Calendar.

## Features

- **Smart Document Processing** — Upload images, PDFs, or text files and let AI extract calendar events automatically
- **AI-Powered Extraction** — Uses OpenAI GPT-4o for OCR and event detection with confidence scoring
- **Google Calendar Integration** — Seamlessly add extracted events to your Google Calendar via OAuth2
- **Smart Event Handling** — Automatically detects all-day events vs. timed events based on the source content
- **Automatic Reminders** — Every event gets email reminders 1 day and 2 days before, plus a popup reminder 1 day before
- **Activity Tracking** — Real-time activity feed and dashboard with processing stats
- **Manual Review** — Review and edit extracted events before adding them to your calendar

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **TailwindCSS** + **shadcn/ui** for styling
- **TanStack Query** for server state management
- **Wouter** for routing
- **react-hook-form** + **zod** for form validation

### Backend
- **Express.js** with TypeScript on Node.js 20
- **Multer** for file upload handling
- **OpenAI API** (GPT-4o) for OCR and event extraction
- **Google Calendar API** with OAuth2 authentication
- **Drizzle ORM** with type-safe schemas

## Getting Started

### Prerequisites

You'll need API credentials from:
- [OpenAI](https://platform.openai.com/api-keys) — for AI processing
- [Google Cloud Console](https://console.cloud.google.com/) — for Calendar integration

### Environment Variables

Set the following secrets in your environment:

```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Google Cloud Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Calendar API**
3. Create **OAuth 2.0 credentials**
4. Add your domain to **Authorized JavaScript Origins**
5. Add `https://your-domain/api/auth/google/callback` to **Authorized Redirect URIs**
6. Add test users in the OAuth consent screen during development

### Installation

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5000`.

## How It Works

1. **Upload** — Drag and drop a school document (image, PDF, or text file)
2. **Process** — AI extracts text via OCR and identifies calendar events
3. **Review** — Preview extracted events with confidence scores
4. **Sync** — Add approved events to your Google Calendar with automatic reminders

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   └── lib/         # Utilities and query client
├── server/              # Express backend
│   ├── services/        # OpenAI and Google Calendar services
│   ├── routes.ts        # API endpoints
│   └── storage.ts       # Data storage interface
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema and Zod validators
└── uploads/             # Temporary file storage
```

## Supported File Types

- Images: PNG, JPG (processed with vision OCR)
- Documents: PDF, TXT
- Maximum size: 10 MB per file

## License

MIT
