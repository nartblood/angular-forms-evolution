export const SIGNAL_SUBMIT_ACTION = `submission: {
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
},`;

export const SIGNAL_SUBMIT_TEMPLATE = `<form [formRoot]="composer" #formEl novalidate>`;

/** From `submit-page.ts` — the form-level list, without walking any controls. */
export const SIGNAL_SUBMIT_SUMMARY = `protected readonly summary = computed(() =>
  this.composer()
    .errorSummary()
    .map((error) => ({
      label: String(error.fieldTree().keyInParent()),
      message: error.message ?? error.kind,
    })),
);`;

export const SIGNAL_SUBMIT_BUTTON = `<ap-button
  [loading]="composer().submitting()"
  [disabled]="composer().submitting()"
  (click)="formEl.requestSubmit()"
>
  Schedule
</ap-button>`;
