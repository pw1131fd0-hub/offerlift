// City adjustment factors
const CITY_FACTORS = {
  taipei: 1.0,
  new_taipei: 0.95,  // New Taipei - slightly below Taipei
  taichung: 0.9,
  kaohsiung: 0.85,
  other: 0.92,
};

// Experience adjustment factors
const EXPERIENCE_FACTORS = {
  '0-2': 0.7,
  '2-5': 1.0,
  '5-10': 1.3,
  '10+': 1.5,
};

// Market reference data (salary ranges in TWD)
const MARKET_REFERENCE = {
  'Frontend Engineer': { min: 600000, max: 1200000, median: 850000 },
  'Senior Frontend': { min: 1000000, max: 1800000, median: 1400000 },
  'Backend Engineer': { min: 650000, max: 1300000, median: 950000 },
  'Senior Backend': { min: 1100000, max: 2000000, median: 1500000 },
  'Full Stack Engineer': { min: 700000, max: 1400000, median: 1050000 },
  'DevOps / SRE': { min: 800000, max: 1600000, median: 1200000 },
  'Data Engineer': { min: 750000, max: 1500000, median: 1100000 },
  'ML Engineer': { min: 900000, max: 2000000, median: 1400000 },
  'Product Manager': { min: 800000, max: 1700000, median: 1250000 },
  'UI/UX Designer': { min: 550000, max: 1100000, median: 800000 },
  'Engineering Manager': { min: 1500000, max: 3000000, median: 2200000 },
  'Tech Lead': { min: 1300000, max: 2500000, median: 1900000 },
};

export function evaluateOffer(input) {
  const { jobTitle, totalComp, baseSalary, bonus, equity, city, experience } = input;

  const breakdown = [];
  let score = 50; // Start with base score

  // 1. Market comparison (up to ±30 points)
  const reference = MARKET_REFERENCE[jobTitle] || { min: 500000, max: 1500000, median: 900000 };
  const cityFactor = CITY_FACTORS[city] || 1.0;
  const expFactor = EXPERIENCE_FACTORS[experience] || 1.0;

  const adjustedMedian = reference.median * cityFactor * expFactor;
  const marketRatio = totalComp / adjustedMedian;

  if (marketRatio >= 1.2) {
    breakdown.push({ label: '市場薪資比', value: '+25', good: true });
    score += 25;
  } else if (marketRatio >= 1.0) {
    const points = Math.round((marketRatio - 0.9) * 250);
    breakdown.push({ label: '市場薪資比', value: `+${points}`, good: true });
    score += points;
  } else if (marketRatio >= 0.8) {
    const points = Math.round((marketRatio - 0.8) * 150);
    breakdown.push({ label: '市場薪資比', value: `${points}`, good: null });
    score += points;
  } else {
    const penalty = Math.round((0.8 - marketRatio) * 150);
    breakdown.push({ label: '市場薪資比', value: `-${penalty}`, good: false });
    score -= penalty;
  }

  // 2. Base salary vs total comp ratio (bonus consideration)
  const bonusRatio = bonus / 12; // Convert months to ratio
  if (bonusRatio >= 2) {
    breakdown.push({ label: '年終獎金', value: '+5', good: true });
    score += 5;
  } else if (bonusRatio >= 1) {
    breakdown.push({ label: '年終獎金', value: '0', good: null });
  } else {
    breakdown.push({ label: '年終獎金', value: '-3', good: false });
    score -= 3;
  }

  // 3. Equity component (up to ±15 points)
  if (equity > 0) {
    const equityValue = equity * 1000000; // Rough estimate
    if (equity >= 0.5) {
      breakdown.push({ label: '股票/選擇權', value: '+10', good: true });
      score += 10;
    } else if (equity >= 0.1) {
      breakdown.push({ label: '股票/選擇權', value: '+5', good: true });
      score += 5;
    } else {
      breakdown.push({ label: '股票/選擇權', value: '+2', good: null });
      score += 2;
    }
  } else {
    breakdown.push({ label: '股票/選擇權', value: '0', good: null });
  }

  // 4. City adjustment
  if (cityFactor > 1.0) {
    breakdown.push({ label: '城市加權', value: '+5', good: true });
    score += 5;
  } else if (cityFactor < 0.9) {
    breakdown.push({ label: '城市加權', value: '-2', good: false });
    score -= 2;
  } else {
    breakdown.push({ label: '城市加權', value: '0', good: null });
  }

  // 5. Experience match
  const expDiff = expFactor - 1.0;
  if (expDiff > 0.2) {
    breakdown.push({ label: '年資匹配', value: '+5', good: true });
    score += 5;
  } else if (expDiff < -0.2) {
    breakdown.push({ label: '年資匹配', value: '-5', good: false });
    score -= 5;
  } else {
    breakdown.push({ label: '年資匹配', value: '0', good: null });
  }

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine verdict and label
  let verdict, label;
  if (score >= 80) {
    verdict = '果斷接受！這個 Offer 非常有競爭力。';
    label = 'excellent';
  } else if (score >= 60) {
    verdict = '可以談判。這個 Offer 接近市場價值，但還有改進空間。';
    label = 'good';
  } else if (score >= 40) {
    verdict = '建議談判。這個 Offer 低於市場價值，建議爭取更好的條件。';
    label = 'fair';
  } else {
    verdict = '必須談判。這個 Offer 明顯低於市場價值，建議積極爭取或考慮其他機會。';
    label = 'poor';
  }

  return {
    score,
    breakdown,
    verdict,
    label,
  };
}
