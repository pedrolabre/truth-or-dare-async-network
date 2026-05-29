import { Router } from 'express';
import {
  getRecommendedUsersController,
  getTrendingClubsController,
  searchAllController,
  searchClubsController,
  searchUsersController,
} from '../../controllers/search/search.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/recommended/users', authMiddleware, getRecommendedUsersController);
router.get('/trending/clubs', authMiddleware, getTrendingClubsController);
router.get('/users', authMiddleware, searchUsersController);
router.get('/clubs', authMiddleware, searchClubsController);
router.get('/', authMiddleware, searchAllController);

export default router;
