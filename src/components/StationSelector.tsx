import { useId, type Ref } from 'react';
import type { Feed, Provider, StationFilter } from '../types';
import { SearchIcon } from './icons';
import { StationRow } from './StationRow';

const FILTERS: { value: StationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'police', label: 'Police' },
  { value: 'fire', label: 'Fire' },
  { value: 'ems', label: 'EMS' },
  { value: 'saved', label: 'Saved' },
];

interface StationSelectorProps {
  feeds: Feed[];
  totalFeeds: number;
  getProvider: (feed: Feed) => Provider | undefined;
  selectedId: string | null;
  playingId: string | null;
  query: string;
  filter: StationFilter;
  hasSaved: boolean;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: StationFilter) => void;
  onReset: () => void;
  onSelect: (feed: Feed) => void;
  onPlay: (feed: Feed) => void;
  sectionRef?: Ref<HTMLElement>;
  searchRef?: Ref<HTMLInputElement>;
}

export function StationSelector({
  feeds,
  totalFeeds,
  getProvider,
  selectedId,
  playingId,
  query,
  filter,
  hasSaved,
  onQueryChange,
  onFilterChange,
  onReset,
  onSelect,
  onPlay,
  sectionRef,
  searchRef,
}: StationSelectorProps) {
  const headingId = useId();
  const searchId = useId();

  let emptyMessage: string | null = null;
  if (feeds.length === 0) {
    if (totalFeeds === 0) emptyMessage = 'No stations configured.';
    else if (filter === 'saved' && !hasSaved && query.trim() === '') emptyMessage = 'No saved stations yet.';
    else emptyMessage = 'No stations match.';
  }

  return (
    <section className="stations" aria-labelledby={headingId} ref={sectionRef}>
      <div className="stations__head">
        <h2 className="stations__title" id={headingId}>
          Choose a station
        </h2>
        <div className="search">
          <label className="sr-only" htmlFor={searchId}>
            Search city or station
          </label>
          <SearchIcon className="search__icon" />
          <input
            id={searchId}
            ref={searchRef}
            className="search__input"
            type="search"
            placeholder="Search city or station"
            autoComplete="off"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter stations">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="filters__button"
            aria-pressed={filter === f.value}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {emptyMessage ? (
        <div className="stations__empty">
          <p>{emptyMessage}</p>
          {totalFeeds > 0 && (
            <button type="button" className="text-button" onClick={onReset}>
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <ul className="station-list">
          {feeds.map((feed) => (
            <StationRow
              key={feed.id}
              feed={feed}
              provider={getProvider(feed)}
              selected={feed.id === selectedId}
              playing={feed.id === playingId}
              onSelect={onSelect}
              onPlay={onPlay}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
