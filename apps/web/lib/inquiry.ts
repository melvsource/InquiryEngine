// apps/web/lib/inquiry.ts
// Library-first workflow:
// 1. Fuzzy search Supabase for existing report
// 2. If found and fresh (< 30 days) → return instantly
// 3. If not found or stale → call Worker → save/overwrite to Supabase

import { createClient } from '@supabase/supabase-js';

const WORKER_URL = 'https://inquiry-engine.melvmentum.workers.dev';
const REFRESH_DAYS = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface InquirySection {
  id: string;
  label: string;
  content: string;
}

export interface InquiryReport {
  subject: string;
  objective: string;
  sections: InquirySection[];
}

export type ReportSource = 'library' | 'fresh';

export interface InquiryResult {
  report: InquiryReport;
  source: ReportSource;
  savedAt?: string;
}

// Normalize subject to a slug for matching
function toSlug(subject: string): string {
  return subject
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');
}

// Check if a date is older than REFRESH_DAYS
function isStale(dateStr: string): boolean {
  const saved = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - saved.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > REFRESH_DAYS;
}

// Fuzzy search Supabase for an existing report
async function searchLibrary(subject: string): Promise<{ id: string; report: InquiryReport; updated_at: string } | null> {
  try {
    const slug = toSlug(subject);
    const { data: exactMatch } = await supabase
      .from('reports')
      .select('id, report, updated_at')
      .eq('subject_slug', slug)
      .single();

    if (exactMatch) return exactMatch;

    const { data: fuzzyMatches } = await supabase
      .from('reports')
      .select('id, report, updated_at, subject')
      .textSearch('subject', subject, {
        type: 'websearch',
        config: 'english',
      })
      .limit(1);

    if (fuzzyMatches && fuzzyMatches.length > 0) {
      return fuzzyMatches[0];
    }

    return null;
  } catch {
    return null;
  }
}

// Save or overwrite report in Supabase
async function saveToLibrary(subject: string, report: InquiryReport): Promise<void> {
  const slug = toSlug(subject);
  try {
    await supabase
      .from('reports')
      .upsert(
        {
          subject: subject.trim(),
          subject_slug: slug,
          report: report,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subject_slug' }
      );
  } catch {
    console.error('Failed to save report to library');
  }
}

// ── Result Mapper ─────────────────────────────────────────────────────────────
// Maps raw Worker response to InquiryReport shape.
// This is the critical translation layer between InquiryEngine-Core and the UI.
function mapWorkerResponse(raw: unknown): InquiryReport {
  // Handle string input (if Worker returns stringified JSON)
  let data: Record<string, unknown>;
  if (typeof raw === 'string') {
    const clean = (raw as string)
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    data = JSON.parse(clean);
  } else {
    data = raw as Record<string, unknown>;
  }

  // Validate required fields
  if (!data.subject || !Array.isArray(data.sections)) {
    throw new Error('The engine returned an incomplete report. Please try again.');
  }

  // Map sections
  const sections: InquirySection[] = (data.sections as Array<Record<string, unknown>>).map((s) => ({
    id: String(s.id ?? ''),
    label: String(s.label ?? ''),
    content: String(s.content ?? ''),
  }));

  return {
    subject: String(data.subject),
    objective: String(data.objective ?? ''),
    sections,
  };
}

// Call the Cloudflare Worker for a fresh inquiry
async function fetchFromWorker(subject: string): Promise<InquiryReport> {
  let response: Response;
  try {
    response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject.trim() }),
    });
  } catch {
    throw new Error('Could not reach the Inquiry Engine. Please check your connection and try again.');
  }

  // Read as text first to handle any encoding issues
  const text = await response.text();

  // Handle Worker-level errors
  if (!response.ok) {
    try {
      const errData = JSON.parse(text);
      throw new Error(errData?.error?.message || `Investigation failed (${response.status}). Please try again.`);
    } catch {
      throw new Error(`Investigation failed (${response.status}). Please try again.`);
    }
  }

  // Clean and parse
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('The engine returned an unexpected format. Please try again.');
  }

  // Map through Result Mapper
  return mapWorkerResponse(parsed);
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function runInquiry(subject: string): Promise<InquiryResult> {
  if (!subject || subject.trim().length === 0) {
    throw new Error('Please enter a subject to investigate.');
  }
  if (subject.trim().length > 1000) {
    throw new Error('Subject must be under 1000 characters.');
  }

  // Step 1: Check library first
  const existing = await searchLibrary(subject);
  if (existing && !isStale(existing.updated_at)) {
    return {
      report: existing.report,
      source: 'library',
      savedAt: existing.updated_at,
    };
  }

  // Step 2: Call Worker for fresh report
  const report = await fetchFromWorker(subject);

  // Step 3: Save to library (non-blocking)
  saveToLibrary(subject, report);

  return {
    report,
    source: 'fresh',
    savedAt: new Date().toISOString(),
  };
}
