import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form, required, validateHttp } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import { ALREADY_PUBLISHED, DUPLICATE_CHECK_URL } from '../../shared/fake-backend';
import { emptyDraft } from '../../shared/post-draft';

/**
 * Step 6 — async validation.
 *
 * `validateHttp` owns the request lifecycle: cancellation of superseded
 * requests, `pending()` state, and mapping success/error into field errors.
 * Compare with the reactive page's hand-rolled `AsyncValidatorFn` — debounce,
 * cache, `catchError`, and the `first()` that keeps the control from hanging.
 */
@Component({
  selector: 'app-signal-async-page',
  imports: [FormField, TextareaDirective, JsonPipe],
  template: `
    <section class="demo">
      <h2>6 · Async</h2>
      <p class="demo__intro">
        The server checks whether this content was already published. Type one of
        <em>{{ triggers }}</em> to see it reject (there's a deliberate 700&nbsp;ms delay).
      </p>

      <form novalidate>
        <div class="field">
          <label for="s6-content">Content</label>
          <textarea id="s6-content" apTextarea [formField]="composer.content"></textarea>

          @if (composer.content().pending()) {
            <span class="field__pending">Checking for duplicates…</span>
          }
          @if (composer.content().touched() && composer.content().invalid()) {
            <span class="field__error">{{ composer.content().errors()[0].message }}</span>
          }
        </div>

        <div class="actions">
          <button
            type="submit"
            class="primary"
            [disabled]="composer().invalid() || composer().pending()"
          >
            Schedule
          </button>
          @if (composer().pending()) {
            <span class="field__hint">waiting for validation…</span>
          }
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>No debounce, no cache, no <code>first()</code>.</strong> Returning
        <code>undefined</code> from <code>request</code> skips the call entirely, so short or empty
        input never hits the server. And <code>pending()</code> is a real signal, so gating the
        submit button needs no <code>settled()</code> helper.
      </p>

      <pre class="demo__state">pending: {{ composer().pending() }}
errors: {{ composer.content().errors() | json }}</pre>
    </section>
  `,
})
export class AsyncPage {
  protected readonly triggers = ALREADY_PUBLISHED.join('", "');

  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    validateHttp(path.content, {
      request: ({ value }) => {
        const content = value().trim();

        // Skip the round-trip entirely for input that can't be a duplicate.
        if (content.length < 5) return undefined;

        return `${DUPLICATE_CHECK_URL}?content=${encodeURIComponent(content)}`;
      },
      onSuccess: (response: { duplicate: boolean; publishedAt: string | null }) =>
        response.duplicate
          ? {
              kind: 'duplicateContent',
              message: `Already published on ${response.publishedAt}`,
            }
          : null,
      onError: () => ({
        kind: 'duplicateCheckFailed',
        message: 'Could not verify duplicates',
      }),
    });
  });
}
