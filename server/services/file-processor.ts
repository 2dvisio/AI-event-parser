import fs from 'fs';
import path from 'path';
import { extractTextFromImage, analyzeSchoolDocument } from './openai.js';

export async function processUploadedFile(filePath: string, mimeType: string): Promise<{
  extractedText: string;
  documentType: string;
  summary: string;
}> {
  try {
    let extractedText = '';

    if (mimeType.startsWith('image/')) {
      // Process image files
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      extractedText = await extractTextFromImage(base64Image);
    } else if (mimeType === 'text/plain') {
      // Process text files
      extractedText = fs.readFileSync(filePath, 'utf-8');
    } else if (mimeType === 'application/pdf') {
      // For PDF processing, we would need a PDF parsing library
      // For now, return a placeholder - in production, use pdf-parse or similar
      throw new Error('PDF processing not implemented yet. Please convert to image or text format.');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the file');
    }

    // Analyze the extracted text
    const analysis = await analyzeSchoolDocument(extractedText);

    return {
      extractedText,
      documentType: analysis.documentType,
      summary: analysis.summary
    };
  } catch (error) {
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain',
    'application/pdf'
  ];
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}
