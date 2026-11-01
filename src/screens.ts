export const screenNames = [
  'home', 'trending', 'perps', 'combos', 'breaking', 'sportsbook', 'casino', 'explore', 'crypto_category', 'binary_market', 'multi_outcome_market',
  'sports_market', 'authentication', 'portfolio_dashboard', 'active_positions',
  'closed_positions', 'open_orders', 'order_history', 'wallet_overview',
  'deposit', 'withdraw', 'account_settings', 'trader_profile', 'live_activity',
  'leaderboard', 'rewards_center', 'notifications_center', 'market_watchlist',
  'market_analytics', 'market_comparison', 'market_calendar', 'resolution_center',
  'admin_dashboard', 'market_management', 'trading_surveillance', 'user_management',
  'resolution_settlement', 'wallet_management', 'financial_reports', 'audit_logs',
  'system_settings', 'api_data_management', 'language_currency_selector',
] as const;

export type ScreenName = (typeof screenNames)[number];
export type Viewport = 'desktop' | 'mobile';

export function screenUrl(name: ScreenName, viewport: Viewport): string {
  return `/stitch/stitch_atlas_prediction_market_platform/atlas_${name === 'perps' || name === 'trending' || name === 'combos' || name === 'breaking' || name === 'sportsbook' || name === 'casino' || name === 'portfolio_dashboard' || name === 'rewards_center' ? 'home' : name}_${viewport}/code.html`;
}

export function humanName(name: ScreenName): string {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function screenGroup(name: ScreenName): string {
  if (['home', 'trending', 'perps', 'combos', 'breaking', 'sportsbook', 'casino', 'explore', 'crypto_category', 'binary_market', 'multi_outcome_market', 'sports_market'].includes(name)) return 'Markets';
  if (['authentication', 'portfolio_dashboard', 'active_positions', 'closed_positions', 'open_orders', 'order_history', 'wallet_overview', 'deposit', 'withdraw', 'account_settings'].includes(name)) return 'Account & Trading';
  if (['trader_profile', 'live_activity', 'leaderboard', 'rewards_center', 'notifications_center'].includes(name)) return 'Community';
  if (['market_watchlist', 'market_analytics', 'market_comparison', 'market_calendar', 'resolution_center'].includes(name)) return 'Intelligence';
  if (name === 'language_currency_selector') return 'Preferences';
  return 'Administration';
}
