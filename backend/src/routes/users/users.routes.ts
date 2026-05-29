import { Router } from 'express';
import {
  getMyProfileController,
  getPublicUserProfileController,
  listUsersController,
  updateMyProfileController,
} from '../../controllers/users/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, getMyProfileController);
router.put('/me', authMiddleware, updateMyProfileController);
router.get('/:id/public', getPublicUserProfileController);
router.get('/', authMiddleware, listUsersController);

export default router;
