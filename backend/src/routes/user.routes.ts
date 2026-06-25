import { Router } from 'express';
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deactivateHandler,
  activateHandler,
  deleteHandler,
  rolesHandler,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('user.manage'), listHandler);
router.get('/roles', requirePermission('user.manage'), rolesHandler);
router.get('/:id', requirePermission('user.manage'), getByIdHandler);
router.post('/', requirePermission('user.manage'), createHandler);
router.patch('/:id', requirePermission('user.manage'), updateHandler);
router.post('/:id/deactivate', requirePermission('user.manage'), deactivateHandler);
router.post('/:id/activate', requirePermission('user.manage'), activateHandler);
router.delete('/:id', requirePermission('user.manage'), deleteHandler);

export default router;
