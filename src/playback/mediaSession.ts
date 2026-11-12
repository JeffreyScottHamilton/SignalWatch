import type { Feed, PlaybackStatus } from '../types';

export interface MediaSessionBinding {
  setStation(feed: Feed): void;
  setStatus(status: PlaybackStatus): void;
  destroy(): void;
}

type Action = 'play' | 'pause' | 'stop';
const ACTIONS: Action[] = ['play', 'pause', 'stop'];

/** Best-effort OS media controls; every call is guarded because support varies by browser. */
export function createMediaSessionBinding(handlers: { play(): void; pause(): void }): MediaSessionBinding {
  const session: MediaSession | null =
    typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : null;
  let handlersSet = false;

  const safe = (fn: () => void) => {
    try {
      fn();
    } catch {
      /* unsupported action or metadata: media controls are optional */
    }
  };

  return {
    setStation(feed) {
      if (!session) return;
      safe(() => {
        if (typeof MediaMetadata !== 'undefined') {
          session.metadata = new MediaMetadata({
            title: feed.name,
            artist: `${feed.city}, ${feed.region}`,
            album: 'SIGNALWATCH',
          });
        }
      });
      if (!handlersSet) {
        handlersSet = true;
        for (const action of ACTIONS) {
          safe(() => session.setActionHandler(action, action === 'play' ? handlers.play : handlers.pause));
        }
      }
    },
    setStatus(status) {
      if (!session) return;
      const next: MediaSessionPlaybackState =
        status === 'idle'
          ? 'none'
          : status === 'paused' || status === 'error'
            ? 'paused'
            : 'playing';
      safe(() => {
        session.playbackState = next;
      });
    },
    destroy() {
      if (!session) return;
      if (handlersSet) {
        for (const action of ACTIONS) safe(() => session.setActionHandler(action, null));
      }
      handlersSet = false;
      safe(() => {
        session.metadata = null;
        session.playbackState = 'none';
      });
    },
  };
}
