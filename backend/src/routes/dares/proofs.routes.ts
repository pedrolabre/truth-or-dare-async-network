import { Router } from 'express';
import { getDareProofDetailsController } from '../../controllers/dares/proofs-detail.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/proofs/:proofId', authMiddleware, getDareProofDetailsController);

export default router;
