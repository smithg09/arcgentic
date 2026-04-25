// ─── Citation Types & Utilities ───

import type { Source } from '@/types/agent';

export interface Citation {
  id: number;
  source_name: string;
  excerpt: string;
}

/**
 * Extract citations from a markdown string containing a ```json:citations block.
 * Returns { cleanContent, citations }.
 */
export function extractMarkdownCitations(content: string): {
  cleanContent: string;
  citations: Citation[];
} {
  const citationBlockRegex = /```json:citations\s*\n([\s\S]*?)\n\s*```/;
  const match = content.match(citationBlockRegex);

  if (!match) {
    return { cleanContent: content, citations: [] };
  }

  try {
    const citations: Citation[] = JSON.parse(match[1]);
    const cleanContent = content.replace(citationBlockRegex, '').trim();
    return { cleanContent, citations };
  } catch {
    return { cleanContent: content, citations: [] };
  }
}

/**
 * Extract citations from a parsed JSON object (podcast, flashcards, presentation).
 */
export function extractJsonCitations(data: Record<string, unknown>): Citation[] {
  const raw = data.citations;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is Citation =>
      typeof c === 'object' &&
      c !== null &&
      typeof (c as Citation).id === 'number' &&
      typeof (c as Citation).source_name === 'string' &&
      typeof (c as Citation).excerpt === 'string',
  );
}

/**
 * Replace [[cite:N]] markers in text with a placeholder for React rendering.
 * Returns an array of string parts and citation IDs.
 */
export interface CitationSegment {
  type: 'text' | 'citation';
  value: string; // text content or citation id
}

export function parseCitationMarkers(text: string): CitationSegment[] {
  const parts: CitationSegment[] = [];
  const regex = /\[\[cite:(\d+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'citation', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Find the matching Source object by citation source_name.
 */
export function findSourceByCitation(
  citation: Citation,
  sources: Source[],
): Source | undefined {
  return sources.find(
    (s) =>
      s.name === citation.source_name ||
      s.name.toLowerCase() === citation.source_name.toLowerCase(),
  );
}

/**
 * Find the character offset of an excerpt within source content.
 * Returns -1 if not found. Tries exact match first, then case-insensitive.
 */
export function findExcerptOffset(
  sourceContent: string,
  excerpt: string,
): number {
  // Exact match
  let idx = sourceContent.indexOf(excerpt);
  if (idx !== -1) return idx;

  // Case-insensitive
  idx = sourceContent.toLowerCase().indexOf(excerpt.toLowerCase());
  return idx;
}
