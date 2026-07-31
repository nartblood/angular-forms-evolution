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

  if (needle.length === 0) return { firstMissingLine: '<empty snippet>', index: 0 };

  for (let start = 0; start + needle.length <= haystack.length; start++) {
    let matched = 0;
    while (matched < needle.length && haystack[start + matched] === needle[matched]) {
      matched++;
    }
    if (matched === needle.length) return null;
  }

  // Report the line that most often failed to line up: the first one absent
  // from the source at all, or else the first line of the snippet.
  const missing = needle.find((line) => !haystack.includes(line));
  return {
    firstMissingLine: missing ?? needle[0],
    index: missing ? needle.indexOf(missing) : 0,
  };
}
