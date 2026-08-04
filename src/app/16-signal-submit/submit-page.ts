import { Component, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { emptyDraft } from '../shared/post-draft';
import { PublishApi } from '../shared/publish-api';
import { CodePanel } from '../shared/code-panel';
import {
  SIGNAL_SUBMIT_FORM,
  SIGNAL_SUBMIT_SUMMARY,
  SIGNAL_SUBMIT_TEMPLATE,
} from './submit-snippets';

/**
 * Step 7 — submission.
 *
 * `[formRoot]` prevents the default submit, runs the action, and marks every
 * field touched. That single attribute replaces the reactive page's
 * `#fd="ngForm"` + `fd.submitted` + `markAllAsTouched()` + the `ViewChild`
 * needed to reset `submitted` afterwards.
 *
 * A native `<button type="submit">` needs nothing else: the directive listens for
 * the form's own submit event. `ap-button` can't be that button — it renders
 * `type="button"`, and the host `type` attribute it appears to accept is taken off
 * the host and then lost, because it is forwarded through `markForCheck()` on the
 * declaring view while `ap-button`'s own view is OnPush (pinned in
 * `probe.spec.ts`). So it asks the form to submit itself.
 *
 * Note `submit()` throws if the form has no `submission.action` — which is why
 * the earlier pages, which have no action, reveal their errors with
 * `composer().markAsTouched()` instead of a real submit.
 */
@Component({
  selector: 'app-signal-submit-page',
  imports: [
    FormField,
    FormRoot,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    ChannelPicker,
    JsonPipe,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <h2>7 · Submit</h2>
      <p class="demo__intro">
        Select <strong>Instagram</strong> and submit: the server rejects it with an expired token,
        and the error lands on the channels field. Everything else publishes.
        <strong>Submit the empty form first</strong> — every field error appears at once, and
        <code>errorSummary()</code> lists them with the field each one came from.
      </p>

      @if (published) {
        <div class="banner banner--success">Scheduled ({{ published }}).</div>
      }

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

      <form [formRoot]="composer" #formEl novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
          @if (composer.channels().touched() && composer.channels().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.channels().errors()[0].message ?? 'Invalid'"
            />
          }
        </div>

        <ap-form-field>
          <label for="s7-content">Content</label>
          <textarea id="s7-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <!-- Neither button is disabled while the form is invalid: submitting is
             how you find out what is wrong. The loading input already blocks a
             second submit, because ap-button sets attr.disabled from it. -->
        <div class="actions">
          <!-- The mechanism: a plain submit button, and the form does the rest. -->
          <button type="submit">Schedule</button>

          <!-- Our design system: ap-button renders type="button" and swallows a
               host type attribute (probe.spec.ts), so it asks the form to submit
               itself instead. Same [formRoot], same submission. -->
          <ap-button [loading]="composer().submitting()" (click)="formEl.requestSubmit()">
            Schedule (ap-button)
          </ap-button>
        </div>
      </form>

      <app-code label="The whole form: state, rules, submission" [code]="formSnippet" />
      <app-code label="The template — the form submits itself" lang="html" [code]="templateSnippet" />
      <app-code label="The form-level summary" [code]="summarySnippet" />

      <p class="demo__pain demo__win">
        <strong>Four things you don't write.</strong> Submitting an empty form shows every error at
        once — <code>[formRoot]</code> marked them touched, and <code>reset()</code> marks them
        untouched again, so there is no <code>submitted</code> flag to clear by hand. The summary
        above comes from <code>errorSummary()</code>: the root's errors plus every descendant's, each
        carrying the field it belongs to — no walk over <code>form.controls</code>. The in-flight
        state is
        <code>submitting()</code>, wired straight into <code>ap-button</code>'s
        <code>loading</code>. And the server error is returned from the action, targeted at a field,
        instead of being pushed in with <code>setErrors</code> and silently wiped on the next
        keystroke.
      </p>

      <pre class="demo__state">submitting: {{ composer().submitting() }}
channel errors: {{ composer.channels().errors() | json }}</pre>
    </section>
  `,
})
export class SubmitPage {
  protected readonly formSnippet = SIGNAL_SUBMIT_FORM;
  protected readonly templateSnippet = SIGNAL_SUBMIT_TEMPLATE;
  protected readonly summarySnippet = SIGNAL_SUBMIT_SUMMARY;

  private readonly api = inject(PublishApi);

  protected published: string | null = null;

  /** Set by `onInvalid`: the summary is a submit-time affordance, not a live one. */
  protected readonly attempted = signal(false);

  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(
    this.model,
    (path) => {
      required(path.content, { message: 'Content is required' });
      validate(path.channels, ({ value }) =>
        value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
      );
    },
    {
      submission: {
        // The framework tells us the user tried and it did not pass, so a summary
        // needs one flag at the root — not a directive's `submitted`, which
        // `form.reset()` then fails to clear.
        onInvalid: () => {
          this.published = null;
          this.attempted.set(true);
        },
        action: async (f) => {
          this.attempted.set(false);
          this.published = null;
          const result = await this.api.publish(f().value());

          if (!result.ok) {
            // Target the field via the action's own argument: referencing
            // `this.composer` here would make the initializer circular.
            return [
              {
                fieldTree: result.field === 'channels' ? f.channels : f.content,
                kind: result.kind,
                message: 'This Instagram account needs reconnecting',
              },
            ];
          }

          this.published = result.id;
          return undefined;
        },
      },
    },
  );

  /**
   * `errorSummary()` is the field's own errors *plus* every descendant's, and each
   * error carries the field tree it belongs to — so naming the offending field is
   * a read, not a walk over `form.controls`. Note it ignores `touched`: it is the
   * whole truth about the form at any instant, which is why the template gates it
   * on `attempted()`.
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
}
