import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormField, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';

import { ChannelControl } from '../shared/channel-control';
import { PostDraft } from '../shared/post-draft';
import { CodePanel } from '../shared/code-panel';
import {
  SIGNAL_MINIMAL_CONTROL,
  SIGNAL_MINIMAL_FORM,
  SIGNAL_MINIMAL_TEMPLATE,
} from './minimal-snippets';

/**
 * Step 1 — the model *is* the form.
 *
 * One signal holds the state. `form()` derives a typed view over it and the
 * rules are declared in one place. There is no control tree to keep in sync.
 */
@Component({
  selector: 'app-signal-minimal-page',
  imports: [
    FormField,
    RouterLink,
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
      <span class="demo__badge demo__badge--signal">S1 · signal forms</span>
      <h2>Minimal</h2>
      <a class="demo__pair-link" routerLink="/reactive/minimal">
        Compare with R1 · the reactive baseline →
      </a>

      <p class="demo__intro">
        A <code>signal()</code> of plain state, and a <code>form()</code> derived from it. Same two
        fields as R1, same rules — what changes is that there is no second copy of the data to keep
        in step, and <code>composer.content</code> is typed, so a typo is a compile error.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-control [formField]="composer.channels" />
        </div>

        <ap-form-field>
          <label for="s1-content">Content</label>
          <textarea id="s1-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <!-- Deliberately never disabled: a disabled button hides which field is
             wrong. markAsTouched() on the ROOT cascades to every descendant, so
             one click reveals every error. S7 gets that from submit() itself. -->
        <div class="actions">
          <ap-button (click)="composer().markAsTouched()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The form" [code]="formSnippet" />
      <app-code label="Binding it in the template" lang="html" [code]="templateSnippet" />
      <app-code
        label="What makes app-channel-control bindable — the whole contract"
        [code]="controlSnippet"
      />

      <p class="demo__pain demo__win">
        <strong>One binding, and it's type-checked.</strong>
        <code>[formField]="composer.content"</code> passes the field itself — not a string name — so
        <code>composer.contnet</code> fails to compile where <code>formControlName="contnet"</code>
        fails at runtime. It comes from the <code>FormField</code> directive in
        <code>&#64;angular/forms/signals</code>, which you add to the component's
        <code>imports</code>; it binds to a native <code>&lt;input&gt;</code>/<code>&lt;textarea&gt;</code>
        (the <code>apInput</code> / <code>apTextarea</code> directives stay exactly as they are) and
        to a <code>ControlValueAccessor</code> component such as <code>ap-radio</code> — see
        <a routerLink="/signal/conditional">S2</a>.
      </p>

      <p class="demo__pain demo__win">
        <strong>Both fields are bound the same way, and one of them is a component.</strong>
        Channels is a <code>Channel[]</code> behind four checkboxes — R1 needs a handler, a
        <code>markAsTouched()</code> call and an error block for it; here it is
        <code>&lt;app-channel-control [formField]="composer.channels" /&gt;</code> and nothing else.
        Same directive as the textarea above, same <code>FormField</code> import.
      </p>

      <p class="demo__pain demo__win">
        <strong>What the component had to do to earn that:</strong> implement
        <code>FormValueControl&lt;Channel[]&gt;</code> — declare <code>value</code> as a
        <code>model()</code>, and declare whichever of <code>errors</code> / <code>touched</code> /
        <code>disabled</code> / <code>invalid</code> / <code>required</code> it wants pushed in.
        Declaring them <em>is</em> the subscription: the page binds none of them. No
        <code>NG_VALUE_ACCESSOR</code>, no <code>writeValue</code> — the only import from
        <code>&#64;angular/forms/signals</code> is the interface, so it stays an ordinary component
        with a two-way <code>value</code>. Full component and the <code>touch</code> policy:
        <a routerLink="/signal/custom-control">S10</a>.
      </p>

      <pre class="demo__state">{{ model() | json }}</pre>
    </section>
  `,
})
export class MinimalPage {
  protected readonly formSnippet = SIGNAL_MINIMAL_FORM;
  protected readonly templateSnippet = SIGNAL_MINIMAL_TEMPLATE;
  protected readonly controlSnippet = SIGNAL_MINIMAL_CONTROL;

  /**
   * Spelled out rather than `signal(emptyDraft())`: on the page whose argument
   * is "the model *is* the form", the model should be visible. The `PostDraft`
   * annotation means a missing or renamed field is a compile error, so this
   * copy can't drift from the interface.
   */
  protected readonly model = signal<PostDraft>({
    channels: [],
    content: '',
    publishMode: 'now',
    scheduledAt: '',
    media: [],
    firstComment: '',
  });

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    validate(path.channels, ({ value }) =>
      value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
    );
  });
}
