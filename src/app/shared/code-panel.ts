import { Component, inject, input, resource } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { CodeHighlighter, CodeLang } from './code-highlighter';

/**
 * Shows the snippet that makes each page work, next to the running form.
 *
 * Renders unhighlighted immediately and upgrades once Shiki has loaded, so a
 * demo is never blocked on the highlighter — and a projector that chokes on the
 * WASM load still shows readable code.
 *
 * `bypassSecurityTrustHtml` is safe here: the input is always a literal string
 * from a `*.snippets.ts` file in this repo, never user data. Angular's sanitizer
 * would otherwise strip the inline styles Shiki uses for colours.
 */
@Component({
  selector: 'app-code',
  template: `
    @if (label()) {
      <p class="code__label">{{ label() }}</p>
    }

    @if (highlighted.value(); as markup) {
      <div class="code" [innerHTML]="markup"></div>
    } @else {
      <pre class="code code--plain"><code>{{ code() }}</code></pre>
    }
  `,
  styles: `
    :host {
      display: block;
      margin: 1rem 0 1.5rem;
    }

    .code__label {
      margin: 0 0 0.35rem;
      color: #6b7280;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .code {
      overflow-x: auto;
      border: 1px solid rgb(0 0 0 / 10%);
      border-radius: 8px;
      font-size: 0.8125rem;
      line-height: 1.55;
    }

    .code ::ng-deep pre,
    .code--plain {
      margin: 0;
      padding: 0.85rem 1rem;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      tab-size: 2;
    }

    .code--plain {
      background: #f6f8fa;
      color: #24292f;
      white-space: pre;
    }
  `,
})
export class CodePanel {
  readonly code = input.required<string>();
  readonly lang = input<CodeLang>('typescript');
  readonly label = input<string>();

  private readonly highlighter = inject(CodeHighlighter);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly highlighted = resource({
    params: () => ({ code: this.code(), lang: this.lang() }),
    loader: async ({ params }) => {
      const html = await this.highlighter.highlight(params.code, params.lang);
      return this.sanitizer.bypassSecurityTrustHtml(html);
    },
  });
}
