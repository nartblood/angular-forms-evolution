import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * Makes `<ap-button type="submit">` submit its form on the *first* click.
 *
 * `BaseButtonDirective` (ui-components 22.0.4) reads the host `type` in
 * `ngAfterViewInit`, removes it from the host, stores it on a plain property and
 * calls `markForCheck()`. That mark is lost — `ap-button`'s own OnPush view was
 * already refreshed in that same pass — so the inner `<button>` keeps
 * `type="button"` until something else checks that view. An input change does it:
 * `[loading]` flipping, or `[config]="{…}"` being a fresh object literal on the
 * next parent check. In a zoned app that happens on the first event to reach the
 * page, long before the user clicks, which is why the platform's forms work.
 * Zoneless, nothing happens until the click itself — which arrives too late.
 *
 * So this sets the attribute where it belongs, once, after render. Selector-only:
 * import it and every `<ap-button type="submit">` in the component is covered, no
 * markup change. Delete it when `hostType` becomes a signal upstream.
 *
 * Pinned by `probe.spec.ts` (the bug) and `submit-page.spec.ts` (the fix).
 */
@Directive({ selector: 'ap-button[type="submit"]' })
export class ApButtonSubmit {
  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;

    afterNextRender(() => host.querySelector('button')?.setAttribute('type', 'submit'));
  }
}
