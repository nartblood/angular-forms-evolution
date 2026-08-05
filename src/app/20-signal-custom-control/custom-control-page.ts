import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { CheckboxComponent } from '@agorapulse/ui-components/checkbox';

import { ChannelControl } from '../shared/channel-control';
import { emptyDraft } from '../shared/post-draft';
import { CodePanel } from '../shared/code-panel';
import {
  SIGNAL_CONTROL_COMPONENT,
  SIGNAL_CONTROL_MESSAGE,
  SIGNAL_CONTROL_RULES,
  SIGNAL_CONTROL_TEMPLATE,
} from './custom-control-snippets';

/**
 * Step 10 — how the channel control every other page binds is actually built.
 *
 * S1 onwards use `<app-channel-control [formField]="composer.channels">` and say
 * nothing about what's inside it. This page opens it: the contract is a `model()`
 * plus some optional `input()`s, not a `ControlValueAccessor`. The comparison it
 * carries is against `channel-picker.ts`, the same component unbound.
 */
@Component({
  selector: 'app-signal-custom-control-page',
  imports: [
    FormField,
    RouterLink,
    TextareaDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    CheckboxComponent,
    ChannelControl,
    JsonPipe,
    CodePanel,
  ],
  template: `
    <section class="demo">
      <span class="demo__badge demo__badge--signal">S10 · signal forms</span>
      <h2>A composite component as a control</h2>
      <a class="demo__pair-link" routerLink="/signal/minimal">
        ← Back to S1, which binds this control and says nothing about it
      </a>

      <p class="demo__intro">
        Every signal page here binds <code>[formField]="composer.channels"</code> onto a component
        whose value is a <code>Channel[]</code> — no toggle handler, no
        <code>markAsTouched()</code>, no error block. This is what that component has to declare to
        earn it, and how little of it is forms-specific.
      </p>

      <form novalidate>
        <div class="field">
          <label>Channels</label>
          <app-channel-control [formField]="composer.channels" />
        </div>

        <ap-form-field>
          <label for="s10-content">Content</label>
          <textarea id="s10-content" apTextarea [formField]="composer.content"></textarea>
          @if (composer.content().touched() && composer.content().invalid()) {
            <ap-form-message
              messageType="error"
              [message]="composer.content().errors()[0].message ?? 'Invalid'"
            />
          }
        </ap-form-field>

        <div class="field">
          <ap-checkbox name="s10-locked" [checked]="locked()" (change)="locked.set($event)">
            Lock the channels (a rule on the field, not a binding on the component)
          </ap-checkbox>
        </div>

        <div class="actions">
          <ap-button (click)="composer().markAsTouched()">Schedule</ap-button>
        </div>
      </form>

      <app-code label="The control" [code]="componentSnippet" />
      <app-code label="It renders its own message" lang="html" [code]="messageSnippet" />
      <app-code label="Binding it in the page" lang="html" [code]="templateSnippet" />
      <app-code label="The rules don't change" [code]="rulesSnippet" />

      <p class="demo__pain demo__win">
        <strong>No <code>ControlValueAccessor</code>.</strong> The contract is
        <code>FormValueControl&lt;T&gt;</code>: a required <code>value = model&lt;T&gt;()</code>, plus
        optional <code>errors</code>, <code>touched</code>, <code>disabled</code>,
        <code>invalid</code>, <code>pending</code>, <code>required</code> and <code>name</code>
        inputs that <code>[formField]</code> fills in <em>because they are declared</em>, and a
        <code>touch</code> output for marking the field touched. There is no provider to register
        and no <code>writeValue</code> to write — the only thing this component imports from
        <code>&#64;angular/forms/signals</code> is a type, so it is still an ordinary component with
        a two-way <code>value</code>.
      </p>

      <p class="demo__pain demo__win">
        <strong>The value can be anything.</strong> A CVA over a checkbox group has to reconcile a
        boolean per box with an array on the model. Here the field's type <em>is</em>
        <code>Channel[]</code>, so the reconciliation stays inside the component where it belongs.
      </p>

      <p class="demo__pain demo__win">
        <strong>Binding it is a choice, not a requirement.</strong> <code>validate()</code> targets a
        model path, so the unbound version — <code>channel-picker.ts</code>, still used by the
        reactive pages and by <a routerLink="/signal/i18n">S9</a> — validates just as well with no
        control involved at all. What it doesn't get is interaction state: each page then owns a
        toggle handler, a <code>markAsTouched()</code> call and an error block. That's the trade, and
        it's per component.
      </p>

      <p class="demo__pain">
        <strong>Two things stay your decision.</strong> A checkbox group has no meaningful blur, so
        this control emits <code>touch</code> on first change — pick that policy deliberately, it is
        what makes errors appear. And <code>errors</code> is pushed in whether or not the field is
        touched, so gating the message on <code>touched()</code> is the component's job, not the
        directive's.
      </p>

      <p class="demo__pain">
        <strong>What this doesn't answer.</strong> Our existing components are CVAs, and
        <a routerLink="/signal/conditional">S2</a> shows one of them binding to
        <code>[formField]</code> unchanged. So the migration has two routes: leave a CVA alone, or
        rewrite it against this contract and delete the adapter. Nothing forces a choice per
        component all at once.
      </p>

      <pre class="demo__state">{{ model() | json }}</pre>
    </section>
  `,
})
export class CustomControlPage {
  protected readonly componentSnippet = SIGNAL_CONTROL_COMPONENT;
  protected readonly messageSnippet = SIGNAL_CONTROL_MESSAGE;
  protected readonly templateSnippet = SIGNAL_CONTROL_TEMPLATE;
  protected readonly rulesSnippet = SIGNAL_CONTROL_RULES;

  protected readonly locked = signal(false);

  protected readonly model = signal(emptyDraft());

  protected readonly composer = form(this.model, (path) => {
    required(path.content, { message: 'Content is required' });

    validate(path.channels, ({ value }) =>
      value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
    );

    // Reaches the component's `disabled` input, which reaches every ap-checkbox.
    disabled(path.channels, { when: () => this.locked() });
  });
}
