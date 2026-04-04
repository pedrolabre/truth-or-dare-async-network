import { Router } from 'express';
import {
  createTruthController,
  deleteTruthController,
} from '../controllers/truths.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createTruthController);
router.delete('/:id', authMiddleware, deleteTruthController);

export default router;