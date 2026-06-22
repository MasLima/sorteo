import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.post('/ticket', requirePermission('notification.send'), notificationController.notifyTicketHandler);
router.post('/payment-confirmed', requirePermission('notification.send'), notificationController.notifyPaymentConfirmedHandler);
router.post('/winner', requirePermission('notification.send'), notificationController.notifyWinnerHandler);
router.post('/custom', requirePermission('notification.send'), notificationController.notifyCustomHandler);
router.get('/logs', requirePermission('notification.send'), notificationController.getLogsHandler);

export default router;
