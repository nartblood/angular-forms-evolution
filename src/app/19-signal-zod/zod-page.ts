import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormField, disabled, form, validateStandardSchema } from '@angular/forms/signals';
import * as z from 'zod';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, contentLimitFor, toggleChannel } from '../shared/channel';
import { ChannelControl } from '../shared/channel-control';
import { CodePanel } from '../shared/code-panel';
import { ZOD_SCHEMA, ZOD_WIRING } from './zod-snippets';

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
    ChannelControl,
    JsonPipe,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <h2>9 · Zod (bonus)</h2>
      <p class="demo__intro">
        No Angular validators at all — <code>validateStandardSchema</code> maps Zod issues onto the
        matching fields. The schema is dynamic: it's rebuilt in a <code>computed</code> when the
        channel selection changes the limit.
      </p>

      <p class="demo__intro">
        <strong>How <code>draftSchema</code> reaches the form:</strong>
        <code>z.infer</code> types the model signal → the model feeds
        <code>limit</code> → <code>limit</code> rebuilds the schema in a
        <code>computed</code> → the form reads it. The last hop is reactive because
        <code>validateStandardSchema</code>'s second argument may be a <em>function</em> returning
        the schema, not just a schema: pass <code>draftSchema(280)</code> for a fixed schema, pass
        <code>() =&gt; this.schema()</code> when it depends on the model.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-control [formField]="composer.channels" />
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
          <ap-button (click)="composer().markAsTouched()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The Zod schema" [code]="schemaSnippet" />
      <app-code
        label="…and the whole chain into the form: z.infer → model → limit → schema → form"
        [code]="wiringSnippet"
      />

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
  protected readonly schemaSnippet = ZOD_SCHEMA;
  protected readonly wiringSnippet = ZOD_WIRING;

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
    // A LogicFn, not a schema: re-read on every run, so a new schema takes effect.
    validateStandardSchema(path, () => this.schema());

    // Behaviour is still Angular's job: Zod has no concept of a disabled field.
    disabled(path.firstComment, {
      when: ({ valueOf }) =>
        !valueOf(path.channels).some((c) => c === 'instagram' || c === 'linkedin'),
    });
  });

}
