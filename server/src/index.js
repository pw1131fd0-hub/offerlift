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
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: config.corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(projectRoot, 'test.html'));
});

// Root POST debugger
app.post('/', (req, res) => {
  console.log('DEBUG: Received POST to /');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ ok: true });
});

// Serve static files with no-cache for debug
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

app.use(express.static(projectRoot));
app.use(express.static(path.join(projectRoot, 'public')));

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