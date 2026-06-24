import { Router } from 'express';
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
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';

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

export default router;
