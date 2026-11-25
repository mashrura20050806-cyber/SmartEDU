const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/assignment.controller');

const router = Router();

router.use(authenticate);
router.get('/', authorize('ASSIGNMENTS', 'view'), controller.list);
router.post('/', authorize('ASSIGNMENTS', 'write'), controller.create);
router.patch('/:id', authorize('ASSIGNMENTS', 'modify'), controller.update);

module.exports = router;