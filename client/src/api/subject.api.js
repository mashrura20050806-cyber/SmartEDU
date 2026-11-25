import ApiClient from './ApiClient.js';

const SubjectApi = {
  list: () => ApiClient.get('/subjects'),
  create: (subject) => ApiClient.post('/subjects', subject),
  update: (id, changes) => ApiClient.patch(`/subjects/${encodeURIComponent(id)}`, changes),
};

export default SubjectApi;