// API Client for OfferLift Backend
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.apiKey = localStorage.getItem('offerlift_api_key') || 'dev_api_key_12345';
    // Generate anonymous ID if not exists
    if (!localStorage.getItem('offerlift_anonymous_id')) {
      localStorage.setItem('offerlift_anonymous_id', this.generateAnonymousId());
    }
    this.anonymousId = localStorage.getItem('offerlift_anonymous_id');
  }

  generateAnonymousId() {
    return 'anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Anonymous-Id': this.anonymousId
    };
    
    // Manual merge to avoid spread issues in older browsers
    if (options.headers) {
      for (let key in options.headers) {
        headers[key] = options.headers[key];
      }
    }

    const config = {
      method: options.method || 'GET',
      headers: headers
    };

    if (options.body) {
      config.body = typeof options.body === 'object' ? JSON.stringify(options.body) : options.body;
    }

    try {
      console.log(`[API] Request: ${config.method} ${endpoint}`);
      const response = await fetch(url, config);
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: 'Invalid JSON response from server', raw: text };
      }

      if (!response.ok) {
        console.error(`[API] Error response:`, data);
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (err) {
      console.error(`[API] Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  async evaluateOffer(data) { return this.request('/evaluate', { method: 'POST', body: data }); }
  async getSalaryData() { return this.request('/salary-data'); }
  async getOffers() { return this.request('/offers'); }
  async getInterviews() { return this.request('/interviews'); }
  async getForumPosts(params = {}) { 
    const query = new URLSearchParams(params).toString();
    return this.request(`/forum${query ? `?${query}` : ''}`); 
  }
  async getScripts() { return this.request('/scripts'); }
  async createOffer(data) { return this.request('/offers', { method: 'POST', body: data }); }
  async createInterview(data) { return this.request('/interviews', { method: 'POST', body: data }); }
}

const apiClient = new ApiClient();
window.api = apiClient;
console.log('[API] Client initialized and bound to window.api');