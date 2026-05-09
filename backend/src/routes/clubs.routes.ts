import { Router } from 'express';
import {
  acceptClubInviteController,
  approveClubJoinRequestController,
  archiveClubController,
  createClubController,
  createClubInviteController,
  createClubJoinRequestController,
  declineClubInviteController,
  discoverClubsController,
  getClubDetailsController,
  joinClubController,
  listClubMembersController,
  listMyClubInvitesController,
  rejectClubJoinRequestController,
  listMyClubsController,
  restoreClubController,
  searchClubsController,
  updateClubController,
} from '../controllers/clubs.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createClubController);
router.get('/my', authMiddleware, listMyClubsController);
router.get('/invites/my', authMiddleware, listMyClubInvitesController);
router.post('/invites/:id/accept', authMiddleware, acceptClubInviteController);
router.post('/invites/:id/decline', authMiddleware, declineClubInviteController);
router.post(
  '/join-requests/:id/approve',
  authMiddleware,
  approveClubJoinRequestController,
);
router.post(
  '/join-requests/:id/reject',
  authMiddleware,
  rejectClubJoinRequestController,
);
router.get('/discover', authMiddleware, discoverClubsController);
router.get('/search', authMiddleware, searchClubsController);
router.get('/:id/members', authMiddleware, listClubMembersController);
router.post('/:id/invites', authMiddleware, createClubInviteController);
router.post('/:id/join', authMiddleware, joinClubController);
router.post(
  '/:id/join-requests',
  authMiddleware,
  createClubJoinRequestController,
);
router.get('/:id', authMiddleware, getClubDetailsController);
router.patch('/:id', authMiddleware, updateClubController);
router.delete('/:id', authMiddleware, archiveClubController);
router.post('/:id/restore', authMiddleware, restoreClubController);

export default router;
