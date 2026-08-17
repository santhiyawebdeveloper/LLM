import { Router } from 'express';
import { CourseController } from '../controllers/courseController.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { validateObjectIdParam } from '../middleware/validateObjectId.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
} from '../validators/index.js';

const router = Router();

router.post('/', validateBody(createCourseSchema), CourseController.create);
router.get('/', validateQuery(courseQuerySchema), CourseController.list);
router.get('/:id', validateObjectIdParam('id'), CourseController.getById);
router.patch('/:id', validateObjectIdParam('id'), validateBody(updateCourseSchema), CourseController.update);
router.delete('/:id', validateObjectIdParam('id'), CourseController.delete);

export default router;
