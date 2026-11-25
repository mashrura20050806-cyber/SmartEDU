const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/section.controller');

const router = Router();

router.use(authenticate);
router.get('/', authorize('CLASSES', 'view'), controller.list);
router.get('/:id/roster', authorize('CLASSES', 'view'), controller.roster);
router.post('/', authorize('CLASSES', 'write'), controller.create);
router.patch('/:id', authorize('CLASSES', 'modify'), controller.update);
router.put('/:id/students', authorize('CLASSES', 'modify'), controller.assignStudents);
router.put('/:id/class-teacher', authorize('ASSIGNMENTS', 'modify'), controller.assignClassTeacher);
router.put('/:id/term-marks', authorize('MARKS', 'write'), controller.saveTermMarks);

module.exports = router;