import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { startScheduler } from './services/rss.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve project root (parent of server/src)
const projectRoot = path.resolve(__dirname, '..', '..');

// Middleware
app.use(cors({
  origin: config.corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));
app.use(express.json({ limit: '1mb' }));

// Serve static files (including index.html)
app.use(express.static(projectRoot));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`OfferLift API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);

  // Start RSS scheduler
  if (config.nodeEnv === 'development' || config.nodeEnv === 'production') {
    startScheduler();
  }
});

export default app;