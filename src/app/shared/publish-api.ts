import { Injectable } from '@angular/core';
import { PostDraft } from './post-draft';

export interface PublishSuccess {
  ok: true;
  id: string;
}

export interface PublishFailure {
  ok: false;
  /** Which field the server blames — drives the field-targeted error demos. */
  field: 'channels' | 'content';
  kind: string;
}

export type PublishResult = PublishSuccess | PublishFailure;

@Injectable({ providedIn: 'root' })
export class PublishApi {
  /**
   * Demo rule: publishing to Instagram always fails with an expired token.
   * That gives every implementation the same server-side rejection to route
   * back onto a specific field.
   */
  async publish(draft: PostDraft): Promise<PublishResult> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    if (draft.channels.includes('instagram')) {
      return { ok: false, field: 'channels', kind: 'instagramTokenExpired' };
    }

    return { ok: true, id: 'post_8f21c' };
  }
}
