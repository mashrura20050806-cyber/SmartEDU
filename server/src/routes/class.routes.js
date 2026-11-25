const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/class.controller');

const router = Router();

router.use(authenticate);
router.get('/', authorize('CLASSES', 'view'), controller.list);
router.post('/', authorize('CLASSES', 'write'), controller.create);
router.post('/standard-setup', authorize('CLASSES', 'write'), controller.standardSetup);
router.patch('/:id', authorize('CLASSES', 'modify'), controller.update);

module.exports = router;