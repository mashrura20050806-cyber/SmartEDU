const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');

const db = () => DatabaseConnection.getInstance().getClient();
const SAFE_STUDENT_FIELDS = {
  id: true, name: true, institutionalId: true, status: true,
  guardianPhone: true, rollNumber: true,
};

function studentScope(user) {
  if (user.role === 'STUDENT') return { students: { some: { id: user.id } } };
  if (user.role === 'TEACHER' || user.role === 'CLASS_TEACHER') {
    return {
      OR: [
        { assignments: { some: { teacherId: user.id } } },
        { schoolClass: { assignments: { some: { teacherId: user.id } } } },
        { classTeacherId: user.id },
      ],
    };
  }
  return {};
}

async function listSections(user, classId) {
  const canViewRoster = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user.role);
  return db().section.findMany({
    where: {
      ...(classId ? { classId } : {}),
      ...studentScope(user),
    },
    include: {
      schoolClass: {
        select: {
          id: true, name: true, academicYear: true,
          subjects: { select: { id: true, name: true, code: true, mt1MaxMarks: true, hyMaxMarks: true, mt2MaxMarks: true } },
          assignments: {
            ...(canViewRoster ? {
              where: { sectionId: null },
              select: {
                teacher: { select: { id: true, name: true, phone: true } },
                subject: { select: { id: true, name: true } },
              },
            } : false),
          },
        },
      },
      classTeacher: canViewRoster ? { select: { id: true, name: true, phone: true } } : false,
      assignments: canViewRoster ? {
        select: {
          teacher: { select: { id: true, name: true, phone: true } },
          subject: { select: { id: true, name: true } },
        },
      } : false,
      students: canViewRoster
        ? {
          select: {
            ...SAFE_STUDENT_FIELDS,
            termMarks: {
              select: {
                academicYear: true, mt1Mark: true, hyMark: true, mt2Mark: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ rollNumber: 'asc' }, { name: 'asc' }],
        }
        : false,
    },
    orderBy: [{ classId: 'asc' }, { name: 'asc' }],
  });
}

