import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormField, form, maxLength, minLength, required, validate } from '@angular/forms/signals';

import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { Channel, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { CodePanel } from '../shared/code-panel';
import { firstErrorMessage } from '../shared/first-error-message';
import { FormMessages } from '../shared/i18n';
import { emptyDraft } from '../shared/post-draft';
import {
  I18N_FALLBACK,
  I18N_LIVE_SWITCH,
  I18N_RULES,
  I18N_VIEW_HTML,
  I18N_VIEW_TS,
  I18N_VIEW_WIRING,
} from './i18n-snippets';

const MIN_CONTENT_LENGTH = 10;
const MAX_FIRST_COMMENT_LENGTH = 20;

/**
 * S9 — translated messages.
 *
 * The rule that survives contact with a real codebase: **translate where the rule
 * is declared.** `message` is typed `string | LogicFn<TValue, string>`, so the
 * validator can produce finished copy, and the view's whole i18n job becomes
 * `errors()[0]?.message`.
 *
 * The alternative — validators emit a bare `kind`, something maps it to
 * `forms.errors.<kind>` — buys one thing (the same failure worded differently in
 * two places) and costs a mapping table, a key convention, and a translation
 * lookup in the view. It stays here only as the fallback for errors that carry no
 * message of their own.
 */
@Component({
  selector: 'app-signal-i18n-page',
  imports: [
    FormField,
    TranslatePipe,
    InputDirective,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    ChannelPicker,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <span class="demo__badge demo__badge--signal">S9 · signal forms</span>
      <h2>Translated messages</h2>

      <p class="demo__intro">
        <code>message</code> is typed <code>string | LogicFn&lt;TValue, string&gt;</code> — it can be
        a function, so the translation happens where the rule is declared. The error then carries
        finished copy and the view reads <code>errors()[0]?.message</code>. Content and first comment
        work that way below.
      </p>

      <p class="demo__intro">
        Channels deliberately declares <em>no</em> message: it emits a bare <code>kind</code>, so the
        template has to build a key from it. That's the fallback — for built-ins used without
        <code>message</code>, and for Zod issues arriving through
        <code>validateStandardSchema</code>.
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
        <ap-form-field>
          <label for="s9-content">{{ 'composer.content.label' | translate }}</label>
          <textarea id="s9-content" apTextarea [formField]="composer.content"></textarea>

          <!-- The rule already produced the sentence; bind it. -->
          @if (contentError(); as message) {
            <ap-form-message messageType="error" [message]="message" />
          }
        </ap-form-field>

        <ap-form-field>
          <label for="s9-firstComment">{{ 'composer.firstComment.label' | translate }}</label>
          <input id="s9-firstComment" apInput [formField]="composer.firstComment" />

          @if (firstCommentError(); as message) {
            <ap-form-message messageType="error" [message]="message" />
          }
        </ap-form-field>

        <div class="field">
          <label>{{ 'composer.channels.label' | translate }}</label>
          <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />

          <!-- Fallback: nothing on the error to show, so build the key here. -->
          @if (composer.channels().touched()) {
            @for (error of composer.channels().errors(); track error.kind) {
              <ap-form-message
                messageType="error"
                [message]="'forms.errors.' + error.kind | translate: error"
              />
            }
          }
        </div>

        <div class="actions">
          <ap-button [disabled]="composer().invalid()">
            {{ 'composer.submit' | translate }}
          </ap-button>
        </div>
      </form>

      <app-code label="1 · translate where the rule is declared" [code]="rulesSnippet" />
      <app-code label="2 · the view's whole i18n job, shared" [code]="viewTsSnippet" />
      <app-code label="3 · one computed per field" [code]="viewWiringSnippet" />
      <app-code label="4 · bind it" lang="html" [code]="viewHtmlSnippet" />
      <app-code
        label="Fallback · when the error carries no message"
        lang="html"
        [code]="fallbackSnippet"
      />
      <app-code label="If the language could change live" [code]="liveSwitchSnippet" />

      <table class="demo__scoreboard">
        <thead>
          <tr>
            <th></th>
            <th>Message in the rule</th>
            <th>kind → key in the view</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Where the copy is decided</td>
            <td>next to the rule it belongs to</td>
            <td>in a table, far from the rule</td>
          </tr>
          <tr>
            <td>The view needs</td>
            <td><code>errors()[0]?.message</code></td>
            <td>a key convention plus a lookup per field</td>
          </tr>
          <tr>
            <td>Params</td>
            <td>real values, at the call site</td>
            <td>whatever the error object happens to carry</td>
          </tr>
          <tr>
            <td>Missing translation</td>
            <td>visible where you wrote the rule</td>
            <td>renders the raw key</td>
          </tr>
          <tr>
            <td>Same failure, two wordings</td>
            <td>pass a different <code>message</code></td>
            <td>free — its one real advantage</td>
          </tr>
        </tbody>
      </table>

      <p class="demo__pain">
        <strong>The one caveat, measured.</strong> A <code>message</code> function runs inside the
        validation computation, so it re-runs when validation recomputes — <em>not</em> when the
        language changes. Switch to Français with errors on screen: content and first comment keep
        their English copy until the value changes, while the channels message (the pipe) switches
        immediately. That is fine for us — the platform picks the language once at bootstrap in
        <code>app.component.ts</code> and never switches it live — and if that ever changes, reading
        a language signal inside the message function fixes it in one line.
        <code>shared/i18n.spec.ts</code> asserts all three behaviours.
      </p>

      <p class="demo__pain demo__win">
        <strong>Why this beats a message registry.</strong> The <code>kind</code> is still there for
        the machine — tests, analytics, <code>errorSummary()</code> — but the copy stops being a
        second system to keep in sync with the rules. And it is testable with no DOM and no view:
        <code>expect(f.company().errors()[0].message).toBe('Company name is required')</code>.
      </p>

      <pre class="demo__state">lang: {{ messages.lang() }}
content: {{ contentError() }}
firstComment: {{ firstCommentError() }}</pre>
    </section>
  `,
})
export class I18nPage {
  protected readonly messages = inject(FormMessages);
  private readonly translate = inject(TranslateService);

  protected readonly rulesSnippet = I18N_RULES;
  protected readonly viewTsSnippet = I18N_VIEW_TS;
  protected readonly viewWiringSnippet = I18N_VIEW_WIRING;
  protected readonly viewHtmlSnippet = I18N_VIEW_HTML;
  protected readonly fallbackSnippet = I18N_FALLBACK;
  protected readonly liveSwitchSnippet = I18N_LIVE_SWITCH;

  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    // The copy is produced here — translated, with the params it needs — so
    // nothing downstream has to know that translations exist.
    required(path.content, {
      message: () =>
        this.translate.instant('forms.XIsRequired', {
          field: this.translate.instant('composer.content.label'),
        }),
    });

    minLength(path.content, MIN_CONTENT_LENGTH, {
      message: () =>
        this.translate.instant('forms.XMinLength', {
          field: this.translate.instant('composer.content.label'),
          min: MIN_CONTENT_LENGTH,
        }),
    });

    maxLength(path.firstComment, MAX_FIRST_COMMENT_LENGTH, {
      message: () =>
        this.translate.instant('forms.XMaxLength', {
          field: this.translate.instant('composer.firstComment.label'),
          max: MAX_FIRST_COMMENT_LENGTH,
        }),
    });

    // Deliberately message-less, to show what the view has to do without one.
    validate(path.channels, ({ value }) =>
      value().length === 0 ? { kind: 'noChannels' } : null,
    );
  });

  /** The view's whole i18n job: the rules already produced the sentences. */
  protected readonly contentError = computed(() => firstErrorMessage(this.composer.content));
  protected readonly firstCommentError = computed(() =>
    firstErrorMessage(this.composer.firstComment),
  );

  protected toggle(channel: Channel): void {
    this.model.update((draft) => ({
      ...draft,
      channels: toggleChannel(draft.channels, channel),
    }));
    this.composer.channels().markAsTouched();
  }
}
