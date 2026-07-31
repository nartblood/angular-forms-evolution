/**
 * Channel rules for the post composer.
 *
 * These are the *domain* rules — deliberately plain functions with no Angular
 * and no forms API, so all three implementations share exactly the same logic
 * and the comparison stays honest.
 */

export type Channel = 'x' | 'linkedin' | 'instagram' | 'facebook';

export const CHANNELS: readonly Channel[] = ['x', 'linkedin', 'instagram', 'facebook'];

export const CHANNEL_LABEL: Record<Channel, string> = {
  x: 'X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

/** Publicly documented caption limits. */
export const CHANNEL_CONTENT_LIMIT: Record<Channel, number> = {
  x: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
};

export const CHANNEL_MAX_MEDIA: Record<Channel, number> = {
  x: 4,
  linkedin: 9,
  instagram: 10,
  facebook: 10,
};

const REQUIRES_MEDIA: readonly Channel[] = ['instagram'];
const SUPPORTS_FIRST_COMMENT: readonly Channel[] = ['instagram', 'linkedin'];

/** With nothing selected, fall back to the most permissive limit. */
export const DEFAULT_CONTENT_LIMIT = 63206;
export const DEFAULT_MAX_MEDIA = 10;

/** The binding constraint is the strictest selected channel. */
export function contentLimitFor(channels: readonly Channel[]): number {
  if (channels.length === 0) return DEFAULT_CONTENT_LIMIT;
  return Math.min(...channels.map((c) => CHANNEL_CONTENT_LIMIT[c]));
}

export function maxMediaFor(channels: readonly Channel[]): number {
  if (channels.length === 0) return DEFAULT_MAX_MEDIA;
  return Math.min(...channels.map((c) => CHANNEL_MAX_MEDIA[c]));
}

export function channelsRequiringMedia(channels: readonly Channel[]): Channel[] {
  return channels.filter((c) => REQUIRES_MEDIA.includes(c));
}

export function supportsFirstComment(channels: readonly Channel[]): boolean {
  return channels.some((c) => SUPPORTS_FIRST_COMMENT.includes(c));
}

export function toggleChannel(channels: readonly Channel[], channel: Channel): Channel[] {
  return channels.includes(channel)
    ? channels.filter((c) => c !== channel)
    : [...channels, channel];
}
