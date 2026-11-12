import type { Feed, Provider } from '../types';
import { formatLocation, formatServices } from '../lib/search';
import { ExternalIcon, PlayIcon } from './icons';

interface StationRowProps {
  feed: Feed;
  provider: Provider | undefined;
  selected: boolean;
  playing: boolean;
  onSelect: (feed: Feed) => void;
  onPlay: (feed: Feed) => void;
}

export function StationRow({ feed, provider, selected, playing, onSelect, onPlay }: StationRowProps) {
  const external = feed.playback.method === 'external';
  const availability =
    feed.availability.status === 'offline' ? 'Offline' : feed.availability.status === 'online' ? 'Online' : null;

  let action;
  if (selected) {
    action = <span className="station-row__selected">{playing ? 'Selected · Playing' : 'Selected'}</span>;
  } else if (external) {
    action = (
      <a
        className="station-row__external"
        href={feed.playback.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${feed.name} on ${provider?.name ?? 'the provider site'} (opens in a new tab)`}
      >
        Opens provider site
        <ExternalIcon />
      </a>
    );
  } else {
    action = (
      <button type="button" className="station-row__play" aria-label={`Play ${feed.name}`} onClick={() => onPlay(feed)}>
        <PlayIcon />
      </button>
    );
  }

  return (
    <li className="station-row" data-selected={selected || undefined}>
      <button type="button" className="station-row__name" onClick={() => onSelect(feed)}>
        {feed.name}
      </button>
      <p className="station-row__meta">
        <span className="station-row__location">{formatLocation(feed)}</span>
        <span className="station-row__services">{formatServices(feed.services)}</span>
      </p>
      <div className="station-row__action">
        {availability && (
          <span className="station-row__availability" data-status={feed.availability.status}>
            {availability}
          </span>
        )}
        {action}
      </div>
    </li>
  );
}
