const AuthService = require('../services/auth.service');
const { env } = require('../config/env');
const { signToken } = require('../utils/token');
const { generateCodeSchema, registerSchema, loginSchema, passwordSchema } = require('../validators/auth.schema');

const authService = new AuthService();
const COOKIE_NAME = 'smartedu_session';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

function registrationOptions(_req, res, next) {
  return authService.listRegistrationOptions()
    .then((classes) => res.json({ data: { classes }, error: null }))
    .catch(next);
}

function register(req, res, next) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ data: null, error: { message: parsed.error.issues[0].message } });
  return authService.register(parsed.data)
    .then((data) => res.status(201).json({ data, error: null }))
    .catch(next);
}

function generateCode(req, res, next) {
  const parsed = generateCodeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ data: null, error: { message: 'Choose a valid role.' } });
  return authService.generateCode(parsed.data.role)
    .then((data) => res.status(201).json({ data, error: null }))
    .catch(next);
}

function login(req, res, next) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ data: null, error: { message: 'Invalid credentials' } });
  return authService.login(parsed.data)
    .then(({ user }) => {
      res.cookie(COOKIE_NAME, signToken(user.id), { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
      res.json({ data: { user }, error: null });
    })
    .catch(next);
}

function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ data: { message: 'Signed out.' }, error: null });
}

function me(req, res) {
  res.json({ data: { user: req.user }, error: null });
}

function changePassword(req, res, next) {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ data: null, error: { message: parsed.error.issues[0].message } });
  return authService.changePassword(req.user.id, parsed.data)
    .then(() => {
      res.clearCookie(COOKIE_NAME, cookieOptions);
      res.json({ data: { message: 'Password updated. Please sign in again.' }, error: null });
    })
    .catch(next);
}

module.exports = { registrationOptions, generateCode, register, login, logout, me, changePassword };