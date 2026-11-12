const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const permissionRoutes = require('./routes/permission.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const sectionRoutes = require('./routes/section.routes');
const subjectRoutes = require('./routes/subject.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const fileRoutes = require('./routes/file.routes');
const noticeRoutes = require('./routes/notice.routes');
const marksRoutes = require('./routes/marks.routes');
const performanceRoutes = require('./routes/performance.routes');
const { env } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => {
  res.json({ data: { status: 'ok' }, error: null });
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/sections', sectionRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/marks', marksRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use(errorHandler);

module.exports = app;
