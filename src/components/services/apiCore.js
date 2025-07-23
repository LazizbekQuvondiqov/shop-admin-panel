// Fayl: frontend/src/services/apiCore.js (YANGI `shops` ENDPOINTLARI BILAN)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * API ga so'rov yuborish uchun markazlashtirilgan funksiya.
 * @param {string} endpoint - API yo'li (masalan, '/users').
 * @param {object} options - Fetch API uchun qo'shimcha sozlamalar (method, body, headers).
 * @returns {Promise<any>} - Serverdan kelgan JSON javobi.
 * @throws {Error} - Agar so'rov muvaffaqiyatsiz bo'lsa.
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');

  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method: 'GET',
    ...options,
    headers,
  };

  if (!isFormData && config.body) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Server javobini o'qib bo'lmadi (status: ${response.status})`
      }));
      throw new Error(errorData.message || `Server xatosi: ${response.statusText || response.status}`);
    }
    if (response.status === 204 || (response.status === 200 && response.headers.get('content-length') === '0')) {
      return { success: true };
    }
    return await response.json();
  } catch (error) {
    console.error(`API so'rovida xatolik (${url}):`, error);
    throw error;
  }
};

const API = {
    auth: {
        login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
        updatePassword: (data) => apiRequest('/auth/update-password', { method: 'PUT', body: data }),
    },

    // >>> YANGI BO'LIM: Do'konlarni boshqarish uchun (Faqat Super Admin) <<<
    shops: {
        get: () => apiRequest('/shops'),
        create: (data) => apiRequest('/shops', { method: 'POST', body: data }),
        update: (id, data) => apiRequest(`/shops/${id}`, { method: 'PUT', body: data }),
        remove: (id) => apiRequest(`/shops/${id}`, { method: 'DELETE' }),
    },

    categories: {
        get: () => apiRequest('/categories'),
        create: (data) => apiRequest('/categories', { method: 'POST', body: data }),
        update: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: data }),
        remove: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
    },
    products: {
        get: () => apiRequest('/products'),
        create: (data) => apiRequest('/products', { method: 'POST', body: data }),
        update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: data }),
        remove: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
    },
    users: {
        get: () => apiRequest('/users'),
        // Super Admin yangi user qo'sha olmaydi, userlar faqat bot orqali yaratiladi
        // create: (data) => apiRequest('/users', { method: 'POST', body: data }),
        // update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: data }),
        // remove: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
    },
    orders: {
        get: () => apiRequest('/orders'),
        // Admin panelda yangi buyurtma yaratish mantiqi murakkablashadi, hozircha o'chirib turamiz
        // create: (data) => apiRequest('/orders', { method: 'POST', body: data }),
        update: (id, data) => apiRequest(`/orders/${id}`, { method: 'PUT', body: data }),
        remove: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),
        updateStatus: (id, data) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: data }),
    },
    settings: {
        // Sozlamalar endi do'konga bog'liq bo'ladi, buni keyinroq alohida qilamiz
        get: () => apiRequest('/settings'),
        update: (data) => apiRequest('/settings/update', { method: 'POST', body: data }),
    }
};

export default API;
