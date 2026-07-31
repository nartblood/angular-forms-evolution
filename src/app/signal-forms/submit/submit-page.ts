import { Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import { CHANNELS, CHANNEL_LABEL, Channel, toggleChannel } from '../../shared/channel';
import { emptyDraft } from '../../shared/post-draft';
import { PublishApi } from '../../shared/publish-api';

/**
 * Step 7 — submission.
 *
 * `[formRoot]` prevents the default submit, runs the action, and marks every
 * field touched. That single attribute replaces the reactive page's
 * `#fd="ngForm"` + `fd.submitted` + `markAllAsTouched()` + the `ViewChild`
 * needed to reset `submitted` afterwards.
 */
@Component({
  selector: 'app-signal-submit-page',
  imports: [FormField, FormRoot, TextareaDirective, JsonPipe],
  template: `
    <section class="demo">
      <h2>7 · Submit</h2>
      <p class="demo__intro">
        Select <strong>Instagram</strong> and submit: the server rejects it with an expired token,
        and the error lands on the channels field. Everything else publishes.
      </p>

      @if (published) {
        <div class="banner banner--success">Scheduled ({{ published }}).</div>
      }

      <form [formRoot]="composer" novalidate>
        <div class="field">
          <label>Channels</label>
          <div class="channels">
            @for (channel of channels; track channel) {
              <button
                type="button"
                class="channel-chip"
                [class.is-selected]="model().channels.includes(channel)"
                (click)="toggle(channel)"
              >
                {{ channelLabel[channel] }}
              </button>
            }
          </div>
          @if (composer.channels().touched() && composer.channels().invalid()) {
            <span class="field__error">{{ composer.channels().errors()[0].message }}</span>
          }
        </div>

        <div class="field">
          <label for="s7-content">Content</label>
          <textarea id="s7-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <span class="field__error">{{ composer.content().errors()[0].message }}</span>
          }
        </div>

        <div class="actions">
          <button type="submit" class="primary" [disabled]="composer().submitting()">
            @if (composer().submitting()) {
              Scheduling…
            } @else {
              Schedule
            }
          </button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>Three things you don't write.</strong> Submitting on an empty form shows every
        error at once — <code>[formRoot]</code> marked them touched. The in-flight state is
        <code>submitting()</code>, not a boolean you maintain. And the server error is returned from
        the action, targeted at a field, instead of being pushed in with
        <code>setErrors</code> and then silently wiped on the next keystroke.
      </p>

      <pre class="demo__state">submitting: {{ composer().submitting() }}
channel errors: {{ composer.channels().errors() | json }}</pre>
    </section>
  `,
})
export class SubmitPage {
  private readonly api = inject(PublishApi);

  protected readonly channels = CHANNELS;
  protected readonly channelLabel = CHANNEL_LABEL;

  protected published: string | null = null;

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
        action: async (f) => {
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

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
    this.composer.channels().markAsTouched();
  }
}
