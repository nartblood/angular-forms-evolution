import { Component, computed, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { CodePanel } from '../shared/code-panel';
import { FieldErrorDisplay } from '../shared/field-error';
import { emptyDraft } from '../shared/post-draft';
import { maxHashtags } from '../shared/validators';
import {
  ERRORS_ATTEMPTED,
  ERRORS_BEFORE,
  ERRORS_POLICY,
  ERRORS_SUMMARY,
  ERRORS_TEMPLATE,
} from './errors-snippets';

const MIN_CONTENT_LENGTH = 30;
const MAX_HASHTAGS = 3;

/**
 * S9 — error management behind the field.
 *
 * Every step up to here repeated the same four lines of `@if` under every field.
 * This one deletes them: a field is a value, so *when* to show an error, *which*
 * error to show and *what it says* collapse into one component
 * (`shared/field-error.ts`) that every field then reuses.
 *
 * The second half is the part reactive forms has no answer for:
 * `errorSummary()` gives the whole form's errors — the field's own and every
 * descendant's — each carrying the field it belongs to, so a form-level summary
 * is a `computed`, not a manual walk over `form.controls`.
 */
@Component({
  selector: 'app-signal-errors-page',
  imports: [
    FormField,
    FormRoot,
    RouterLink,
    TextareaDirective,
    FormFieldComponent,
    ButtonComponent,
    ChannelPicker,
    CodePanel,
    FieldErrorDisplay,
  ],
  template: `
    <section class="demo">
      <span class="demo__badge demo__badge--signal">S9 · signal forms</span>
      <h2>Errors behind the field</h2>

      <a class="demo__pair-link" routerLink="/reactive">
        Compare with R9 · everything at once →
      </a>

      <p class="demo__intro">
        Same rules as before; nothing new in the schema. What changes is the
        <em>display</em>: one <code>&lt;app-field-error&gt;</code> per field instead of four lines of
        <code>&#64;if</code>, and a form-level summary derived from
        <code>errorSummary()</code>.
        <strong>Blur the empty textarea</strong>, then <strong>submit</strong>, then
        <strong>reset</strong> — one flag (<code>touched</code>) drives all three moments.
      </p>

      @if (attempted() && summary().length > 0) {
        <div class="banner banner--error">
          <strong>{{ summary().length }} problem(s) to fix:</strong>
          <ul class="error-summary">
            @for (item of summary(); track item.label + item.message) {
              <li><code>{{ item.label }}</code> — {{ item.message }}</li>
            }
          </ul>
        </div>
      }

      @if (scheduled()) {
        <div class="banner banner--success">Scheduled.</div>
      }

      <form [formRoot]="composer" #formEl novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
          <app-field-error [field]="composer.channels" />
        </div>

        <ap-form-field>
          <label for="s9-content">Content</label>
          <textarea id="s9-content" apTextarea [formField]="composer.content"></textarea>
          <!-- Two rules can fail at once — show both instead of hiding one.
               ngProjectAs puts a wrapper component into ap-form-field's
               ap-form-message slot, which matches on element name. -->
          <app-field-error
            [field]="composer.content"
            [all]="true"
            ngProjectAs="ap-form-message"
          />
        </ap-form-field>
        <span class="field__hint">
          At least {{ MIN_CONTENT_LENGTH }} characters, at most {{ MAX_HASHTAGS }} hashtags
        </span>

        <div class="actions">
          <ap-button (click)="formEl.requestSubmit()">Schedule</ap-button>
          <ap-button [config]="{ style: 'stroked', color: 'blue' }" (click)="reset()">
            Reset
          </ap-button>
        </div>
      </form>

      <app-code label="One line per field" lang="html" [code]="templateSnippet" />
      <app-code label="What it replaces — on every field, on every page" lang="html" [code]="beforeSnippet" />
      <app-code label="The policy, written once (shared/field-error.ts)" [code]="policySnippet" />
      <app-code label="“The user tried” — one flag, at the root" [code]="attemptedSnippet" />
      <app-code label="The form-level summary" [code]="summarySnippet" />

      <table class="demo__scoreboard">
        <thead>
          <tr>
            <th>Decision</th>
            <th>Inline per field</th>
            <th>One component</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Markup per field</td>
            <td>6 lines, copy-pasted</td>
            <td>1 line</td>
          </tr>
          <tr>
            <td>When to reveal</td>
            <td>restated per field, drifts</td>
            <td>one rule, one place</td>
          </tr>
          <tr>
            <td>Missing copy</td>
            <td><code>?? 'Invalid'</code> silently</td>
            <td>falls back to the translation key — visible</td>
          </tr>
          <tr>
            <td>Form-level summary</td>
            <td>walk the controls by hand</td>
            <td><code>errorSummary()</code></td>
          </tr>
        </tbody>
      </table>

      <p class="demo__pain demo__win">
        <strong>One flag for both moments.</strong> <code>touched()</code> is set on blur by the
        control, and <code>[formRoot]</code>'s submit calls <code>markAsTouched()</code>, which
        cascades to every field — so submitting reveals everything with the same condition. And
        <code>reset()</code> marks the tree untouched again, so the errors go away. Reactive forms
        needs <code>#fd="ngForm"</code> plus <code>fd.submitted</code> for the submit half, and
        <code>form.reset()</code> famously leaves <code>submitted</code> stuck at <code>true</code>.
      </p>

      <p class="demo__pain">
        <strong>Two things to decide yourself.</strong> <code>errorSummary()</code> ignores
        <code>touched</code> — it is the whole truth about the form at any instant — so a summary
        needs a "the user actually tried" flag; here that is <code>onInvalid</code>, one line at the
        root rather than one per field. And the label in the summary comes from
        <code>keyInParent()</code>, a property name, not a human label: map it to a translation key
        before shipping this to users.
      </p>

      <pre class="demo__state">attempted: {{ attempted() }}
content touched: {{ composer.content().touched() }} · errors: {{ composer.content().errors().length }}
errorSummary(): {{ summary().length }}</pre>
    </section>
  `,
})
export class ErrorsPage {
  protected readonly templateSnippet = ERRORS_TEMPLATE;
  protected readonly beforeSnippet = ERRORS_BEFORE;
  protected readonly policySnippet = ERRORS_POLICY;
  protected readonly attemptedSnippet = ERRORS_ATTEMPTED;
  protected readonly summarySnippet = ERRORS_SUMMARY;

  protected readonly MIN_CONTENT_LENGTH = MIN_CONTENT_LENGTH;
  protected readonly MAX_HASHTAGS = MAX_HASHTAGS;

  protected readonly model = signal(emptyDraft());

  /** Set by `onInvalid` — the summary is a submit-time affordance, not a live one. */
  protected readonly attempted = signal(false);
  protected readonly scheduled = signal(false);

  protected readonly composer = form(
    this.model,
    (path) => {
      // Two message sources on purpose: these emit a `kind` for the view to
      // translate, `maxHashtags` carries its own copy. The display handles both.
      required(path.content);
      minLength(path.content, MIN_CONTENT_LENGTH);
      maxHashtags(path.content, MAX_HASHTAGS);

      validate(path.channels, ({ value }) => (value().length === 0 ? { kind: 'noChannels' } : null));
    },
    {
      submission: {
        action: async () => {
          this.attempted.set(false);
          this.scheduled.set(true);
          return undefined;
        },
        // The framework tells us the user tried and it did not pass — no need to
        // reach for a directive's `submitted` flag.
        onInvalid: () => {
          this.scheduled.set(false);
          this.attempted.set(true);
        },
      },
    },
  );

  /**
   * `errorSummary()` is the field's own errors *plus* every descendant's, and each
   * error carries the field tree it belongs to — so naming the offending field is
   * a read, not a walk over `form.controls`.
   */
  protected readonly summary = computed(() =>
    this.composer()
      .errorSummary()
      .map((error) => ({
        label: String(error.fieldTree().keyInParent()),
        message: error.message ?? error.kind,
      })),
  );

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
    this.composer.channels().markAsTouched();
  }

  protected reset(): void {
    this.attempted.set(false);
    this.scheduled.set(false);
    this.composer().reset(emptyDraft());
  }
}
