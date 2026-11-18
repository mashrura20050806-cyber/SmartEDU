const test = require('node:test');
const assert = require('node:assert/strict');
const UserRepository = require('../../src/repositories/user.repository');

for (const role of ['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ASSISTANT', 'STUDENT']) {
  test(`consumes a code reservation once and assigns ${role} the correct status`, async () => {
    let reservationAvailable = true;
    let createdUser;
    const reservation = {
      id: 'reservation-id',
      role,
      codeHash: 'bcrypt-hash',
      codeDigest: 'a'.repeat(64),
    };
    const transaction = {
      codeReservation: {
        deleteMany: async ({ where }) => {
          assert.equal(where.id, reservation.id);
          assert.equal(where.codeDigest, reservation.codeDigest);
          assert.ok(where.expiresAt.gt instanceof Date);
          if (!reservationAvailable) return { count: 0 };
          reservationAvailable = false;
          return { count: 1 };
        },
      },
      section: {
        findFirst: async ({ where }) => {
          assert.equal(where.id, 'section-id');
          assert.equal(where.classId, 'class-id');
          return { id: 'section-id' };
        },
      },
      user: {
        create: async ({ data, select }) => {
          createdUser = { ...data, selectedFields: select };
          return { id: 'user-id', role: data.role, status: data.status };
        },
      },
    };
    const repository = Object.create(UserRepository.prototype);
    repository.db = { $transaction: (operation) => operation(transaction) };

    const account = await repository.createAccountFromReservation({
      reservation,
      name: 'Example User',
      email: 'user@example.edu',
      institutionalId: 'USER-1',
      passwordHash: 'password-hash',
      phone: '5551234567',
      guardianPhone: '5557654321',
      rollNumber: '4',
      sectionId: 'section-id',
      classId: 'class-id',
    });

    assert.deepEqual(account, {
      id: 'user-id',
      role,
      status: role === 'STUDENT' ? 'ACTIVE' : 'PENDING',
    });
    assert.equal(createdUser.loginCodeHash, reservation.codeHash);
    assert.equal(createdUser.loginCodeDigest, reservation.codeDigest);
    assert.equal(createdUser.phone, '5551234567');
    if (role === 'STUDENT') {
      assert.equal(createdUser.guardianPhone, '5557654321');
      assert.equal(createdUser.rollNumber, '4');
      assert.equal(createdUser.sectionId, 'section-id');
    }
    assert.deepEqual(createdUser.selectedFields, {
      id: true,
      name: true,
      email: true,
      institutionalId: true,
      role: true,
      status: true,
    });

    await assert.rejects(
      repository.createAccountFromReservation({
        reservation,
        name: 'Another User',
        email: 'another@example.edu',
        institutionalId: 'USER-2',
        passwordHash: 'another-password-hash',
      }),
      { message: 'The generated code has expired or was already used.' },
    );
  });
}
