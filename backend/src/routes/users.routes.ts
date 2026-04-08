import { Router } from 'express';
import {
  getMyProfileController,
  listUsersController,
  updateMyProfileController,
} from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, getMyProfileController);
router.put('/me', authMiddleware, updateMyProfileController);
router.get('/', authMiddleware, listUsersController);

export default router;