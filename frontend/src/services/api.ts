import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Verifique a porta do seu Laravel
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor: Adiciona o Token em toda requisição se ele existir
api.interceptors.request.use(config => {
  const token = localStorage.getItem('diceplay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Se der erro 401 (Não autorizado), desloga o usuário
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('diceplay_token');
      localStorage.removeItem('diceplay_current_profile');
      // Opcional: window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;