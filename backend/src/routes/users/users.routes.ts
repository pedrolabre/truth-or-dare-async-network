import { Router } from 'express';
import {
  deleteMyAccountController,
  getMyProfileController,
  getPublicUserProfileController,
  listUsersController,
  patchMyAccountController,
  updateMyProfileController,
} from '../../controllers/users/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/me', authMiddleware, getMyProfileController);
router.put('/me', authMiddleware, updateMyProfileController);
router.patch('/me', authMiddleware, patchMyAccountController);
router.delete('/me', authMiddleware, deleteMyAccountController);
router.get('/:id/public', getPublicUserProfileController);
router.get('/', authMiddleware, listUsersController);

export default router;
