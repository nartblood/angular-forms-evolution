import { Channel } from './channel';

export interface MediaItem {
  url: string;
  altText: string;
}

export type PublishMode = 'now' | 'scheduled';

export interface PostDraft {
  channels: Channel[];
  content: string;
  publishMode: PublishMode;
  /** `yyyy-MM-ddTHH:mm`, the shape `<input type="datetime-local">` produces. */
  scheduledAt: string;
  media: MediaItem[];
  firstComment: string;
}

/**
 * A factory, not a shared constant: a module-level object would hand every form
 * the same `channels` / `media` array references. Spread-based so keys explicitly
 * set to undefined survive (structuredClone drops them under jsdom).
 */
export function emptyDraft(): PostDraft {
  return {
    channels: [],
    content: '',
    publishMode: 'now',
    scheduledAt: '',
    media: [],
    firstComment: '',
  };
}

export function emptyMediaItem(): MediaItem {
  return { url: '', altText: '' };
}

/** Stands in for a draft loaded from the API, used by the "load existing" demos. */
export function existingDraft(): PostDraft {
  return {
    channels: ['linkedin', 'instagram'],
    content: 'Behind the scenes of our latest release 🚀',
    publishMode: 'scheduled',
    scheduledAt: '2026-09-01T09:30',
    media: [{ url: 'https://picsum.photos/seed/ap/800/600', altText: 'Team at work' }],
    firstComment: '#engineering #angular',
  };
}
