import { Router } from 'express';
import evaluateRouter from './evaluate.js';
import salaryDataRouter from './salary-data.js';
import offersRouter from './offers.js';
import interviewsRouter from './interviews.js';
import forumRouter from './forum.js';
import calculatorRouter from './calculator.js';
import rssRouter from './rss.js';
import scriptsRouter from './scripts.js';
import contributeRouter from './contribute.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth to all API routes
router.use(authMiddleware);

// Route handlers
router.use('/evaluate', evaluateRouter);
router.use('/salary-data', salaryDataRouter);
router.use('/offers', offersRouter);
router.use('/interviews', interviewsRouter);
router.use('/forum', forumRouter);
router.use('/calculator', calculatorRouter);
router.use('/rss', rssRouter);
router.use('/scripts', scriptsRouter);
router.use('/contribute', contributeRouter);

export default router;
