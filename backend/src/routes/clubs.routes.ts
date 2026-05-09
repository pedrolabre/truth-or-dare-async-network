import { Router } from 'express';
import {
  archiveClubController,
  createClubController,
  discoverClubsController,
  getClubDetailsController,
  listMyClubsController,
  restoreClubController,
  searchClubsController,
  updateClubController,
} from '../controllers/clubs.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createClubController);
router.get('/my', authMiddleware, listMyClubsController);
router.get('/discover', authMiddleware, discoverClubsController);
router.get('/search', authMiddleware, searchClubsController);
router.get('/:id', authMiddleware, getClubDetailsController);
router.patch('/:id', authMiddleware, updateClubController);
router.delete('/:id', authMiddleware, archiveClubController);
router.post('/:id/restore', authMiddleware, restoreClubController);

export default router;
