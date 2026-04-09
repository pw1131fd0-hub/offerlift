// Core business logic for OfferLift
// This module contains pure functions for testing

export const salaryData = [
  { title: 'Frontend Engineer', min: 600000, max: 1200000, level: '2-5年', city: 'taipei' },
  { title: 'Senior Frontend', min: 1000000, max: 1800000, level: '5-10年', city: 'taipei' },
  { title: 'Backend Engineer', min: 650000, max: 1300000, level: '2-5年', city: 'taipei' },
  { title: 'Senior Backend', min: 1100000, max: 2000000, level: '5-10年', city: 'taipei' },
  { title: 'Full Stack Engineer', min: 700000, max: 1400000, level: '2-5年', city: 'taipei' },
  { title: 'DevOps / SRE', min: 800000, max: 1600000, level: '3-5年', city: 'nhc' },
  { title: 'Data Engineer', min: 750000, max: 1500000, level: '2-5年', city: 'taipei' },
  { title: 'ML Engineer', min: 900000, max: 2000000, level: '3-5年', city: 'taipei' },
  { title: 'Product Manager', min: 800000, max: 1700000, level: '3-5年', city: 'taipei' },
  { title: 'UI/UX Designer', min: 550000, max: 1100000, level: '2-5年', city: 'taipei' },
  { title: 'Engineering Manager', min: 1500000, max: 3000000, level: '10+年', city: 'taipei' },
  { title: 'Tech Lead', min: 1300000, max: 2500000, level: '5-10年', city: 'taipei' },
];

export const negotiationScripts = [
  {
    title: '開場：感謝 + 確認範圍',
    situation: '面試最後一關，HR 打來通知 Offer',
    script: '非常感謝您提供這個機會！我對這個職位非常感興趣。在我們討論具體數字之前，我想先確認一下這個 Offer 的整體結構——包括薪資、獎金、股票、以及其他福利。這樣我可以更全面地評估。',
    tip: '不要第一時間拒絕或接受，先爭取時間了解完整 package'
  },
  {
    title: '第一步：市場數據開場',
    situation: 'HR 給出第一個數字，低於預期',
    script: '感謝您提出的數字。根據我對市場行情的了解——特別是同職級、同產業的薪資範圍——我預期這個職位的市場價值大約在 [市場數據] 左右。我很想了解，公司在薪資上是否有彈性？',
    tip: '用數據說話，不要只說「我覺得太低」'
  },
  {
    title: '第二步：提出具體數字',
    situation: 'HR 說可以討論',
    script: '根據我的研究與自身經驗，我希望爭取 [具體數字] 的年度總薪酬。如果這個範圍有困難，我想了解公司是否有其他的補償方式——例如更高獎金比例、更多的股票、或是一次性的 sign-on bonus？',
    tip: '提出一個範圍，而非單一數字，給雙方留空間'
  },
  {
    title: '第三步：談判非薪資福利',
    situation: '薪資談到上限，但還想爭取更多',
    script: '我理解薪資有公司的規範。請問有機會討論以下任何一項嗎？1) 額外的年假天數。2) 彈性工時或完全遠端選項。3) 年度在職進修補助。4) 優先 Vesting 排程。這些對我來說跟薪資一樣重要。',
    tip: 'Total Compensation 不是只有月薪'
  },
  {
    title: '結尾：設定下一步',
    situation: '談判還沒結論，需要暫停',
    script: '非常感謝這次機會，我真的很期待加入團隊。我需要一點時間消化這個 Offer，明天再給您回覆可以嗎？如果有任何需要補充的資料或參考，我很樂意提供。',
    tip: '永遠不要當場答應或拒絕，爭取 24-48 小時考慮時間'
  }
];

/**
 * Find a matching salary reference for the given criteria
 */
export function findReference(jobTitle, city, level) {
  return salaryData.find(s =>
    jobTitle.toLowerCase().includes(s.title.toLowerCase().split(' ')[0]) ||
    (city === s.city && level === s.level)
  );
}

/**
 * Calculate the evaluation score for an offer
 * @returns {{ score: number, breakdown: Array }}
 */
export function calculateScore(total, base, city, level, jobTitle) {
  let score = 50;
  const breakdown = [];

  // Base salary vs total comp
  const bonusRatio = (total - base) / base;
  if (bonusRatio > 0.2) { score += 15; breakdown.push({ label: '獎金比例佳', value: '+15', good: true }); }
  else if (bonusRatio < 0.05) { score += 5; breakdown.push({ label: '固定薪資導向', value: '+5', good: true }); }

  // vs market
  const ref = findReference(jobTitle, city, level);
  if (ref) {
    const mid = (ref.min + ref.max) / 2;
    const ratio = total / mid;
    if (ratio >= 1.2) { score += 25; breakdown.push({ label: '高於市場', value: '+25', good: true }); }
    else if (ratio >= 1.0) { score += 10; breakdown.push({ label: '符合市場', value: '+10', good: true }); }
    else if (ratio >= 0.8) { score -= 10; breakdown.push({ label: '低於市場', value: '-10', good: false }); }
    else { score -= 25; breakdown.push({ label: '明顯低於市場', value: '-25', good: false }); }
  } else {
    score += 10; breakdown.push({ label: '無直接參考', value: '+10', good: null });
  }

  // City adjustment
  if (city === 'nhc') { score += 10; breakdown.push({ label: '新竹科技聚落', value: '+10', good: true }); }
  else if (city === 'remote') { score += 5; breakdown.push({ label: '遠端彈性', value: '+5', good: true }); }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, breakdown };
}

/**
 * Get the verdict text based on score
 */
export function getVerdict(score) {
  if (score >= 70) return '這個 Offer 已經優於市場水平，果斷接受吧！如果有一點小的不滿意，可以用「第三步：非薪資福利談判」爭取更多假期或進修補助。';
  if (score >= 50) return '基本合理，但還有談判空間。先用「第一步：市場數據開場」，準備好參考數據再跟 HR 聯繫。記住：談判是正常的，HR 預期你會談。';
  return '明顯低於行情，建議立刻談判。先用「第二步：提出具體數字」，給出一個你有數據支撐的具體範圍。如果公司真的沒辦法，可能要考慮其他選項。';
}

/**
 * Filter negotiation scripts by query
 */
export function filterScripts(query) {
  const q = query.toLowerCase();
  return negotiationScripts.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.situation.toLowerCase().includes(q) ||
    s.tip.toLowerCase().includes(q)
  );
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitize(str) {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Storage service for localStorage operations
 */
export const StorageService = {
  getUserCount() {
    return parseInt(localStorage.getItem('offerlift_users') || '127');
  },

  incrementUserCount() {
    const users = this.getUserCount() + 1;
    localStorage.setItem('offerlift_users', users.toString());
    return users;
  },

  getContributions() {
    return JSON.parse(localStorage.getItem('offerlift_contribs') || '[]');
  },

  addContribution(item) {
    const contribs = this.getContributions();
    contribs.push({ ...item, date: new Date().toISOString() });
    localStorage.setItem('offerlift_contribs', JSON.stringify(contribs));
  },

  getHistory() {
    return JSON.parse(localStorage.getItem('offerlift_history') || '[]');
  },

  addHistory(item) {
    const MAX_HISTORY = 5;
    let history = this.getHistory();
    history.unshift({ ...item, date: new Date().toISOString() });
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem('offerlift_history', JSON.stringify(history));
  }
};
