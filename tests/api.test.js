/**
 * @jest-environment jsdom
 */

import { api } from '../public/js/api.js';

// Mock fetch globally
let mockFetch;
let mockResponseData;
let mockResponseOk;

beforeEach(() => {
  mockResponseData = null;
  mockResponseOk = true;
  mockFetch = jest.fn(async () => {
    return {
      ok: mockResponseOk,
      json: async () => mockResponseData,
    };
  });
  global.fetch = mockFetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ApiClient', () => {
  describe('evaluateOffer', () => {
    test('should call POST /api/evaluate with correct body', async () => {
      mockResponseData = { score: 75, verdict: '可以談判', breakdown: [] };

      const data = {
        jobTitle: 'Frontend Engineer',
        totalComp: 1200000,
        baseSalary: 1000000,
        bonus: 2,
        equity: 0.05,
        city: 'taipei',
        experience: '2-5'
      };

      const result = await api.evaluateOffer(data);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/evaluate');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(data);
      expect(result).toEqual({ score: 75, verdict: '可以談判', breakdown: [] });
    });

    test('should throw error when response is not ok', async () => {
      mockResponseOk = false;
      mockResponseData = { error: 'Validation failed' };

      await expect(api.evaluateOffer({})).rejects.toThrow('Validation failed');
    });
  });

  describe('getSalaryData', () => {
    test('should call GET /api/salary-data', async () => {
      const mockData = {
        data: [
          { title: 'Frontend Engineer', min: 600000, max: 1200000 }
        ],
        sources: ['104', 'LinkedIn']
      };
      mockResponseData = mockData;

      const result = await api.getSalaryData();

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/salary-data');
      // Note: GET requests don't explicitly set method
      expect(result).toEqual(mockData);
    });
  });

  describe('contributeSalary', () => {
    test('should call POST /api/contribute', async () => {
      mockResponseData = { success: true, message: '感謝您的貢獻' };

      const data = { title: 'Senior Engineer', salary: 1800000, city: 'taipei' };
      const result = await api.contributeSalary(data);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/contribute');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(data);
      expect(result).toEqual({ success: true, message: '感謝您的貢獻' });
    });
  });

  describe('Offers CRUD', () => {
    test('getOffers should call GET /api/offers', async () => {
      mockResponseData = { offers: [{ id: 1, company: 'Google' }] };

      const result = await api.getOffers();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/offers');
      expect(result).toEqual({ offers: [{ id: 1, company: 'Google' }] });
    });

    test('createOffer should call POST /api/offers', async () => {
      mockResponseData = { id: 1, company: 'Google', title: 'Engineer' };

      const data = { company: 'Google', title: 'Engineer', deadline: '2026-04-20' };
      const result = await api.createOffer(data);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/offers');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(data);
      expect(result).toEqual({ id: 1, company: 'Google', title: 'Engineer' });
    });

    test('updateOffer should call PUT /api/offers/:id', async () => {
      mockResponseData = { id: 1, status: 'accepted' };

      const result = await api.updateOffer(1, { status: 'accepted' });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/offers/1');
      expect(callArgs[1].method).toBe('PUT');
      expect(JSON.parse(callArgs[1].body)).toEqual({ status: 'accepted' });
      expect(result).toEqual({ id: 1, status: 'accepted' });
    });

    test('deleteOffer should call DELETE /api/offers/:id', async () => {
      mockResponseOk = true;
      mockResponseData = null;

      await api.deleteOffer(1);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/offers/1');
      expect(callArgs[1].method).toBe('DELETE');
    });
  });

  describe('Interviews CRUD', () => {
    test('getInterviews should call GET /api/interviews', async () => {
      mockResponseData = { interviews: [{ id: 1, company: 'Amazon' }] };

      const result = await api.getInterviews();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/interviews');
      expect(result).toEqual({ interviews: [{ id: 1, company: 'Amazon' }] });
    });

    test('createInterview should call POST /api/interviews', async () => {
      mockResponseData = { id: 1, company: 'Amazon', stage: '技術面試' };

      const data = { company: 'Amazon', title: 'Backend', stage: '技術面試' };
      const result = await api.createInterview(data);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/interviews');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(data);
      expect(result).toEqual({ id: 1, company: 'Amazon', stage: '技術面試' });
    });

    test('updateInterview should call PUT /api/interviews/:id', async () => {
      mockResponseData = { id: 1, stage: '主管面試', notes: '下週二複試' };

      const result = await api.updateInterview(1, { stage: '主管面試', notes: '下週二複試' });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/interviews/1');
      expect(callArgs[1].method).toBe('PUT');
      expect(JSON.parse(callArgs[1].body)).toEqual({ stage: '主管面試', notes: '下週二複試' });
      expect(result).toEqual({ id: 1, stage: '主管面試', notes: '下週二複試' });
    });

    test('deleteInterview should call DELETE /api/interviews/:id', async () => {
      mockResponseOk = true;
      mockResponseData = null;

      await api.deleteInterview(1);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/interviews/1');
      expect(callArgs[1].method).toBe('DELETE');
    });
  });

  describe('Forum', () => {
    test('getForumPosts should call GET /api/forum with query params', async () => {
      mockResponseData = { posts: [], total: 0, page: 1, pageSize: 10 };

      await api.getForumPosts({ page: 1, city: 'taipei' });

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/forum?page=1&city=taipei');
    });

    test('createForumPost should call POST /api/forum', async () => {
      mockResponseData = { id: 1, title: 'Test post' };

      const data = { title: 'Test post', city: 'taipei', content: 'Test content' };
      const result = await api.createForumPost(data);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/forum');
      expect(callArgs[1].method).toBe('POST');
      expect(JSON.parse(callArgs[1].body)).toEqual(data);
      expect(result).toEqual({ id: 1, title: 'Test post' });
    });

    test('deleteForumPost should call DELETE /api/forum/:id', async () => {
      mockResponseOk = true;
      mockResponseData = null;

      await api.deleteForumPost(1);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/forum/1');
      expect(callArgs[1].method).toBe('DELETE');
    });
  });

  describe('Calculator', () => {
    test('calculateTax should call GET /api/calculator/tax with params', async () => {
      mockResponseData = { taxAmount: 62400, monthlyNet: 89450 };

      const params = { annualIncome: 1500000, bonus: 200000, deduction: 'standard' };
      const result = await api.calculateTax(params);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/calculator/tax?annualIncome=1500000&bonus=200000&deduction=standard');
      expect(result).toEqual({ taxAmount: 62400, monthlyNet: 89450 });
    });

    test('calculateBenefits should call GET /api/calculator/benefits', async () => {
      mockResponseData = { totalBenefits: 86400, totalComp: 1386400 };

      const params = { baseSalary: 1300000, annualLeave: 14 };
      const result = await api.calculateBenefits(params);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/calculator/benefits?baseSalary=1300000&annualLeave=14');
      expect(result).toEqual({ totalBenefits: 86400, totalComp: 1386400 });
    });
  });

  describe('Scripts', () => {
    test('getScripts should call GET /api/scripts', async () => {
      mockResponseData = {
        scripts: [
          { id: 1, title: '開場：感謝 + 確認範圍', script: '非常感謝您提供這個機會！' }
        ]
      };

      const result = await api.getScripts();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/scripts');
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('RSS', () => {
    test('getRss104 should call GET /api/rss/104', async () => {
      mockResponseData = { items: [{ title: '前端工程師薪資趨勢' }], cachedAt: '2026-04-11' };

      const result = await api.getRss104();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/rss/104');
      expect(result).toEqual(mockResponseData);
    });

    test('getRssCakeResume should call GET /api/rss/cakeresume', async () => {
      mockResponseData = { items: [{ title: '2026 科技業薪資報告' }] };

      const result = await api.getRssCakeResume();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toBe('/api/rss/cakeresume');
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('Error handling', () => {
    test('should throw error when network fails', async () => {
      // Override mock for this specific test
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(api.getSalaryData()).rejects.toThrow('Network error');
    });
  });
});
