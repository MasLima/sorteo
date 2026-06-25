import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  deleteTicketHandler,
  registerTicketHandler,
  confirmTicketHandler,
  listTicketsHandler,
  registerWinnerHandler,
} from '../controllers/raffle.controller';
import { scanPaymentHandler, matchScanHandler, createFromScanHandler } from '../controllers/scan.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Formato no soportado'));
  },
});

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('raffle.view'), listHandler);
router.get('/:id', requirePermission('raffle.view'), getByIdHandler);
router.post('/', requirePermission('raffle.create'), createHandler);
router.patch('/:id', requirePermission('raffle.edit'), updateHandler);
router.delete('/:id', requirePermission('raffle.delete'), deleteHandler);

router.post('/:id/tickets', requirePermission('ticket.register'), registerTicketHandler);
router.get('/:id/tickets', requirePermission('raffle.view'), listTicketsHandler);
router.patch('/tickets/:ticketId/confirm', requirePermission('ticket.confirm'), confirmTicketHandler);
router.delete('/tickets/:ticketId', requirePermission('raffle.edit'), deleteTicketHandler);

router.post('/:id/winner', requirePermission('winner.register'), registerWinnerHandler);

router.post('/:id/scan-payment', requirePermission('ticket.confirm'), upload.single('image'), scanPaymentHandler);
router.post('/:id/scan-match', requirePermission('ticket.confirm'), matchScanHandler);
router.post('/:id/scan-create', requirePermission('ticket.register'), createFromScanHandler);

export default router;
