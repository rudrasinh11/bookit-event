import axios from 'axios';

// 1. Establish absolute baseline configuration pathways
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://bookit-event-backend.vercel.app/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// ==========================================================
// 🚀 IN-MEMORY PERFORMANCE PERFORMANCE CACHE STORE
// ==========================================================
const clientMemoryCacheStore = new Map();
const CACHE_TTL_MILLISECONDS = 15 * 1000; 

// Request Interceptor: Force attach bearer verification tokens to all outbound headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Clean out trailing slash inconsistencies to prevent Vercel path mapping breaks
        if (config.url && config.url.startsWith('/')) {
            config.url = config.url.replace(/^\/+/, '');
        }

        if (config.method === 'get') {
            const cacheKey = `${config.url}${config.params ? JSON.stringify(config.params) : ''}`;
            const cachedRecord = clientMemoryCacheStore.get(cacheKey);
            const currentSystemClock = Date.now();

            if (cachedRecord && cachedRecord.expirationTime > currentSystemClock) {
                config.adapter = () => {
                    return Promise.resolve({
                        data: JSON.parse(cachedRecord.payloadData),
                        status: 200,
                        statusText: 'OK',
                        headers: config.headers,
                        config: config
                    });
                };
            }
        } else {
            clientMemoryCacheStore.clear();
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Manage token rotation, failures, and caching windows
api.interceptors.response.use(
    (response) => {
        const config = response.config;
        if (config.method === 'get' && response.status === 200) {
            const cacheKey = `${config.url}${config.params ? JSON.stringify(config.params) : ''}`;
            clientMemoryCacheStore.set(cacheKey, {
                payloadData: JSON.stringify(response.data),
                expirationTime: Date.now() + CACHE_TTL_MILLISECONDS
            });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Intercept standard unauthorized expiration signatures safely
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; 

            try {
                const currentRefreshToken = localStorage.getItem('refreshToken');
                if (!currentRefreshToken) throw new Error('Refresh token missing');

                const refreshBaseUrl = (import.meta.env.VITE_API_URL || 'https://bookit-event-backend.vercel.app/api').replace(/\/$/, '');
                const { data } = await axios.post(
                    `${refreshBaseUrl}/auth/refresh-token`, 
                    { refreshToken: currentRefreshToken }
                );

                if (data.token) {
                    localStorage.setItem('token', data.token);
                    if (data.refreshToken) {
                        localStorage.setItem('refreshToken', data.refreshToken);
                    }
                    
                    // 🌟 FIXED: Reinject token and route back into our instance ('api', not plain 'axios')
                    originalRequest.headers.Authorization = `Bearer ${data.token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.warn('Session expired completely. Evicting data instances.');
                localStorage.removeItem('userInfo');
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;