import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncExternalStore } from 'react';
import App from './App';
import { makeFeed } from './test/fixtures';
import type { Feed, PlaybackController, PlaybackState } from './types';

vi.mock('./playback', () => ({
  createPlaybackController: () => {
    throw new Error('tests must inject a controller');
  },
  usePlaybackState: (c: PlaybackController) => useSyncExternalStore(c.subscribe, c.getState),
}));

interface FakeController extends PlaybackController {
  setState(patch: Partial<PlaybackState>): void;
}

function makeController(): FakeController {
  let state: PlaybackState = {
    stationId: null,
    status: 'idle',
    error: null,
    retryAttempt: 0,
    volume: 0.8,
    muted: false,
    volumeSupported: true,
  };
  const listeners = new Set<() => void>();
  const setState = (patch: Partial<PlaybackState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };
  return {
    getState: () => state,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    select: vi.fn((feed: Feed | null) => setState({ stationId: feed?.id ?? null })),
    play: vi.fn(),
    pause: vi.fn(),
    toggle: vi.fn(),
    retry: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    destroy: vi.fn(),
    setState,
  };
}

const durham = makeFeed({ id: 'durham', name: 'Durham Mixed', city: 'Durham', region: 'North Carolina', services: ['police', 'fire', 'ems'] });
const austinFire = makeFeed({ id: 'austin-fire', name: 'Austin Fire', city: 'Austin', region: 'Texas', services: ['fire'] });
const durhamPolice = makeFeed({ id: 'durham-police', name: 'Durham Police Only', city: 'Durham', region: 'North Carolina', services: ['police'] });
const external = makeFeed({
  id: 'ext',
  name: 'External Dispatch',
  services: ['ems'],
  playback: { method: 'external', url: 'https://provider.test/player' },
});
const FIXTURES = [durham, austinFire, durhamPolice, external];

