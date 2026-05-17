import { Router } from 'express';
import { signUploadUrlController } from '../../controllers/uploads/uploads.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/sign', authMiddleware, signUploadUrlController);

export default router;
