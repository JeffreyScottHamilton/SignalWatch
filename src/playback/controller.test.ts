import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeFeed } from '../test/fixtures';
import { createPlaybackController, type PlaybackControllerOptions } from './index';

interface PlayCall {
  src: string;
  resolve: () => void;
  reject: (e: unknown) => void;
}

class FakeAudio extends EventTarget {
  src = '';
  volume = 1;
  muted = false;
  preload = '';
  error: { code: number } | null = null;
  supported = true;
  calls: PlayCall[] = [];
  log: string[] = [];
  play() {
    this.log.push(`play:${this.src}`);
    return new Promise<void>((resolve, reject) => {
      this.calls.push({ src: this.src, resolve, reject });
    });
  }
  pause() {
    this.log.push('pause');
  }
  load() {
    this.log.push('load');
  }
  removeAttribute(name: string) {
    if (name === 'src') {
      this.src = '';
      this.log.push('removeSrc');
    }
  }
  canPlayType() {
    return this.supported ? 'maybe' : '';
  }
  fire(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

class NoVolumeAudio extends FakeAudio {
  constructor() {
    super();
    Object.defineProperty(this, 'volume', { get: () => 1, set: () => {} });
  }
}

const A = makeFeed({ id: 'a', playback: { method: 'direct', url: 'https://s.test/a', mimeType: 'audio/mpeg', cacheBustParam: 't' } });
const B = makeFeed({ id: 'b', playback: { method: 'direct', url: 'https://s.test/b?x=1', mimeType: 'audio/mpeg', cacheBustParam: 'cb' } });

function setup(opts: PlaybackControllerOptions = {}, Ctor: typeof FakeAudio = FakeAudio) {
  const created: FakeAudio[] = [];
  const controller = createPlaybackController({
    createAudio: () => {
      const a = new Ctor();
      created.push(a);
      return a as unknown as HTMLAudioElement;
    },
    ...opts,
  });
  return { controller, created, audio: () => created[0]! };
}

const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
});
afterEach(() => vi.useRealTimers());

