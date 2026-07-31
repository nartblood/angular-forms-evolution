import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findSnippetMismatch } from './snippet-guard';

describe('findSnippetMismatch', () => {
  it('matches a contiguous run regardless of indentation', () => {
    const source = `
      function greet() {
        return 'hi';
      }
    `;
    expect(findSnippetMismatch(`function greet() {\n  return 'hi';\n}`, source)).toBeNull();
  });

  it('reports the line that drifted', () => {
    const source = `const limit = 280;`;
    const mismatch = findSnippetMismatch(`const limit = 2200;`, source);

    expect(mismatch?.firstMissingLine).toBe('const limit = 2200;');
  });

  it('rejects lines that exist but in the wrong order', () => {
    const source = `a();\nb();`;
    expect(findSnippetMismatch(`b();\na();`, source)).not.toBeNull();
  });

  it('can read real source files from disk', () => {
    // Proves the guard is usable against actual sources, not just strings.
    const source = readFileSync(resolve(process.cwd(), 'src/app/shared/channel.ts'), 'utf8');

    expect(
      findSnippetMismatch(
        `export function contentLimitFor(channels: readonly Channel[]): number {`,
        source,
      ),
    ).toBeNull();
  });
});
