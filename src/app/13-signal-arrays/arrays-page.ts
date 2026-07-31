import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, applyEach, form, required, validate } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import {
  Channel,
  channelsRequiringMedia,
  maxMediaFor,
  toggleChannel,
} from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { emptyDraft, emptyMediaItem } from '../shared/post-draft';

/**
 * Step 4 — arrays.
 *
 * `applyEach` applies a rule set to every item. Adding and removing items is
 * just updating the model signal: no `FormArray`, no `push`/`removeAt`, and no
 * rebuilding controls when data is loaded.
 */
@Component({
  selector: 'app-signal-arrays-page',
  imports: [
    FormField,
    InputDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    ChannelPicker,
    JsonPipe,
  ],
  template: `
    <section class="demo">
      <h2>4 · Arrays</h2>
      <p class="demo__intro">
        Media items, each with its own rules, plus two rules about the list as a whole: Instagram
        requires at least one image, and X allows at most four.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
          @if (composer.media().touched() && composer.media().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.media().errors()[0].message ?? 'Invalid'"
            />
          }
        </div>

        <div class="field">
          <label>Media</label>
          @for (item of composer.media; track $index) {
            <div class="media-row">
              <ap-form-field>
                <input apInput placeholder="https://…" [formField]="item.url" />
                @if (item.url().touched() && item.url().invalid()) {
                  <ap-form-message
                    messageType="error"
                    [message]="item.url().errors()[0].message ?? 'Invalid'"
                  />
                }
              </ap-form-field>
              <ap-form-field>
                <input apInput placeholder="Alt text" [formField]="item.altText" />
                @if (item.altText().touched() && item.altText().invalid()) {
                  <ap-form-message
                    messageType="error"
                    [message]="item.altText().errors()[0].message ?? 'Invalid'"
                  />
                }
              </ap-form-field>
              <ap-button [config]="{ style: 'stroked', color: 'red' }" (click)="removeMedia($index)">
                Remove
              </ap-button>
            </div>
          }
          <ap-button [config]="{ style: 'stroked', color: 'grey' }" (click)="addMedia()">
            Add media
          </ap-button>
        </div>

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">Schedule</ap-button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>Adding an item is <code>model.update()</code>.</strong> The form re-derives, and
        every new item already has its rules from <code>applyEach</code>. Compare with the reactive
        page, where loading a draft needs <code>media.clear()</code> followed by a
        <code>push()</code> per item, each with its validators re-specified.
      </p>

      <pre class="demo__state">{{ model().media | json }}</pre>
    </section>
  `,
})
export class ArraysPage {
  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    // Per-item rules, declared once for every element.
    applyEach(path.media, (item) => {
      required(item.url, { message: 'URL is required' });
      required(item.altText, { message: 'Alt text is required' });
    });

    // Rules about the list itself, attached to the list field.
    validate(path.media, ({ value, valueOf }) => {
      const channels = valueOf(path.channels);
      const needing = channelsRequiringMedia(channels);

      if (needing.length > 0 && value().length === 0) {
        return {
          kind: 'mediaRequired',
          message: `${needing.join(', ')} requires at least one image`,
        };
      }

      const max = maxMediaFor(channels);
      return value().length > max
        ? { kind: 'tooManyMedia', message: `At most ${max} images for the selected channels` }
        : null;
    });
  });

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
    this.composer.media().markAsTouched();
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
}
