import { Router } from 'express';

import { toggleTruthCommentLike } from '../../controllers/truths/comments-likes.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/truths/comments/:id/like', authMiddleware, toggleTruthCommentLike);

export default router;
