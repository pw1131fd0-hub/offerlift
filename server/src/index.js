import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'"],
//       upgradeInsecureRequests: null
//     }
//   }
// }));
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

// Serve static files from public directory
app.use('/js', express.static(path.join(projectRoot, 'public', 'js')));

import fs from 'fs';

// Serve index.html for root route
app.get('/', (req, res) => {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(projectRoot, 'test.html'));
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
