import { Injectable } from '@angular/core';
import type { Highlighter } from 'shiki';

export type CodeLang = 'typescript' | 'html';

/**
 * Shiki, loaded lazily.
 *
 * The dynamic `import()` keeps ~1 MB of grammars and themes out of the initial
 * bundle — it only arrives when a page actually shows code. Shiki is the engine
 * VS Code uses, so snippets on screen match what the audience sees in an editor.
 */
@Injectable({ providedIn: 'root' })
export class CodeHighlighter {
  private highlighter?: Promise<Highlighter>;

  private load(): Promise<Highlighter> {
    this.highlighter ??= import('shiki').then((shiki) =>
      shiki.createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['typescript', 'html'],
      }),
    );
    return this.highlighter;
  }

  async highlight(code: string, lang: CodeLang): Promise<string> {
    const highlighter = await this.load();
    return highlighter.codeToHtml(code, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark' },
    });
  }
}
