export const categories = [
  { id: 'live_activity', label: 'Activity' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'portfolio_dashboard', label: 'Dashboard' },
  { id: 'rewards_center', label: 'Rewards' },
  { id: 'all', label: 'All Markets' },
  { id: 'trending', label: 'Trending' },
  { id: 'combos', label: 'Combos' },
  { id: 'perps', label: 'Perps' },
  { id: 'esports', label: 'Esports' },
  { id: 'iran', label: 'Iran' },
  { id: 'weather', label: 'Weather' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'art', label: 'Art' },
  { id: 'new', label: 'New' },
  { id: 'breaking', label: 'Breaking' },
  { id: 'crypto', label: 'Crypto', tag: '21' },
  { id: 'politics', label: 'Politics', tag: '2' },
  { id: 'sports', label: 'Sports', tag: '1' },
  { id: 'finance', label: 'Finance', tag: '120' },
  { id: 'geopolitics', label: 'Geopolitics', tag: '100265' },
  { id: 'technology', label: 'Technology', tag: '1401' },
  { id: 'elections', label: 'Elections', tag: '144' },
  { id: 'economy', label: 'Economy', tag: '100328' },
  { id: 'culture', label: 'Culture', tag: '596' },
  { id: 'business', label: 'Business', tag: '107' },
  { id: 'world', label: 'World', tag: '101970' },
  { id: 'ai', label: 'AI', tag: '439' },
] as const;
export type CategoryId = (typeof categories)[number]['id'];
export function validCategory(value: string | null): CategoryId {
  return categories.find(item => item.id === value)?.id ?? 'all';
}
