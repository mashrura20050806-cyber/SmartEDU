const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');

const SAFE_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  institutionalId: true,
  role: true,
  status: true,
};

class UserRepository {
  constructor() {
    this.db = DatabaseConnection.getInstance().getClient();
  }

  findRegistrationConflict(email, institutionalId) {
    return this.db.user.findFirst({
      where: { OR: [{ email }, { institutionalId }] },
      select: { id: true },
    });
  }

  createReservation({ role, codeHash, codeDigest, expiresAt }) {
    return this.db.codeReservation.create({
      data: { role, codeHash, codeDigest, expiresAt },
    });
  }

  findReservationById(id) {
    return this.db.codeReservation.findUnique({ where: { id } });
  }

  listRegistrationOptions() {
    return this.db.schoolClass.findMany({
      where: { name: { in: Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`) } },
      orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        academicYear: true,
        sections: {
          where: { name: { in: ['SEC-A', 'SEC-B'] } },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });
  }

  async createAccountFromReservation({
    reservation, name, email, institutionalId, passwordHash, phone,
    guardianPhone, rollNumber, sectionId, classId,
  }) {
    return this.db.$transaction(async (transaction) => {
      const consumed = await transaction.codeReservation.deleteMany({
        where: {
          id: reservation.id,
          role: reservation.role,
          codeDigest: reservation.codeDigest,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) throw new AppError('The generated code has expired or was already used.', 400);

      if (reservation.role === 'STUDENT') {
        const section = await transaction.section.findFirst({
          where: { id: sectionId, classId, name: { in: ['SEC-A', 'SEC-B'] } },
          select: { id: true },
        });
        if (!section) throw new AppError('Choose a valid class and section.', 400);
      }

      return transaction.user.create({
        data: {
          name,
          email,
          institutionalId,
          phone,
          ...(reservation.role === 'STUDENT'
            ? { guardianPhone, rollNumber, sectionId }
            : {}),
          passwordHash,
          loginCodeHash: reservation.codeHash,
          loginCodeDigest: reservation.codeDigest,
          role: reservation.role,
          status: reservation.role === 'STUDENT' ? 'ACTIVE' : 'PENDING',
        },
        select: SAFE_USER_FIELDS,
      });
    });
  }

  async deleteExpiredReservations(now) {
    await this.db.codeReservation.deleteMany({ where: { expiresAt: { lte: now } } });
  }

  async hasCodeDigest(codeDigest) {
    const [user, reservation] = await Promise.all([
      this.db.user.findUnique({ where: { loginCodeDigest: codeDigest }, select: { id: true } }),
      this.db.codeReservation.findUnique({ where: { codeDigest }, select: { id: true } }),
    ]);
    return Boolean(user || reservation);
  }

  findByEmail(email) {
    return this.db.user.findUnique({ where: { email } });
  }

  findById(id) {
    return this.db.user.findUnique({ where: { id } });
  }

  recordFailedLogin(id, maxAttempts, lockoutMs) {
    return this.db.$transaction(async (transaction) => {
      const now = new Date();
      const updated = await transaction.user.updateMany({
        where: {
          id,
          OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
        },
        data: { failedLogins: { increment: 1 } },
      });
      if (updated.count !== 1) return;

      const user = await transaction.user.findUnique({
        where: { id },
        select: { failedLogins: true },
      });
      if (user.failedLogins >= maxAttempts) {
        await transaction.user.update({
          where: { id },
          data: {
            failedLogins: 0,
            lockedUntil: new Date(now.getTime() + lockoutMs),
          },
        });
      }
    });
  }

  updateLoginState(id, failedLogins, lockedUntil) {
    return this.db.user.update({
      where: { id },
      data: { failedLogins, lockedUntil },
    });
  }

  updatePassword(id, passwordHash) {
    return this.db.user.update({
      where: { id },
      data: { passwordHash, failedLogins: 0, lockedUntil: null },
    });
  }
}

module.exports = UserRepository;