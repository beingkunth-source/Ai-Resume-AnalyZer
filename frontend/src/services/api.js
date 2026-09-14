import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hirelen-api.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        message: 'Unable to connect to the server. Please check your internet connection or verify if the backend is running.',
        status: 0,
      });
    }

    const { status, data } = error.response;
    let userMessage = data?.message || data?.detail;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      userMessage = userMessage || 'Your session has expired. Please log in again.';
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      userMessage = userMessage || 'You do not have permission to perform this action.';
    } else if (status === 404) {
      userMessage = userMessage || 'The requested resource was not found.';
    } else if (status === 422) {
      userMessage = userMessage || 'Please check your inputs and try again.';
    } else if (status === 429) {
      userMessage = userMessage || 'Too many requests. Please wait a moment and try again.';
    } else if (status === 503) {
      userMessage = userMessage || 'AI analysis service is temporarily unavailable. Please try again shortly.';
    } else if (status >= 500) {
      userMessage = userMessage || 'Something went wrong on our server. Please try again.';
    }

    return Promise.reject({
      message: typeof userMessage === 'string' ? userMessage : 'An error occurred. Please try again.',
      status,
      data,
    });
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  oauth: (data) => api.post('/api/auth/oauth', data),
  me: () => api.get('/api/auth/me'),
};

export const resumeAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
  list: () => api.get('/api/resume'),
  get: (id) => api.get(`/api/resume/${id}`),
  delete: (id) => api.delete(`/api/resume/${id}`),
};

export const analysisAPI = {
  create: (resumeId, force = false) => api.post(`/api/analysis/${resumeId}?force=${force}`, null, { timeout: 120000 }),
  list: () => api.get('/api/analysis'),
  get: (id) => api.get(`/api/analysis/${id}`),
};

export const jobsAPI = {
  create: (data) => api.post('/api/jobs', data),
  list: () => api.get('/api/jobs'),
  get: (id) => api.get(`/api/jobs/${id}`),
  delete: (id) => api.delete(`/api/jobs/${id}`),
  match: (data) => api.post('/api/jobs/match', data, { timeout: 120000 }),
  getLive: (q = '', location = '') => api.get(`/api/jobs/live?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`),
  importUrl: (url) => api.post('/api/jobs/import-url', { url }),
  getRecommended: (resumeId, page = 1, limit = 20) => api.get(`/api/jobs/recommended/${resumeId}?page=${page}&limit=${limit}`, { timeout: 60000 }),
  search: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.location) queryParams.append('location', params.location);
    if (params.experience) queryParams.append('experience', params.experience);
    if (params.remote !== undefined) queryParams.append('remote', params.remote);
    if (params.source) queryParams.append('source', params.source);
    if (params.resumeId) queryParams.append('resume_id', params.resumeId);
    if (params.minScore) queryParams.append('min_score', params.minScore);
    if (params.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    return api.get(`/api/jobs/search?${queryParams.toString()}`);
  },
  save: (jobId) => api.post(`/api/jobs/${jobId}/save`),
  unsave: (jobId) => api.delete(`/api/jobs/${jobId}/save`),
  getSaved: () => api.get('/api/jobs/saved'),
};

export const applicationsAPI = {
  track: (data) => api.post('/api/applications', data),
  getAll: () => api.get('/api/applications'),
  update: (id, data) => api.patch(`/api/applications/${id}`, data),
  delete: (id) => api.delete(`/api/applications/${id}`),
};


export const dashboardAPI = {
  get: () => api.get('/api/dashboard'),
};

export const profileAPI = {
  get: () => api.get('/api/profile'),
  update: (data) => api.put('/api/profile', data),
  getCompletion: () => api.get('/api/profile/completion'),
  resolveConflicts: (resolutions) => api.post('/api/profile/resolve-conflicts', resolutions),
};

export const linkedinAPI = {
  analyze: (payload) => api.post('/api/linkedin/analyze', payload),
};

export const githubAPI = {
  analyze: (username_or_url) => api.post('/api/github/analyze', typeof username_or_url === 'string' ? { username_or_url } : username_or_url),
  getProjects: (username) => api.get(`/api/github/projects?username=${encodeURIComponent(username || '')}`),
  generateProjectDescription: (payload) => api.post('/api/github/project-description', payload),
};

export const resumeGeneratorAPI = {
  generate: (payload) => api.post('/api/builder/generate', payload, { timeout: 120000 }),
  enrich: (payload) => api.post('/api/builder/enrich-resume', payload),
  improve: (payload) => api.post('/api/builder/improve', payload),
  atsCheck: (payload) => api.post('/api/builder/ats-check', payload),
  getTemplates: () => api.get('/api/templates'),
  getVersions: () => api.get('/api/builder/versions'),
  exportDocx: (payload) => api.post('/api/builder/export-docx', payload, { responseType: 'blob' }),
  exportPdf: (payload) => api.post('/api/builder/export-pdf', payload, { responseType: 'blob' }),
  saveResume: (payload) => api.post('/api/builder/save-resume', payload),
};

export const builderAPI = {
  githubSummarize: (url) => api.post('/api/builder/github-summarize', { url }),
  linkedinImport: (payload) => api.post('/api/builder/linkedin-import', payload),
  linkedinUploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/builder/linkedin-upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  linkedinUploadScreenshot: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/builder/linkedin-upload-screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  aiEnhanceBullet: (bullet) => api.post('/api/builder/ai-enhance-bullet', { bullet }),
  saveResume: (payload) => api.post('/api/builder/save-resume', payload),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/builder/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportDocx: (payload) => api.post('/api/builder/export-docx', payload),
};

export default api;

