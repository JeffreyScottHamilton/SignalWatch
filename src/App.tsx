import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Feed, PlaybackController, StationFilter } from './types';
import { FEEDS, PROVIDERS, getProvider } from './data/feeds';
import { createPlaybackController, usePlaybackState } from './playback';
import { filterFeeds } from './lib/search';
import {
  loadFavorites,
  loadLastStationId,
  loadVolume,
  pickInitialStationId,
  saveFavorites,
  saveLastStationId,
  saveVolume,
} from './lib/storage';
import { SiteHeader } from './components/SiteHeader';
import { RadioConsole } from './components/RadioConsole';
import { StationSelector } from './components/StationSelector';
import { SiteFooter } from './components/SiteFooter';
import { getStatusCopy, isAudioActive } from './components/statusCopy';

interface AppProps {
  feeds?: Feed[];
  controller?: PlaybackController;
}

// One audio controller for the page lifetime, shared across StrictMode re-mounts.
let defaultController: PlaybackController | null = null;
function getDefaultController(): PlaybackController {
  defaultController ??= createPlaybackController({ initialVolume: loadVolume() ?? undefined });
  return defaultController;
}

const providerFor = (feed: Feed) => getProvider(feed.providerId);

export default function App({ feeds = FEEDS, controller: injected }: AppProps) {
  const [controller] = useState(() => injected ?? getDefaultController());
  const state = usePlaybackState(controller);

  const [selectedId, setSelectedId] = useState(() => pickInitialStationId(feeds, loadLastStationId()));
  const [favorites, setFavorites] = useState(loadFavorites);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StationFilter>('all');
  const [announcement, setAnnouncement] = useState('');

  const sectionRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedFeed = feeds.find((f) => f.id === selectedId) ?? null;
  const provider = selectedFeed ? providerFor(selectedFeed) : undefined;
  const visibleFeeds = useMemo(() => filterFeeds(feeds, query, filter, favorites), [feeds, query, filter, favorites]);

  // Hand the restored station to the controller once, without playing.
  const initialSelection = useRef(selectedFeed);
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (initialSelection.current) controller.select(initialSelection.current);
  }, [controller]);

  // Announce only settled outcomes; connecting/buffering would be noise.
  const copy = getStatusCopy(state, selectedFeed, provider?.name ?? 'The provider');
  let message: string | null = null;
  if (selectedFeed && selectedFeed.playback.method === 'direct') {
    if (state.status === 'playing') message = `Playing ${selectedFeed.name}`;
    else if (state.status === 'paused') message = 'Stopped';
    else if (state.status === 'error') message = copy.title;
    // Reset on a fresh attempt so a repeated outcome is announced again.
    else if (state.status === 'connecting' && state.retryAttempt === 0) message = '';
  }
  useEffect(() => {
    if (message !== null) setAnnouncement(message);
  }, [message]);

  const choose = useCallback((feed: Feed) => {
    setSelectedId(feed.id);
    saveLastStationId(feed.id);
  }, []);

  const handleSelect = useCallback(
    (feed: Feed) => {
      choose(feed);
      controller.select(feed);
    },
    [choose, controller],
  );

  const handlePlay = useCallback(
    (feed: Feed) => {
      choose(feed);
      controller.play(feed);
    },
    [choose, controller],
  );

  const handlePlayToggle = () => {
    if (!selectedFeed) return;
    if (isAudioActive(state)) controller.pause();
    else controller.play(selectedFeed);
  };

  const handleVolumeChange = (volume: number) => {
    controller.setVolume(volume);
    if (state.muted && volume > 0) controller.setMuted(false);
    saveVolume(volume);
  };

  const handleChangeStation = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    sectionRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    searchRef.current?.focus({ preventScroll: true });
  };

  const handleToggleSave = () => {
    if (!selectedFeed) return;
    const next = new Set(favorites);
    if (next.has(selectedFeed.id)) next.delete(selectedFeed.id);
    else next.add(selectedFeed.id);
    // A false return means storage is unavailable; the in-memory set still works.
    saveFavorites(next);
    setFavorites(next);
  };

  const playingId = state.status === 'playing' ? (state.stationId ?? selectedId) : null;

  return (
    <div className="page">
      <SiteHeader />
      <main>
        <div className="intro">
          <h1 className="intro__title">Find your frequency.</h1>
          <p className="intro__lede">Choose a station. Press play. Stay tuned.</p>
        </div>

        <RadioConsole
          feed={selectedFeed}
          provider={provider}
          state={state}
          saved={selectedFeed ? favorites.has(selectedFeed.id) : false}
          onPlayToggle={handlePlayToggle}
          onRetry={() => controller.retry()}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={() => controller.setMuted(!state.muted)}
          onChangeStation={handleChangeStation}
          onToggleSave={handleToggleSave}
        />

        <StationSelector
          feeds={visibleFeeds}
          totalFeeds={feeds.length}
          getProvider={providerFor}
          selectedId={selectedId}
          playingId={playingId}
          query={query}
          filter={filter}
          hasSaved={feeds.some((f) => favorites.has(f.id))}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          onReset={() => {
            setQuery('');
            setFilter('all');
          }}
          onSelect={handleSelect}
          onPlay={handlePlay}
          sectionRef={sectionRef}
          searchRef={searchRef}
        />
      </main>
      <SiteFooter providers={PROVIDERS} />
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
