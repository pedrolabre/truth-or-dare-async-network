import { Router } from 'express';
import {
  createDareController,
  deleteDareController,
} from '../controllers/dares.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createDareController);
router.delete('/:id', authMiddleware, deleteDareController);

export default router;