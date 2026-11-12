import type { Feed, PlaybackState } from '../types';

export interface StatusCopy {
  badge: string;
  title: string;
  helper: string;
}

/** UI copy for every console state; strings are fixed by the SIGNALWATCH spec. */
export function getStatusCopy(state: PlaybackState, feed: Feed | null, providerName: string): StatusCopy {
  if (!feed) {
    return { badge: 'UNAVAILABLE', title: 'No stations configured', helper: 'The directory is empty. See About.' };
  }
  if (feed.playback.method === 'external') {
    return {
      badge: 'EXTERNAL',
      title: 'Plays on the provider’s site',
      helper: `${providerName} allows listening only in its own player`,
    };
  }
  switch (state.status) {
    case 'connecting':
      return state.retryAttempt > 0
        ? { badge: 'CONNECTING', title: 'Reconnecting…', helper: `Attempt ${state.retryAttempt} of 3` }
        : { badge: 'CONNECTING', title: 'Connecting…', helper: 'Reaching the live stream' };
    case 'playing':
      return { badge: 'LIVE', title: 'Playing live', helper: 'Silence between transmissions is normal' };
    case 'buffering':
      return { badge: 'BUFFERING', title: 'Buffering…', helper: 'Waiting for audio' };
    case 'paused':
      return { badge: 'STOPPED', title: 'Stopped', helper: 'Press play to rejoin the live stream' };
    case 'error':
      switch (state.error) {
        case 'unsupported':
          return { badge: 'ERROR', title: 'This browser can’t play this stream', helper: 'Use the feed source link instead' };
        case 'blocked':
          return { badge: 'BLOCKED', title: 'Playback was blocked', helper: 'Press play again to start' };
        case 'offline':
          return { badge: 'OFFLINE', title: 'Station offline', helper: 'The provider reports this feed is offline' };
        default:
          return {
            badge: 'ERROR',
            title: 'Can’t reach this stream',
            helper: 'The source may be down, or blocked on your network.',
          };
      }
    default:
      return { badge: 'READY', title: 'Ready to play', helper: 'Press play to connect' };
  }
}

export function isAudioActive(state: PlaybackState): boolean {
  return state.status === 'connecting' || state.status === 'playing' || state.status === 'buffering';
}
