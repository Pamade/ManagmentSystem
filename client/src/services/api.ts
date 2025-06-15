import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const projectApi = {
  getAll: () => api.get('/projects').then(res => res.data),
  getById: (id: string) => api.get(`/projects/${id}`).then(res => res.data),
  create: (data: any) => api.post('/projects', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data).then(res => res.data),
  getParticipants: (id: string) => api.get(`/projects/${id}/participants`).then(res => res.data),
  getAvailableUsers: (id: string) => api.get(`/projects/${id}/available-users`).then(res => res.data),
  addParticipant: (id: string, userId: string) => api.post(`/projects/${id}/participants`, { userId }).then(res => res.data),
  removeParticipant: (id: string, userId: string) => api.delete(`/projects/${id}/participants/${userId}`).then(res => res.data)
};

export default api;