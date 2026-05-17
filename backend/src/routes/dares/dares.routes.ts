import { Router } from 'express';
import {
  createDareController,
  deleteDareController,
} from '../../controllers/dares/dares.controller';
import { submitDareProofController } from '../../controllers/dares/proof.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createDareController);
router.post('/:id/proof', authMiddleware, submitDareProofController);
router.delete('/:id', authMiddleware, deleteDareController);

export default router;
