import { Router } from 'express';
import {
  getMyProfileController,
  listUsersController,
} from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, getMyProfileController);
router.get('/', authMiddleware, listUsersController);

export default router;