const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/subject.controller');

const router = Router();

router.use(authenticate);
router.get('/', authorize('SUBJECTS', 'view'), controller.list);
router.post('/', authorize('SUBJECTS', 'write'), controller.create);
router.patch('/:id', authorize('SUBJECTS', 'modify'), controller.update);

module.exports = router;