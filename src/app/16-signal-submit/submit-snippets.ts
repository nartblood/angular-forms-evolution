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
 * `[formRoot]` plus `type="submit"` is the whole wiring — the same shape as
 * `archie-login-form` in the platform. No `(ngSubmit)`, no `#fd="ngForm"`, no
 * `submitted` flag, no click handler.
 *
 * (`ApButtonSubmit` in this repo's `imports` is a workaround for a ui-components
 * bug, not part of the API: the forwarded `type` is lost until `ap-button`'s view
 * is checked again, which zone.js hides and zoneless does not.)
 */
export const SIGNAL_SUBMIT_TEMPLATE = `<form [formRoot]="composer" novalidate>
  <div class="field">
    <label>Channels</label>
    <app-channel-control [formField]="composer.channels" />
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
       second submit, because ap-button sets attr.disabled from it.

       Two triggers, one submission. Both are ap-buttons. -->
  <div class="actions">
    <!-- 1 · through the form: type="submit", nothing else. -->
    <ap-button
      type="submit"
      [config]="{ style: 'primary', color: 'blue' }"
      [loading]="composer().submitting()"
    >
      Schedule
    </ap-button>

    <!-- 2 · from TypeScript: no form event involved at all. -->
    <ap-button
      [config]="{ style: 'stroked', color: 'blue' }"
      [loading]="composer().submitting()"
      (click)="save()"
    >
      Schedule (from TypeScript)
    </ap-button>
  </div>
</form>`;

/**
 * The programmatic path. `submit()` is the same function the directive calls, so
 * there is no second code path: same touched cascade, same `submitting()`, same
 * server errors landing on fields. A view-model can own this and the template
 * never needs `[formRoot]` at all.
 */
export const SIGNAL_SUBMIT_PROGRAMMATIC = `protected async save(): Promise<boolean> {
  return await submit(this.composer);
}`;

/** From `submit-page.ts` — the form-level list, without walking any controls. */
export const SIGNAL_SUBMIT_SUMMARY = `protected readonly summary = computed(() =>
  this.composer()
    .errorSummary()
    .map((error) => ({
      label: String(error.fieldTree().keyInParent()),
      message: error.message ?? error.kind,
    })),
);`;
