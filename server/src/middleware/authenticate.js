const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');

async function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.smartedu_session;
    if (!token) throw new AppError('Authentication required.', 401);

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new AppError('Authentication required.', 401);
    }

    const user = await DatabaseConnection.getInstance().getClient().user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, institutionalId: true, role: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') throw new AppError('Authentication required.', 401);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;