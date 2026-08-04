import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, switchMap, throwError, timer } from 'rxjs';

/**
 * Canned backend so the async-validation demos work with no server.
 *
 * This matters for the Signal Forms story: `validateHttp` performs a real
 * HttpClient request, so faking at the interceptor layer keeps the demo code
 * identical to production code.
 */

/** Type any of these and the duplicate check will reject the post. */
export const ALREADY_PUBLISHED = [
  'we are hiring',
  'new blog post is live',
  'behind the scenes',
];

/**
 * Type this and the *check itself* fails (503) instead of answering.
 *
 * Without it, `onError` is unreachable in the demo — and "what does the form do
 * when the validator can't reach the server" is the question that actually gets
 * asked in review.
 */
export const CHECK_UNAVAILABLE = 'server is down';

export const DUPLICATE_CHECK_URL = '/api/duplicate-check';

export const fakeBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(DUPLICATE_CHECK_URL)) {
    return next(req);
  }

  // Accept either HttpParams (the reactive page) or a query string baked into
  // the URL (validateHttp, whose `request` returns a plain URL).
  const fromParams = req.params.get('content');
  const fromUrl = new URL(req.url, 'http://localhost').searchParams.get('content');
  const content = (fromParams ?? fromUrl ?? '').toLowerCase();

  if (content.includes(CHECK_UNAVAILABLE)) {
    // `delay` does not delay error notifications, so the latency has to come
    // from a timer the error is switched onto.
    return timer(700).pipe(
      switchMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              statusText: 'Service Unavailable',
              url: req.url,
            }),
        ),
      ),
    );
  }

  const duplicate = ALREADY_PUBLISHED.some((phrase) => content.includes(phrase));

  return of(
    new HttpResponse({
      status: 200,
      body: {
        duplicate,
        publishedAt: duplicate ? '2026-07-14' : null,
      },
    }),
  ).pipe(delay(700)); // visible latency, so `pending()` is demonstrable
};

export interface DuplicateCheckResponse {
  duplicate: boolean;
  publishedAt: string | null;
}
