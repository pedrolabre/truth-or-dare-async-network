import { Router } from 'express';
import {
  changeEmailController,
  changePasswordController,
  loginController,
  signupController,
} from '../../controllers/auth/auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.post('/change-email', authMiddleware, changeEmailController);
router.post('/change-password', authMiddleware, changePasswordController);

export default router;
