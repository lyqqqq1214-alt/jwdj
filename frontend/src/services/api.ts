import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 后端统一返回 Result 格式: { code, message, data }
    if (res.code === 200) {
      return res;
    }
    // 业务错误
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  (error) => {
    // HTTP 错误
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // Token 过期或无效，清除登录状态
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }
      if (status === 403) {
        return Promise.reject(new Error('无权限访问'));
      }
      if (data && data.message) {
        return Promise.reject(new Error(data.message));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
