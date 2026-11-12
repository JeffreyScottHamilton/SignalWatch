import type { Feed, Provider } from '../types';

/**
 * The SIGNALWATCH directory. Every entry is a real source whose terms were
 * read on the date in docs/PROVIDERS.md. Add a feed only after documenting,
 * there, that its operator permits the playback method used here.
 */

export const PROVIDERS: Provider[] = [
  {
    id: 'durham-police-scanner',
    name: 'Durham Police Scanner',
    homepage: 'https://durhampolicescanner.com/',
    description:
      'A privately owned and operated scanner stream from South Durham, North Carolina. It is not supported or endorsed by any government or public safety agency.',
    attribution: 'Audio: durhampolicescanner.com',
  },
  {
    id: 'warsug',
    name: 'WA Radio Scanner Users’ Group',
    homepage: 'https://warsug.info/viewtopic.php?f=3&t=5454',
    description:
      'A volunteer scanner hobbyist group in Western Australia. Its forum administrator runs the streams and publishes their addresses for listening.',
    attribution: 'Audio: WARSUG (warsug.info)',
  },
  {
    id: 'bay-county-scanner',
    name: 'Bay County Scanner Feed',
    homepage: 'https://www.baycountyscanner.org/',
    description:
      'An independently operated scanner feed for Bay City and Bay County, Michigan, online since 2005. Its terms ask for permission before its live audio is reused, so SIGNALWATCH sends you to its own player.',
    attribution: 'Feed: baycountyscanner.org',
  },
  {
    id: 'loudoun-county-ecc',
    name: 'Loudoun County Emergency Communications Center',
    homepage: 'https://www.loudoun.gov/724/Radio-Dispatch-Webcast',
    description:
      'The county’s own webcast of its fire and rescue radio dispatch channel, offered as a service to the public. It plays only in the county’s player.',
    attribution: 'Webcast: Loudoun County, Virginia',
  },
  {
    id: 'somafm',
    name: 'SomaFM',
    homepage: 'https://somafm.com/scanner/',
    description:
      'A listener-supported internet radio station in San Francisco. Its stream links are for individual use, so SIGNALWATCH sends you to SomaFM’s own player.',
    attribution: 'Stream: SomaFM',
  },
];

export const FEEDS: Feed[] = [
  {
    id: 'durham-nc-public-safety',
    providerId: 'durham-police-scanner',
    name: 'Durham Police, Fire and EMS',
    city: 'Durham',
    region: 'North Carolina',
    country: 'US',
    services: ['police', 'fire', 'ems'],
    sourceUrl: 'https://durhampolicescanner.com/',
    playback: {
      method: 'direct',
      url: 'https://stream.durhampolicescanner.com/',
      mimeType: 'audio/mpeg',
      cacheBustParam: 'n',
    },
    delayNote: null,
    coverageNote:
      'Public safety and operations talkgroups on the Durham County trunked P25 radio system: police, fire, EMS dispatch and other municipal functions.',
    availability: { status: 'unknown', checkedAt: null },
  },
  {
    id: 'perth-wa-fire-dispatch',
    providerId: 'warsug',
    name: 'Perth Fire and Rescue Dispatch',
    city: 'Perth',
    region: 'Western Australia',
    country: 'AU',
    services: ['fire'],
    sourceUrl: 'https://warsug.info/viewtopic.php?f=3&t=5454',
    playback: { method: 'direct', url: 'https://stream.warsug.info/WARSUG', mimeType: 'audio/mpeg' },
    delayNote: null,
    coverageNote:
      'The Department of Fire and Emergency Services metro network control channel: fire and rescue and SES turnouts for Perth and the greater south-west.',
    availability: { status: 'unknown', checkedAt: null },
  },
  {
    id: 'perth-wa-dfes-fireground',
    providerId: 'warsug',
    name: 'Perth DFES Fireground Channels',
    city: 'Perth',
    region: 'Western Australia',
    country: 'AU',
    services: ['fire'],
    sourceUrl: 'https://warsug.info/viewtopic.php?f=3&t=5454',
    playback: { method: 'direct', url: 'https://stream.warsug.info/DFES', mimeType: 'audio/mpeg' },
    delayNote: null,
    coverageNote:
      'Department of Fire and Emergency Services repeater and simplex channels in the Perth metropolitan area, UHF on the right channel and VHF on the left. Simplex channels can be noisy.',
    availability: { status: 'unknown', checkedAt: null },
  },
  {
    id: 'bay-county-mi-public-safety',
    providerId: 'bay-county-scanner',
    name: 'Bay County Scanner',
    city: 'Bay City',
    region: 'Michigan',
    country: 'US',
    services: ['police', 'fire'],
    sourceUrl: 'https://www.baycountyscanner.org/',
    playback: { method: 'external', url: 'https://www.baycountyscanner.org/' },
    delayNote: null,
    coverageNote: 'Local public safety communications for Bay City and Bay County, Michigan.',
    availability: { status: 'unknown', checkedAt: null },
  },
  {
    id: 'loudoun-va-fire-rescue',
    providerId: 'loudoun-county-ecc',
    name: 'Loudoun County Fire and Rescue Dispatch',
    city: 'Loudoun County',
    region: 'Virginia',
    country: 'US',
    services: ['fire', 'ems'],
    sourceUrl: 'https://www.loudoun.gov/724/Radio-Dispatch-Webcast',
    playback: { method: 'external', url: 'https://www.loudoun.gov/724/Radio-Dispatch-Webcast' },
    delayNote: null,
    coverageNote:
      'The Emergency Communications Center’s radio dispatch channel. Expect long periods of silence between broadcasts.',
    availability: { status: 'unknown', checkedAt: null },
  },
  {
    id: 'sf-ca-public-safety',
    providerId: 'somafm',
    name: 'SF Police Scanner',
    city: 'San Francisco',
    region: 'California',
    country: 'US',
    services: ['police', 'fire', 'ems'],
    sourceUrl: 'https://somafm.com/scanner/',
    playback: { method: 'external', url: 'https://somafm.com/scanner/' },
    delayNote: null,
    coverageNote:
      'San Francisco fire and emergency services, plus initial police dispatch. Most other SFPD traffic is encrypted and not carried.',
    availability: { status: 'unknown', checkedAt: null },
  },
];

export function getProvider(providerId: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === providerId);
}
