# Feed providers and integration decisions

Terms were read on **2026-11-12**. Re-read a provider's page before adding or changing its entry.

The rule for the directory: a feed plays inside SIGNALWATCH only when its operator publishes the stream for use in outside players. Everything else is either a link to the provider's own player or left out. Being publicly reachable is not treated as permission.

## Integrated

### Durham Police Scanner — plays in SIGNALWATCH

| | |
|---|---|
| Provider | Privately owned and operated; "not supported or endorsed by any government or public safety agency" |
| Station | Durham Police, Fire and EMS |
| Coverage | Durham County, North Carolina trunked P25 system: police, fire, EMS dispatch and other municipal talkgroups |
| Source page | https://durhampolicescanner.com/ |
| Playback | Direct, in the browser's native audio element. `https://stream.durhampolicescanner.com/` — single-channel MP3, 32 kb/s, HTTPS |
| Basis for integration | The operator's page says: "You can listen to this stream outside your browser. Just open https://stream.durhampolicescanner.com/ in almost any media player app". The stream responds with `Access-Control-Allow-Origin: *`. |
| Attribution | None stated. SIGNALWATCH credits "Audio: durhampolicescanner.com" and links the source page. |
| Restrictions | None stated. No credentials, no payment, no advertising. |
| Delay | None documented. Internet buffering adds a few seconds. |
| Contact | info@durhampolicescanner.com |

**Open item before a public launch:** the operator invites outside media players but does not address third-party websites specifically. Email the operator, say that SIGNALWATCH plays the stream directly from their server with credit and a link, and ask for a yes. Until then, treat this as permitted-by-published-invitation, not by written agreement. If the operator objects, remove the entry from `src/data/feeds.ts` and its host from the `media-src` directive in `vercel.json`.

SIGNALWATCH does not use the site's "who's talking" WebSocket (`status.durhampolicescanner.com`); nothing on the page offers it for outside use.

### WA Radio Scanner Users' Group (WARSUG) — plays in SIGNALWATCH

| | |
|---|---|
| Provider | Volunteer scanner hobbyist group, Western Australia. Streams run by the forum administrator (Gavin Rogers, VK6HGR). |
| Stations | Perth Fire and Rescue Dispatch (`https://stream.warsug.info/WARSUG`); Perth DFES Fireground Channels (`https://stream.warsug.info/DFES`) |
| Coverage | Department of Fire and Emergency Services (DFES), Perth. Dispatch: "Metro Network Control Channel (6AR/6IP) for Fire and Rescue. All fire & rescue and SES turnouts in the metro and greater south-west are on this channel." Fireground: "major Department of Fire and Emergency Services repeater and simplex channels in the Perth metropolitan area". Fire only; no police. |
| Source page | https://warsug.info/viewtopic.php?f=3&t=5454 |
| Playback | Direct, native audio element, MP3 over HTTPS |
| Basis for integration | The operator's post gives each address under "To listen :" and adds playlist addresses "for older software", and notes the streams are also mirrored to Broadcastify and usable in mobile apps. SIGNALWATCH uses the operator's own addresses, not the Broadcastify mirror. |
| Attribution | None stated. SIGNALWATCH credits "Audio: WARSUG (warsug.info)" and links the source post. |
| Restrictions | None stated. No credentials or payment. The operator accepts donations for site and stream costs. |
| Delay | None documented. |

**Open item before a public launch:** same as Durham. The addresses are published for listeners' own players; a third-party website is not mentioned. Ask through the forum before promoting the site.

### Bay County Scanner Feed — link to the operator's player

| | |
|---|---|
| Provider | Independently operated since 2005; "not affiliated with, endorsed by, or operated by any police department, fire department, emergency service, or government agency" |
| Coverage | Local public safety communications, Bay City and Bay County, Michigan |
| Source page | https://www.baycountyscanner.org/ |
| Playback | External link only |
| Why not in-app | Terms of Use (last updated 2026-11-09), section 2: "Permission to share website content does not automatically grant permission to reproduce, redistribute, rebroadcast, sell, or commercially exploit our live audio feed or archived scanner recordings. If you have a question about using or reproducing any of our material, please contact us before doing so." Its stream is technically reachable over HTTPS with open CORS, but that is not permission. |

To play it in-app, ask through https://www.baycountyscanner.org/contact.

