/**
 * Platform Fetchers Index
 *
 * Import all fetchers to register them with the system
 * Supports 12 prediction market platforms
 */

// Import fetchers to register them
import './polymarket-fetcher';
import './limitless-fetcher';
import './manifold-fetcher';
import './kalshi-fetcher';
import './azuro-fetcher';
import './sxbet-fetcher';
import './metaculus-fetcher';
import './overtime-fetcher';
import './pancakeswap-fetcher';
import './speedmarkets-fetcher';
import './drift-fetcher';
import './gnosis-fetcher';

// Re-export the main fetcher utilities
export * from '../market-fetcher';

// Re-export individual fetchers for direct use
export { polymarketFetcher } from './polymarket-fetcher';
export { limitlessFetcher } from './limitless-fetcher';
export { manifoldFetcher } from './manifold-fetcher';
export { kalshiFetcher } from './kalshi-fetcher';
export { azuroFetcher } from './azuro-fetcher';
export { sxbetFetcher } from './sxbet-fetcher';
export { metaculusFetcher } from './metaculus-fetcher';
export { overtimeFetcher } from './overtime-fetcher';
export { pancakeswapFetcher } from './pancakeswap-fetcher';
export { speedmarketsFetcher } from './speedmarkets-fetcher';
export { driftFetcher } from './drift-fetcher';
export { gnosisFetcher } from './gnosis-fetcher';
