const API_PREFIX = import.meta.env.VITE_API_URL || '/api/v1';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the SmartEDU API. Start it with `npm run dev` from the project root, then try again.');
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    const error = new Error(result?.error?.message || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }

  return result?.data;
}

async function download(path) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, { credentials: 'include' });
  } catch {
    throw new Error('Cannot reach the SmartEDU API. Start it with `npm run dev` from the project root, then try again.');
  }
  if (!response.ok) {
    let message = 'The request could not be completed.';
    try {
      const result = await response.json();
      message = result?.error?.message || message;
    } catch {
      message = 'The server returned an invalid response.';
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.blob();
}

const ApiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  download,
};

export default ApiClient;