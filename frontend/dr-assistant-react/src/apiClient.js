import axios from 'axios';

// Create a global axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Your API's base URL
});

// Use an interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;