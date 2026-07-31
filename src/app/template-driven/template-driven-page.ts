import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { InputDirective } from '@agorapulse/ui-components/input';
import { TextareaDirective } from '@agorapulse/ui-components/textarea';

import {
  CHANNELS,
  CHANNEL_LABEL,
  Channel,
  contentLimitFor,
  toggleChannel,
} from '../shared/channel';
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
  imports: [FormsModule, InputDirective, TextareaDirective, JsonPipe],
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

      <form #f="ngForm" (ngSubmit)="submit(f)" novalidate>
        <!-- Channels: no ngModel at all. A multi-toggle has no native control,
             so its validity is invisible to the form — see the pain note below. -->
        <div class="field">
          <label>Channels</label>
          <div class="channels">
            @for (channel of channels; track channel) {
              <button
                type="button"
                class="channel-chip"
                [class.is-selected]="draft.channels.includes(channel)"
                (click)="toggle(channel)"
              >
                {{ channelLabel[channel] }}
              </button>
            }
          </div>
          @if ((f.submitted || channelsTouched) && draft.channels.length === 0) {
            <span class="field__error">Pick at least one channel</span>
          }
        </div>

        <div class="field">
          <label for="content">Content</label>
          <textarea
            id="content"
            name="content"
            apTextarea
            required
            [maxlength]="contentLimit"
            [(ngModel)]="draft.content"
            #contentCtrl="ngModel"
          ></textarea>
          <span class="field__hint">
            {{ draft.content.length }} / {{ contentLimit }}
            @if (draft.channels.length > 0) {
              — limited by the strictest selected channel
            }
          </span>
          @if ((contentCtrl.touched || f.submitted) && contentCtrl.hasError('required')) {
            <span class="field__error">Content is required</span>
          }
        </div>

        <div class="field">
          <label>When</label>
          <div class="radio-row">
            <label>
              <input type="radio" name="publishMode" value="now" [(ngModel)]="draft.publishMode" />
              Now
            </label>
            <label>
              <input
                type="radio"
                name="publishMode"
                value="scheduled"
                [(ngModel)]="draft.publishMode"
              />
              Schedule
            </label>
          </div>
        </div>

        @if (draft.publishMode === 'scheduled') {
          <div class="field">
            <label for="scheduledAt">Publish at</label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              apInput
              required
              [(ngModel)]="draft.scheduledAt"
              #scheduledCtrl="ngModel"
            />
            @if ((scheduledCtrl.touched || f.submitted) && scheduledCtrl.hasError('required')) {
              <span class="field__error">Pick a date and time</span>
            }
          </div>
        }

        <div class="actions">
          <button type="submit" class="primary">Schedule</button>
          <button type="button" class="ghost" (click)="reset(f)">Reset</button>
        </div>
      </form>

      <p class="demo__pain">
        <strong>Where it stops.</strong>
        <br />1. <code>channels</code> has no native control, so its validity lives outside the
        form: <code>f.valid</code> is <code>true</code> with zero channels selected. Fixing it
        properly means writing a custom validator directive.
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
  protected readonly channels = CHANNELS;
  protected readonly channelLabel = CHANNEL_LABEL;

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
