import { Router } from 'express';

const router = Router();

router.post('/signup', (req, res) => {
  return res.json({ message: 'signup endpoint' });
});

router.post('/login', (req, res) => {
  return res.json({ message: 'login endpoint' });
});

export default router;
