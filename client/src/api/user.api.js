import ApiClient from './ApiClient.js';

const UserApi = {
  list: () => ApiClient.get('/users'),
  create: (user) => ApiClient.post('/users', user),
  update: (id, changes) => ApiClient.patch(`/users/${encodeURIComponent(id)}`, changes),
};

export default UserApi;