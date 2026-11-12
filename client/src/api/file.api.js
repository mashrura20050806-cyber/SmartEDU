import ApiClient from './ApiClient.js';

const FileApi = {
  list: (kind) => ApiClient.get(`/files${kind ? `?kind=${encodeURIComponent(kind)}` : ''}`),
  upload: (formData) => ApiClient.postForm('/files', formData),
  download: (id) => ApiClient.download(`/files/${encodeURIComponent(id)}/download`),
  update: (id, changes) => ApiClient.patch(`/files/${encodeURIComponent(id)}`, changes),
  remove: (id) => ApiClient.delete(`/files/${encodeURIComponent(id)}`),
};

export default FileApi;