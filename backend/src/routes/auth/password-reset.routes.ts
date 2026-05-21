import { Router } from 'express';
import {
  forgotPasswordController,
  resetPasswordController,
  verifyResetCodeController,
} from '../../controllers/auth/password-reset.controller';

const router = Router();

router.post('/forgot-password', forgotPasswordController);
router.post('/verify-reset-code', verifyResetCodeController);
router.post('/reset-password', resetPasswordController);

export default router;
