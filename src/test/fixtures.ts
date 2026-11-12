import type { Feed } from '../types';

/** Private test fixtures. Never imported by application code. */
export function makeFeed(overrides: Partial<Feed> & { id: string }): Feed {
  return {
    providerId: 'test-provider',
    name: `Test ${overrides.id}`,
    city: 'Testville',
    region: 'Nowhere',
    country: 'US',
    services: ['police'],
    sourceUrl: `https://example.test/${overrides.id}`,
    playback: { method: 'direct', url: `https://stream.example.test/${overrides.id}`, mimeType: 'audio/mpeg' },
    delayNote: null,
    coverageNote: 'Fixture feed.',
    availability: { status: 'unknown', checkedAt: null },
    ...overrides,
  };
}
