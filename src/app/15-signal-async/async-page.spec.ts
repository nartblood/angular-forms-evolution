import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AsyncPage } from './async-page';
import { CHECK_UNAVAILABLE, fakeBackendInterceptor } from '../shared/fake-backend';

/**
 * `validateHttp` has two failure modes and they are not the same claim: the
 * server *answering* "already published", and the server not answering at all.
 * The second one is the one nobody demos and everybody asks about, so it is
 * driven here through the real HttpClient path the page uses.
 */
describe('S6 · async', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([fakeBackendInterceptor]))],
    });
  });

  async function type(text: string) {
    const fixture = TestBed.createComponent(AsyncPage);
    await fixture.whenStable();

    const page = fixture.componentInstance as unknown as {
      model: { set: (draft: { content: string }) => void };
      composer: { content: () => { errors: () => { kind: string }[]; pending: () => boolean } };
    };

    page.model.set({ ...emptyish(), content: text });
    await fixture.whenStable();

    return { fixture, field: () => page.composer.content() };
  }

  /** The page's model is a whole PostDraft; only `content` matters here. */
  function emptyish() {
    return {
      channels: [],
      content: '',
      publishMode: 'now' as const,
      scheduledAt: '',
      media: [],
      firstComment: '',
    };
  }

  it('rejects content the server says was already published', async () => {
    const { field } = await type('behind the scenes');

    expect(field().errors().map((error) => error.kind)).toEqual(['duplicateContent']);
  });

  it('reports a failed check as an error instead of passing silently', async () => {
    const { field } = await type(CHECK_UNAVAILABLE);

    // The 503 lands in `onError`, so the field is invalid — a form that can't
    // verify a rule does not get to call itself valid.
    expect(field().errors().map((error) => error.kind)).toEqual(['duplicateCheckFailed']);
    expect(field().pending()).toBe(false);
  });
});
