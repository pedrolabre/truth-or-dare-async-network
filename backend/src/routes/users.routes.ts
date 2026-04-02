import { Router } from 'express';
import { listUsersController } from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listUsersController);

export default router;