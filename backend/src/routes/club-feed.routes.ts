import { Router } from 'express';
import {
  getClubFeedController,
  getClubsAggregatedFeedController,
} from '../controllers/club-feed.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/feed', authMiddleware, getClubsAggregatedFeedController);
router.get('/:id/feed', authMiddleware, getClubFeedController);

export default router;
