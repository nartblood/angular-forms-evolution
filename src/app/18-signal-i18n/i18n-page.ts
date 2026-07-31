import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FormField, form, minLength, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, contentLimitFor, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { CodePanel } from '../shared/code-panel';
import { FieldErrorDisplay } from '../shared/field-error';
import { FormMessages } from '../shared/i18n';
import { emptyDraft } from '../shared/post-draft';
import {
  I18N_BRIDGE,
  I18N_PARAMS,
  I18N_RESOLVER,
  I18N_SCHEMA,
  I18N_TEMPLATE,
} from './i18n-snippets';

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
    FormMessageComponent,
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
        <strong>Two ways to resolve the copy, one on each field below.</strong> Channels translates
        <em>in the template</em> with the <code>translate</code> pipe; content translates
        <em>in TypeScript</em>, inside the shared
        <code>&lt;app-field-error&gt;</code> component. Switch the language and watch both — they
        get there differently, and only one of them needed extra work to stay live.
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

          <!-- Variant A — translated in the template. The pipe resolves the key and
               re-renders itself when the language changes; the params are the error
               object, because built-in errors carry their own constraint. -->
          @if (composer.channels().touched()) {
            @for (error of composer.channels().errors(); track error.kind) {
              <ap-form-message
                messageType="error"
                [message]="'forms.errors.' + error.kind | translate: error"
              />
            }
          }
        </div>

        <ap-form-field>
          <label for="s9-content">{{ 'composer.content.label' | translate }}</label>
          <textarea id="s9-content" apTextarea [formField]="composer.content"></textarea>

          <!-- Variant B — translated in TypeScript, inside the component. -->
          <app-field-error [field]="composer.content" ngProjectAs="ap-form-message" />
        </ap-form-field>

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">
            {{ 'composer.submit' | translate }}
          </ap-button>
        </div>
      </form>

      <app-code label="The schema — no copy at all" [code]="schemaSnippet" />
      <app-code label="A · in the template, with the pipe" lang="html" [code]="templateSnippet" />
      <app-code label="B · in TypeScript — kind → translation key" [code]="resolverSnippet" />
      <app-code label="B · called from the shared component" [code]="paramsSnippet" />
      <app-code label="B's catch: instant() is not reactive" [code]="bridgeSnippet" />

      <table class="demo__scoreboard">
        <thead>
          <tr>
            <th></th>
            <th>A · template pipe</th>
            <th>B · TypeScript</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stays live on language switch</td>
            <td>free — the pipe re-renders</td>
            <td>only with the <code>onLangChange</code> → signal bridge</td>
          </tr>
          <tr>
            <td>Interpolation params</td>
            <td colspan="2">the error object, for both</td>
          </tr>
          <tr>
            <td>Written</td>
            <td>per field, in every template</td>
            <td>once, reused by every field</td>
          </tr>
          <tr>
            <td>Usable outside the view</td>
            <td>no</td>
            <td>yes — summaries, analytics, tests</td>
          </tr>
          <tr>
            <td>Validator's own message wins</td>
            <td>needs an extra <code>&#64;if</code></td>
            <td>one <code>if</code> in the resolver</td>
          </tr>
        </tbody>
      </table>

      <p class="demo__pain">
        <strong>The catch that only hits variant B.</strong>
        <code>TranslateService.instant()</code> is a plain function call, so nothing re-runs it when
        the language changes. Bridging <code>onLangChange</code> into a signal with
        <code>toSignal</code> is what makes the content message update live — without it, it stays
        frozen in the old language until the user retypes, while the channels message next to it
        switches correctly. That asymmetry is the whole argument for knowing both.
      </p>

      <p class="demo__pain demo__win">
        <strong>Which to use.</strong> The pipe for a one-off field; the resolver everywhere else —
        it is written once, and it's the only variant whose output you can reach from TypeScript,
        which you need the moment a message has to appear in a form-level summary, an
        <code>aria-live</code> region, an analytics event or a test assertion.
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
  protected readonly templateSnippet = I18N_TEMPLATE;
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
