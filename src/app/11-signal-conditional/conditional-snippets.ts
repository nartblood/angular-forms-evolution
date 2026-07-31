/**
 * Snippets shown on screen, asserted verbatim against `conditional-page.ts` by
 * `conditional-page.spec.ts`.
 */

export const SIGNAL_CONDITIONAL_RULE = `required(path.scheduledAt, {
  when: ({ valueOf }) => valueOf(path.publishMode) === 'scheduled',
  message: 'Pick a date and time',
});

// And a rule that needs the value itself: the date must be in the future.
validate(path.scheduledAt, ({ value, valueOf }) => {
  if (valueOf(path.publishMode) !== 'scheduled' || !value()) return null;

  return new Date(value()).getTime() <= Date.now()
    ? { kind: 'pastDate', message: 'Pick a time in the future' }
    : null;
});`;

export const SIGNAL_CONDITIONAL_MODEL = `protected readonly model = signal(emptyDraft());`;

/**
 * The binding half of the story, from `conditional-page.ts`. Same
 * `[formField]` as on a native `<textarea>`, this time on a
 * `ControlValueAccessor` *component* — and the two radios share one field, so
 * "which one is selected" is the model value, not view state.
 */
export const SIGNAL_CONDITIONAL_TEMPLATE = `<div class="field">
  <label>When</label>
  <!-- ap-radio is a ControlValueAccessor component, bound with [formField] -->
  <ap-radio radioId="s2-now" value="now" [formField]="composer.publishMode">Now</ap-radio>
  <ap-radio radioId="s2-scheduled" value="scheduled" [formField]="composer.publishMode">
    Schedule
  </ap-radio>
</div>

@if (model().publishMode === 'scheduled') {
  <ap-form-field>
    <label for="s2-scheduledAt">Publish at</label>
    <input
      id="s2-scheduledAt"
      type="datetime-local"
      apInput
      [formField]="composer.scheduledAt"
    />
    @if (composer.scheduledAt().touched() && composer.scheduledAt().invalid()) {
      <ap-form-message
        messageType="error"
        [message]="composer.scheduledAt().errors()[0].message ?? 'Invalid'"
      />
    }
  </ap-form-field>
}`;
