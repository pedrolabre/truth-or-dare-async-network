import { Router } from 'express';
import { toggleTruthLike } from '../controllers/truth-likes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/truths/:id/like', authMiddleware, toggleTruthLike);

export default router;