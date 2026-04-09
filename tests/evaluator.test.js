/**
 * @jest-environment jsdom
 */

import {
  salaryData,
  negotiationScripts,
  findReference,
  calculateScore,
  getVerdict,
  filterScripts,
  sanitize,
  StorageService
} from '../assets/js/core/evaluator';

// Mock localStorage
let localStorageMock = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value.toString(); },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; }
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.data = {};
});

describe('salaryData', () => {
  test('should have 12 salary references', () => {
    expect(salaryData).toHaveLength(12);
  });

  test('all entries should have required fields', () => {
    salaryData.forEach(s => {
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('min');
      expect(s).toHaveProperty('max');
      expect(s).toHaveProperty('level');
      expect(s).toHaveProperty('city');
      expect(typeof s.min).toBe('number');
      expect(typeof s.max).toBe('number');
      expect(s.max).toBeGreaterThan(s.min);
    });
  });
});

describe('negotiationScripts', () => {
  test('should have 5 negotiation scripts', () => {
    expect(negotiationScripts).toHaveLength(5);
  });

  test('all scripts should have required fields', () => {
    negotiationScripts.forEach(s => {
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('situation');
      expect(s).toHaveProperty('script');
      expect(s).toHaveProperty('tip');
    });
  });
});

describe('findReference', () => {
  test('should find reference by job title keyword', () => {
    const ref = findReference('Frontend Engineer', 'taipei', '2-5年');
    expect(ref).toBeDefined();
    expect(ref.title).toContain('Frontend');
  });

  test('should find reference by city and level', () => {
    const ref = findReference('Unknown Job', 'nhc', '3-5年');
    expect(ref).toBeDefined();
    expect(ref.city).toBe('nhc');
    expect(ref.level).toBe('3-5年');
  });

  test('should return undefined for unknown criteria', () => {
    const ref = findReference('XYZ Job', 'xyz', '99年');
    expect(ref).toBeUndefined();
  });
});

describe('calculateScore', () => {
  test('should return base score 50 for average offer', () => {
    // An offer at market median
    const result = calculateScore(900000, 800000, 'taipei', '2-5年', 'Backend Engineer');
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.breakdown).toBeInstanceOf(Array);
  });

  test('should add points for high bonus ratio', () => {
    const result = calculateScore(1200000, 800000, 'taipei', '2-5年', 'Backend Engineer');
    const bonusItem = result.breakdown.find(b => b.label === '獎金比例佳');
    expect(bonusItem).toBeDefined();
    expect(bonusItem.value).toBe('+15');
  });

  test('should add points for above market offer', () => {
    const result = calculateScore(2000000, 1800000, 'taipei', '5-10年', 'Senior Backend');
    const marketItem = result.breakdown.find(b => b.label === '高於市場');
    expect(marketItem).toBeDefined();
    expect(marketItem.value).toBe('+25');
  });

  test('should subtract points for below market offer', () => {
    const result = calculateScore(400000, 400000, 'taipei', '2-5年', 'Backend Engineer');
    const marketItem = result.breakdown.find(b => b.label === '明顯低於市場');
    expect(marketItem).toBeDefined();
    expect(marketItem.value).toBe('-25');
  });

  test('should add points for Hsinchu city', () => {
    const result = calculateScore(1000000, 900000, 'nhc', '3-5年', 'DevOps');
    const cityItem = result.breakdown.find(b => b.label === '新竹科技聚落');
    expect(cityItem).toBeDefined();
    expect(cityItem.value).toBe('+10');
  });

  test('should add points for remote work', () => {
    const result = calculateScore(1000000, 900000, 'remote', '2-5年', 'Frontend');
    const remoteItem = result.breakdown.find(b => b.label === '遠端彈性');
    expect(remoteItem).toBeDefined();
    expect(remoteItem.value).toBe('+5');
  });

  test('should handle missing reference gracefully', () => {
    // Use a city/level combo that doesn't exist in salaryData
    const result = calculateScore(1000000, 900000, 'kaohsiung', '10+年', 'Very Specific Job Title');
    const noRefItem = result.breakdown.find(b => b.label === '無直接參考');
    expect(noRefItem).toBeDefined();
  });

  test('should clamp score between 0 and 100', () => {
    // Extremely low offer
    const lowResult = calculateScore(100000, 100000, 'taipei', '0-2年', 'CEO');
    expect(lowResult.score).toBeGreaterThanOrEqual(0);

    // Extremely high offer
    const highResult = calculateScore(10000000, 10000000, 'nhc', '10+年', 'Tech Lead');
    expect(highResult.score).toBeLessThanOrEqual(100);
  });
});

