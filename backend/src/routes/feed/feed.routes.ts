import { Router } from 'express';
import { getFeedController } from '../../controllers/feed/feed.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getFeedController);

export default router;