async function createSection(input) {
  try {
    return await db().section.create({
      data: input,
      include: { schoolClass: { select: { id: true, name: true, academicYear: true } } },
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('That section already exists in this class.', 409);
    if (error.code === 'P2003') throw new AppError('Choose an existing class.', 400);
    throw error;
  }
}

async function updateSection(id, input) {
  try {
    return await db().section.update({
      where: { id },
      data: input,
      include: { schoolClass: { select: { id: true, name: true, academicYear: true } } },
    });
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('That section already exists in this class.', 409);
    if (error.code === 'P2025') throw new AppError('Section not found.', 404);
    throw error;
  }
}

async function assignStudents(id, studentIds) {
  return db().$transaction(async (transaction) => {
    const section = await transaction.section.findUnique({ where: { id }, select: { id: true } });
    if (!section) throw new AppError('Section not found.', 404);

    const students = studentIds.length
      ? await transaction.user.findMany({
        where: { id: { in: studentIds }, role: 'STUDENT', status: 'ACTIVE' },
        select: { id: true },
      })
      : [];
    if (students.length !== studentIds.length) {
      throw new AppError('Select only active student accounts.', 400);
    }

    await transaction.user.updateMany({ where: { sectionId: id }, data: { sectionId: null } });
    if (studentIds.length) {
      await transaction.user.updateMany({
        where: { id: { in: studentIds }, role: 'STUDENT', status: 'ACTIVE' },
        data: { sectionId: id },
      });
    }

    return transaction.section.findUnique({
      where: { id },
      include: {
        schoolClass: { select: { id: true, name: true, academicYear: true } },
        students: { select: SAFE_STUDENT_FIELDS, orderBy: { name: 'asc' } },
      },
    });
  });
}

async function assignClassTeacher(id, teacherId) {
  if (teacherId) {
    const teacher = await db().user.findFirst({
      where: { id: teacherId, role: 'CLASS_TEACHER', status: 'ACTIVE' },
      select: { id: true },
    });
    if (!teacher) throw new AppError('Choose an active class teacher account.', 400);
  }
  try {
    return await db().section.update({
      where: { id },
      data: { classTeacherId: teacherId },
      select: { id: true, classTeacher: { select: { id: true, name: true, phone: true } } },
    });
  } catch (error) {
    if (error.code === 'P2025') throw new AppError('Section not found.', 404);
    throw error;
  }
}

async function getSectionRoster(user, id) {
  if (!['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'].includes(user.role)) {
    throw new AppError('You are not allowed to view this section roster.', 403);
  }
  const section = await db().section.findUnique({
    where: { id },
    include: {
      schoolClass: {
        select: {
          id: true, name: true, academicYear: true,
          subjects: { select: { id: true, name: true, code: true, mt1MaxMarks: true, hyMaxMarks: true, mt2MaxMarks: true } },
          assignments: {
            where: { sectionId: null },
            select: {
              teacher: { select: { id: true, name: true, phone: true } },
              subject: { select: { id: true, name: true } },
            },
          },
        },
      },
      classTeacher: { select: { id: true, name: true, phone: true } },
      assignments: {
        select: {
          teacher: { select: { id: true, name: true, phone: true } },
          subject: { select: { id: true, name: true } },
        },
      },
      students: {
        where: { role: 'STUDENT', status: 'ACTIVE' },
        select: {
          id: true, name: true, institutionalId: true, rollNumber: true,
          guardianPhone: true,
          termMarks: {
            select: {
              academicYear: true, mt1Mark: true, hyMark: true, mt2Mark: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ rollNumber: 'asc' }, { name: 'asc' }],
      },
    },
  });
  if (!section) throw new AppError('Section not found.', 404);
  section.assignments = await db().teacherAssignment.findMany({
    where: { classId: section.classId, OR: [{ sectionId: id }, { sectionId: null }] },
    select: {
      teacher: { select: { id: true, name: true, phone: true } },
      subject: { select: { id: true, name: true } },
    },
  });
  if (user.role === 'TEACHER' || user.role === 'CLASS_TEACHER') {
    const assigned = section.classTeacherId === user.id
      || section.assignments.some(({ teacher }) => teacher.id === user.id)
      || await db().teacherAssignment.findFirst({
        where: { teacherId: user.id, classId: section.classId, sectionId: null },
        select: { id: true },
      });
    if (!assigned) throw new AppError('This section is not assigned to you.', 403);
  }
  return section;
}

async function saveTermMarks(user, sectionId, { subjectId, academicYear, marks }) {
  const section = await getSectionRoster(user, sectionId);
  if (academicYear !== section.schoolClass.academicYear) {
    throw new AppError('Use the academic year assigned to this class.', 400);
  }
  const subject = section.schoolClass.subjects.find((item) => item.id === subjectId);
  if (!subject) throw new AppError('Choose a subject belonging to this class.', 400);
  const elevated = ['ADMIN', 'PRINCIPAL'].includes(user.role);
  const isClassTeacher = section.classTeacherId === user.id;
  if (!elevated && !isClassTeacher && !section.assignments.some(({ teacher, subject: assignedSubject }) => (
    teacher.id === user.id && (!assignedSubject || assignedSubject.id === subjectId)
  ))
      && !(await db().teacherAssignment.findFirst({
        where: {
          teacherId: user.id, classId: section.classId, sectionId: null,
          OR: [{ subjectId: null }, { subjectId }],
        },
        select: { id: true },
      }))) {
    throw new AppError('This subject or section is not assigned to you.', 403);
  }

  const studentIds = new Set(section.students.map(({ id }) => id));
  if (marks.some(({ studentId }) => !studentIds.has(studentId))) {
    throw new AppError('All marks must belong to active students in this section.', 400);
  }
  const maximums = { mt1Mark: subject.mt1MaxMarks, hyMark: subject.hyMaxMarks, mt2Mark: subject.mt2MaxMarks };
  for (const row of marks) {
    for (const [field, maximum] of Object.entries(maximums)) {
      if (row[field] !== null && row[field] > maximum) {
        throw new AppError(`${field.replace('Mark', '').toUpperCase()} cannot exceed ${maximum}.`, 400);
      }
    }
  }

  return db().$transaction(async (transaction) => {
    for (const row of marks) {
      const where = {
        studentId_subjectId_academicYear: {
          studentId: row.studentId, subjectId, academicYear,
        },
      };
      const existing = await transaction.termMark.findUnique({ where, select: { mt1Mark: true, hyMark: true, mt2Mark: true } });
      if (!existing && row.mt1Mark === null && row.hyMark === null && row.mt2Mark === null) continue;
      if (existing && !elevated && !isClassTeacher
        && Object.keys(maximums).some((field) => existing[field] !== row[field])) {
        throw new AppError('Only the class teacher can modify recorded term marks.', 403);
      }
      await transaction.termMark.upsert({
        where,
        create: { studentId: row.studentId, subjectId, academicYear, mt1Mark: row.mt1Mark, hyMark: row.hyMark, mt2Mark: row.mt2Mark },
        update: { mt1Mark: row.mt1Mark, hyMark: row.hyMark, mt2Mark: row.mt2Mark },
      });
    }
    return { saved: marks.length };
  });
}

module.exports = {
  listSections, createSection, updateSection, assignStudents,
  assignClassTeacher, getSectionRoster, saveTermMarks,
};