import { applyEach, required, schema, validate } from '@angular/forms/signals';

import {
  channelsRequiringMedia,
  contentLimitFor,
  maxMediaFor,
  supportsFirstComment,
} from '../../shared/channel';
import { MediaItem, PostDraft } from '../../shared/post-draft';

/**
 * The composer's rules as a standalone, reusable artifact.
 *
 * No component, no Angular DI, no DOM — so it can be unit-tested directly and
 * shared by every screen that composes a post (composer, bulk editor, drafts).
 * The reactive equivalent is a `ValidatorFn[]` array plus a `setValidators`
 * routine, neither of which travels well between components.
 */

export const mediaItemSchema = schema<MediaItem>((item) => {
  required(item.url, { message: 'URL is required' });
  required(item.altText, { message: 'Alt text is required' });
});

export const composerSchema = schema<PostDraft>((path) => {
  required(path.content, { message: 'Content is required' });

  validate(path.channels, ({ value }) =>
    value().length === 0 ? { kind: 'noChannels', message: 'Pick at least one channel' } : null,
  );

  validate(path.content, ({ value, valueOf }) => {
    const limit = contentLimitFor(valueOf(path.channels));
    const length = value().length;

    return length > limit
      ? {
          kind: 'overChannelLimit',
          message: `${length} characters — the strictest selected channel allows ${limit}`,
        }
      : null;
  });

  required(path.scheduledAt, {
    when: ({ valueOf }) => valueOf(path.publishMode) === 'scheduled',
    message: 'Pick a date and time',
  });

  applyEach(path.media, mediaItemSchema);

  validate(path.media, ({ value, valueOf }) => {
    const channels = valueOf(path.channels);
    const needing = channelsRequiringMedia(channels);

    if (needing.length > 0 && value().length === 0) {
      return { kind: 'mediaRequired', message: `${needing.join(', ')} requires at least one image` };
    }

    const max = maxMediaFor(channels);
    return value().length > max
      ? { kind: 'tooManyMedia', message: `At most ${max} images for the selected channels` }
      : null;
  });

  validate(path.firstComment, ({ value, valueOf }) => {
    if (!value()) return null;

    return supportsFirstComment(valueOf(path.channels))
      ? null
      : { kind: 'firstCommentUnsupported', message: 'No selected channel supports a first comment' };
  });
});
