import { Router } from 'express';
import {
  getClubFeedController,
  getClubsAggregatedFeedController,
  markClubFeedSeenController,
} from '../../controllers/clubs/feed.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/feed', authMiddleware, getClubsAggregatedFeedController);
router.post('/:id/feed/seen', authMiddleware, markClubFeedSeenController);
router.get('/:id/feed', authMiddleware, getClubFeedController);

export default router;