function listNames() {
  return within(screen.getByRole('list')).getAllByRole('listitem').map((li) => li.querySelector('button')?.textContent);
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('App', () => {
  it('starts ready without playing and selects the initial station', () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    expect(screen.getByText('Ready to play')).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Durham Mixed' })).toBeInTheDocument();
    expect(controller.play).not.toHaveBeenCalled();
    expect(controller.select).toHaveBeenCalledWith(durham);
  });

  it('plays a station from its row', async () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    await userEvent.click(screen.getByRole('button', { name: 'Play Austin Fire' }));
    expect(controller.play).toHaveBeenCalledWith(austinFire);
    expect(screen.getByRole('heading', { level: 2, name: 'Austin Fire' })).toBeInTheDocument();
  });

  it('selects a station when its name is clicked', async () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    await userEvent.click(screen.getByRole('button', { name: 'Durham Police Only' }));
    expect(controller.select).toHaveBeenLastCalledWith(durhamPolice);
    expect(controller.play).toHaveBeenCalledTimes(0);
  });

  it('shows stop control and live status while playing, and announces it', () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    act(() => controller.setState({ status: 'connecting' }));
    expect(screen.getByRole('status')).toHaveTextContent('');
    act(() => controller.setState({ status: 'playing' }));
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop Durham Mixed' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Playing Durham Mixed');
    expect(screen.getByText('Selected · Playing')).toBeInTheDocument();
  });

  it('offers retry after a network error', async () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    act(() => controller.setState({ status: 'error', error: 'network' }));
    expect(screen.getByRole('region', { name: 'Radio' })).toHaveTextContent('Can’t reach this stream');
    expect(screen.getByRole('status')).toHaveTextContent('Can’t reach this stream');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(controller.retry).toHaveBeenCalled();
  });

  it('combines search with the category filter', async () => {
    render(<App feeds={FIXTURES} controller={makeController()} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search city or station' }), 'durham');
    expect(listNames()).toEqual(['Durham Mixed', 'Durham Police Only']);
    await userEvent.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.getByRole('button', { name: 'Fire' })).toHaveAttribute('aria-pressed', 'true');
    expect(listNames()).toEqual(['Durham Mixed']);
  });

  it('lists a mixed-service feed under every filter it carries', async () => {
    render(<App feeds={FIXTURES} controller={makeController()} />);
    for (const name of ['Police', 'Fire', 'EMS']) {
      await userEvent.click(screen.getByRole('button', { name }));
      expect(listNames()).toContain('Durham Mixed');
    }
  });

  it('resets search and filters from the empty state', async () => {
    render(<App feeds={FIXTURES} controller={makeController()} />);
    await userEvent.type(screen.getByRole('searchbox'), 'nowhere at all');
    expect(screen.getByText('No stations match.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    expect(listNames()).toHaveLength(4);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('explains an empty Saved filter', async () => {
    render(<App feeds={FIXTURES} controller={makeController()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Saved' }));
    expect(screen.getByText('No saved stations yet.')).toBeInTheDocument();
  });

  it('saves a station and keeps it after a remount', async () => {
    const { unmount } = render(<App feeds={FIXTURES} controller={makeController()} />);
    const radio = () => within(screen.getByRole('region', { name: 'Radio' }));
    await userEvent.click(radio().getByRole('button', { name: 'Save station' }));
    expect(radio().getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
    unmount();
    render(<App feeds={FIXTURES} controller={makeController()} />);
    expect(radio().getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Saved', pressed: false }));
    expect(listNames()).toEqual(['Durham Mixed']);
  });

  it('restores the last selected station on remount', async () => {
    const { unmount } = render(<App feeds={FIXTURES} controller={makeController()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Austin Fire' }));
    unmount();
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Austin Fire' })).toBeInTheDocument();
    expect(controller.select).toHaveBeenCalledWith(austinFire);
    expect(controller.play).not.toHaveBeenCalled();
  });

  it('opens and closes the About dialog', async () => {
    render(<App feeds={FIXTURES} controller={makeController()} />);
    const about = screen.getByRole('button', { name: 'About' });
    await userEvent.click(about);
    const dialog = document.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog).toHaveTextContent('not an emergency service');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(dialog.open).toBe(false);
    expect(about).toHaveFocus();
  });

  it('renders an external feed as a provider link, not a play button', async () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    await userEvent.click(screen.getByRole('button', { name: 'External Dispatch' }));
    const radio = screen.getByRole('region', { name: 'Radio' });
    expect(within(radio).queryByRole('button', { name: /^Play / })).not.toBeInTheDocument();
    const link = within(radio).getByRole('link', { name: /Open External Dispatch on .*opens in a new tab/ });
    expect(link).toHaveAttribute('href', 'https://provider.test/player');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('EXTERNAL')).toBeInTheDocument();
    expect(within(radio).queryByRole('slider', { name: 'Volume' })).not.toBeInTheDocument();
  });

  it('renders a very long station name', () => {
    const longName = 'Extraordinarily Long Regional Interoperability Public Safety Dispatch '.repeat(4).trim();
    const feed = makeFeed({ id: 'long', name: longName });
    render(<App feeds={[feed]} controller={makeController()} />);
    expect(screen.getByRole('heading', { level: 2, name: longName })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: longName })).toBeInTheDocument();
  });

  it('shows the unavailable state with no feeds', () => {
    render(<App feeds={[]} controller={makeController()} />);
    expect(screen.getByText('UNAVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('No stations configured')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  it('hides the slider when volume is not supported and persists volume', () => {
    const controller = makeController();
    render(<App feeds={FIXTURES} controller={controller} />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveValue('80');
    fireEvent.change(slider, { target: { value: '35' } });
    expect(controller.setVolume).toHaveBeenCalledWith(0.35);
    expect(localStorage.getItem('signalwatch.volume.v1')).toBe('0.35');
    act(() => controller.setState({ volumeSupported: false }));
    expect(screen.queryByRole('slider', { name: 'Volume' })).not.toBeInTheDocument();
    expect(screen.getByText('Use your device’s volume buttons')).toBeInTheDocument();
  });
});
