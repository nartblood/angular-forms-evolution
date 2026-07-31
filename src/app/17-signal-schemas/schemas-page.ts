import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { emptyDraft, emptyMediaItem, existingDraft } from '../shared/post-draft';
import { composerSchema } from './composer-schema';

/**
 * Step 8 — every rule extracted, and the whole form is one line.
 *
 * This page also demonstrates loading existing data, which is where the reactive
 * version needs `patchValue({emitEvent: false})`, an array rebuild, and a manual
 * replay of every conditional rule.
 */
@Component({
  selector: 'app-signal-schemas-page',
  imports: [
    FormField,
    InputDirective,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    RadioComponent,
    ChannelPicker,
    JsonPipe,
  ],
  template: `
    <section class="demo">
      <h2>8 · Schemas</h2>
      <p class="demo__intro">
        All the rules now live in <code>composer-schema.ts</code>, and this component declares the
        form in a single line. Press <em>Load existing draft</em> and watch the derived state arrive
        already correct.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
          @if (composer.channels().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.channels().errors()[0].message ?? 'Invalid'"
            />
          }
        </div>

        <ap-form-field>
          <label for="s8-content">Content</label>
          <textarea id="s8-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <div class="field">
          <label>When</label>
          <div class="radio-row">
            <ap-radio radioId="s8-now" value="now" [formField]="composer.publishMode">Now</ap-radio>
            <ap-radio radioId="s8-scheduled" value="scheduled" [formField]="composer.publishMode">
              Schedule
            </ap-radio>
          </div>
        </div>

        @if (model().publishMode === 'scheduled') {
          <ap-form-field>
            <label for="s8-scheduledAt">Publish at</label>
            <input
              id="s8-scheduledAt"
              type="datetime-local"
              apInput
              [formField]="composer.scheduledAt"
            />
            @if (composer.scheduledAt().touched() && composer.scheduledAt().invalid()) {
              <ap-form-message
                messageType="error"
                [message]="composer.scheduledAt().errors()[0].message ?? 'Invalid'"
              />
            }
          </ap-form-field>
        }

        <div class="field">
          <label>Media</label>
          @for (item of composer.media; track $index) {
            <div class="media-row">
              <ap-form-field>
                <input apInput placeholder="https://…" [formField]="item.url" />
              </ap-form-field>
              <ap-form-field>
                <input apInput placeholder="Alt text" [formField]="item.altText" />
              </ap-form-field>
              <ap-button
                [config]="{ style: 'stroked', color: 'red' }"
                (click)="removeMedia($index)"
              >
                Remove
              </ap-button>
            </div>
          }
          @if (composer.media().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.media().errors()[0].message ?? 'Invalid'"
            />
          }
          <ap-button [config]="{ style: 'stroked', color: 'grey' }" (click)="addMedia()">
            Add media
          </ap-button>
        </div>

        <ap-form-field>
          <label for="s8-firstComment">First comment</label>
          <input id="s8-firstComment" apInput [formField]="composer.firstComment" />
          @if (composer.firstComment().touched() && composer.firstComment().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.firstComment().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">Schedule</ap-button>
          <ap-button [config]="{ style: 'stroked', color: 'blue' }" (click)="loadExisting()">
            Load existing draft
          </ap-button>
          <ap-button [config]="{ style: 'stroked', color: 'grey' }" (click)="reset()">
            Reset
          </ap-button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>Loading is one assignment.</strong> <code>model.set(draft)</code> — no event
        suppression, no array rebuild, no rule replay. Every conditional rule is derived, so the
        loaded draft is validated correctly the moment it arrives.
      </p>

      <pre class="demo__state">valid: {{ composer().valid() }}
{{ model() | json }}</pre>
    </section>
  `,
})
export class SchemasPage {
  protected readonly model = signal(emptyDraft());

  /** Every rule, applied. */
  protected readonly composer = form(this.model, composerSchema);

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
  }

  protected addMedia(): void {
    this.model.update((draft) => ({ ...draft, media: [...draft.media, emptyMediaItem()] }));
  }

  protected removeMedia(index: number): void {
    this.model.update((draft) => ({
      ...draft,
      media: draft.media.filter((_, i) => i !== index),
    }));
  }

  protected loadExisting(): void {
    this.model.set(existingDraft());
  }

  protected reset(): void {
    this.composer().reset(emptyDraft());
  }
}
