import { describe, test, expect, beforeEach, vi } from 'vitest';

import { MetricsCache } from '../server/cache';
import { metrics } from '../server/monitoring';

describe('MetricsCache', () => {
  let cache: MetricsCache<any>;

  beforeEach(() => {
    cache = new MetricsCache(1000); // 1 second TTL
    metrics.reset();
  });

  describe('Basic Operations', () => {
    test('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    test('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    test('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    test('should return cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('TTL Expiration', () => {
    test('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', { ttl: 100 });
      
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should use default TTL', async () => {
      const shortCache = new MetricsCache(100);
      shortCache.set('key1', 'value1');
      
      expect(shortCache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(shortCache.get('key1')).toBeUndefined();
    });

    test('should remove expired entries on has check', async () => {
      cache.set('key1', 'value1', { ttl: 100 });
      
      expect(cache.has('key1')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.has('key1')).toBe(false);
    });

    test('should clean expired entries on size calculation', async () => {
      cache.set('key1', 'value1', { ttl: 100 });
      cache.set('key2', 'value2', { ttl: 1000 });
      
      expect(cache.size()).toBe(2);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.size()).toBe(1);
    });
  });

  describe('Metrics Tracking', () => {
    test('should track cache hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.hits).toBe(2);
    });

    test('should track cache misses', () => {
      cache.get('nonexistent');
      cache.get('missing');
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.misses).toBe(2);
    });

    test('should track cache sets', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.sets).toBe(2);
    });

    test('should track cache deletes', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.deletes).toBe(1);
    });

    test('should track deletes on clear', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.clear();
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.deletes).toBe(3);
    });

    test('should calculate cache hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.hitRate).toBeCloseTo(0.67, 1);
    });

    test('should track misses for expired entries', async () => {
      cache.set('key1', 'value1', { ttl: 100 });
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      cache.get('key1');
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.cache.misses).toBe(1);
      expect(metricsData.cache.deletes).toBe(1);
    });
  });

  describe('Data Types', () => {
    test('should handle strings', () => {
      cache.set('str', 'hello');
      expect(cache.get('str')).toBe('hello');
    });

    test('should handle numbers', () => {
      cache.set('num', 42);
      expect(cache.get('num')).toBe(42);
    });

    test('should handle objects', () => {
      const obj = { name: 'test', value: 123 };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });

    test('should handle arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      cache.set('arr', arr);
      expect(cache.get('arr')).toEqual(arr);
    });

    test('should handle null and undefined', () => {
      cache.set('null', null);
      cache.set('undef', undefined);
      expect(cache.get('null')).toBe(null);
      expect(cache.get('undef')).toBe(undefined);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid set/get operations', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
      
      expect(cache.size()).toBe(100);
    });

    test('should overwrite existing keys', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    test('should handle very short TTL', async () => {
      cache.set('key1', 'value1', { ttl: 10 });
      
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should handle very long TTL', () => {
      cache.set('key1', 'value1', { ttl: 1000000 });
      expect(cache.get('key1')).toBe('value1');
    });
  });
});
