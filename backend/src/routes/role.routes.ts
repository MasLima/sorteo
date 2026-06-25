import { Router } from 'express';
import {
  listRoles, listPermissions, createRole, updateRole, deleteRole,
  createPermission, deletePermission,
} from '../controllers/role.controller';
import { authenticate } from '../middleware/authenticate';
import { requirePermission } from '../middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('user.manage'), listRoles);
router.get('/permissions', requirePermission('user.manage'), listPermissions);
router.post('/', requirePermission('user.manage'), createRole);
router.patch('/:id', requirePermission('user.manage'), updateRole);
router.delete('/:id', requirePermission('user.manage'), deleteRole);

router.post('/permissions', requirePermission('user.manage'), createPermission);
router.delete('/permissions/:id', requirePermission('user.manage'), deletePermission);

export default router;