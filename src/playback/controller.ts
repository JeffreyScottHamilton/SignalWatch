import type { DirectPlayback, Feed, PlaybackController, PlaybackErrorKind, PlaybackState } from '../types';
import { createMediaSessionBinding } from './mediaSession';

export interface PlaybackControllerOptions {
  createAudio?: () => HTMLAudioElement; // default: () => new Audio()
  initialVolume?: number; // default 0.8
  maxRetries?: number; // default 3 automatic retries
  retryDelaysMs?: number[]; // default [1000, 2000, 4000]
  connectTimeoutMs?: number; // default 15000
  bufferingTimeoutMs?: number; // default 20000
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export function buildStreamUrl(playback: DirectPlayback, now: number): string {
  const param = playback.cacheBustParam;
  if (!param) return playback.url;
  const hashAt = playback.url.indexOf('#');
  const base = hashAt === -1 ? playback.url : playback.url.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : playback.url.slice(hashAt);
  const sep = !base.includes('?') ? '?' : /[?&]$/.test(base) ? '' : '&';
  return `${base}${sep}${encodeURIComponent(param)}=${now}${hash}`;
}

const isActive = (s: PlaybackState['status']) => s === 'connecting' || s === 'playing' || s === 'buffering';

export function createPlaybackController(options: PlaybackControllerOptions = {}): PlaybackController {
  const {
    createAudio = () => new Audio(),
    initialVolume = 0.8,
    maxRetries = 3,
    retryDelaysMs = [1000, 2000, 4000],
    connectTimeoutMs = 15000,
    bufferingTimeoutMs = 20000,
  } = options;

  let state: PlaybackState = {
    stationId: null,
    status: 'idle',
    error: null,
    retryAttempt: 0,
    volume: clamp01(initialVolume),
    muted: false,
    volumeSupported: true,
  };
  const listeners = new Set<() => void>();

  let station: Feed | null = null;
  let audio: HTMLAudioElement | null = null;
  const attached: Array<[string, EventListener]> = [];
  /** Bumped by every connect/stop; async callbacks capture it and bail if it moved. */
  let generation = 0;
  /** True only while a stream is loaded in the element; gates late element events. */
  let connected = false;
  /** Set around our own audio.pause() so its pause event is not read as an OS interruption. */
  let internalPause = false;
  let hasPlayed = false;
  let retryCount = 0;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let bufferTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  const mediaSession = createMediaSessionBinding({ play: () => play(), pause: () => pause() });

  function setState(patch: Partial<PlaybackState>) {
    const next = { ...state, ...patch };
    const changed = (Object.keys(next) as Array<keyof PlaybackState>).some((k) => next[k] !== state[k]);
    if (!changed) return;
    const statusChanged = next.status !== state.status;
    state = next;
    if (statusChanged) mediaSession.setStatus(state.status);
    for (const l of [...listeners]) l();
  }

  function clearTimers() {
    if (connectTimer) clearTimeout(connectTimer);
    if (bufferTimer) clearTimeout(bufferTimer);
    if (retryTimer) clearTimeout(retryTimer);
    connectTimer = bufferTimer = retryTimer = null;
  }

  /** Invalidates the current connection and disconnects the element from the stream. */
  function stop() {
    generation++;
    clearTimers();
    connected = false;
    hasPlayed = false;
    if (!audio) return;
    internalPause = true;
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } finally {
      internalPause = false;
    }
  }

  function fail(kind: PlaybackErrorKind) {
    stop();
    setState({ status: 'error', error: kind, retryAttempt: 0 });
  }

  function networkFailure(gen: number) {
    if (gen !== generation || destroyed) return;
    stop();
    if (retryCount >= maxRetries) {
      setState({ status: 'error', error: 'network', retryAttempt: 0 });
      return;
    }
    retryCount++;
    setState({ status: 'connecting', error: null, retryAttempt: retryCount });
    const delay = retryDelaysMs[retryCount - 1] ?? retryDelaysMs[retryDelaysMs.length - 1] ?? 1000;
    const gen2 = generation;
    retryTimer = setTimeout(() => {
      if (gen2 !== generation) return;
      connect();
    }, delay);
  }

  function onPlayRejected(gen: number, err: unknown) {
    if (gen !== generation || destroyed) return;
    const name = (err as { name?: string } | null)?.name;
    if (name === 'AbortError') return;
    if (name === 'NotAllowedError') return fail('blocked');
    if (name === 'NotSupportedError' && audio && station?.playback.method === 'direct') {
      if (audio.canPlayType(station.playback.mimeType) === '') return fail('unsupported');
    }
    networkFailure(gen);
  }

