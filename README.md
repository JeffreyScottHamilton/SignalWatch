# SIGNALWATCH

Find your frequency. A free, single-page public safety radio site: choose a station, press play, stay tuned.

No accounts, no tracking, no server. Audio plays in the listener's browser directly from each provider's own stream, or opens the provider's player where that is all the provider allows.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Requires Node 20.19 or newer.

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit and behaviour tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript only |

## Stations

The directory lives in `src/data/feeds.ts`. Each entry's permission basis, attribution and restrictions are recorded in [`docs/PROVIDERS.md`](docs/PROVIDERS.md). Read that file before adding a feed.

## How it is put together

| Path | Role |
|---|---|
| `src/types.ts` | Feed, provider and playback contracts |
| `src/data/feeds.ts` | The provider and feed directory |
| `src/playback/` | The one playback controller: a single audio element, connection states, bounded retry, Media Session |
| `src/lib/` | Search and filter, local storage for favorites, last station and volume |
| `src/components/`, `src/styles/` | The interface |

Pausing disconnects from the stream; pressing play again rejoins it live. Nothing is recorded, so there is no rewind.

## Environment variables

None. There are no secrets in this project. If a licensed provider is added later, its key belongs in a Vercel environment variable read by a server function, never in a `VITE_` variable (those are shipped to the browser).

## Deploy on Vercel

1. Import the GitHub repository in Vercel.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`, install command `npm install`. These are also set in `vercel.json`.
3. No environment variables are needed.
4. Every pull request and branch push gets a preview deployment; the production branch deploys to production.

`vercel.json` sets a Content Security Policy. `media-src` lists the only hosts the page may load audio from. When you add an in-app feed, add its stream host there or the browser will block it.

## Limits

- Feeds are run by volunteers and agencies and can go offline without notice.
- Many police channels are encrypted and are not carried by any feed.
- Mobile browsers may stop audio when the page is in the background, and iOS ignores in-page volume; use the device's volume buttons there.
- SIGNALWATCH is not an emergency service. In an emergency call 911 or your local emergency number.
