import { loadFavorites, loadVolume, pickInitialStationId, saveFavorites, saveVolume } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('favorites storage', () => {
  it('round-trips favorites', () => {
    expect(saveFavorites(new Set(['x', 'y']))).toBe(true);
    expect([...loadFavorites()]).toEqual(['x', 'y']);
  });
  it('returns an empty set for corrupt data', () => {
    window.localStorage.setItem('signalwatch.favorites.v1', '{not json');
    expect(loadFavorites().size).toBe(0);
    window.localStorage.setItem('signalwatch.favorites.v1', '{"a":1}');
    expect(loadFavorites().size).toBe(0);
  });
  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadFavorites().size).toBe(0);
    expect(saveFavorites(new Set(['x']))).toBe(false);
  });
});

describe('volume storage', () => {
  it('rejects out-of-range values', () => {
    saveVolume(0.4);
    expect(loadVolume()).toBe(0.4);
    window.localStorage.setItem('signalwatch.volume.v1', '7');
    expect(loadVolume()).toBeNull();
  });
});

describe('pickInitialStationId', () => {
  const feeds = [
    { id: 'ext', playback: { method: 'external' } },
    { id: 'dir', playback: { method: 'direct' } },
  ];
  it('restores the last station when it still exists', () => {
    expect(pickInitialStationId(feeds, 'ext')).toBe('ext');
  });
  it('falls back to the first directly playable feed', () => {
    expect(pickInitialStationId(feeds, 'gone')).toBe('dir');
    expect(pickInitialStationId(feeds, null)).toBe('dir');
  });
  it('returns null when nothing is configured', () => {
    expect(pickInitialStationId([], 'x')).toBeNull();
  });
});
