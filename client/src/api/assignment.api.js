import ApiClient from './ApiClient.js';

const AssignmentApi = {
  list: () => ApiClient.get('/assignments'),
  create: (assignment) => ApiClient.post('/assignments', assignment),
  update: (id, changes) => ApiClient.patch(`/assignments/${encodeURIComponent(id)}`, changes),
};

export default AssignmentApi;