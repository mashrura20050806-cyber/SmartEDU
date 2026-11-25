const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');

const db = () => DatabaseConnection.getInstance().getClient();

async function listSubjects(user) {
  let where = {};
  if (user.role === 'STUDENT') {
    where = { schoolClass: { sections: { some: { students: { some: { id: user.id } } } } } };
  } else if (user.role === 'TEACHER' || user.role === 'CLASS_TEACHER') {
    where = {
      OR: [
        { assignments: { some: { teacherId: user.id } } },
        { schoolClass: { assignments: { some: { teacherId: user.id, subjectId: null } } } },
      ],
    };
  }
  return db().subject.findMany({
    where,
    include: {
      schoolClass: { select: { id: true, name: true, academicYear: true } },
      assignments: {
        select: {
          id: true,
          teacher: { select: { id: true, name: true, institutionalId: true } },
          section: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ name: 'asc' }],
  });
}

async function createSubject(input) {
  try {
    return await db().subject.create({
      data: { ...input, code: input.code || null },
      include: { schoolClass: { select: { id: true, name: true, academicYear: true } } },
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('That subject name or code already exists in this class.', 409);
    if (error.code === 'P2003') throw new AppError('Choose an existing class.', 400);
    throw error;
  }
}

async function updateSubject(id, input) {
  const data = { ...input };
  if (Object.hasOwn(data, 'code')) data.code = data.code || null;
  if (data.classId) {
    const existingSubject = await db().subject.findUnique({
      where: { id },
      select: { classId: true, _count: { select: { assignments: true, termMarks: true } } },
    });
    if (!existingSubject) throw new AppError('Subject not found.', 404);
    if (existingSubject.classId !== data.classId
      && (existingSubject._count.assignments || existingSubject._count.termMarks)) {
      throw new AppError('A subject with teacher assignments or recorded term marks cannot be moved to another class.', 409);
    }
    const maximumChecks = [
      ['mt1MaxMarks', 'mt1Mark'],
      ['hyMaxMarks', 'hyMark'],
      ['mt2MaxMarks', 'mt2Mark'],
    ].filter(([maximum]) => data[maximum] !== undefined);
    if (maximumChecks.length) {
      const invalidExistingMarks = await db().termMark.count({
        where: {
          subjectId: id,
          OR: maximumChecks.map(([maximum, field]) => ({ [field]: { gt: data[maximum] } })),
        },
      });
      if (invalidExistingMarks) {
        throw new AppError('A maximum cannot be lower than term marks already recorded.', 409);
      }
    }
  }
  try {
    return await db().subject.update({
      where: { id },
      data,
      include: { schoolClass: { select: { id: true, name: true, academicYear: true } } },
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('That subject name or code already exists in this class.', 409);
    if (error.code === 'P2025') throw new AppError('Subject not found.', 404);
    if (error.code === 'P2003') throw new AppError('Choose an existing class.', 400);
    throw error;
  }
}

module.exports = { listSubjects, createSubject, updateSubject };