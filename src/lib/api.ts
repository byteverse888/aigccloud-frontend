const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// User API
export const userApi = {
  register: (data: { email: string; password: string; username: string }) =>
    fetchApi('/api/v1/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerPhone: (data: { phone: string; code: string; password: string; username?: string }) =>
    fetchApi('/api/v1/users/register-phone', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  activate: (token: string) =>
    fetchApi(`/api/v1/users/activate/${token}`, { method: 'POST' }),

  bindWeb3: (userId: string, web3Address: string) =>
    fetchApi('/api/v1/users/bind-web3', {
      method: 'POST',
      body: JSON.stringify({ userId, web3Address }),
    }),

  verifyWeb3: (address: string) =>
    fetchApi(`/api/v1/users/verify-web3/${address}`),
};

// Auth API
export const authApi = {
  sendSms: (phone: string, type: 'login' | 'register' = 'login') =>
    fetchApi('/api/v1/auth/send-sms', {
      method: 'POST',
      body: JSON.stringify({ phone, type }),
    }),

  phoneLogin: (phone: string, code: string) =>
    fetchApi('/api/v1/auth/phone-login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  login: (username: string, password: string) =>
    fetchApi('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Payment API
export const paymentApi = {
  createOrder: (data: { 
    user_id: string; 
    amount: number; 
    type: string;
    plan?: string;
    product_id?: string;
    payment_method?: string;
  }) =>
    fetchApi('/api/v1/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createCartOrder: (data: {
    user_id: string;
    items: Array<{
      product_id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    payment_method?: string;
  }) =>
    fetchApi('/api/v1/payment/create-cart-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  queryOrder: (orderId: string) =>
    fetchApi(`/api/v1/payment/order/${orderId}`),

  getSubscriptionPlans: () =>
    fetchApi('/api/v1/payment/plans'),
  
  cancelOrder: (orderId: string) =>
    fetchApi(`/api/v1/payment/order/${orderId}/cancel`, {
      method: 'POST',
    }),
  
  mockPay: (orderId: string) =>
    fetchApi(`/api/v1/payment/order/${orderId}/mock-pay`, {
      method: 'POST',
    }),
};

// Task API
export const taskApi = {
  submitTask: (data: {
    type: string;
    model: string;
    data: Record<string, unknown>;
    userId: string;
  }) =>
    fetchApi('/api/v1/tasks/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTaskStatus: (taskId: string) =>
    fetchApi(`/api/v1/tasks/${taskId}`),

  getUserTasks: (userId: string, page = 1, limit = 20) =>
    fetchApi(`/api/v1/tasks/user/${userId}?page=${page}&limit=${limit}`),
};

// Incentive API
export const incentiveApi = {
  claimDailyReward: (userId: string) =>
    fetchApi('/api/v1/incentive/daily', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  getIncentiveHistory: (userId: string, page = 1, limit = 20) =>
    fetchApi(`/api/v1/incentive/history/${userId}?page=${page}&limit=${limit}`),
};

// Promotion API
export const promotionApi = {
  getPromotionLink: (userId: string) =>
    fetchApi(`/api/v1/promotion/link/${userId}`),

  getPromotionStats: (userId: string) =>
    fetchApi(`/api/v1/promotion/stats/${userId}`),
};

export default {
  user: userApi,
  auth: authApi,
  payment: paymentApi,
  task: taskApi,
  incentive: incentiveApi,
  promotion: promotionApi,
};
