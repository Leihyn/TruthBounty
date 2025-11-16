/**
 * Data Mode Configuration
 *
 * Controls whether the app uses demo data or real mainnet data
 */

export type DataMode = 'demo' | 'mainnet';

// Read from environment variable, default to mainnet
export const DATA_MODE: DataMode = (process.env.NEXT_PUBLIC_DATA_MODE as DataMode) || 'mainnet';

export const isDemoMode = () => DATA_MODE === 'demo';
export const isMainnetMode = () => DATA_MODE === 'mainnet';

// Display configuration
export const getDataModeConfig = () => ({
  mode: DATA_MODE,
  isDemo: isDemoMode(),
  isMainnet: isMainnetMode(),
  description: isDemoMode()
    ? 'Using sample demo data'
    : 'Using real blockchain data from BSC mainnet',
  badgeColor: isDemoMode() ? 'orange' : 'green',
  badgeText: isDemoMode() ? 'DEMO MODE' : 'LIVE DATA',
});
