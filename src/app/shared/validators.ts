import { SchemaPath, validate } from '@angular/forms/signals';

/**
 * Shared custom rules.
 *
 * There is no separate "custom validator" concept in Signal Forms. `required`,
 * `minLength` and friends are just functions that register logic against a path,
 * so a custom rule is a function that calls `validate()` — and it composes
 * exactly like a built-in: inside `form()`, inside `schema()`, inside
 * `applyEach()`, with `when` conditions, anywhere.
 *
 * Compare with reactive forms, where a shared rule is a `ValidatorFn` handed to
 * `setValidators()`, and combining it with a conditional rule means an
 * imperative method plus a subscription.
 */

/** Social platforms reject plain-http media; require TLS. */
export function httpsUrl(path: SchemaPath<string>, options?: { message?: string }): void {
  validate(path, ({ value }) => {
    const raw = value().trim();
    if (!raw) return null; // `required` is a separate, composable concern

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return { kind: 'url', message: options?.message ?? 'Enter a valid URL' };
    }

    return parsed.protocol === 'https:'
      ? null
      : { kind: 'httpsUrl', message: options?.message ?? 'The URL must use https' };
  });
}

/** Hashtag stuffing hurts reach; cap it. */
export function maxHashtags(
  path: SchemaPath<string>,
  max: number,
  options?: { message?: string },
): void {
  validate(path, ({ value }) => {
    const count = (value().match(/#[\p{L}\p{N}_]+/gu) ?? []).length;

    return count > max
      ? {
          kind: 'maxHashtags',
          message: options?.message ?? `Use at most ${max} hashtags (found ${count})`,
        }
      : null;
  });
}
