import type { MouseEvent } from 'react';
import { RadioEmblem } from './icons';

function goHome(event: MouseEvent<HTMLAnchorElement>) {
  // Stay on the page so a playing stream is not interrupted.
  event.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

export function SiteHeader() {
  return (
    <header className="masthead">
      <a className="masthead__brand" href="/" onClick={goHome}>
        <span className="masthead__emblem">
          <RadioEmblem />
        </span>
        <span className="masthead__wordmark">SIGNALWATCH</span>
      </a>
      <p className="masthead__tagline">Public safety radio</p>
    </header>
  );
}
