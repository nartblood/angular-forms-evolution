import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, applyEach, form } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { MediaItem, emptyDraft, emptyMediaItem, existingDraft } from '../shared/post-draft';
import { composerSchema, mediaItemSchema } from './composer-schema';
import { CodePanel } from '../shared/code-panel';
import {
  SIGNAL_SCHEMAS_COMPOSER,
  SIGNAL_SCHEMAS_CUSTOM_RULE,
  SIGNAL_SCHEMAS_LOAD,
  SIGNAL_SCHEMAS_REUSE,
  SIGNAL_SCHEMAS_SUB,
  SIGNAL_SCHEMAS_USAGE,
} from './schemas-snippets';

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
    CodePanel,
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

      <app-code
        label="1 · a shared custom rule — just a function calling validate()"
        [code]="customRuleSnippet"
      />
      <app-code label="2 · a sub-schema using it, next to built-ins" [code]="subSnippet" />
      <app-code
        label="3 · composed into the whole schema — every rule in one place"
        [code]="composerSnippet"
      />
      <app-code label="…and the whole form" [code]="usageSnippet" />
      <app-code label="Loading is one assignment" [code]="loadSnippet" />

      <h3>The same sub-schema, a different form</h3>
      <p class="demo__intro">
        A bulk media editor with no post around it, validated by the very same
        <code>mediaItemSchema</code>. Nothing about the rules is repeated.
      </p>

      <form novalidate>
        @for (item of bulkForm; track $index) {
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
            <ap-button [config]="{ style: 'stroked', color: 'red' }" (click)="removeBulk($index)">
              Remove
            </ap-button>
          </div>
        }
        <ap-button [config]="{ style: 'stroked', color: 'grey' }" (click)="addBulk()">
          Add row
        </ap-button>
      </form>

      <app-code label="4 · reused by an unrelated form" [code]="reuseSnippet" />

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
  protected readonly customRuleSnippet = SIGNAL_SCHEMAS_CUSTOM_RULE;
  protected readonly subSnippet = SIGNAL_SCHEMAS_SUB;
  protected readonly composerSnippet = SIGNAL_SCHEMAS_COMPOSER;
  protected readonly reuseSnippet = SIGNAL_SCHEMAS_REUSE;
  protected readonly usageSnippet = SIGNAL_SCHEMAS_USAGE;
  protected readonly loadSnippet = SIGNAL_SCHEMAS_LOAD;

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

  /**
   * A second, unrelated form — a bulk media editor with no post around it —
   * validated by the *same* mediaItemSchema. This is what "reusable" has to mean:
   * one definition, two forms, no copy of the rules.
   */
  protected readonly bulkModel = signal<MediaItem[]>([emptyMediaItem()]);

  protected readonly bulkForm = form(this.bulkModel, (path) => {
    applyEach(path, mediaItemSchema);
  });

  protected addBulk(): void {
    this.bulkModel.update((items) => [...items, emptyMediaItem()]);
  }

  protected removeBulk(index: number): void {
    this.bulkModel.update((items) => items.filter((_, i) => i !== index));
  }

  protected loadExisting(): void {
    this.model.set(existingDraft());
  }

  protected reset(): void {
    this.composer().reset(emptyDraft());
  }
}
