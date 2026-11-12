const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');

const UPLOAD_DIRECTORY = path.resolve(__dirname, '../../uploads');
const STORAGE_KEY_PATTERN = /^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/i;

function pathFor(storageKey) {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) throw new Error('Invalid file storage key.');
  return path.join(UPLOAD_DIRECTORY, storageKey);
}

async function save(storageKey, buffer) {
  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });
  await fs.writeFile(pathFor(storageKey), buffer, { flag: 'wx' });
}

async function remove(storageKey) {
  await fs.unlink(pathFor(storageKey));
}

function open(storageKey) {
  return fsSync.createReadStream(pathFor(storageKey));
}

module.exports = { save, remove, open };