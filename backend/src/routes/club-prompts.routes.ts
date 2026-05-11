import { Router } from 'express';
import {
  createClubPromptController,
  getClubPromptDetailController,
  moderateClubPromptController,
  updateClubPromptController,
} from '../controllers/club-prompts.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:id/prompts', authMiddleware, createClubPromptController);
router.get(
  '/:id/prompts/:promptId',
  authMiddleware,
  getClubPromptDetailController,
);
router.patch(
  '/:id/prompts/:promptId',
  authMiddleware,
  updateClubPromptController,
);
router.delete(
  '/:id/prompts/:promptId',
  authMiddleware,
  moderateClubPromptController,
);

export default router;
