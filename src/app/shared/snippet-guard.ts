/**
 * Drift guard for the on-screen snippets.
 *
 * A snippet shown in the UI is a *copy* of the code it claims to show, so it can
 * silently stop matching — and an audience will spot that faster than we will.
 * `?raw` source imports would remove the copy entirely, but @angular/build's
 * esbuild pipeline ignores the suffix and treats the file as a module, so the
 * copy is unavoidable. This asserts the copy is honest instead.
 *
 * Comparison ignores indentation and blank lines (so reformatting doesn't break
 * the build) but requires the same lines in the same order.
 */

function significantLines(source: string): string[] {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export interface SnippetMismatch {
  /** 'absent' — the line isn't in the source at all. 'moved' — every line
   *  exists but no longer as one contiguous run, so something was inserted or
   *  reordered between them. */
  reason: 'absent' | 'moved';
  firstMissingLine: string;
  index: number;
}

/**
 * Returns null when `snippet`'s lines appear as a contiguous run inside
 * `source`, otherwise the first line that broke the match.
 */
export function findSnippetMismatch(snippet: string, source: string): SnippetMismatch | null {
  const needle = significantLines(snippet);
  const haystack = significantLines(source);

  if (needle.length === 0) {
    return { reason: 'absent', firstMissingLine: '<empty snippet>', index: 0 };
  }

  for (let start = 0; start + needle.length <= haystack.length; start++) {
    let matched = 0;
    while (matched < needle.length && haystack[start + matched] === needle[matched]) {
      matched++;
    }
    if (matched === needle.length) return null;
  }

  // Distinguish the two failure modes: a line that no longer exists (the code
  // changed) from lines that all exist but no longer adjacently (something was
  // inserted between them). Reporting the second as "not found" sends whoever
  // hits it looking for the wrong thing.
  const missing = needle.find((line) => !haystack.includes(line));
  if (missing) {
    return { reason: 'absent', firstMissingLine: missing, index: needle.indexOf(missing) };
  }

  return { reason: 'moved', firstMissingLine: needle[0], index: 0 };
}
