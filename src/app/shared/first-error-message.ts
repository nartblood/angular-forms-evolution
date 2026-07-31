import { FieldTree } from '@angular/forms/signals';

/**
 * The view's entire job when the rules declare their own copy.
 *
 * Read the field, bail out if the user hasn't left it yet, hand back the first
 * error's message. No `kind` → key table, no translation service in the view, no
 * `?? 'Invalid'` fallback: the validator already decided what to say, so this
 * stays a two-line function that every field can share.
 *
 * Call it from a `computed` in the component (or presenter) and bind the result:
 *
 * ```ts
 * readonly contentError = computed(() => firstErrorMessage(this.composer.content));
 * ```
 * ```html
 * @if (contentError(); as message) {
 *   <ap-form-message messageType="error" [message]="message" />
 * }
 * ```
 *
 * Returns `null` — not `'Invalid'` — when the error carries no message, which is
 * the case for a built-in used without `message` or a Zod issue mapped through
 * `validateStandardSchema`. Those need the template-pipe fallback shown on S9.
 */
export function firstErrorMessage<T>(field: FieldTree<T>): string | null {
  const state = field();

  // Blur sets `touched`, and `submit()` marks the whole tree touched, so this one
  // condition covers "left the field" and "tried to submit" alike.
  if (!state.touched()) return null;

  return state.errors()[0]?.message ?? null;
}
