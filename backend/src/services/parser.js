import fs from 'fs';
import path from 'path';

export async function parseResume(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf' || mimetype === 'application/pdf') {
    return parsePDF(filePath);
  } else if (
    ext === '.docx' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseDOCX(filePath);
  } else if (ext === '.txt' || mimetype === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
  }
}

async function parsePDF(filePath) {
  // Dynamic import to handle ES module issues with pdf-parse
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  if (!data.text || data.text.trim().length < 50) {
    throw new Error('Could not extract text from PDF. Please ensure it is not a scanned image.');
  }
  return data.text.trim();
}

async function parseDOCX(filePath) {
  const { default: mammoth } = await import('mammoth');
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  if (!result.value || result.value.trim().length < 50) {
    throw new Error('Could not extract text from DOCX file.');
  }
  return result.value.trim();
}

export function truncateResume(text, maxChars = 8000) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n[Resume truncated for processing...]';
}