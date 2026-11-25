const { createHmac } = require('node:crypto');
const CodeFactory = require('../core/factories/CodeFactory');
const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/hash');

const SAFE_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  institutionalId: true,
  role: true,
  status: true,
  phone: true,
  createdAt: true,
};

const db = () => DatabaseConnection.getInstance().getClient();

function digestCode(code) {
  return createHmac('sha256', env.JWT_SECRET).update(code).digest('hex');
}

async function codeDigestExists(codeDigest) {
  const [user, reservation] = await Promise.all([
    db().user.findUnique({ where: { loginCodeDigest: codeDigest }, select: { id: true } }),
    db().codeReservation.findUnique({ where: { codeDigest }, select: { id: true } }),
  ]);
  return Boolean(user || reservation);
}

async function createUser(input) {
  const passwordHash = await hashPassword(input.password);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generatedCode = CodeFactory.create(input.role).generate();
    const loginCodeDigest = digestCode(generatedCode);
    if (await codeDigestExists(loginCodeDigest)) continue;
    try {
      const user = await db().user.create({
        data: {
          name: input.name,
          email: input.email,
          institutionalId: input.institutionalId,
          passwordHash,
          loginCodeHash: await hashPassword(generatedCode),
          loginCodeDigest,
          role: input.role,
          status: input.status,
          phone: input.phone || null,
        },
        select: SAFE_USER_FIELDS,
      });
      return { user, generatedCode };
    } catch (error) {
      if (error.code !== 'P2002') throw error;
      const existing = await db().user.findFirst({
        where: { OR: [{ email: input.email }, { institutionalId: input.institutionalId }] },
        select: { id: true },
      });
      if (existing) throw new AppError('An account with that email or school ID already exists.', 409);
    }
  }
  throw new AppError('Could not generate a unique login code. Please try again.', 503);
}

async function updateUser(id, changes, actingUserId) {
  const currentUser = await db().user.findUnique({
    where: { id },
    select: { role: true, status: true },
  });
  if (!currentUser) throw new AppError('User not found.', 404);
  if (
    id === actingUserId
    && currentUser.role === 'ADMIN'
    && ((changes.role && changes.role !== 'ADMIN') || (changes.status && changes.status !== 'ACTIVE'))
  ) {
    throw new AppError('You cannot remove your own active administrator access.', 400);
  }

  const { password, role, ...profile } = changes;
  const update = { ...profile };
  if (password) {
    update.passwordHash = await hashPassword(password);
    update.failedLogins = 0;
    update.lockedUntil = null;
  }

  let generatedCode;
  if (role) {
    update.role = role;
    if (currentUser.role !== role) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = CodeFactory.create(role).generate();
        const candidateDigest = digestCode(candidate);
        if (await codeDigestExists(candidateDigest)) continue;
        generatedCode = candidate;
        update.loginCodeHash = await hashPassword(candidate);
        update.loginCodeDigest = candidateDigest;
        break;
      }
      if (!generatedCode) throw new AppError('Could not generate a unique login code. Please try again.', 503);
    }
  }

  try {
    const user = await db().user.update({
      where: { id },
      data: update,
      select: SAFE_USER_FIELDS,
    });
    return { user, ...(generatedCode ? { generatedCode } : {}) };
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('An account with that email or school ID already exists.', 409);
    }
    if (error.code === 'P2025') throw new AppError('User not found.', 404);
    throw error;
  }
}

function listUsers() {
  return db().user.findMany({
    orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    select: SAFE_USER_FIELDS,
  });
}

module.exports = { listUsers, createUser, updateUser };