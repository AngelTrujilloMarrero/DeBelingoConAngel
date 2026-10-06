// Lazy loading utilities for large JSON files
export const loadHistoricalStats = async () => {
  const module = await import('../data/historicalStats.json');
  return module.default;
};

export const loadOrchestraArchive = async () => {
  const module = await import('../data/orchestraArchive.json');
  return module.default;
};

// Cache for loaded data
let cachedHistoricalStats: any = null;
let cachedOrchestraArchive: any = null;

// Loading states
let historicalStatsLoading = false;
let orchestraArchiveLoading = false;

export const getCachedHistoricalStats = async () => {
  if (!cachedHistoricalStats && !historicalStatsLoading) {
    historicalStatsLoading = true;
    try {
      cachedHistoricalStats = await loadHistoricalStats();
    } catch (error) {
      console.error('Error loading historical stats:', error);
      throw error;
    } finally {
      historicalStatsLoading = false;
    }
  } else if (historicalStatsLoading) {
    // Wait for loading to complete
    while (historicalStatsLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return cachedHistoricalStats;
};

export const getCachedOrchestraArchive = async () => {
  if (!cachedOrchestraArchive && !orchestraArchiveLoading) {
    orchestraArchiveLoading = true;
    try {
      cachedOrchestraArchive = await loadOrchestraArchive();
    } catch (error) {
      console.error('Error loading orchestra archive:', error);
      throw error;
    } finally {
      orchestraArchiveLoading = false;
    }
  } else if (orchestraArchiveLoading) {
    // Wait for loading to complete
    while (orchestraArchiveLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return cachedOrchestraArchive;
};

export const getLoadingStatus = () => ({
  historicalStatsLoading,
  orchestraArchiveLoading
});