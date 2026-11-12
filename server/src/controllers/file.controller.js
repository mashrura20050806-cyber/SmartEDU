const { z } = require('zod');
const { createFileSchema, updateFileSchema } = require('../validators/file.schema');
const fileService = require('../services/file.service');
const fileStorage = require('../utils/fileStorage');
const AppError = require('../utils/AppError');

async function list(req, res, next) {
  try {
    const kind = req.query.kind
      ? z.enum(['MATERIAL', 'TASK']).safeParse(req.query.kind)
      : null;
    if (kind && !kind.success) throw new AppError('Choose a valid file type.', 400);
    const files = await fileService.listFiles(req.user, kind?.data);
    res.json({ data: { files }, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createFileSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const file = await fileService.createFile(parsed.data, req.file, req.user);
    res.status(201).json({ data: { file }, error: null });
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid file ID.', 400);
    const file = await fileService.findFileVisibleToUser(id.data, req.user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.attachment(file.originalName);
    const stream = fileStorage.open(file.storageKey);
    stream.on('error', (error) => {
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      next(error);
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid file ID.', 400);
    const parsed = updateFileSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const file = await fileService.updateFile(id.data, parsed.data, req.user);
    res.json({ data: { file }, error: null });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid file ID.', 400);
    await fileService.deleteFile(id.data, req.user);
    res.json({ data: { message: 'File deleted.' }, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, download, update, remove };