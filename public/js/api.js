// API Client for OfferLift Backend
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.apiKey = localStorage.getItem('offerlift_api_key') || 'dev_api_key_12345';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Evaluate offer
  async evaluateOffer(data) {
    return this.request('/evaluate', { method: 'POST', body: data });
  }

  async getEvaluationHistory() {
    return this.request('/evaluate/history');
  }

  // Salary data
  async getSalaryData() {
    return this.request('/salary-data');
  }

  async contributeSalary(data) {
    return this.request('/contribute', { method: 'POST', body: data });
  }

  // Offers
  async getOffers() {
    return this.request('/offers');
  }

  async createOffer(data) {
    return this.request('/offers', { method: 'POST', body: data });
  }

  async updateOffer(id, data) {
    return this.request(`/offers/${id}`, { method: 'PUT', body: data });
  }

  async deleteOffer(id) {
    return this.request(`/offers/${id}`, { method: 'DELETE' });
  }

  // Interviews
  async getInterviews() {
    return this.request('/interviews');
  }

  async createInterview(data) {
    return this.request('/interviews', { method: 'POST', body: data });
  }

  async updateInterview(id, data) {
    return this.request(`/interviews/${id}`, { method: 'PUT', body: data });
  }

  async deleteInterview(id) {
    return this.request(`/interviews/${id}`, { method: 'DELETE' });
  }

  // Forum
  async getForumPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/forum${query ? `?${query}` : ''}`);
  }

  async createForumPost(data) {
    return this.request('/forum', { method: 'POST', body: data });
  }

  async deleteForumPost(id) {
    return this.request(`/forum/${id}`, { method: 'DELETE' });
  }

  // Calculator
  async calculateTax(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/calculator/tax?${query}`);
  }

  async calculateBenefits(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/calculator/benefits?${query}`);
  }

  // Scripts
  async getScripts() {
    return this.request('/scripts');
  }

  // RSS
  async getRss104() {
    return this.request('/rss/104');
  }

  async getRssCakeResume() {
    return this.request('/rss/cakeresume');
  }
}

const apiClient = new ApiClient();
window.api = apiClient;
export { apiClient as api };