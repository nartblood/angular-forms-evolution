import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { applyEach, form } from '@angular/forms/signals';

import { emptyDraft, existingDraft, PostDraft } from '../shared/post-draft';
import { composerSchema, mediaItemSchema } from './composer-schema';

/**
 * The rules are testable on their own — no component, no DOM, no TestBed
 * harness beyond an injector. This is the payoff of extracting the schema:
 * in the reactive implementation the same rules are spread across a root
 * validator, two subscriptions and an `applyPlanRules`-style method.
 */
function composerFor(draft: Partial<PostDraft> = {}) {
  const model = signal<PostDraft>({ ...emptyDraft(), ...draft });
  const composer = form(model, composerSchema, { injector: TestBed.inject(Injector) });
  return { model, composer };
}

describe('composerSchema', () => {
  it('requires content and at least one channel', () => {
    const { composer } = composerFor();

    expect(composer.content().invalid()).toBe(true);
    expect(composer.channels().errors()[0].kind).toBe('noChannels');
  });

  it('caps content at the strictest selected channel', () => {
    const { composer } = composerFor({
      channels: ['x', 'linkedin'], // X's 280 wins over LinkedIn's 3000
      content: 'a'.repeat(281),
    });

    expect(composer.content().invalid()).toBe(true);
    expect(composer.content().errors()[0].kind).toBe('overChannelLimit');
  });

  it('clears the length error when the strict channel is deselected', () => {
    const { model, composer } = composerFor({
      channels: ['x'],
      content: 'a'.repeat(281),
    });
    expect(composer.content().invalid()).toBe(true);

    model.update((draft) => ({ ...draft, channels: ['linkedin'] }));

    // No revalidation call: the rule is derived from the model.
    expect(composer.content().valid()).toBe(true);
  });

  it('requires a date only when scheduling', () => {
    const { model, composer } = composerFor({ channels: ['x'], content: 'Hello' });
    expect(composer.scheduledAt().valid()).toBe(true);

    model.update((draft) => ({ ...draft, publishMode: 'scheduled' }));

    expect(composer.scheduledAt().invalid()).toBe(true);
    expect(composer.scheduledAt().errors()[0].kind).toBe('required');
  });

  it('requires media for Instagram', () => {
    const { model, composer } = composerFor({ channels: ['instagram'], content: 'Hello' });

    expect(composer.media().errors()[0].kind).toBe('mediaRequired');

    model.update((draft) => ({
      ...draft,
      media: [{ url: 'https://example.com/a.jpg', altText: 'A photo' }],
    }));

    expect(composer.media().valid()).toBe(true);
  });

  it('validates every media item through applyEach', () => {
    const { composer } = composerFor({
      channels: ['x'],
      content: 'Hello',
      media: [{ url: '', altText: '' }],
    });

    expect(composer.media[0].url().invalid()).toBe(true);
    expect(composer.media[0].altText().invalid()).toBe(true);
  });

  it('accepts a loaded draft as valid without any replay step', () => {
    const { composer } = composerFor(existingDraft());

    expect(composer().valid()).toBe(true);
  });

  it('reuses mediaItemSchema in a form that has no post around it', () => {
    // The claim S8 makes: one definition, two unrelated forms, no repeated rules.
    const bulk = signal([{ url: '', altText: '' }]);
    const bulkForm = form(bulk, (path) => applyEach(path, mediaItemSchema), {
      injector: TestBed.inject(Injector),
    });

    expect(bulkForm[0].url().errors()[0].kind).toBe('required');
    expect(bulkForm[0].altText().errors()[0].kind).toBe('required');

    bulk.set([{ url: 'https://example.com/a.jpg', altText: 'A photo' }]);

    expect(bulkForm().valid()).toBe(true);
  });
});
