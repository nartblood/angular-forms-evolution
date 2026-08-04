/**
 * Snippets for S7, guarded verbatim against `submit-page.ts`.
 *
 * The first one is deliberately the *whole* declaration rather than the
 * submission object alone: "where does the action go" is the question, and the
 * answer is only legible next to the model it reads and the rules it gates on.
 */

/** State, rules and submission — one `form()` call, in the order you write it. */
export const SIGNAL_SUBMIT_FORM = `protected published: string | null = null;

/** Set by \`onInvalid\`: the summary is a submit-time affordance, not a live one. */
protected readonly attempted = signal(false);

protected readonly model = signal(emptyDraft());

protected readonly composer = form(
  this.model,
  (path) => {
    required(path.content, { message: 'Content is required' });
    validate(path.channels, ({ value }) =>
      value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
    );
  },
  {
    submission: {
      // The framework tells us the user tried and it did not pass, so a summary
      // needs one flag at the root — not a directive's \`submitted\`, which
      // \`form.reset()\` then fails to clear.
      onInvalid: () => {
        this.published = null;
        this.attempted.set(true);
      },
      action: async (f) => {
        this.attempted.set(false);
        this.published = null;
        const result = await this.api.publish(f().value());

        if (!result.ok) {
          // Target the field via the action's own argument: referencing
          // \`this.composer\` here would make the initializer circular.
          return [
            {
              fieldTree: result.field === 'channels' ? f.channels : f.content,
              kind: result.kind,
              message: 'This Instagram account needs reconnecting',
            },
          ];
        }

        this.published = result.id;
        return undefined;
      },
    },
  },
);`;

/**
 * The submit path end to end: `[formRoot]` on the form and a plain
 * `<button type="submit">`. No `(ngSubmit)`, no `#fd="ngForm"`, no click handler,
 * no `submitted` flag.
 *
 * `ap-button` is the exception, not the rule: it renders `type="button"`, and the
 * host `type` attribute it looks like it accepts is removed from the host and then
 * dropped (`probe.spec.ts`), so it calls `requestSubmit()` on the form instead.
 */
export const SIGNAL_SUBMIT_TEMPLATE = `<form [formRoot]="composer" #formEl novalidate>
  <div class="field">
    <label>Channels</label>
    <app-channel-picker [selected]="model().channels" (toggled)="toggle($event)" />
    @if (composer.channels().touched() && composer.channels().invalid()) {
      <ap-form-message
        messageType="error"
        [message]="composer.channels().errors()[0].message ?? 'Invalid'"
      />
    }
  </div>

  <ap-form-field>
    <label for="s7-content">Content</label>
    <textarea id="s7-content" apTextarea [formField]="composer.content"></textarea>
    @if (composer.content().touched() && composer.content().invalid()) {
      <ap-form-message
        messageType="error"
        [message]="composer.content().errors()[0].message ?? 'Invalid'"
      />
    }
  </ap-form-field>

  <!-- Neither button is disabled while the form is invalid: submitting is
       how you find out what is wrong. The loading input already blocks a
       second submit, because ap-button sets attr.disabled from it. -->
  <div class="actions">
    <!-- The mechanism: a plain submit button, and the form does the rest. -->
    <button type="submit">Schedule</button>

    <!-- Our design system: ap-button renders type="button" and swallows a
         host type attribute (probe.spec.ts), so it asks the form to submit
         itself instead. Same [formRoot], same submission. -->
    <ap-button [loading]="composer().submitting()" (click)="formEl.requestSubmit()">
      Schedule (ap-button)
    </ap-button>
  </div>
</form>`;

/** From `submit-page.ts` — the form-level list, without walking any controls. */
export const SIGNAL_SUBMIT_SUMMARY = `protected readonly summary = computed(() =>
  this.composer()
    .errorSummary()
    .map((error) => ({
      label: String(error.fieldTree().keyInParent()),
      message: error.message ?? error.kind,
    })),
);`;
