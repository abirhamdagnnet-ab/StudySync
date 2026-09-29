import * as publicStatsModel from "../models/publicStats.model.js";

const cacheDurationMs = 60_000;
let cachedStats;
let cacheExpiresAt = 0;
let pendingStats;

const getStats = async () => {
  if (cachedStats && Date.now() < cacheExpiresAt) return cachedStats;
  if (!pendingStats) {
    pendingStats = publicStatsModel.getStats()
      .then((stats) => {
        cachedStats = stats;
        cacheExpiresAt = Date.now() + cacheDurationMs;
        return stats;
      })
      .finally(() => { pendingStats = null; });
  }
  return pendingStats;
};

export { getStats };
