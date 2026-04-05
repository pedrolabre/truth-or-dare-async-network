import { Router } from 'express';
import { toggleDareLike } from '../controllers/dare-likes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/dares/:id/like', authMiddleware, toggleDareLike);

export default router;