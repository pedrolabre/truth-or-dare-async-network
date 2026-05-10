import { Router } from 'express';
import { createClubPromptController } from '../controllers/club-prompts.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:id/prompts', authMiddleware, createClubPromptController);

export default router;
