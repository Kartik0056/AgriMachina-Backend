/**
 * High-Performance In-Memory Micro-Cache Service
 * Provides O(1) in-memory storage for high-concurrency read-heavy endpoints
 * (categories, banners, featured deals) to eliminate database load when multiple users visit.
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if not expired
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set cached data with TTL in seconds (default: 45 seconds)
   * @param {string} key
   * @param {any} data
   * @param {number} ttlSeconds
   */
  set(key, data, ttlSeconds = 45) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Invalidate a single key or pattern
   * @param {string} keyOrPrefix
   */
  invalidate(keyOrPrefix) {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Flush entire cache
   */
  clear() {
    this.cache.clear();
  }
}

const memoryCache = new MemoryCache();
module.exports = memoryCache;
