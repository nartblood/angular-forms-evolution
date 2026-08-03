/**
 * Snippets for R1, guarded verbatim against `minimal-reactive-page.ts`.
 *
 * Deliberately the same four panels as S1 — the form, the template, writing to it,
 * reading it back — so the pair can be read side by side.
 */

/** The group itself — two controls, two rules. */
export const REACTIVE_MINIMAL_FORM = `protected readonly form = this.fb.group({
  channels: this.fb.control<Channel[]>([], { validators: [atLeastOneChannel] }),
  content: this.fb.control('', { validators: [Validators.required] }),
});`;

/** `Validators` covers strings and numbers; an array rule is yours to write. */
export const REACTIVE_MINIMAL_VALIDATOR = `/** Arrays have no built-in validator, so the rule is a \`ValidatorFn\`. */
const atLeastOneChannel: ValidatorFn = (control): ValidationErrors | null =>
  (control.value as Channel[]).length === 0 ? { noChannels: true } : null;`;

/** Bound by name, and the error gating needs `fd.submitted` alongside `touched`. */
export const REACTIVE_MINIMAL_TEMPLATE = `<form [formGroup]="form" #fd="ngForm" #formEl (ngSubmit)="submit()" novalidate>
  <div class="field">
    <label>Channels</label>
    <app-channel-picker [selected]="form.controls.channels.value" (toggled)="toggle($event)" />
    @if (form.controls.channels.touched && form.controls.channels.invalid) {
      <ap-form-message messageType="error" message="Pick at least one channel" />
    }
  </div>

  <ap-form-field>
    <label for="r1-content">Content</label>
    <textarea id="r1-content" apTextarea formControlName="content"></textarea>
    @if ((form.controls.content.touched || fd.submitted) && form.controls.content.invalid) {
      <ap-form-message messageType="error" message="Content is required" />
    }
  </ap-form-field>`;

export const REACTIVE_MINIMAL_WRITE = `protected toggle(channel: Channel): void {
  const channels = this.form.controls.channels;

  channels.setValue(toggleChannel(channels.value, channel));
  channels.markAsTouched();
}`;

export const REACTIVE_MINIMAL_READ = `protected draft(): PostDraft {
  return { ...emptyDraft(), ...this.form.getRawValue() };
}`;
