import { useSyncExternalStore } from 'react';
import type { PlaybackController, PlaybackState } from '../types';

export function usePlaybackState(controller: PlaybackController): PlaybackState {
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
