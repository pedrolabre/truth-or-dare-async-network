import { Router } from 'express';
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadNotificationsCountController,
} from '../controllers/notifications.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listNotificationsController);
router.get('/unread-count', authMiddleware, unreadNotificationsCountController);
router.patch('/:id/read', authMiddleware, markNotificationReadController);
router.post('/read-all', authMiddleware, markAllNotificationsReadController);

export default router;
