export const SIGNAL_SUBMIT_ACTION = `submission: {
  action: async (f) => {
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

export const SIGNAL_SUBMIT_BUTTON = `<ap-button
  [loading]="composer().submitting()"
  [disabled]="composer().submitting()"
  (click)="formEl.requestSubmit()"
>
  Schedule
</ap-button>`;
