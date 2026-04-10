import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://offerlift:offerlift_dev_password@localhost:5432/offerlift';

async function migrate() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        anonymous_id VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS salary_data (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        min_salary INTEGER NOT NULL,
        max_salary INTEGER NOT NULL,
        level VARCHAR(20) NOT NULL,
        city VARCHAR(20) NOT NULL,
        source VARCHAR(50) DEFAULT 'manual',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS salary_contributions (
        id SERIAL PRIMARY KEY,
        anonymous_id VARCHAR(64) NOT NULL,
        title VARCHAR(100) NOT NULL,
        salary INTEGER NOT NULL,
        city VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        anonymous_id VARCHAR(64) NOT NULL,
        company VARCHAR(100) NOT NULL,
        title VARCHAR(100) NOT NULL,
        deadline TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'candidate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        anonymous_id VARCHAR(64) NOT NULL,
        company VARCHAR(100) NOT NULL,
        title VARCHAR(100) NOT NULL,
        stage VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        company VARCHAR(100),
        city VARCHAR(20) NOT NULL,
        salary_range VARCHAR(50),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS negotiation_scripts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        situation TEXT NOT NULL,
        script TEXT NOT NULL,
        tip TEXT NOT NULL,
        category VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        anonymous_id VARCHAR(64) NOT NULL,
        job_title VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        total_comp INTEGER NOT NULL,
        breakdown JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_salary_title_city ON salary_data(title, city);
      CREATE INDEX IF NOT EXISTS idx_offers_anonymous ON offers(anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_interviews_anonymous ON interviews(anonymous_id);
      CREATE INDEX IF NOT EXISTS idx_evaluations_anonymous ON evaluations(anonymous_id);
    `);

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
