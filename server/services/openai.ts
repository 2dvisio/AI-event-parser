import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ExtractedEvent {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  confidence: number;
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image. Focus on school communications, notices, flyers, or any educational content. Return only the extracted text without any additional commentary."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to extract text from image: " + error.message);
  }
}

export async function extractEventsFromText(text: string): Promise<ExtractedEvent[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting calendar events from school communications. 
          
          Analyze the provided text and extract all potential calendar events. Look for:
          - School events (field trips, science fairs, parent meetings, etc.)
          - Important dates and deadlines
          - Scheduled activities or appointments
          - Conferences or meetings
          
          For each event, provide:
          - title: Clear, descriptive title
          - description: Brief description with relevant details
          - startDate: ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
          - endDate: ISO 8601 format if duration is specified, otherwise null
          - location: If mentioned in the text
          - confidence: Score from 0-100 indicating how confident you are this is a real event
          
          Only include events with confidence > 60. If no clear dates are found, try to infer from context.
          
          Respond with JSON in this format: { "events": [array of events] }`
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"events": []}');
    return result.events || [];
  } catch (error) {
    throw new Error("Failed to extract events from text: " + error.message);
  }
}

export async function analyzeSchoolDocument(text: string): Promise<{
  events: ExtractedEvent[];
  documentType: string;
  summary: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in analyzing school communications and documents.
          
          Analyze the provided text and:
          1. Extract all calendar events (with high confidence > 60)
          2. Identify the document type (newsletter, flyer, notice, permission slip, etc.)
          3. Provide a brief summary of the document's main points
          
          For events, follow the same format as extractEventsFromText.
          
          Respond with JSON in this format:
          {
            "events": [array of events],
            "documentType": "string",
            "summary": "string"
          }`
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"events": [], "documentType": "unknown", "summary": ""}');
    return {
      events: result.events || [],
      documentType: result.documentType || "unknown",
      summary: result.summary || ""
    };
  } catch (error) {
    throw new Error("Failed to analyze school document: " + error.message);
  }
}
