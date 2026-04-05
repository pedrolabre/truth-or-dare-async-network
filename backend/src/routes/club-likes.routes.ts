import { Router } from 'express';
import { toggleClubLike } from '../controllers/club-likes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/clubs/:id/like', authMiddleware, toggleClubLike);

export default router;