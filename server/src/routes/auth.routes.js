const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authenticate = require('../middleware/authenticate');
const controller = require('../controllers/auth.controller');

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { data: null, error: { message: 'Invalid credentials' } },
});

router.post('/generate-code', authLimiter, controller.generateCode);
router.get('/registration-options', controller.registrationOptions);
router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);
router.patch('/password', authenticate, controller.changePassword);

module.exports = router;