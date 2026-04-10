import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://offerlift:offerlift_dev_password@localhost:5432/offerlift';

// Salary reference data
const salaryData = [
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

// Negotiation scripts
const scripts = [
  {
    title: '開場：感謝 + 確認範圍',
    situation: '面試最後一關，HR 打來通知 Offer',
    script: '非常感謝您提供這個機會！我對這個職位非常感興趣。在我們討論具體數字之前，我想先確認一下這個 Offer 的整體結構——包括薪資、獎金、股票、以及其他福利。這樣我可以更全面地評估。',
    tip: '不要第一時間拒絕或接受，先爭取時間了解完整 package',
    category: '開場',
  },
  {
    title: '第一步：市場數據開場',
    situation: 'HR 給出第一個數字，低於預期',
    script: '感謝您提出的數字。根據我對市場行情的了解——特別是同職級、同產業的薪資範圍——我預期這個職位的市場價值大約在 [市場數據] 左右。我很想了解，公司在薪資上是否有彈性？',
    tip: '用數據說話，不要只說「我覺得太低」',
    category: '談判',
  },
  {
    title: '第二步：提出具體數字',
    situation: 'HR 說可以討論',
    script: '根據我的研究與自身經驗，我希望爭取 [具體數字] 的年度總薪酬。如果這個範圍有困難，我想了解公司是否有其他的補償方式——例如更高獎金比例、更多的股票、或是一次性的 sign-on bonus？',
    tip: '提出一個範圍，而非單一數字，給雙方留空間',
    category: '談判',
  },
  {
    title: '第三步：談判非薪資福利',
    situation: '薪資談到上限，但還想爭取更多',
    script: '我理解薪資有公司的規範。請問有機會討論以下任何一項嗎？1) 額外的年假天數。2) 彈性工時或完全遠端選項。3) 年度在職進修補助。4) 優先 Vesting 排程。這些對我來說跟薪資一樣重要。',
    tip: 'Total Compensation 不是只有月薪',
    category: '福利',
  },
  {
    title: '結尾：設定下一步',
    situation: '談判還沒結論，需要暫停',
    script: '非常感謝這次機會，我真的很期待加入團隊。我需要一點時間消化這個 Offer，明天再給您回覆可以嗎？如果有任何需要補充的資料或參考，我很樂意提供。',
    tip: '永遠不要當場答應或拒絕，爭取 24-48 小時考慮時間',
    category: '結尾',
  },
];

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await client.query('DELETE FROM salary_data');
    await client.query('DELETE FROM negotiation_scripts');

    // Insert salary data
    for (const data of salaryData) {
      await client.query(
        `INSERT INTO salary_data (title, min_salary, max_salary, level, city, source)
         VALUES ($1, $2, $3, $4, $5, 'manual')`,
        [data.title, data.min, data.max, data.level, data.city]
      );
    }

    // Insert scripts
    for (const script of scripts) {
      await client.query(
        `INSERT INTO negotiation_scripts (title, situation, script, tip, category)
         VALUES ($1, $2, $3, $4, $5)`,
        [script.title, script.situation, script.script, script.tip, script.category]
      );
    }

    console.log('Seeding completed successfully');
    console.log(`Inserted ${salaryData.length} salary records`);
    console.log(`Inserted ${scripts.length} negotiation scripts`);
  } catch (err) {
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