describe('playback controller', () => {
  it('starts idle and never loads or autoplays', () => {
    const { controller, created } = setup();
    controller.select(A);
    expect(controller.getState()).toMatchObject({ status: 'idle', stationId: 'a', error: null, retryAttempt: 0 });
    expect(created).toHaveLength(1);
    expect(created[0].calls).toHaveLength(0);
    expect(created[0].src).toBe('');
  });

  it('is connecting after click and playing only after the playing event', () => {
    const { controller, audio } = setup();
    controller.play(A);
    expect(controller.getState().status).toBe('connecting');
    expect(audio().calls).toHaveLength(1);
    expect(audio().preload).toBe('none');
    audio().fire('playing');
    expect(controller.getState().status).toBe('playing');
  });

  it('appends the cache-bust param correctly with and without an existing query', () => {
    const { controller, audio } = setup();
    controller.play(A);
    expect(audio().calls[0]!.src).toBe('https://s.test/a?t=1000000');
    controller.play(B);
    expect(audio().calls[1]!.src).toBe('https://s.test/b?x=1&cb=1000000');
  });

  it('maps a NotAllowedError rejection to blocked without retrying', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().calls[0]!.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' }));
    await flush();
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'blocked' });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(audio().calls).toHaveLength(1);
  });

  it('ignores AbortError rejections', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().calls[0]!.reject(Object.assign(new Error('x'), { name: 'AbortError' }));
    await flush();
    expect(controller.getState().status).toBe('connecting');
  });

  it('reports unsupported for NotSupportedError when the format cannot play', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().supported = false;
    audio().calls[0]!.reject(Object.assign(new Error('x'), { name: 'NotSupportedError' }));
    await flush();
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'unsupported' });
  });

  it('treats NotSupportedError as network failure when the format is playable', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().calls[0]!.reject(Object.assign(new Error('x'), { name: 'NotSupportedError' }));
    await flush();
    expect(controller.getState()).toMatchObject({ status: 'connecting', retryAttempt: 1 });
  });

  it('reports unsupported for a MediaError code 4 with no canPlayType support', () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().supported = false;
    audio().error = { code: 4 };
    audio().fire('error');
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'unsupported' });
  });

  it('retries exactly maxRetries times then errors and stops', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    const delays = [1000, 2000, 4000];
    for (let i = 0; i < 3; i++) {
      audio().error = { code: 2 };
      audio().fire('error');
      expect(controller.getState()).toMatchObject({ status: 'connecting', retryAttempt: i + 1 });
      await vi.advanceTimersByTimeAsync(delays[i]!);
      expect(audio().calls).toHaveLength(i + 2);
    }
    audio().fire('error');
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'network', retryAttempt: 0 });
    expect(audio().src).toBe('');
    await vi.advanceTimersByTimeAsync(600_000);
    expect(audio().calls).toHaveLength(4);
  });

  it('retry() resets the budget and reconnects from error', async () => {
    const { controller, audio } = setup({ maxRetries: 0 });
    controller.play(A);
    audio().fire('error');
    expect(controller.getState().error).toBe('network');
    controller.retry();
    expect(controller.getState().status).toBe('connecting');
    expect(audio().calls).toHaveLength(2);
    audio().fire('playing');
    expect(controller.getState().status).toBe('playing');
  });

  it('retry() without a station is a no-op', () => {
    const { controller, created } = setup();
    controller.retry();
    expect(controller.getState().status).toBe('idle');
    expect(created).toHaveLength(1);
    expect(created[0].calls).toHaveLength(0);
    expect(created[0].src).toBe('');
  });

  it('counts a connect timeout as a network failure', async () => {
    const { controller, audio } = setup({ maxRetries: 0 });
    controller.play(A);
    await vi.advanceTimersByTimeAsync(14_999);
    expect(controller.getState().status).toBe('connecting');
    await vi.advanceTimersByTimeAsync(1);
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'network' });
    expect(audio().src).toBe('');
  });

  it('goes waiting -> buffering -> playing, and a stuck buffer reconnects', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().fire('waiting'); // before any playback: not buffering
    expect(controller.getState().status).toBe('connecting');
    audio().fire('playing');
    audio().fire('waiting');
    expect(controller.getState().status).toBe('buffering');
    audio().fire('playing');
    expect(controller.getState().status).toBe('playing');
    audio().fire('stalled');
    expect(controller.getState().status).toBe('buffering');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(controller.getState()).toMatchObject({ status: 'connecting', retryAttempt: 1 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(audio().calls).toHaveLength(2);
  });

  it('treats ended on a live stream as a dropped stream', () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().fire('playing');
    audio().fire('ended');
    expect(controller.getState()).toMatchObject({ status: 'connecting', retryAttempt: 1 });
  });

  it('pause disconnects the stream and resume reconnects with a fresh cache-bust value', () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().fire('playing');
    controller.pause();
    expect(controller.getState().status).toBe('paused');
    expect(audio().src).toBe('');
    expect(audio().log.slice(-3)).toEqual(['pause', 'removeSrc', 'load']);
    vi.setSystemTime(2_000_000);
    controller.toggle();
    expect(controller.getState().status).toBe('connecting');
    expect(audio().calls[1]!.src).toBe('https://s.test/a?t=2000000');
  });

  it('an unsolicited element pause while playing behaves like pause()', () => {
    const { controller, audio } = setup();
    controller.play(A);
    audio().fire('playing');
    audio().fire('pause');
    expect(controller.getState().status).toBe('paused');
    expect(audio().src).toBe('');
  });

  it('select while playing switches and keeps playing; never two streams', () => {
    const { controller, created, audio } = setup();
    controller.play(A);
    audio().fire('playing');
    controller.select(B);
    expect(controller.getState()).toMatchObject({ stationId: 'b', status: 'connecting' });
    expect(created).toHaveLength(1);
    const log = audio().log;
    const removeIdx = log.lastIndexOf('removeSrc');
    expect(removeIdx).toBeGreaterThan(-1);
    expect(removeIdx).toBeLessThan(log.findIndex((l) => l.startsWith('play:https://s.test/b')));
    audio().fire('playing');
    expect(controller.getState().status).toBe('playing');
  });

  it('select while stopped stays idle and clears the error', () => {
    const { controller, audio } = setup({ maxRetries: 0 });
    controller.play(A);
    audio().fire('error');
    expect(controller.getState().error).toBe('network');
    controller.select(B);
    expect(controller.getState()).toMatchObject({ stationId: 'b', status: 'idle', error: null, retryAttempt: 0 });
    expect(audio().calls).toHaveLength(1);
  });

  it('select(null) tears down', () => {
    const { controller, audio } = setup();
    controller.play(A);
    controller.select(null);
    expect(controller.getState()).toMatchObject({ stationId: null, status: 'idle' });
    expect(audio().src).toBe('');
  });

  it('ignores stale play() promises and timers from a previous connection', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    const staleA = audio().calls[0]!;
    controller.select(B);
    audio().fire('playing');
    expect(controller.getState()).toMatchObject({ stationId: 'b', status: 'playing' });

    staleA.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' }));
    await flush();
    expect(controller.getState()).toMatchObject({ stationId: 'b', status: 'playing', error: null });
    staleA.resolve();
    await vi.advanceTimersByTimeAsync(100_000); // A's connect timeout must not fire either
    expect(controller.getState()).toMatchObject({ stationId: 'b', status: 'playing', error: null, retryAttempt: 0 });
    expect(audio().calls).toHaveLength(2);
  });

  it('ignores a stale network rejection while B is connecting', async () => {
    const { controller, audio } = setup();
    controller.play(A);
    const staleA = audio().calls[0]!;
    controller.select(B);
    staleA.reject(new Error('network'));
    await flush();
    expect(controller.getState()).toMatchObject({ stationId: 'b', status: 'connecting', retryAttempt: 0 });
  });

  it('ignores late element events once the stream is torn down', () => {
    const { controller, audio } = setup();
    controller.play(A);
    controller.pause();
    audio().fire('playing');
    audio().fire('error');
    audio().fire('ended');
    expect(controller.getState()).toMatchObject({ status: 'paused', error: null });
  });

  it('never loads an external feed', () => {
    const ext = makeFeed({ id: 'x', playback: { method: 'external', url: 'https://ext.test' } });
    const { controller, created, audio } = setup();
    controller.play(ext);
    expect(controller.getState()).toMatchObject({ stationId: 'x', status: 'idle' });
    expect(created.every((a) => a.calls.length === 0)).toBe(true);
    controller.play(A);
    audio().fire('playing');
    controller.select(ext);
    expect(controller.getState()).toMatchObject({ stationId: 'x', status: 'idle' });
    expect(audio().src).toBe('');
    expect(audio().calls).toHaveLength(1);
  });

  it('offline feed gives error offline with no play() call', () => {
    const off = makeFeed({ id: 'o', availability: { status: 'offline', checkedAt: null } });
    const { controller, created } = setup();
    controller.play(off);
    expect(controller.getState()).toMatchObject({ status: 'error', error: 'offline' });
    expect(created.every((a) => a.calls.length === 0)).toBe(true);
  });

  it('clamps volume, applies mute, and applies them to a later-created element', () => {
    const { controller, audio } = setup({ initialVolume: 0.3 });
    controller.setVolume(5);
    expect(controller.getState().volume).toBe(1);
    controller.setVolume(-1);
    expect(controller.getState().volume).toBe(0);
    controller.setVolume(0.6);
    controller.setMuted(true);
    controller.play(A);
    expect(audio().volume).toBe(0.6);
    expect(audio().muted).toBe(true);
    controller.setMuted(false);
    controller.setVolume(0.2);
    expect(audio().muted).toBe(false);
    expect(audio().volume).toBe(0.2);
    expect(controller.getState().volumeSupported).toBe(true);
  });

  it('detects platforms that ignore programmatic volume', () => {
    const { controller } = setup({}, NoVolumeAudio);
    controller.play(A);
    expect(controller.getState().volumeSupported).toBe(false);
  });

  it('notifies only on real changes and stops after unsubscribe', () => {
    const { controller } = setup();
    const fn = vi.fn();
    const off = controller.subscribe(fn);
    const before = controller.getState();
    controller.setVolume(0.8);
    expect(fn).not.toHaveBeenCalled();
    expect(controller.getState()).toBe(before);
    controller.select(A);
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    controller.select(B);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('destroy tears down, removes listeners, and stops notifications', () => {
    const { controller, audio } = setup();
    const fn = vi.fn();
    controller.subscribe(fn);
    controller.play(A);
    const a = audio();
    const removed = vi.spyOn(a, 'removeEventListener');
    fn.mockClear();
    controller.destroy();
    expect(a.src).toBe('');
    expect(removed).toHaveBeenCalled();
    a.fire('playing');
    controller.play(B);
    controller.setVolume(0.1);
    expect(fn).not.toHaveBeenCalled();
    expect(controller.getState().status).toBe('connecting');
  });
});