describe('getVerdict', () => {
  test('should return excellent verdict for score >= 80', () => {
    const verdict = getVerdict(85);
    expect(verdict).toContain('優於市場水平');
  });

  test('should return good verdict for score >= 60', () => {
    const verdict = getVerdict(65);
    expect(verdict).toContain('談判空間');
  });

  test('should return poor verdict for score < 50', () => {
    const verdict = getVerdict(30);
    expect(verdict).toContain('低於行情');
  });
});

describe('filterScripts', () => {
  test('should filter scripts by title keyword', () => {
    const results = filterScripts('開場');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('開場');
  });

  test('should filter scripts by situation keyword', () => {
    const results = filterScripts('HR 打來');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].situation).toContain('HR');
  });

  test('should filter scripts by tip keyword', () => {
    const results = filterScripts('談判');
    expect(results.length).toBeGreaterThan(0);
  });

  test('should be case insensitive', () => {
    const upper = filterScripts('FRONTEND');
    const lower = filterScripts('frontend');
    expect(upper.length).toBe(lower.length);
  });

  test('should return all scripts for empty query', () => {
    const results = filterScripts('');
    expect(results).toHaveLength(negotiationScripts.length);
  });
});

describe('sanitize', () => {
  test('should escape HTML tags', () => {
    expect(sanitize('<script>')).toBe('&lt;script&gt;');
    expect(sanitize('<div>')).toBe('&lt;div&gt;');
  });

  test('should escape quotes', () => {
    expect(sanitize('"double quotes"')).toBe('&quot;double quotes&quot;');
    expect(sanitize("'single quotes'")).toBe('&#x27;single quotes&#x27;');
  });

  test('should pass through normal text unchanged', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
    expect(sanitize('普通文字')).toBe('普通文字');
  });
});

describe('StorageService', () => {
  describe('getUserCount', () => {
    test('should return 127 as default', () => {
      expect(StorageService.getUserCount()).toBe(127);
    });

    test('should return stored value', () => {
      localStorage.setItem('offerlift_users', '500');
      expect(StorageService.getUserCount()).toBe(500);
    });
  });

  describe('incrementUserCount', () => {
    test('should increment and store', () => {
      const result = StorageService.incrementUserCount();
      expect(result).toBe(128);
      expect(localStorage.getItem('offerlift_users')).toBe('128');
    });
  });

  describe('Contributions', () => {
    test('addContribution should add item with date', () => {
      StorageService.addContribution({ title: 'Frontend', salary: 1000000 });
      const contribs = StorageService.getContributions();
      expect(contribs).toHaveLength(1);
      expect(contribs[0].title).toBe('Frontend');
      expect(contribs[0].salary).toBe(1000000);
      expect(contribs[0]).toHaveProperty('date');
    });
  });

  describe('History', () => {
    test('addHistory should add item with date', () => {
      StorageService.addHistory({ jobTitle: 'Backend', score: 75, totalComp: 1200000 });
      const history = StorageService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].jobTitle).toBe('Backend');
      expect(history[0].score).toBe(75);
    });

    test('should limit history to 5 items', () => {
      for (let i = 0; i < 7; i++) {
        StorageService.addHistory({ jobTitle: `Job ${i}`, score: 50 + i, totalComp: 1000000 });
      }
      const history = StorageService.getHistory();
      expect(history).toHaveLength(5);
      expect(history[0].jobTitle).toBe('Job 6'); // Most recent first
    });
  });
});
