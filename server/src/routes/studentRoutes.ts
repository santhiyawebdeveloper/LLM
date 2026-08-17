import { Router } from 'express';
import { StudentController } from '../controllers/studentController.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { validateObjectIdParam } from '../middleware/validateObjectId.js';
import { createStudentSchema, studentQuerySchema } from '../validators/index.js';

const router = Router();

router.post('/', validateBody(createStudentSchema), StudentController.create);
router.get('/', validateQuery(studentQuerySchema), StudentController.list);
router.get('/:id/dashboard', validateObjectIdParam('id'), StudentController.getDashboard);
router.get('/:id', validateObjectIdParam('id'), StudentController.getById);

export default router;
