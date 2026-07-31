export const TEMPLATE_DRIVEN_MARKUP = `<textarea
  id="td-content"
  name="content"
  apTextarea
  required
  [maxlength]="contentLimit"
  [(ngModel)]="draft.content"
  #contentCtrl="ngModel"
></textarea>`;

export const TEMPLATE_DRIVEN_MODEL = `/** ngModel mutates this in place. The model *is* the form. */
protected draft: PostDraft = emptyDraft();
protected channelsTouched = false;`;

export const TEMPLATE_DRIVEN_GAP = `protected submit(form: NgForm): void {
  this.channelsTouched = true;

  // The channel rule has to be re-checked by hand: the form knows nothing about it.
  if (form.invalid || this.draft.channels.length === 0) {
    this.saved = null;
    return;
  }`;
