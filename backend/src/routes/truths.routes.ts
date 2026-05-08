import { Router } from 'express';
import {
  createTruthCommentController,
  createTruthController,
  deleteTruthCommentController,
  deleteTruthController,
  getTruthCommentsController,
  updateTruthCommentController,
} from '../controllers/truths.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createTruthController);

router.patch(
  '/comments/:id',
  authMiddleware,
  updateTruthCommentController,
);

router.delete(
  '/comments/:id',
  authMiddleware,
  deleteTruthCommentController,
);

router.get('/:id/comments', authMiddleware, getTruthCommentsController);
router.post('/:id/comments', authMiddleware, createTruthCommentController);
router.delete('/:id', authMiddleware, deleteTruthController);

export default router;