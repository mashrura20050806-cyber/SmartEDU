import ApiClient from './ApiClient.js';

const SectionApi = {
  list: (classId) => ApiClient.get(`/sections${classId ? `?classId=${encodeURIComponent(classId)}` : ''}`),
  create: (section) => ApiClient.post('/sections', section),
  update: (id, changes) => ApiClient.patch(`/sections/${encodeURIComponent(id)}`, changes),
  assignStudents: (id, studentIds) => ApiClient.put(`/sections/${encodeURIComponent(id)}/students`, { studentIds }),
  assignClassTeacher: (id, teacherId) => ApiClient.put(`/sections/${encodeURIComponent(id)}/class-teacher`, { teacherId }),
  roster: (id) => ApiClient.get(`/sections/${encodeURIComponent(id)}/roster`),
  saveTermMarks: (id, values) => ApiClient.put(`/sections/${encodeURIComponent(id)}/term-marks`, values),
};

export default SectionApi;
