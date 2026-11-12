// STUB written by the lead so the UI slice compiles. The playback slice replaces this file.
import type { PlaybackController, PlaybackState } from '../types';

export interface PlaybackControllerOptions {
  createAudio?: () => HTMLAudioElement;
  initialVolume?: number;
  maxRetries?: number;
  retryDelaysMs?: number[];
  connectTimeoutMs?: number;
  bufferingTimeoutMs?: number;
}

export function createPlaybackController(_options: PlaybackControllerOptions = {}): PlaybackController {
  void _options;
  const state: PlaybackState = {
    stationId: null, status: 'idle', error: null, retryAttempt: 0, volume: 0.8, muted: false, volumeSupported: true,
  };
  return {
    getState: () => state, subscribe: () => () => {}, select() {}, play() {}, pause() {}, toggle() {}, retry() {},
    setVolume() {}, setMuted() {}, destroy() {},
  };
}

export function usePlaybackState(controller: PlaybackController): PlaybackState {
  return controller.getState();
}
