import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { TextareaDirective } from '@agorapulse/ui-components/textarea';
import { InputDirective } from '@agorapulse/ui-components/input';
import { FormFieldComponent } from '@agorapulse/ui-components/form-field';
import { FormMessageComponent } from '@agorapulse/ui-components/form-message';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { RadioComponent } from '@agorapulse/ui-components/radio';

import { Channel, contentLimitFor, toggleChannel } from '../shared/channel';
import { ChannelPicker } from '../shared/channel-picker';
import { PostDraft, emptyDraft } from '../shared/post-draft';

/**
 * Template-driven: the five-minute form.
 *
 * Trimmed to four fields on purpose — this API is genuinely pleasant at this
 * size, and the talk is more convincing if we show it at its best before
 * showing where it stops.
 */
@Component({
  selector: 'app-template-driven-page',
  imports: [
    FormsModule,
    TextareaDirective,
    InputDirective,
    FormFieldComponent,
    FormMessageComponent,
    ButtonComponent,
    RadioComponent,
    ChannelPicker,
    JsonPipe,
  ],
  template: `
    <section class="demo">
      <h2>Template-driven</h2>
      <p class="demo__intro">
        Four fields, almost no TypeScript. Validation reads like HTML, the model is a plain
        object, and <code>[(ngModel)]</code> mutates it in place.
      </p>

      @if (saved) {
        <div class="banner banner--success">{{ saved }}</div>
      }

      <form #f="ngForm" #formEl (ngSubmit)="submit(f)" novalidate>
        <!-- ap-checkbox via [checked]/(change): a multi-select has no single
             control, so its validity is invisible to the form. -->
        <div class="field">
          <label>Channels</label>
          <app-channel-picker [selected]="draft.channels" (toggled)="toggle($event)" />
          @if ((f.submitted || channelsTouched) && draft.channels.length === 0) {
            <ap-form-message messageType="error" message="Pick at least one channel" />
          }
        </div>

        <ap-form-field>
          <label for="td-content">Content</label>
          <textarea
            id="td-content"
            name="content"
            apTextarea
            required
            [maxlength]="contentLimit"
            [(ngModel)]="draft.content"
            #contentCtrl="ngModel"
          ></textarea>
          @if ((contentCtrl.touched || f.submitted) && contentCtrl.hasError('required')) {
            <ap-form-message messageType="error" message="Content is required" />
          }
        </ap-form-field>
        <span class="field__hint">
          {{ draft.content.length }} / {{ contentLimit }}
          @if (draft.channels.length > 0) {
            — limited by the strictest selected channel
          }
        </span>

        <div class="field">
          <label>When</label>
          <div class="radio-row">
            <ap-radio
              radioId="td-now"
              name="publishMode"
              value="now"
              [(ngModel)]="draft.publishMode"
            >
              Now
            </ap-radio>
            <ap-radio
              radioId="td-scheduled"
              name="publishMode"
              value="scheduled"
              [(ngModel)]="draft.publishMode"
            >
              Schedule
            </ap-radio>
          </div>
        </div>

        @if (draft.publishMode === 'scheduled') {
          <ap-form-field>
            <label for="td-scheduledAt">Publish at</label>
            <input
              id="td-scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              apInput
              required
              [(ngModel)]="draft.scheduledAt"
              #scheduledCtrl="ngModel"
            />
            @if ((scheduledCtrl.touched || f.submitted) && scheduledCtrl.hasError('required')) {
              <ap-form-message messageType="error" message="Pick a date and time" />
            }
          </ap-form-field>
        }

        <div class="actions">
          <!-- ap-button renders type="button", so submission goes through
               requestSubmit() rather than relying on a native submit. -->
          <ap-button (click)="formEl.requestSubmit()">Schedule</ap-button>
          <ap-button [config]="{ style: 'stroked', color: 'grey' }" (click)="reset(f)">
            Reset
          </ap-button>
        </div>
      </form>

      <p class="demo__pain">
        <strong>Where it stops.</strong>
        <br />1. Channels has no single control, so its validity lives outside the form:
        <code>f.valid</code> is <code>true</code> with zero channels selected. Fixing it properly
        means writing a custom validator directive.
        <br />2. <code>f.value</code> is <code>any</code>. Rename a field and nothing complains.
        <br />3. Fields inside <code>&#64;if</code> are <em>removed</em> from the form — switch to
        "Now" after typing a date and the value is silently dropped.
        <br />4. Validation logic lives in the template, so it can't be unit-tested without
        rendering, and cross-field rules need a directive.
      </p>

      <pre class="demo__state">{{ draft | json }}</pre>
    </section>
  `,
})
export class TemplateDrivenPage {
  /** ngModel mutates this in place. The model *is* the form. */
  protected draft: PostDraft = emptyDraft();
  protected channelsTouched = false;
  protected saved: string | null = null;

  protected get contentLimit(): number {
    return contentLimitFor(this.draft.channels);
  }

  protected toggle(channel: Channel): void {
    this.channelsTouched = true;
    this.draft.channels = toggleChannel(this.draft.channels, channel);
  }

  protected submit(form: NgForm): void {
    this.channelsTouched = true;

    // The channel rule has to be re-checked by hand: the form knows nothing about it.
    if (form.invalid || this.draft.channels.length === 0) {
      this.saved = null;
      return;
    }

    this.saved = `Scheduled for ${this.draft.channels.join(', ')}.`;
  }

  protected reset(form: NgForm): void {
    this.draft = emptyDraft();
    this.channelsTouched = false;
    this.saved = null;
    form.resetForm(this.draft);
  }
}
