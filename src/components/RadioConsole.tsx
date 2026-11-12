import { useRef, type CSSProperties } from 'react';
import type { Feed, PlaybackState, Provider } from '../types';
import { formatLocation, formatServices } from '../lib/search';
import { ExternalIcon, PlayIcon, SpeakerIcon, StarIcon, StopIcon, SwapIcon } from './icons';
import { getStatusCopy, isAudioActive } from './statusCopy';

interface RadioConsoleProps {
  feed: Feed | null;
  provider: Provider | undefined;
  state: PlaybackState;
  saved: boolean;
  onPlayToggle: () => void;
  onRetry: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onChangeStation: () => void;
  onToggleSave: () => void;
}

export function RadioConsole({
  feed,
  provider,
  state,
  saved,
  onPlayToggle,
  onRetry,
  onVolumeChange,
  onMuteToggle,
  onChangeStation,
  onToggleSave,
}: RadioConsoleProps) {
  const providerName = provider?.name ?? 'The provider';
  const copy = getStatusCopy(state, feed, providerName);
  const external = feed?.playback.method === 'external';
  const active = !external && isAudioActive(state);
  const volumePercent = Math.round(state.volume * 100);
  const shownPercent = state.muted ? 0 : volumePercent;
  const playButtonRef = useRef<HTMLButtonElement>(null);
  // Retry unmounts itself once reconnecting starts; keep keyboard focus in the console.
  const handleRetry = () => {
    onRetry();
    playButtonRef.current?.focus();
  };

  return (
    <section className="console" aria-label="Radio">
      <span className="screw screw--tl" aria-hidden="true" />
      <span className="screw screw--tr" aria-hidden="true" />
      <span className="screw screw--bl" aria-hidden="true" />
      <span className="screw screw--br" aria-hidden="true" />

      <div className="console__top">
        <div className="console__station">
          <p className="console__eyebrow">Selected station</p>
          <h2 className="console__name">{feed ? feed.name : 'No station selected'}</h2>
          {feed && (
            <p className="console__meta">
              {formatLocation(feed)} · {formatServices(feed.services)}
            </p>
          )}
        </div>
        <p className="badge">{copy.badge}</p>
      </div>

      <div className="tuner" aria-hidden="true" data-live={state.status === 'playing' && !external}>
        <div className="tuner__scale" />
        <div className="tuner__needle" />
      </div>

      <div className="console__playback">
        <div className="console__transport">
          {feed && external ? (
            <a
              className="play-button"
              href={feed.playback.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${feed.name} on ${providerName} (opens in a new tab)`}
            >
              <ExternalIcon className="play-button__icon play-button__icon--external" />
            </a>
          ) : (
            <button
              ref={playButtonRef}
              type="button"
              className="play-button"
              onClick={onPlayToggle}
              disabled={!feed}
              aria-label={feed ? `${active ? 'Stop' : 'Play'} ${feed.name}` : 'Play'}
            >
              {active ? (
                <StopIcon className="play-button__icon" />
              ) : (
                <PlayIcon className="play-button__icon play-button__icon--play" />
              )}
            </button>
          )}
          <div className="console__status">
            <p className="console__title">{copy.title}</p>
            <p className="console__helper">{copy.helper}</p>
            {!external && state.status === 'error' && (state.error === 'network' || state.error === null) && (
              <button type="button" className="console-button console-button--small" onClick={handleRetry}>
                Retry
              </button>
            )}
          </div>
        </div>

        {feed && !external && (
          <div className="volume">
            <button
              type="button"
              className="volume__mute"
              onClick={onMuteToggle}
              aria-label="Mute"
              aria-pressed={state.muted}
            >
              <SpeakerIcon muted={state.muted} />
            </button>
            {state.volumeSupported ? (
              <>
                <label className="volume__label" htmlFor="volume-slider">
                  Volume
                </label>
                <input
                  id="volume-slider"
                  className="volume__slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={shownPercent}
                  style={{ '--fill': `${shownPercent}%` } as CSSProperties}
                  onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
                />
              </>
            ) : (
              <p className="volume__hint">Use your device’s volume buttons</p>
            )}
          </div>
        )}
      </div>

      <div className="console__actions">
        <div className="console__buttons">
          <button type="button" className="console-button" onClick={onChangeStation}>
            <SwapIcon />
            Change station
          </button>
          {feed && (
            <button type="button" className="console-button" aria-pressed={saved} onClick={onToggleSave}>
              <StarIcon filled={saved} />
              {saved ? 'Saved' : 'Save station'}
            </button>
          )}
        </div>
        {feed && (
          <div className="console__source">
            {feed.delayNote && <p className="console__delay">{feed.delayNote}</p>}
            {provider && <p className="console__attribution">{provider.attribution}</p>}
            <a className="console__source-link" href={feed.sourceUrl} target="_blank" rel="noopener noreferrer">
              Feed source
              <ExternalIcon />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
