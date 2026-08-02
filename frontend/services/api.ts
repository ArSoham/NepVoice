import { API_BASE_URL } from '@/constants/api';
import { getSessionId } from '@/utils/session';

export interface ScanResult {
  id: string;
  session_id: string;
  doc_type: string;
  summary: string;
  audio_url: string | null;
  created_at: string;
}

export interface AskResult {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  audio_url: string | null;
  created_at: string;
}

export interface InsightsResult {
  total: number;
  by_type: Record<string, number>;
  overview: string | null;
  audio_url: string | null;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON error body (e.g. backend unreachable, proxy error page)
  }
  if (!response.ok) {
    const message =
      body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body?.error || 'unknown_error');
  }
  return body as T;
}

function toAbsoluteUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
}

/** Photograph a document -> OCR -> simplified Nepali summary + audio. */
export async function scanDocument(photoUri: string): Promise<ScanResult> {
  const sessionId = await getSessionId();

  const form = new FormData();
  form.append('session_id', sessionId);
  // React Native's fetch accepts this {uri, name, type} shape for file fields.
  form.append('image', {
    uri: photoUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    body: form,
    headers: {
      // Do NOT set Content-Type manually — fetch needs to set the
      // multipart boundary itself, or the backend can't parse the file part.
      Accept: 'application/json',
    },
  });

  const result = await parseJsonOrThrow<ScanResult>(response);
  return { ...result, audio_url: toAbsoluteUrl(result.audio_url) };
}

/** Ask a follow-up question via typed text, grounded in the last scanned doc. */
export async function askQuestionText(question: string): Promise<AskResult> {
  const sessionId = await getSessionId();

  const response = await fetch(`${API_BASE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question }),
  });

  const result = await parseJsonOrThrow<AskResult>(response);
  return { ...result, audio_url: toAbsoluteUrl(result.audio_url) };
}

/** Ask a follow-up question via a recorded audio clip. */
export async function askQuestionAudio(audioUri: string): Promise<AskResult> {
  const sessionId = await getSessionId();

  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('audio', {
    uri: audioUri,
    name: 'question.wav',
    type: 'audio/wav',
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/ask`, {
    method: 'POST',
    body: form,
    headers: { Accept: 'application/json' },
  });

  const result = await parseJsonOrThrow<AskResult>(response);
  return { ...result, audio_url: toAbsoluteUrl(result.audio_url) };
}

/** AI overview across everything scanned this session, plus category counts. */
export async function fetchInsights(): Promise<InsightsResult> {
  const sessionId = await getSessionId();
  const response = await fetch(
    `${API_BASE_URL}/api/insights?session_id=${encodeURIComponent(sessionId)}`,
    { headers: { Accept: 'application/json' } },
  );
  const result = await parseJsonOrThrow<InsightsResult>(response);
  return { ...result, audio_url: toAbsoluteUrl(result.audio_url) };
}

export async function fetchHistory(): Promise<ScanResult[]> {
  const sessionId = await getSessionId();
  const response = await fetch(
    `${API_BASE_URL}/api/history?session_id=${encodeURIComponent(sessionId)}`,
    { headers: { Accept: 'application/json' } },
  );
  const result = await parseJsonOrThrow<ScanResult[]>(response);
  return result.map((r) => ({ ...r, audio_url: toAbsoluteUrl(r.audio_url) }));
}
