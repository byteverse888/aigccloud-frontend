const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { headers: customHeaders, ...restOptions } = options || {};
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
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

  // Web3 认证
  web3Init: (address: string) =>
    fetchApi<{
      success: boolean;
      nonce: string;
      message: string;
      address: string;
    }>('/api/v1/auth/web3/init', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  // Web3 注册
  web3Register: (address: string, signature: string, message: string, password: string) =>
    fetchApi<{
      success: boolean;
      token: string;
      user: {
        objectId: string;
        username: string;
        email?: string;
        phone?: string;
        role: string;
        level: number;
        memberLevel: 'normal' | 'vip' | 'svip';
        coins: number;
        avatar?: string;
        avatarKey?: string;
        web3Address: string;
        inviteCount: number;
      };
      is_new_user: boolean;
      message: string;
    }>('/api/v1/auth/web3/register', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message, password }),
    }),

  // Web3 登录
  web3Login: (address: string, signature: string, message: string, password: string) =>
    fetchApi<{
      success: boolean;
      token: string;
      user: {
        objectId: string;
        username: string;
        email?: string;
        phone?: string;
        role: string;
        level: number;
        memberLevel: 'normal' | 'vip' | 'svip';
        coins: number;
        avatar?: string;
        avatarKey?: string;
        web3Address: string;
        inviteCount: number;
      };
      is_new_user: boolean;
      message: string;
    }>('/api/v1/auth/web3/login', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message, password }),
    }),

  // 邮箱注册
  emailRegister: (email: string, password: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      email: string;
    }>('/api/v1/auth/email/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // 邮箱激活
  emailActivate: (token: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      email: string;
    }>(`/api/v1/auth/email/activate?token=${token}`),

  // 邮箱登录
  emailLogin: (email: string, password: string) =>
    fetchApi<{
      success: boolean;
      token: string;
      user: {
        objectId: string;
        sessionToken: string;
        username: string;
        email?: string;
        phone?: string;
        role: string;
        level: number;
        memberLevel: 'normal' | 'vip' | 'svip';
        coins: number;
        avatar?: string;
        avatarKey?: string;
        web3Address?: string;
        inviteCount: number;
      };
      message: string;
    }>('/api/v1/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
  }, sessionToken?: string) =>
    fetchApi('/api/v1/payment/create-order', {
      method: 'POST',
      headers: sessionToken ? { 'X-Parse-Session-Token': sessionToken } : {},
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

// Member API
export const memberApi = {
  // 获取会员套餐列表
  getPlans: () =>
    fetchApi<Array<{
      plan_id: string;
      name: string;
      level: string;
      days: number;
      price: number;
      original_price: number;
      discount: number;
      bonus: number;
    }>>('/api/v1/member/plans'),

  // 创建订阅订单
  subscribe: (data: {
    user_id: string;
    plan_id: string;
    openid?: string;
    session_token?: string;
  }) =>
    fetchApi<{
      success: boolean;
      order_id?: string;
      pay_params?: {
        prepay_id?: string;
        code_url?: string;
        test_mode?: boolean;
      };
      message?: string;
    }>('/api/v1/member/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 模拟支付（测试模式）
  simulatePay: (data: { order_id: string; session_token?: string }) =>
    fetchApi<{
      success: boolean;
      order_id?: string;
      message?: string;
    }>('/api/v1/member/simulate-pay', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取会员状态
  getStatus: (userId: string, sessionToken: string) =>
    fetchApi<{
      member_level: string;
      member_expire_at?: string;
      is_expired: boolean;
    }>(`/api/v1/member/status/${userId}`, {
      headers: { 'X-Parse-Session-Token': sessionToken },
    }),

  // 获取订阅记录
  getOrders: (userId: string, sessionToken: string, limit = 20, skip = 0) =>
    fetchApi<{
      orders: Array<{
        orderId: string;
        planId: string;
        planName: string;
        level: string;
        days: number;
        amount: number;
        bonus: number;
        status: string;
        createdAt: string;
        paidAt?: string;
      }>;
      total: number;
    }>(`/api/v1/member/orders/${userId}?limit=${limit}&skip=${skip}`, {
      headers: { 'X-Parse-Session-Token': sessionToken },
    }),
};

// Wallet API
export const walletApi = {
  // 创建钱包（将加密后的 keystore 保存到服务器）
  createWallet: (web3Address: string, encryptedKeystore: string, token: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      web3Address: string;
    }>('/api/v1/users/wallet/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ web3_address: web3Address, encrypted_keystore: encryptedKeystore }),
    }),

  // 导入钱包
  importWallet: (web3Address: string, encryptedKeystore: string, token: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      web3Address: string;
    }>('/api/v1/users/wallet/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ web3_address: web3Address, encrypted_keystore: encryptedKeystore }),
    }),

  // 转账（使用密码解密 keystore 后转账）
  transfer: (toAddress: string, amount: string, password: string, token: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      txHash: string;
      from: string;
      to: string;
      amount: string;
    }>('/api/v1/users/wallet/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ to_address: toAddress, amount, password }),
    }),

  // 解绑钱包
  unbindWallet: (token: string) =>
    fetchApi<{
      success: boolean;
      message: string;
    }>('/api/v1/users/wallet/unbind', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
};

export default {
  user: userApi,
  auth: authApi,
  payment: paymentApi,
  task: taskApi,
  incentive: incentiveApi,
  promotion: promotionApi,
  member: memberApi,
  wallet: walletApi,
};
