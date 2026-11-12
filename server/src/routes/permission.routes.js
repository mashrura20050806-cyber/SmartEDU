const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const controller = require('../controllers/permission.controller');
const AppError = require('../utils/AppError');

const router = Router();

router.use(authenticate);
router.get('/me', controller.mine);
router.use((req, _res, next) => {
  if (req.user.role !== 'ADMIN') return next(new AppError('You do not have permission to perform this action.', 403));
  return next();
});
router.get('/', controller.list);
router.put('/:role/:module', controller.update);

module.exports = router;