import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    // Development Basic Auth using the admin account we seeded
    'Authorization': 'Basic ' + btoa('admin:admin123')
  }
});

export default api;