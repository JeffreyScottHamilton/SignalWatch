/**
 * Shared contract for SIGNALWATCH. Feed data, the playback controller and the
 * UI all depend on these types; provider-specific behaviour stays in
 * src/data and src/playback, never in presentational components.
 */

export type ServiceCategory = 'police' | 'fire' | 'ems';

export interface Provider {
  id: string;
  name: string;
  homepage: string;
  /** Who operates the source, in one sentence, for the About dialog. */
  description: string;
  /** Short credit shown next to the feed source link. */
  attribution: string;
}

/** Audio the browser plays directly from the provider's own server. */
export interface DirectPlayback {
  method: 'direct';
  url: string;
  mimeType: string;
  /**
   * Query parameter given a fresh value on every connection, so a resumed
   * stream joins the live edge instead of a cached response.
   */
  cacheBustParam?: string;
}

/**
 * The provider permits listening only in its own player. SIGNALWATCH links
 * out and never loads this audio itself.
 */
export interface ExternalPlayback {
  method: 'external';
  url: string;
}

export interface Feed {
  /** Stable ID; persisted in localStorage for last-selected and favorites. */
  id: string;
  providerId: string;
  name: string;
  city: string;
  region: string;
  country: string;
  /** A mixed feed lists every service it carries and matches each filter. */
  services: ServiceCategory[];
  /** The provider's public page for this feed. */
  sourceUrl: string;
  playback: DirectPlayback | ExternalPlayback;
  /** Documented delay, or null when the provider documents none. */
  delayNote: string | null;
  /** One sentence on what the feed carries, from the provider's own page. */
  coverageNote: string;
  /**
   * Provider-confirmed status only. 'unknown' means nobody has confirmed it;
   * a feed is never assumed online because it is listed.
   */
  availability: { status: 'unknown' | 'online' | 'offline'; checkedAt: string | null };
}

export type StationFilter = 'all' | ServiceCategory | 'saved';

export type PlaybackStatus =
  | 'idle' // station selected (or none); nothing loaded. "Ready to play"
  | 'connecting' // user pressed play; audio has not started yet
  | 'playing' // the audio element reported real playback
  | 'buffering' // was playing; stalled waiting for data
  | 'paused' // user stopped; stream disconnected
  | 'error';

export type PlaybackErrorKind =
  | 'network' // stream unreachable after bounded retries
  | 'unsupported' // browser cannot decode this format
  | 'blocked' // browser refused playback without a user gesture
  | 'offline'; // provider-confirmed offline (feed.availability)

export interface PlaybackState {
  /** ID of the feed the controller currently holds, or null. */
  stationId: string | null;
  status: PlaybackStatus;
  error: PlaybackErrorKind | null;
  /** 0 when not retrying; otherwise the automatic retry attempt number. */
  retryAttempt: number;
  /** 0..1 */
  volume: number;
  muted: boolean;
  /** false where the platform ignores programmatic volume (iOS Safari). */
  volumeSupported: boolean;
}

export interface PlaybackController {
  getState(): PlaybackState;
  subscribe(listener: () => void): () => void;
  /**
   * Select a feed. If audio is active (connecting/playing/buffering) the
   * controller switches to the new feed and keeps playing; otherwise it stays
   * stopped with status 'idle'. Selecting an external feed always stops audio.
   */
  select(feed: Feed | null): void;
  /** Select (if given) and start playback. Must be called from a user gesture. */
  play(feed?: Feed): void;
  /** Stop and disconnect from the live stream. */
  pause(): void;
  toggle(): void;
  /** Manual retry after an error; resets the automatic retry budget. */
  retry(): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  destroy(): void;
}
