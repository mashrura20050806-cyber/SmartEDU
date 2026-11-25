const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');

const db = () => DatabaseConnection.getInstance().getClient();

function scopeFor(user) {
  if (user.role === 'STUDENT') {
    return { sections: { some: { students: { some: { id: user.id } } } } };
  }
  if (user.role === 'TEACHER' || user.role === 'CLASS_TEACHER') {
    return {
      OR: [
        { assignments: { some: { teacherId: user.id } } },
        { sections: { some: { classTeacherId: user.id } } },
      ],
    };
  }
  return {};
}

async function listClasses(user) {
  return db().schoolClass.findMany({
    where: scopeFor(user),
    include: {
      sections: user.role === 'STUDENT'
        ? {
          where: { students: { some: { id: user.id } } },
          select: { id: true, name: true },
        }
        : { select: { id: true, name: true } },
      subjects: { select: { id: true, name: true, code: true } },
      _count: { select: { sections: true, subjects: true } },
    },
    orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
  });
}

async function createClass(input) {
  try {
    return await db().schoolClass.create({ data: input });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('A class with that name already exists for this academic year.', 409);
    throw error;
  }
}

async function updateClass(id, input) {
  try {
    return await db().schoolClass.update({ where: { id }, data: input });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('A class with that name already exists for this academic year.', 409);
    if (error.code === 'P2025') throw new AppError('Class not found.', 404);
    throw error;
  }
}

async function setupStandardClasses(academicYear) {
  return db().$transaction(async (transaction) => {
    const classes = [];
    for (let grade = 1; grade <= 10; grade += 1) {
      const schoolClass = await transaction.schoolClass.upsert({
        where: { name_academicYear: { name: `Class ${grade}`, academicYear } },
        create: { name: `Class ${grade}`, grade, academicYear },
        update: { grade },
      });
      for (const name of ['SEC-A', 'SEC-B']) {
        await transaction.section.upsert({
          where: { classId_name: { classId: schoolClass.id, name } },
          create: { name, classId: schoolClass.id },
          update: {},
        });
      }
      classes.push(schoolClass);
    }
    return classes;
  });
}

module.exports = { listClasses, createClass, updateClass, setupStandardClasses };