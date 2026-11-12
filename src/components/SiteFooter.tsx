import { useId, useRef, type MouseEvent } from 'react';
import type { Provider } from '../types';

interface SiteFooterProps {
  providers: Provider[];
}

/** Footer with the About button and the native modal dialog it opens. */
export function SiteFooter({ providers }: SiteFooterProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = () => dialogRef.current?.close();

  // Clicks on the dialog element itself (not its content) land on the backdrop.
  const onDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <footer className="site-footer">
      <p className="site-footer__claim">Public feeds. Free listening.</p>
      <p className="site-footer__note">Availability varies by location.</p>
      <button
        ref={openerRef}
        type="button"
        className="text-button site-footer__about"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        About
      </button>

      <dialog
        ref={dialogRef}
        className="about"
        aria-labelledby={titleId}
        onClick={onDialogClick}
        onClose={() => openerRef.current?.focus()}
      >
        <div className="about__body">
          <h2 className="about__title" id={titleId}>
            About SIGNALWATCH
          </h2>
          <p>
            SIGNALWATCH is a simple directory and player for public safety radio feeds: police, fire and EMS
            dispatch from the places listed here.
          </p>
          <p>
            Audio plays directly from each provider’s own server, or the station opens in the provider’s own
            player. SIGNALWATCH does not record, relay or store any audio.
          </p>
          <h3 className="about__subtitle">Sources</h3>
          <ul className="about__providers">
            {providers.map((p) => (
              <li key={p.id}>
                <a href={p.homepage} target="_blank" rel="noopener noreferrer">
                  {p.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <span> — {p.description}</span>
              </li>
            ))}
          </ul>
          <h3 className="about__subtitle">Limitations</h3>
          <p>
            Feeds are run by volunteers and agencies and can go offline without notice. Many police channels are
            encrypted and cannot be carried. Internet streams run behind real time by a few seconds or more, and
            long silences between transmissions are normal.
          </p>
          <p className="about__warning">
            <strong>
              SIGNALWATCH is not an emergency service. In an emergency call 911 or your local emergency number.
            </strong>
          </p>
          <button type="button" className="about__close" onClick={close}>
            Close
          </button>
        </div>
      </dialog>
    </footer>
  );
}
