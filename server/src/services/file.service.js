const { randomUUID } = require('node:crypto');
const path = require('node:path');
const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');
const fileStorage = require('../utils/fileStorage');

const db = () => DatabaseConnection.getInstance().getClient();
const EXTENSION_BY_MIME = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const FILE_DETAILS = {
  id: true,
  title: true,
  description: true,
  kind: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  dueAt: true,
  classId: true,
  sectionId: true,
  uploaderId: true,
  createdAt: true,
  uploader: { select: { id: true, name: true } },
  schoolClass: { select: { id: true, name: true, academicYear: true } },
  section: { select: { id: true, name: true } },
};

function hasValidSignature(file) {
  const buffer = file.buffer;
  if (file.mimetype === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (file.mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  }
  return false;
}

async function validateScope(input, user) {
  if (input.classId) {
    const schoolClass = await db().schoolClass.findUnique({ where: { id: input.classId }, select: { id: true } });
    if (!schoolClass) throw new AppError('Choose an existing class.', 400);
  }
  if (input.sectionId) {
    const section = await db().section.findUnique({ where: { id: input.sectionId }, select: { classId: true } });
    if (!section || section.classId !== input.classId) {
      throw new AppError('Choose a section in the selected class.', 400);
    }
  }
  if (['TEACHER', 'CLASS_TEACHER'].includes(user.role) && input.classId) {
    const assignment = await db().teacherAssignment.findFirst({
      where: {
        teacherId: user.id,
        classId: input.classId,
        OR: [{ sectionId: null }, ...(input.sectionId ? [{ sectionId: input.sectionId }] : [])],
      },
      select: { id: true },
    });
    if (!assignment) throw new AppError('You can only upload materials for your assigned classes.', 403);
  }
}

async function visibleWhere(user) {
  if (['ADMIN', 'PRINCIPAL', 'ASSISTANT'].includes(user.role)) return {};
  if (user.role === 'STUDENT') {
    const account = await db().user.findUnique({
      where: { id: user.id },
      select: { sectionId: true, section: { select: { classId: true } } },
    });
    if (!account?.section) return { classId: null };
    return {
      OR: [
        { classId: null },
        { classId: account.section.classId, OR: [{ sectionId: null }, { sectionId: account.sectionId }] },
      ],
    };
  }
  if (user.role === 'TEACHER' || user.role === 'CLASS_TEACHER') {
    const assignments = await db().teacherAssignment.findMany({
      where: { teacherId: user.id },
      select: { classId: true, sectionId: true },
    });
    return {
      OR: [
        { classId: null },
        ...assignments.map(({ classId, sectionId }) => ({
          classId,
          OR: [{ sectionId: null }, ...(sectionId ? [{ sectionId }] : [])],
        })),
      ],
    };
  }
  return { classId: null };
}

async function listFiles(user, kind) {
  return db().learningFile.findMany({
    where: {
      ...(kind ? { kind } : {}),
      ...await visibleWhere(user),
    },
    select: FILE_DETAILS,
    orderBy: [{ createdAt: 'desc' }],
  });
}

async function createFile(input, file, user) {
  if (!file || !EXTENSION_BY_MIME[file.mimetype] || !hasValidSignature(file)) {
    throw new AppError('The file contents do not match a supported PDF or image type.', 400);
  }
  await validateScope(input, user);
  const storageKey = `${randomUUID()}.${EXTENSION_BY_MIME[file.mimetype]}`;
  const originalName = path.basename(file.originalname).replace(/[\r\n"]/g, '_').slice(0, 255);
  await fileStorage.save(storageKey, file.buffer);
  try {
    return await db().learningFile.create({
      data: {
        title: input.title,
        description: input.description || null,
        kind: input.kind,
        originalName,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        classId: input.classId || null,
        sectionId: input.sectionId || null,
        uploaderId: user.id,
      },
      select: FILE_DETAILS,
    });
  } catch (error) {
    await fileStorage.remove(storageKey);
    if (error.code === 'P2003') throw new AppError('The selected class or section no longer exists.', 400);
    throw error;
  }
}

async function findFileVisibleToUser(id, user) {
  const file = await db().learningFile.findFirst({
    where: { id, ...await visibleWhere(user) },
    select: { ...FILE_DETAILS, storageKey: true },
  });
  if (!file) throw new AppError('File not found.', 404);
  return file;
}

async function canModify(file, user) {
  if (user.role === 'ADMIN' || file.uploaderId === user.id) return;
  throw new AppError('You can only modify files you uploaded.', 403);
}

async function updateFile(id, changes, user) {
  const existing = await db().learningFile.findUnique({ where: { id } });
  if (!existing) throw new AppError('File not found.', 404);
  await canModify(existing, user);
  if (existing.kind === 'TASK' && Object.hasOwn(changes, 'dueAt') && !changes.dueAt) {
    throw new AppError('Tasks must have a due date.', 400);
  }
  const data = { ...changes };
  if (Object.hasOwn(data, 'dueAt')) data.dueAt = data.dueAt ? new Date(data.dueAt) : null;
  return db().learningFile.update({ where: { id }, data, select: FILE_DETAILS });
}

async function deleteFile(id, user) {
  const existing = await db().learningFile.findUnique({ where: { id } });
  if (!existing) throw new AppError('File not found.', 404);
  await canModify(existing, user);
  await fileStorage.remove(existing.storageKey);
  await db().learningFile.delete({ where: { id } });
}

module.exports = { listFiles, createFile, findFileVisibleToUser, updateFile, deleteFile };