import { filterFeeds, formatServices } from './search';
import { makeFeed } from '../test/fixtures';

const feeds = [
  makeFeed({ id: 'a', name: 'Alpha County Sheriff', city: 'Alpha', region: 'Ohio', services: ['police'] }),
  makeFeed({ id: 'b', name: 'Bravo Fire Dispatch', city: 'Bravo', region: 'Texas', services: ['fire'] }),
  makeFeed({ id: 'c', name: 'Charlie Public Safety', city: 'Charlie', region: 'Ohio', services: ['police', 'fire', 'ems'] }),
];
const ids = (list: { id: string }[]) => list.map((f) => f.id);
const none = new Set<string>();

describe('filterFeeds', () => {
  it('returns everything for an empty query and the All filter', () => {
    expect(ids(filterFeeds(feeds, '', 'all', none))).toEqual(['a', 'b', 'c']);
  });
  it('ignores case and surrounding whitespace', () => {
    expect(ids(filterFeeds(feeds, '   bRaVo  ', 'all', none))).toEqual(['b']);
  });
  it('matches name, city and region', () => {
    expect(ids(filterFeeds(feeds, 'sheriff', 'all', none))).toEqual(['a']);
    expect(ids(filterFeeds(feeds, 'ohio', 'all', none))).toEqual(['a', 'c']);
  });
  it('requires every term to match', () => {
    expect(ids(filterFeeds(feeds, 'ohio charlie', 'all', none))).toEqual(['c']);
    expect(ids(filterFeeds(feeds, 'ohio texas', 'all', none))).toEqual([]);
  });
  it('includes a mixed-service feed under each of its services', () => {
    expect(ids(filterFeeds(feeds, '', 'police', none))).toEqual(['a', 'c']);
    expect(ids(filterFeeds(feeds, '', 'fire', none))).toEqual(['b', 'c']);
    expect(ids(filterFeeds(feeds, '', 'ems', none))).toEqual(['c']);
  });
  it('combines search and category with AND', () => {
    expect(ids(filterFeeds(feeds, 'ohio', 'fire', none))).toEqual(['c']);
    expect(ids(filterFeeds(feeds, 'texas', 'police', none))).toEqual([]);
  });
  it('filters to saved stations and still applies search', () => {
    const saved = new Set(['a', 'b']);
    expect(ids(filterFeeds(feeds, '', 'saved', saved))).toEqual(['a', 'b']);
    expect(ids(filterFeeds(feeds, 'texas', 'saved', saved))).toEqual(['b']);
  });
});

describe('formatServices', () => {
  it('orders services consistently', () => {
    expect(formatServices(['ems', 'police', 'fire'])).toBe('Police · Fire · EMS');
  });
});
