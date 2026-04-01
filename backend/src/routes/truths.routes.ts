import { Router } from 'express';
import { createTruthController } from '../controllers/truths.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createTruthController);

export default router;