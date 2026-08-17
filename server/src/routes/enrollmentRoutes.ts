import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { validateObjectIdParam } from '../middleware/validateObjectId.js';
import {
  createEnrollmentSchema,
  updateEnrollmentStatusSchema,
  enrollmentQuerySchema,
} from '../validators/index.js';

const router = Router();

router.post('/', validateBody(createEnrollmentSchema), EnrollmentController.create);
router.get('/', validateQuery(enrollmentQuerySchema), EnrollmentController.list);
router.get('/:id', validateObjectIdParam('id'), EnrollmentController.getById);
router.patch('/:id/status', validateObjectIdParam('id'), validateBody(updateEnrollmentStatusSchema), EnrollmentController.updateStatus);
router.delete('/:id', validateObjectIdParam('id'), EnrollmentController.delete);

export default router;
