/**
 * Robust JSON repair for LLM-generated content.
 *
 * LLMs frequently produce invalid JSON with:
 *  - Unescaped double quotes inside string values  ("it works" → broken)
 *  - Raw newlines / tabs inside strings
 *  - Trailing commas
 *  - Smart/curly quotes (", ", ', ')
 *
 * This module provides a `safeParseJson` that tries `JSON.parse` first,
 * then falls back to progressively more aggressive repairs.
 */

/**
 * Replace smart/curly quotes with their ASCII equivalents.
 */
function normalizeQuotes(str: string): string {
  return str
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // " " „ ‟ ″ ‶ → "
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'"); // ' ' ‚ ‛ ′ ‵ → '
}

/**
 * Walk through a JSON string character-by-character and fix:
 *  1. Raw newlines/tabs inside string values  →  \\n / \\t
 *  2. Unescaped double quotes inside string values  →  \\"
 *
 * The approach: track whether we're inside a JSON string.  When inside,
 * if we encounter a `"`, peek ahead to see if the surrounding context
 * suggests it's a structural delimiter (followed by `:`, `,`, `}`, `]`
 * or preceded by start-of-value patterns).  If not, escape it.
 */
function repairJsonString(raw: string): string {
  const src = normalizeQuotes(raw.trim());
  const len = src.length;
  let out = '';
  let inString = false;
  let i = 0;

  while (i < len) {
    const ch = src[i];

    // ── Backslash escape passthrough ──
    if (ch === '\\' && inString) {
      // Keep the escape pair as-is
      out += ch;
      i++;
      if (i < len) {
        out += src[i];
        i++;
      }
      continue;
    }

    // ── Double-quote handling ──
    if (ch === '"') {
      if (!inString) {
        // Opening a string
        inString = true;
        out += ch;
        i++;
        continue;
      }

      // We're inside a string and hit a `"`.
      // Determine if this is the *closing* quote or an unescaped inner quote.
      //
      // Heuristic: look at what follows (skipping whitespace).
      // Structural closers: `,` `}` `]` `:` or EOF → it's a real closing quote.
      // Another `"` preceded by `:` or `,` → it's the close of this value, next string opening.
      const rest = src.slice(i + 1).trimStart();
      const nextChar = rest[0];

      const isStructural =
        nextChar === undefined || // EOF
        nextChar === ',' ||
        nextChar === '}' ||
        nextChar === ']' ||
        nextChar === ':';

      if (isStructural) {
        // It's the real closing quote
        inString = false;
        out += ch;
        i++;
        continue;
      }

      // Check if it looks like a new key-value boundary: "key":
      // Pattern: `"<word>":`  or  `" ` followed soon by `":`
      const kvMatch = rest.match(/^([^"]{0,50})":\s/);
      if (kvMatch) {
        // This is the closing quote of the current value,
        // and what follows is a new key.  Close the string.
        inString = false;
        out += ch;
        i++;
        continue;
      }

      // Otherwise it's an unescaped inner quote → escape it
      out += '\\"';
      i++;
      continue;
    }

    // ── Raw control characters inside strings ──
    if (inString) {
      if (ch === '\n') {
        out += '\\n';
        i++;
        continue;
      }
      if (ch === '\r') {
        i++;
        continue; // skip carriage returns
      }
      if (ch === '\t') {
        out += '\\t';
        i++;
        continue;
      }
    }

    // ── Normal character ──
    out += ch;
    i++;
  }

  return out;
}

/**
 * Remove trailing commas before `}` or `]`.
 */
function removeTrailingCommas(str: string): string {
  return str.replace(/,\s*([}\]])/g, '$1');
}

/**
 * Safely parse JSON with automatic repair for common LLM generation errors.
 *
 * Tries:
 *  1. Direct `JSON.parse` (fastest, most common)
 *  2. Smart-quote normalization + parse
 *  3. Full repair (escape inner quotes, fix newlines, trailing commas)
 *
 * Returns the parsed object or throws if nothing works.
 */
export function safeParseJson<T = unknown>(raw: string): T {
  // 1. Direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue to repairs
  }

  // 2. Quick fix: normalize smart quotes + trailing commas
  const normalized = removeTrailingCommas(normalizeQuotes(raw.trim()));
  try {
    return JSON.parse(normalized) as T;
  } catch {
    // continue to full repair
  }

  // 3. Full character-level repair
  const repaired = removeTrailingCommas(repairJsonString(raw));
  return JSON.parse(repaired) as T;
}
