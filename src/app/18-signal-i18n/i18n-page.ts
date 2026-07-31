import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FormField, form, minLength, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, contentLimitFor, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { CodePanel } from '../shared/code-panel';
import { FieldErrorDisplay } from '../shared/field-error';
import { FormMessages } from '../shared/i18n';
import { emptyDraft } from '../shared/post-draft';
import { I18N_BRIDGE, I18N_PARAMS, I18N_RESOLVER, I18N_SCHEMA } from './i18n-snippets';

const MIN_CONTENT_LENGTH = 10;

/**
 * S9 — translated validation messages.
 *
 * The rule: validators declare *what failed* (`kind` plus params); the view
 * decides *what to say*. Hardcoding copy in a schema makes it untranslatable,
 * and duplicating the copy per locale makes it drift.
 */
@Component({
  selector: 'app-signal-i18n-page',
  imports: [
    FormField,
    TranslatePipe,
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
      <h2>Translated messages</h2>

      <p class="demo__intro">
        Not a single string of copy lives in the schema. Validators emit a
        <code>kind</code>, the view maps it to <code>forms.errors.&lt;kind&gt;</code>, and
        <code>&#64;ngx-translate</code> resolves it — the same setup as the platform.
        <strong>Switch the language with errors on screen</strong> and watch them re-translate.
      </p>

      <p class="demo__intro">
        The resolution lives in one shared component —
        <code>&lt;app-field-error [field]="composer.content" /&gt;</code>. A field is a value, so
        <em>when</em> to reveal an error and <em>what it says</em> are written once rather than
        restated under every field. Adding a language changes one table.
      </p>

      <div class="field">
        <label>{{ 'composer.language' | translate }}</label>
        <div class="radio-row">
          <ap-button
            [config]="{ style: messages.lang() === 'en' ? 'primary' : 'stroked', color: 'blue' }"
            (click)="messages.use('en')"
          >
            English
          </ap-button>
          <ap-button
            [config]="{ style: messages.lang() === 'fr' ? 'primary' : 'stroked', color: 'blue' }"
            (click)="messages.use('fr')"
          >
            Français
          </ap-button>
        </div>
      </div>

      <form novalidate>
        <div class="field">
          <label>{{ 'composer.channels.label' | translate }}</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
          <app-field-error [field]="composer.channels" />
        </div>

        <ap-form-field>
          <label for="s9-content">{{ 'composer.content.label' | translate }}</label>
          <textarea id="s9-content" apTextarea [formField]="composer.content"></textarea>
          <app-field-error [field]="composer.content" ngProjectAs="ap-form-message" />
        </ap-form-field>

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">
            {{ 'composer.submit' | translate }}
          </ap-button>
        </div>
      </form>

      <app-code label="The schema — no copy at all" [code]="schemaSnippet" />
      <app-code label="kind → translation key" [code]="resolverSnippet" />
      <app-code
        label="Params come from the validator's own constraints (shared/field-error.ts)"
        [code]="paramsSnippet"
      />
      <app-code label="The catch: instant() is not reactive" [code]="bridgeSnippet" />

      <p class="demo__pain">
        <strong>The catch worth knowing.</strong> <code>TranslateService.instant()</code> is a plain
        function call, so nothing re-runs it when the language changes. Bridging
        <code>onLangChange</code> into a signal with <code>toSignal</code> is what makes the
        messages above update live — without it, errors stay frozen in the old language until the
        user retypes.
      </p>

      <p class="demo__pain demo__win">
        <strong>Why kinds beat messages.</strong> A <code>kind</code> is machine-readable, so the
        same error can drive copy, analytics and tests. And interpolation params come from the
        validator itself — <code>minLength()</code> is a constraint signal, so changing
        <code>minLength(path.content, 10)</code> to 20 updates the sentence with no edit to any
        translation file.
      </p>

      <pre class="demo__state">lang: {{ messages.lang() }}
content errors: {{ composer.content().errors().length }}</pre>
    </section>
  `,
})
export class I18nPage {
  protected readonly messages = inject(FormMessages);

  protected readonly schemaSnippet = I18N_SCHEMA;
  protected readonly resolverSnippet = I18N_RESOLVER;
  protected readonly paramsSnippet = I18N_PARAMS;
  protected readonly bridgeSnippet = I18N_BRIDGE;

  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    // No `message:` anywhere — validators declare what failed, not what to say.
    required(path.content);
    minLength(path.content, MIN_CONTENT_LENGTH);

    validate(path.content, ({ value, valueOf }) => {
      const limit = contentLimitFor(valueOf(path.channels));

      return value().length > limit ? { kind: 'overChannelLimit', limit } : null;
    });

    validate(path.channels, ({ value }) =>
      value().length === 0 ? { kind: 'noChannels' } : null,
    );
  });

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
    this.composer.channels().markAsTouched();
  }
}
