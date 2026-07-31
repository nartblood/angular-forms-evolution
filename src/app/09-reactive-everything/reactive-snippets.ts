/**
 * The worst four moments of the reactive implementation, shown in place.
 * Guarded verbatim against `reactive-page.ts`.
 */

export const REACTIVE_ASYNC_VALIDATOR = `private duplicateContentValidator(): AsyncValidatorFn {
  const cache = new Map<string, boolean>();

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const content = ((control.value as string) ?? '').trim();
    if (content.length < 5) return of(null);

    if (cache.has(content)) {
      return of(cache.get(content) ? { duplicateContent: true } : null);
    }

    return timer(400).pipe(
      switchMap(() =>
        this.http.get<DuplicateCheckResponse>(DUPLICATE_CHECK_URL, { params: { content } }),
      ),
      tap((res) => cache.set(content, res.duplicate)),
      map((res) =>
        res.duplicate ? { duplicateContent: { publishedAt: res.publishedAt } } : null,
      ),
      catchError(() => of({ duplicateCheckFailed: true })),
      first(),
    );
  };
}`;

export const REACTIVE_LOADING = `protected loadExisting(): void {
  const draft = existingDraft();

  this.form.patchValue(draft, { emitEvent: false });

  this.media.clear({ emitEvent: false });
  draft.media.forEach((item) =>
    this.media.push(
      this.fb.group({
        url: this.fb.control(item.url, { validators: [Validators.required] }),
        altText: this.fb.control(item.altText, { validators: [Validators.required] }),
      }),
    ),
  );

  this.applyPublishModeRules(draft.publishMode);
  this.applyChannelRules(draft.channels);
  this.form.markAsPristine();
  this.form.updateValueAndValidity();
}`;

export const REACTIVE_SETTLED = `/** PAIN 9: "submit once validation settles" is universal, and unimplemented. */
private async settled(): Promise<void> {
  if (!this.form.pending) return;
  await firstValueFrom(
    this.form.statusChanges.pipe(
      filter((status) => status !== 'PENDING'),
      first(),
    ),
  );
}`;

export const REACTIVE_SERVER_ERROR = `if (!result.ok) {
  const control = this.form.get(result.field); // AbstractControl | null
  control?.setErrors({ server: result.kind });
  control?.markAsTouched();
  this.serverError = \`Server rejected the post: \${result.kind}\`;
  // ...and this error is wiped the next time the control revalidates.
  return;
}`;

export const REACTIVE_CROSS_FIELD = `const contentWithinChannelLimit: ValidatorFn = (group): ValidationErrors | null => {
  const channels = group.get('channels')!.value as Channel[];
  const content = (group.get('content')!.value as string) ?? '';
  const limit = contentLimitFor(channels);

  return content.length > limit ? { contentTooLong: { limit, actual: content.length } } : null;
};`;
