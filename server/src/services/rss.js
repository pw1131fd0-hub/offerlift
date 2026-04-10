import cron from 'node-cron';
import axios from 'axios';
import { parseString } from 'xml2js';
import { query } from '../config/database.js';
import { cacheSet, cacheDel } from '../config/redis.js';

const RSS_URLS = {
  '104': 'https://www.104.com.tw/rss/relevancefeed/未填寫', // Placeholder
  'cakeresume': 'https://www.cakeresume.com/feed', // Placeholder
};

export async function fetchRSSFeed(source) {
  try {
    const url = RSS_URLS[source];
    if (!url) return null;

    const response = await axios.get(url, { timeout: 10000 });
    const xml = response.data;

    // Parse XML to JSON
    const parsed = await new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Extract items (RSS format varies)
    const items = parsed?.rss?.channel?.[0]?.item || [];

    return items.map(item => ({
      title: item.title?.[0] || '',
      link: item.link?.[0] || '',
      pubDate: item.pubDate?.[0] || new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`Failed to fetch RSS from ${source}:`, err.message);
    return null;
  }
}

export async function updateSalaryDataFromRSS() {
  console.log('Running RSS salary data update...');

  try {
    // Fetch from multiple sources
    for (const [source, url] of Object.entries(RSS_URLS)) {
      const items = await fetchRSSFeed(source);
      if (!items) continue;

      // In a real implementation, we would:
      // 1. Parse the RSS items for salary data
      // 2. Update the salary_data table with new market data
      // 3. Mark entries with source = '104' or 'cakeresume'

      console.log(`Fetched ${items.length} items from ${source}`);
    }

    // Invalidate cache
    await cacheDel('salary:all');

    console.log('RSS salary data update completed');
  } catch (err) {
    console.error('RSS update failed:', err);
  }
}

export function startScheduler() {
  // Run every hour
  cron.schedule('0 * * * *', () => {
    updateSalaryDataFromRSS();
  });

  console.log('RSS scheduler started (runs every hour)');
}
