const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/user.controller');

const router = Router();

router.use(authenticate);
router.get('/', authorize('USERS', 'view'), controller.list);
router.post('/', authorize('USERS', 'write'), controller.create);
router.patch('/:id', authorize('USERS', 'modify'), controller.update);

module.exports = router;