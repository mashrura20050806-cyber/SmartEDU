import ApiClient from './ApiClient.js';

const ClassApi = {
  list: () => ApiClient.get('/classes'),
  create: (schoolClass) => ApiClient.post('/classes', schoolClass),
  setupStandard: (academicYear) => ApiClient.post('/classes/standard-setup', { academicYear }),
  update: (id, changes) => ApiClient.patch(`/classes/${encodeURIComponent(id)}`, changes),
};

export default ClassApi;