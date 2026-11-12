/**
 * localStorage access that never throws: private windows, blocked site data
 * and quota errors all degrade to "nothing stored".
 */

const FAVORITES_KEY = 'signalwatch.favorites.v1';
const LAST_STATION_KEY = 'signalwatch.lastStation.v1';
const VOLUME_KEY = 'signalwatch.volume.v1';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored. */
function write(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadFavorites(): Set<string> {
  const raw = read(FAVORITES_KEY);
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

export function saveFavorites(ids: ReadonlySet<string>): boolean {
  return write(FAVORITES_KEY, JSON.stringify([...ids]));
}

export function loadLastStationId(): string | null {
  return read(LAST_STATION_KEY);
}

export function saveLastStationId(id: string): boolean {
  return write(LAST_STATION_KEY, id);
}

export function loadVolume(): number | null {
  const raw = read(VOLUME_KEY);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
}

export function saveVolume(volume: number): boolean {
  return write(VOLUME_KEY, String(volume));
}

/**
 * The station to show on load: the last one selected if it still exists,
 * otherwise the first directly playable feed, otherwise the first feed.
 */
export function pickInitialStationId(
  feeds: { id: string; playback: { method: string } }[],
  lastId: string | null,
): string | null {
  if (lastId && feeds.some((f) => f.id === lastId)) return lastId;
  return (feeds.find((f) => f.playback.method === 'direct') ?? feeds[0])?.id ?? null;
}
