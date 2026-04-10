import { Router } from 'express';

const router = Router();

// Taiwan progressive tax brackets (2024)
const TAX_BRACKETS = [
  { min: 0, max: 560000, rate: 0.05, deduction: 0 },
  { min: 560000, max: 1260000, rate: 0.12, deduction: 25200 },
  { min: 1260000, max: 2520000, rate: 0.2, deduction: 109200 },
  { min: 2520000, max: 4410000, rate: 0.3, deduction: 220200 },
  { min: 4410000, max: 6930000, rate: 0.4, deduction: 442200 },
  { min: 6930000, max: Infinity, rate: 0.45, deduction: 847200 },
];

// GET /api/calculator/tax
router.get('/tax', (req, res, next) => {
  try {
    const { annualIncome, bonus = 0, deduction = 'standard' } = req.query;

    if (!annualIncome) {
      return res.status(400).json({ error: 'annualIncome is required' });
    }

    const income = parseInt(annualIncome, 10);
    const bonusAmount = parseInt(bonus, 10);

    // Standard deduction or itemized
    const standardDeduction = deduction === 'standard' ? 124000 : 0;
    const taxableIncome = Math.max(0, income - standardDeduction);

    // Calculate progressive tax
    let taxAmount = 0;
    for (const bracket of TAX_BRACKETS) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        taxAmount = bracket.rate * taxableIncome - bracket.deduction;
        break;
      }
    }
    taxAmount = Math.max(0, Math.round(taxAmount));

    // Bonus tax calculation (separate or combined)
    const bonusTaxRates = [0.05, 0.12, 0.2]; // Progressive for bonus

    // One-time bonus tax (at highest rate of income tax brackets)
    const effectiveRate = income > 0 ? (taxAmount / income) * 100 : 0;
    const bonusTaxOneTime = Math.round(bonusAmount * Math.min(0.4, effectiveRate / 100 + 0.05));

    // Bonus split into 2 payments
    const halfBonus = bonusAmount / 2;
    const bonusTaxTwoTimes = Math.round(halfBonus * 0.12 * 2);

    // Bonus split into 3 payments
    const thirdBonus = bonusAmount / 3;
    const bonusTaxThreeTimes = Math.round(thirdBonus * 0.12 * 3);

    const monthlyNet = Math.round((income - taxAmount) / 12);
    const netBonusOneTime = bonusAmount - bonusTaxOneTime;
    const netBonusTwoTimes = bonusAmount - bonusTaxTwoTimes;
    const netBonusThreeTimes = bonusAmount - bonusTaxThreeTimes;

    // Recommend the best option
    let recommended = 'one-time';
    let maxNet = netBonusOneTime;
    let savings = 0;

    if (netBonusTwoTimes > maxNet) {
      recommended = 'two-times';
      maxNet = netBonusTwoTimes;
      savings = netBonusTwoTimes - netBonusOneTime;
    }
    if (netBonusThreeTimes > maxNet) {
      recommended = 'three-times';
      maxNet = netBonusThreeTimes;
      savings = netBonusThreeTimes - netBonusOneTime;
    }

    res.json({
      grossIncome: income,
      bonusAmount,
      taxableIncome,
      taxAmount,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      monthlyNet,
      bonusBreakdown: {
        oneTime: { tax: bonusTaxOneTime, net: netBonusOneTime },
        twoTimes: { tax: bonusTaxTwoTimes, net: netBonusTwoTimes },
        threeTimes: { tax: bonusTaxThreeTimes, net: netBonusThreeTimes },
      },
      recommended: `分${recommended === 'two-times' ? '兩次' : recommended === 'three-times' ? '三次' : '一次'}發放`,
      savings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/calculator/benefits
router.get('/benefits', (req, res, next) => {
  try {
    const { baseSalary, annualLeave = 0, mealAllowance = 0, transportAllowance = 0, healthInsurance = 0, laborInsurance = 0 } = req.query;

    if (!baseSalary) {
      return res.status(400).json({ error: 'baseSalary is required' });
    }

    const salary = parseInt(baseSalary, 10);

    // Calculate annual value of benefits
    const annualLeaveValue = parseInt(annualLeave, 10) * (salary / 365) * 1.5; // 1.5x for unused leave
    const mealValue = parseInt(mealAllowance, 10) * 12;
    const transportValue = parseInt(transportAllowance, 10) * 12;
    const healthValue = parseInt(healthInsurance, 10) * 12;
    const laborValue = parseInt(laborInsurance, 10) * 12;

    const totalBenefits = Math.round(annualLeaveValue + mealValue + transportValue + healthValue + laborValue);

    res.json({
      baseSalary: salary,
      totalBenefits,
      breakdown: {
        annualLeave: Math.round(annualLeaveValue),
        mealAllowance: mealValue,
        transportAllowance: transportValue,
        healthInsurance: healthValue,
        laborInsurance: laborValue,
      },
      totalComp: salary + totalBenefits,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
