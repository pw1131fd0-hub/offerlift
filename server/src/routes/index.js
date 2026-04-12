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
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// Public endpoints - no auth required
router.use('/salary-data', salaryDataRouter); // Public salary data
router.use('/scripts', scriptsRouter); // Public negotiation scripts

// Protected endpoints - require API key
router.use('/evaluate', authMiddleware, evaluateRouter);
router.use('/offers', authMiddleware, offersRouter);
router.use('/interviews', authMiddleware, interviewsRouter);
router.use('/forum', authMiddleware, forumRouter);
router.use('/calculator', authMiddleware, calculatorRouter);
router.use('/rss', authMiddleware, rssRouter);
router.use('/contribute', authMiddleware, contributeRouter);

export default router;
