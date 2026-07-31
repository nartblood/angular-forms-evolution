import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { form, minLength, required } from '@angular/forms/signals';

import { FieldErrorDisplay } from './field-error';
import { provideDemoTranslations } from './i18n';
import { maxHashtags } from './validators';

/**
 * The display policy is now a single component, so it deserves its own tests:
 * every field on every page inherits whatever this does.
 */
@Component({
  imports: [FieldErrorDisplay],
  template: `
    <app-field-error [field]="composer.content" [all]="all()" />
    <app-field-error [field]="composer.title" />
  `,
})
class Host {
  readonly all = signal(false);
  readonly model = signal({ content: '', title: '' });

  readonly composer = form(this.model, (path) => {
    // Two failing rules on one field, from both message sources: `minLength`
    // emits a bare kind, `maxHashtags` carries its own copy.
    minLength(path.content, 30);
    maxHashtags(path.content, 3);

    required(path.title, { message: 'A title is required' });
  });
}

describe('app-field-error', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideDemoTranslations()],
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;

    const shown = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('ap-form-message'),
      ).map((element) => element.textContent?.trim() ?? '');

    return { fixture, host, shown };
  }

  it('shows nothing until the field is touched', async () => {
    const { fixture, host, shown } = setup();
    host.model.set({ content: '#a #b #c #d', title: '' });
    await fixture.whenStable();

    expect(host.composer.content().invalid()).toBe(true);
    expect(shown()).toEqual([]);
  });

  it('shows the first error only, by default', async () => {
    const { fixture, host, shown } = setup();
    host.model.set({ content: '#a #b #c #d', title: '' });
    host.composer.content().markAsTouched();
    await fixture.whenStable();

    // Both rules are failing, but only one message is rendered.
    expect(host.composer.content().errors().length).toBe(2);
    expect(shown()).toEqual(['Write at least 30 characters']);
  });

  it('shows every error with [all]="true"', async () => {
    const { fixture, host, shown } = setup();
    host.model.set({ content: '#a #b #c #d', title: '' });
    host.composer.content().markAsTouched();
    host.all.set(true);
    await fixture.whenStable();

    expect(shown()).toEqual([
      'Write at least 30 characters', // kind → translation key, param from minLength()
      'Use at most 3 hashtags (found 4)', // the validator's own message
    ]);
  });

  it('reveals every field at once when the tree is marked touched, as submit does', async () => {
    const { fixture, host, shown } = setup();
    host.model.set({ content: '#a #b #c #d', title: '' });
    host.composer().markAsTouched(); // exactly what submit() calls
    await fixture.whenStable();

    // Both fields at once, from one call on the root — markAsTouched() cascades.
    expect(shown()).toEqual(['Write at least 30 characters', 'A title is required']);
  });

  it('hides errors again after reset — no separate submitted flag to clear', async () => {
    const { fixture, host, shown } = setup();
    host.model.set({ content: '#a #b #c #d', title: '' });
    host.composer().markAsTouched();
    await fixture.whenStable();
    expect(shown().length).toBe(2);

    host.composer().reset();
    await fixture.whenStable();

    expect(shown()).toEqual([]);
  });
});