  const handlers: Record<string, () => void> = {
    playing() {
      if (!connected) return;
      hasPlayed = true;
      retryCount = 0;
      clearTimers();
      setState({ status: 'playing', error: null, retryAttempt: 0 });
    },
    waiting() {
      if (!connected || !hasPlayed || state.status !== 'playing') return;
      setState({ status: 'buffering' });
      const gen = generation;
      if (bufferTimer) clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => networkFailure(gen), bufferingTimeoutMs);
    },
    error() {
      if (!connected || !audio) return;
      const code = audio.error?.code;
      if (code === 4 && station?.playback.method === 'direct' && audio.canPlayType(station.playback.mimeType) === '') {
        return fail('unsupported');
      }
      networkFailure(generation);
    },
    ended() {
      if (connected) networkFailure(generation);
    },
    pause() {
      if (internalPause || !connected) return;
      if (state.status === 'playing' || state.status === 'buffering') pause();
    },
  };
  handlers.stalled = handlers.waiting;

  function ensureAudio(): HTMLAudioElement {
    if (audio) return audio;
    const el = createAudio();
    el.preload = 'none';
    // Probe on the one element we own: iOS Safari silently ignores programmatic volume.
    let supported: boolean;
    try {
      el.volume = 0.5;
      supported = el.volume === 0.5;
    } catch {
      supported = false;
    }
    el.volume = state.volume;
    el.muted = state.muted;
    for (const [type, fn] of Object.entries(handlers)) {
      const listener: EventListener = () => fn();
      el.addEventListener(type, listener);
      attached.push([type, listener]);
    }
    audio = el;
    if (!supported) setState({ volumeSupported: false });
    return el;
  }

  function connect() {
    const feed = station;
    if (!feed || feed.playback.method !== 'direct' || destroyed) return;
    stop();
    const gen = generation;
    const el = ensureAudio();
    connected = true;
    el.src = buildStreamUrl(feed.playback, Date.now());
    mediaSession.setStation(feed);
    connectTimer = setTimeout(() => networkFailure(gen), connectTimeoutMs);
    // Must stay in the caller's tick so the browser counts it as the user gesture.
    try {
      const result = el.play();
      if (result && typeof result.then === 'function') {
        result.then(undefined, (err: unknown) => onPlayRejected(gen, err));
      }
    } catch (err) {
      onPlayRejected(gen, err);
    }
  }

  /** Begins playback of the held station from a clean budget, honouring external/offline rules. */
  function start() {
    const feed = station;
    if (!feed) return;
    retryCount = 0;
    if (feed.playback.method === 'external') {
      stop();
      setState({ status: 'idle', error: null, retryAttempt: 0 });
      return;
    }
    if (feed.availability.status === 'offline') {
      stop();
      setState({ status: 'error', error: 'offline', retryAttempt: 0 });
      return;
    }
    setState({ status: 'connecting', error: null, retryAttempt: 0 });
    connect();
  }

  function pause() {
    if (destroyed) return;
    stop();
    if (station) setState({ status: 'paused', error: null, retryAttempt: 0 });
  }

  function play(feed?: Feed) {
    if (destroyed) return;
    if (feed && feed.id !== station?.id) {
      stop();
      station = feed;
      setState({ stationId: feed.id, status: 'idle', error: null, retryAttempt: 0 });
    } else if (feed) {
      station = feed;
    }
    if (!station) return;
    if (isActive(state.status)) return;
    start();
  }

  // Created up front (it loads nothing until play) so volumeSupported is right
  // before the first render, not only after the first play.
  try {
    ensureAudio();
  } catch {
    // No audio support at all; play() will surface the failure.
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    select(feed) {
      if (destroyed) return;
      const wasActive = isActive(state.status);
      if (feed === null) {
        stop();
        station = null;
        setState({ stationId: null, status: 'idle', error: null, retryAttempt: 0 });
        return;
      }
      if (feed.id === station?.id) {
        station = feed;
        return;
      }
      stop();
      station = feed;
      setState({ stationId: feed.id, status: 'idle', error: null, retryAttempt: 0 });
      if (wasActive || feed.playback.method === 'external') start();
    },
    play,
    pause,
    toggle() {
      if (isActive(state.status)) pause();
      else play();
    },
    retry() {
      if (destroyed || !station) return;
      start();
    },
    setVolume(volume) {
      const v = clamp01(volume);
      if (audio) audio.volume = v;
      setState({ volume: v });
    },
    setMuted(muted) {
      if (audio) audio.muted = muted;
      setState({ muted });
    },
    destroy() {
      if (destroyed) return;
      stop();
      destroyed = true;
      if (audio) for (const [type, fn] of attached) audio.removeEventListener(type, fn);
      attached.length = 0;
      audio = null;
      mediaSession.destroy();
      listeners.clear();
    },
  };
}
