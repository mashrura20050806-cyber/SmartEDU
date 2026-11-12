const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { upload } = require('../config/upload');
const controller = require('../controllers/file.controller');

const router = Router();

router.use(authenticate);
router.get('/', authorize('FILES', 'view'), controller.list);
router.post('/', authorize('FILES', 'write'), upload.single('file'), controller.create);
router.get('/:id/download', authorize('FILES', 'view'), controller.download);
router.patch('/:id', authorize('FILES', 'modify'), controller.update);
router.delete('/:id', authorize('FILES', 'modify'), controller.remove);

module.exports = router;