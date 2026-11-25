const { createHmac, timingSafeEqual } = require('node:crypto');
const bcrypt = require('bcryptjs');
const CodeFactory = require('../core/factories/CodeFactory');
const { env } = require('../config/env');
const UserRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');
const { comparePassword, hashPassword } = require('../utils/hash');

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const CODE_RESERVATION_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid credentials';
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('smartedu-invalid-credential-check', 12);

class AuthService {
  constructor() {
    this.users = new UserRepository();
  }

  async generateCode(role) {
    const now = new Date();
    await this.users.deleteExpiredReservations(now);
    const generator = CodeFactory.create(role);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generator.generate();
      const codeDigest = this.digestCode(code);
      if (await this.users.hasCodeDigest(codeDigest)) continue;

      try {
        const reservation = await this.users.createReservation({
          role,
          codeHash: await hashPassword(code),
          codeDigest,
          expiresAt: new Date(now.getTime() + CODE_RESERVATION_MS),
        });
        return { code, reservationId: reservation.id, expiresAt: reservation.expiresAt };
      } catch (error) {
        if (error.code !== 'P2002') throw error;
      }
    }

    throw new AppError('Could not generate a unique code. Please try again.', 503);
  }

  async register(input) {
    await this.users.deleteExpiredReservations(new Date());
    const existing = await this.users.findRegistrationConflict(input.email, input.institutionalId);
    if (existing) throw new AppError('An account with that email or school ID already exists.', 409);

    const reservation = await this.users.findReservationById(input.codeReservationId);
    if (
      !reservation
      || reservation.expiresAt <= new Date()
      || reservation.role !== input.role
      || !CodeFactory.hasRolePrefix(input.role, input.generatedCode)
      || !(await comparePassword(input.generatedCode, reservation.codeHash))
      || !this.digestMatches(input.generatedCode, reservation.codeDigest)
    ) {
      throw new AppError('The generated code has expired or is invalid. Generate a new code and try again.', 400);
    }

    let user;
    try {
      user = await this.users.createAccountFromReservation({
        reservation,
        name: input.name,
        email: input.email,
        institutionalId: input.institutionalId,
        passwordHash: await hashPassword(input.password),
        phone: input.phone,
        guardianPhone: input.guardianPhone,
        rollNumber: input.rollNumber,
        sectionId: input.sectionId,
        classId: input.classId,
      });
    } catch (error) {
      if (error.code === 'P2002') throw new AppError('An account with that email, school ID, roll number, or generated code already exists.', 409);
      throw error;
    }
    return {
      user,
      message: user.status === 'PENDING'
        ? 'Your account has been created and is pending administrator approval.'
        : 'Your student account has been created. You can now sign in.',
    };
  }

  listRegistrationOptions() {
    return this.users.listRegistrationOptions();
  }

  async login({ email, password, role, generatedCode, phone }) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      await Promise.all([
        comparePassword(password, DUMMY_PASSWORD_HASH),
        comparePassword(generatedCode, DUMMY_PASSWORD_HASH),
      ]);
      throw new AppError(INVALID_CREDENTIALS, 401);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError(INVALID_CREDENTIALS, 401);
    }

    const [validPassword, validCode] = await Promise.all([
      comparePassword(password, user.passwordHash),
      user.loginCodeHash
        ? comparePassword(generatedCode, user.loginCodeHash)
        : comparePassword(generatedCode, DUMMY_PASSWORD_HASH),
    ]);
    const validRole = role === user.role && CodeFactory.hasRolePrefix(user.role, generatedCode);

    if (!validPassword || !validCode || !validRole || (phone && phone !== user.phone)) {
      await this.users.recordFailedLogin(user.id, MAX_FAILED_LOGINS, LOCKOUT_MS);
      throw new AppError(INVALID_CREDENTIALS, 401);
    }

    if (user.status === 'PENDING') {
      throw new AppError('Your account is waiting for administrator approval. Contact your school administrator.', 403);
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account is inactive. Contact your school administrator.', 403);
    }

    if (user.failedLogins || user.lockedUntil) {
      await this.users.updateLoginState(user.id, 0, null);
    }
    return { user: this.toSafeUser(user) };
  }

  digestCode(code) {
    return createHmac('sha256', env.JWT_SECRET).update(code).digest('hex');
  }

  digestMatches(code, expectedDigest) {
    const actual = Buffer.from(this.digestCode(code), 'hex');
    const expected = Buffer.from(expectedDigest, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await this.users.findById(userId);
    if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
      throw new AppError('Current password is incorrect.', 400);
    }
    await this.users.updatePassword(userId, await hashPassword(newPassword));
  }

  toSafeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      institutionalId: user.institutionalId,
      role: user.role,
      status: user.status,
    };
  }
}

module.exports = AuthService;