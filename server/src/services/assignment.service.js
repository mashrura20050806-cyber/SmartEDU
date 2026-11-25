const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');

const db = () => DatabaseConnection.getInstance().getClient();
const assignmentDetails = {
  id: true,
  teacherId: true,
  classId: true,
  sectionId: true,
  subjectId: true,
  teacher: { select: { id: true, name: true, email: true, institutionalId: true, phone: true } },
  schoolClass: { select: { id: true, name: true, academicYear: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
};

async function validateAssignment(data) {
  const [teacher, schoolClass, section, subject] = await Promise.all([
    db().user.findUnique({ where: { id: data.teacherId }, select: { role: true, status: true } }),
    db().schoolClass.findUnique({ where: { id: data.classId }, select: { id: true } }),
    data.sectionId ? db().section.findUnique({ where: { id: data.sectionId }, select: { classId: true } }) : null,
    data.subjectId ? db().subject.findUnique({ where: { id: data.subjectId }, select: { classId: true } }) : null,
  ]);

  if (!teacher || !['TEACHER', 'CLASS_TEACHER'].includes(teacher.role) || teacher.status !== 'ACTIVE') {
    throw new AppError('Choose an active teacher account.', 400);
  }
  if (!schoolClass) throw new AppError('Choose an existing class.', 400);
  if (data.sectionId && (!section || section.classId !== data.classId)) {
    throw new AppError('Choose a section in the selected class.', 400);
  }
  if (data.subjectId && (!subject || subject.classId !== data.classId)) {
    throw new AppError('Choose a subject in the selected class.', 400);
  }
}

async function listAssignments(user) {
  return db().teacherAssignment.findMany({
    where: user.role === 'TEACHER' || user.role === 'CLASS_TEACHER'
      ? { teacherId: user.id }
      : {},
    select: assignmentDetails,
    orderBy: [{ schoolClass: { name: 'asc' } }, { teacher: { name: 'asc' } }],
  });
}

async function createAssignment(input) {
  await validateAssignment(input);
  const duplicate = await db().teacherAssignment.findFirst({
    where: {
      teacherId: input.teacherId,
      classId: input.classId,
      sectionId: input.sectionId || null,
      subjectId: input.subjectId || null,
    },
    select: { id: true },
  });
  if (duplicate) throw new AppError('This teacher assignment already exists.', 409);
  try {
    return await db().teacherAssignment.create({
      data: { ...input, scopeKey: scopeKey(input) },
      select: assignmentDetails,
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('This teacher assignment already exists.', 409);
    throw error;
  }
}

function scopeKey(assignment) {
  return JSON.stringify([
    assignment.teacherId,
    assignment.classId,
    assignment.sectionId || '',
    assignment.subjectId || '',
  ]);
}

async function updateAssignment(id, changes) {
  const current = await db().teacherAssignment.findUnique({ where: { id } });
  if (!current) throw new AppError('Teacher assignment not found.', 404);
  const updated = { ...current, ...changes };
  await validateAssignment(updated);
  const duplicate = await db().teacherAssignment.findFirst({
    where: {
      id: { not: id },
      teacherId: updated.teacherId,
      classId: updated.classId,
      sectionId: updated.sectionId,
      subjectId: updated.subjectId,
    },
    select: { id: true },
  });
  if (duplicate) throw new AppError('This teacher assignment already exists.', 409);
  try {
    return await db().teacherAssignment.update({
      where: { id },
      data: { ...changes, scopeKey: scopeKey(updated) },
      select: assignmentDetails,
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('This teacher assignment already exists.', 409);
    throw error;
  }
}

module.exports = { listAssignments, createAssignment, updateAssignment };