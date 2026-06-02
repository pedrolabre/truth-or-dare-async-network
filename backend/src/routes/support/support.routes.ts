import { Router } from 'express';
import { reportAbuseController } from '../../controllers/support/support.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/report-abuse', authMiddleware, reportAbuseController);

export default router;
