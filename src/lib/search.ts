import type { Feed, ServiceCategory, StationFilter } from '../types';

export const SERVICE_LABELS: Record<ServiceCategory, string> = {
  police: 'Police',
  fire: 'Fire',
  ems: 'EMS',
};

/** "Police · Fire · EMS" in a fixed, readable order. */
export function formatServices(services: ServiceCategory[]): string {
  return (['police', 'fire', 'ems'] as const)
    .filter((s) => services.includes(s))
    .map((s) => SERVICE_LABELS[s])
    .join(' · ');
}

export function formatLocation(feed: Feed): string {
  return `${feed.city}, ${feed.region}`;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Filters by category and search text together (logical AND). Search matches
 * station name, city and region; every whitespace-separated term must match.
 * A mixed-service feed appears under each of its services.
 */
export function filterFeeds(
  feeds: Feed[],
  query: string,
  filter: StationFilter,
  savedIds: ReadonlySet<string>,
): Feed[] {
  const terms = normalize(query).split(' ').filter(Boolean);
  return feeds.filter((feed) => {
    if (filter === 'saved' && !savedIds.has(feed.id)) return false;
    if (filter !== 'all' && filter !== 'saved' && !feed.services.includes(filter)) return false;
    if (terms.length === 0) return true;
    const haystack = normalize(`${feed.name} ${feed.city} ${feed.region}`);
    return terms.every((term) => haystack.includes(term));
  });
}
