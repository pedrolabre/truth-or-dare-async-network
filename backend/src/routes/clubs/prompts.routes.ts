import { Router } from 'express';
import {
  createClubPromptCommentController,
  createClubPromptController,
  createClubPromptResponseController,
  getClubPromptDetailController,
  listClubPromptResponsesController,
  moderateClubPromptController,
  toggleClubPromptLikeController,
  toggleClubPromptResponseLikeController,
  updateClubPromptController,
} from '../../controllers/clubs/prompts.controller';
import {
  createClubPromptCommentReportController,
  createClubPromptReportController,
  createClubPromptResponseReportController,
} from '../../controllers/clubs/reports.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/:id/prompts', authMiddleware, createClubPromptController);
router.post(
  '/:id/prompts/:promptId/like',
  authMiddleware,
  toggleClubPromptLikeController,
);
router.post(
  '/:id/prompts/:promptId/responses/:responseId/like',
  authMiddleware,
  toggleClubPromptResponseLikeController,
);
router.post(
  '/:id/prompts/:promptId/responses/:responseId/report',
  authMiddleware,
  createClubPromptResponseReportController,
);
router.post(
  '/:id/prompts/:promptId/responses',
  authMiddleware,
  createClubPromptResponseController,
);
router.get(
  '/:id/prompts/:promptId/responses',
  authMiddleware,
  listClubPromptResponsesController,
);
router.post(
  '/:id/prompts/:promptId/comments',
  authMiddleware,
  createClubPromptCommentController,
);
router.post(
  '/:id/prompts/:promptId/comments/:commentId/report',
  authMiddleware,
  createClubPromptCommentReportController,
);
router.post(
  '/:id/prompts/:promptId/report',
  authMiddleware,
  createClubPromptReportController,
);
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
