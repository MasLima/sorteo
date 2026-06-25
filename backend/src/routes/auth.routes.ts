import { Router } from 'express';
import { loginHandler, refreshHandler, meHandler, changePasswordHandler, forgotPasswordHandler, resetPasswordHandler } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.get('/me', authenticate, meHandler);
router.post('/change-password', authenticate, changePasswordHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

export default router;
