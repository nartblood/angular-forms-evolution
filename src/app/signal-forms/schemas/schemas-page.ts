import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, form } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import { CHANNELS, CHANNEL_LABEL, Channel, toggleChannel } from '../../shared/channel';
import { emptyDraft, emptyMediaItem, existingDraft } from '../../shared/post-draft';
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
  imports: [FormField, InputDirective, TextareaDirective, JsonPipe],
  template: `
    <section class="demo">
      <h2>8 · Schemas</h2>
      <p class="demo__intro">
        All eight rules now live in <code>composer-schema.ts</code>, and this component declares
        the form in a single line. Press <em>Load existing draft</em> and watch the derived state
        arrive already correct.
      </p>

      <form novalidate>
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
          @if (composer.channels().invalid()) {
            <span class="field__error">{{ composer.channels().errors()[0].message }}</span>
          }
        </div>

        <div class="field">
          <label for="s8-content">Content</label>
          <textarea id="s8-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <span class="field__error">{{ composer.content().errors()[0].message }}</span>
          }
        </div>

        <div class="field">
          <label>When</label>
          <div class="radio-row">
            <label>
              <input type="radio" value="now" [formField]="composer.publishMode" /> Now
            </label>
            <label>
              <input type="radio" value="scheduled" [formField]="composer.publishMode" /> Schedule
            </label>
          </div>
        </div>

        @if (model().publishMode === 'scheduled') {
          <div class="field">
            <label for="s8-scheduledAt">Publish at</label>
            <input
              id="s8-scheduledAt"
              type="datetime-local"
              apInput
              [formField]="composer.scheduledAt"
            />
            @if (composer.scheduledAt().touched() && composer.scheduledAt().invalid()) {
              <span class="field__error">{{ composer.scheduledAt().errors()[0].message }}</span>
            }
          </div>
        }

        <div class="field">
          <label>Media</label>
          @for (item of composer.media; track $index) {
            <div class="media-row">
              <input apInput placeholder="https://…" [formField]="item.url" />
              <input apInput placeholder="Alt text" [formField]="item.altText" />
              <button type="button" class="ghost" (click)="removeMedia($index)">Remove</button>
            </div>
          }
          @if (composer.media().invalid()) {
            <span class="field__error">{{ composer.media().errors()[0].message }}</span>
          }
          <button type="button" class="ghost" (click)="addMedia()">Add media</button>
        </div>

        <div class="field">
          <label for="s8-firstComment">First comment</label>
          <input id="s8-firstComment" apInput [formField]="composer.firstComment" />
          @if (composer.firstComment().touched() && composer.firstComment().invalid()) {
            <span class="field__error">{{ composer.firstComment().errors()[0].message }}</span>
          }
        </div>

        <div class="actions">
          <button type="submit" class="primary" [disabled]="composer().invalid()">Schedule</button>
          <button type="button" class="ghost" (click)="loadExisting()">Load existing draft</button>
          <button type="button" class="ghost" (click)="reset()">Reset</button>
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
  protected readonly channels = CHANNELS;
  protected readonly channelLabel = CHANNEL_LABEL;

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