### Loudoun County Emergency Communications Center — link to the county's player

| | |
|---|---|
| Provider | Loudoun County, Virginia (government) |
| Station | Loudoun County Fire and Rescue Dispatch |
| Coverage | The ECC's fire and rescue radio dispatch channel |
| Source page | https://www.loudoun.gov/724/Radio-Dispatch-Webcast |
| Playback | External link only |
| Why not in-app | The webcast runs in a vendor player (iSi Live) that looks up the stream through its own service. No stream address is published for outside players, so pulling one out of the vendor's player would go around the provider's controls. |
| Notes from the provider | "there may be long periods of silence between radio broadcasts" |

To play it in-app, ask the ECC (contact on the source page) for a stream address they are willing to have used by an outside player.

### SomaFM "SF Police Scanner" — link to SomaFM's player

| | |
|---|---|
| Provider | SomaFM.com, LLC (listener-supported internet radio, San Francisco) |
| Coverage | San Francisco fire and emergency services plus initial police dispatch; most SFPD traffic is encrypted |
| Source page | https://somafm.com/scanner/ |
| Playback | External link only |
| Why not in-app | SomaFM's direct stream page says: "These links are for individual, personal use only. They are not for use in video games, streams, Second Life, etc. Unauthorized use will be blocked". Its API page says: "SomaFM API is no longer available to third parties". Linking to station pages is encouraged on its "link to us" page. |

To play it in-app, get written permission from SomaFM (https://somafm.com/contact/).

## Evaluated and not used

| Source | Reason |
|---|---|
| Broadcastify | Its site refuses automated access, so its terms could not be read first-hand from this build environment. Its help centre (as returned by web search) says public redistribution of live audio is prohibited under the developer programme terms (§4.B), that programme access needs an application and review at https://bcfy.io/dev/apply/, and that a broad public scanner product needs an enterprise licence. A feed-provider forum post reports the embeddable player was retired. Not integrated. |
| OpenMHz | Site refuses automated access; no published terms for third-party players were found. Carries recorded calls, not a continuous stream. |
| 916scanner.com, ScanCBUS | Proprietary web apps with accounts or paid plans; no stream published for outside players. |
| Radio Browser (radio-browser.info) | Free community directory with an open API. Checked 2026-11-12: 157 entries matched scanner, police, fire, EMS and dispatch searches; about five were real scanner feeds and the rest were music stations. A listing there is not permission, so each operator was vetted separately (WARSUG and Bay County above). Not a bulk source. |
| ScanBC (scanbc.com) | Streams play only through its own web app; no terms or stream addresses are published for outside players. |
| CrimeIsDown.com | All rights reserved; distributes through YouTube, OpenMHz and Broadcastify. |
| Pottawattamie County Sheriff (Iowa) | Official streams exist, but the page refused access from the build environment and could not be reviewed. |

### Adding Broadcastify later

This is the route to a large directory. It needs things only the site owner can supply:

1. A RadioReference/Broadcastify account and an approved developer application (https://bcfy.io/dev/apply/).
2. Agreement to the programme terms, including whatever licence and fees Broadcastify sets for a public listening site.
3. The API key they issue. It must stay server-side: add a Vercel Function that calls their catalogue API with the key from an environment variable, validates input, sets a timeout, and returns only public feed fields. Do not put the key in `src/` or any `VITE_` variable, and do not build an audio proxy.

## Adding a feed

1. Read the operator's page and confirm it permits the playback method you intend. Record the exact wording in this file.
2. Add the provider and feed to `src/data/feeds.ts`. Use `method: 'external'` unless in-app playback is clearly permitted.
3. For in-app playback, add the stream host to `media-src` in `vercel.json`.
4. Play it in a real browser and confirm audio, not just an HTTP 200.

## Verification record

2026-11-12, headless Chromium, stream `https://stream.durhampolicescanner.com/`:
response `content-type: audio/mp3`; the audio element fired `playing` 6.9 s after connecting; `currentTime` advanced 19.98 s over a 20 s sample; decoded samples through a Web Audio analyser had peak amplitude 0.24 with 59.8% of samples above the noise floor. Both WARSUG streams fired `playing` within 3.2 s and advanced 9.95 s over a 10 s sample. This is machine evidence of decoded audio (non-silent, in Durham's case). Nobody listened to it by ear in the build environment.
