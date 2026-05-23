import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Use root-relative pathing to delegate all requests to the Next.js port 3000 reverse proxy
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const downloadTrackFile = (trackId: string) => {
  if (typeof window !== 'undefined') {
    const url = `${API_BASE_URL}/stream/${trackId}?download=true`;
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // 8-second connection timeout fail-safe
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into all requests if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('waveflow_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Token is invalid/expired
        localStorage.removeItem('waveflow_auth_token');
        // We can let the auth store handle redirects, or reload
      }
    }
    return Promise.reject(error);
  }
);

export default api;
