import ApiClient from './ApiClient.js';

const PermissionApi = {
  list: () => ApiClient.get('/permissions'),
  update: (role, module, permission) => ApiClient.put(
    `/permissions/${encodeURIComponent(role)}/${encodeURIComponent(module)}`,
    permission,
  ),
};

export default PermissionApi;