import { Router } from 'express';
import { loginHandler, refreshHandler, meHandler } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.get('/me', authenticate, meHandler);

export default router;
