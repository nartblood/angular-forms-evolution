import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, disabled, form, validateStandardSchema } from '@angular/forms/signals';
import * as z from 'zod';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, contentLimitFor, toggleChannel } from '../../shared/channel';
import { ChannelPicker } from '../../shared/channel-picker';

/**
 * Bonus — the same rules as a Zod schema.
 *
 * Signal Forms speaks the Standard Schema spec (Zod, Valibot, ArkType), so a
 * schema we already use to parse API responses can validate the form directly:
 * one declaration produces the TypeScript type, the form rules, and the runtime
 * contract at the HTTP boundary.
 */

const channelEnum = z.enum(['x', 'linkedin', 'instagram', 'facebook']);

/** Built as a function of the selected channels, so the limit stays dynamic. */
function draftSchema(limit: number) {
  return z.object({
    channels: z.array(channelEnum).min(1, 'Pick at least one channel'),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(limit, `The strictest selected channel allows ${limit} characters`),
    publishMode: z.enum(['now', 'scheduled']),
    scheduledAt: z.string(),
    media: z.array(
      z.object({
        url: z.string().url('Enter a valid URL'),
        altText: z.string().min(1, 'Alt text is required'),
      }),
    ),
    firstComment: z.string(),
  });
}

/** The model type comes from the schema — not hand-written alongside it. */
type ZodDraft = z.infer<ReturnType<typeof draftSchema>>;

@Component({
  selector: 'app-signal-zod-page',
  imports: [
    FormField,
    InputDirective,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    ChannelPicker,
    JsonPipe,
  ],
  template: `
    <section class="demo">
      <h2>9 · Zod (bonus)</h2>
      <p class="demo__intro">
        No Angular validators at all — <code>validateStandardSchema</code> maps Zod issues onto the
        matching fields. The schema is dynamic: it's rebuilt in a <code>computed</code> when the
        channel selection changes the limit.
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
          <label for="s9-content">Content</label>
          <textarea id="s9-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>
        <span class="field__hint">{{ model().content.length }} / {{ limit() }}</span>

        <ap-form-field>
          <label for="s9-firstComment">First comment</label>
          <input id="s9-firstComment" apInput [formField]="composer.firstComment" />
        </ap-form-field>
        @if (composer.firstComment().disabled()) {
          <span class="field__hint">Instagram or LinkedIn only</span>
        }

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">Schedule</ap-button>
        </div>
      </form>

      <p class="demo__pain demo__win">
        <strong>One schema, three jobs.</strong> <code>z.infer</code> gives the model type,
        <code>validateStandardSchema</code> gives the form rules, and
        <code>schema.parse(response)</code> guards the API boundary. Today we declare Zod rules for
        the API <em>and</em> Angular validators for the form, and one of the two always drifts.
      </p>

      <p class="demo__pain">
        <strong>Not a replacement.</strong> Zod describes what the data must <em>be</em>. It has no
        opinion about UI behaviour, which is why <code>disabled()</code> is still an Angular rule
        here. Use both: Zod for shape and values, the Angular schema for behaviour.
      </p>

      <pre class="demo__state">limit: {{ limit() }}
{{ model() | json }}</pre>
    </section>
  `,
})
export class ZodPage {
  protected readonly model = signal<ZodDraft>({
    channels: [],
    content: '',
    publishMode: 'now',
    scheduledAt: '',
    media: [],
    firstComment: '',
  });

  protected readonly limit = computed(() => contentLimitFor(this.model().channels));

  /** Rebuilt whenever the limit changes — validation follows automatically. */
  private readonly schema = computed(() => draftSchema(this.limit()));

  protected readonly composer = form(this.model, (path) => {
    validateStandardSchema(path, () => this.schema());

    // Behaviour is still Angular's job: Zod has no concept of a disabled field.
    disabled(path.firstComment, {
      when: ({ valueOf }) =>
        !valueOf(path.channels).some((c) => c === 'instagram' || c === 'linkedin'),
    });
  });

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels as Channel[], channel),
    }));
  }
}
