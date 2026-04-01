import { Router } from 'express';
import { createDareController } from '../controllers/dares.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createDareController);

export default router;