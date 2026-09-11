import axios from 'axios';
import logger from '../utils/logger';

const BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
    });
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const endpoint = error.config?.url || 'unknown';
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    logger.apiError(endpoint, error);

    // Keep user session active even if specific endpoints return 401
    // UI will gracefully load fallback/mock data without kicking user out

    const normalizedError = {
      message,
      status,
      endpoint,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
