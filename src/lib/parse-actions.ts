'use server';

/**
 * Parse Server Actions - 精简版
 */

const PARSE_SERVER_URL = process.env.PARSE_SERVER_URL || 'http://localhost:1337/parse';
const PARSE_APP_ID = process.env.PARSE_APP_ID || 'aigccloud';
const PARSE_REST_API_KEY = process.env.PARSE_REST_API_KEY || 'restapi_service_key';

// ============ 错误信息翻译 ============

function translateError(error: string, context?: Record<string, unknown>): string {
  const errorMap: Record<string, string> = {
    'Account already exists for this username.': `用户名已存在${context?.username ? ` (${context.username})` : ''}`,
    'Invalid username/password.': '用户名或密码错误',
    'Invalid session token': '登录已过期，请重新登录',
    'Object not found.': '数据不存在',
    'unauthorized': '未授权访问',
    'Invalid key': '无效的密钥',
  };
  
  for (const [en, zh] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(en.toLowerCase())) {
      return zh;
    }
  }
  return error;
}

// ============ 核心请求 ============

async function parseRequest(
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown>,
  sessionToken?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Parse-Application-Id': PARSE_APP_ID,
    'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
  };
  if (sessionToken) headers['X-Parse-Session-Token'] = sessionToken;

  const response = await fetch(`${PARSE_SERVER_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMsg = translateError(error.error || `HTTP ${response.status}`, body);
    throw new Error(errorMsg);
  }
  return response.json();
}

// ============ 通用类型 ============

export interface ParseUser {
  objectId: string;
  sessionToken?: string;
  username: string;
  email: string;
  phone?: string;
  role?: string;
  level?: number;
  isPaid?: boolean;
  paidExpireAt?: string;
  web3Address?: string;
  inviteCount?: number;
  successRegCount?: number;
  totalIncentive?: number;
  avatar?: string;
  avatarKey?: string;
}

export interface PaginatedResult<T> {
  success: boolean;
  data: T[];
  total: number;
  error?: string;
}

// ============ 通用 CRUD ============

export async function queryObjects(
  className: string,
  options?: { where?: Record<string, unknown>; limit?: number; skip?: number; order?: string; include?: string }
) {
  try {
    const params = new URLSearchParams();
    if (options?.where) params.set('where', JSON.stringify(options.where));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.skip) params.set('skip', String(options.skip));
    if (options?.order) params.set('order', options.order);
    if (options?.include) params.set('include', options.include);

    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await parseRequest(`/classes/${className}${query}`, 'GET');
    return { success: true, data: result.results || [] };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [] };
  }
}

export async function getObject(className: string, objectId: string) {
  try {
    const result = await parseRequest(`/classes/${className}/${objectId}`, 'GET');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createObject(className: string, data: Record<string, unknown>) {
  try {
    const result = await parseRequest(`/classes/${className}`, 'POST', data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateObject(className: string, objectId: string, data: Record<string, unknown>) {
  try {
    const result = await parseRequest(`/classes/${className}/${objectId}`, 'PUT', data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteObject(className: string, objectId: string) {
  try {
    await parseRequest(`/classes/${className}/${objectId}`, 'DELETE');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function countObjects(className: string, where?: Record<string, unknown>) {
  try {
    const params = new URLSearchParams({ count: '1', limit: '0' });
    if (where) params.set('where', JSON.stringify(where));
    const result = await parseRequest(`/classes/${className}?${params.toString()}`, 'GET');
    return { success: true, count: result.count || 0 };
  } catch (error) {
    return { success: false, error: (error as Error).message, count: 0 };
  }
}

// ============ 通用分页查询 ============

async function paginatedQuery<T>(
  className: string,
  where: Record<string, unknown>,
  page = 1,
  limit = 20,
  order = '-createdAt'
): Promise<PaginatedResult<T>> {
  try {
    const skip = (page - 1) * limit;
    const [result, countResult] = await Promise.all([
      queryObjects(className, { where, limit, skip, order }),
      countObjects(className, where),
    ]);
    return { success: true, data: result.data as T[], total: countResult.count };
  } catch (error) {
    return { success: false, error: (error as Error).message, data: [], total: 0 };
  }
}

// ============ 通用 Toggle 关系 ============

async function toggleRelation(
  className: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
  counterField?: { className: string; objectId: string; field: string }
) {
  try {
    const existing = await queryObjects(className, { where, limit: 1 });
    const exists = existing.data && existing.data.length > 0;

    if (exists) {
      await deleteObject(className, existing.data[0].objectId);
      if (counterField) {
        await parseRequest(`/classes/${counterField.className}/${counterField.objectId}`, 'PUT', {
          [counterField.field]: { __op: 'Increment', amount: -1 },
        });
      }
    } else {
      await createObject(className, data);
      if (counterField) {
        await parseRequest(`/classes/${counterField.className}/${counterField.objectId}`, 'PUT', {
          [counterField.field]: { __op: 'Increment', amount: 1 },
        });
      }
    }
    return { success: true, active: !exists };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============ 用户认证 ============

export async function loginUser(username: string, password: string) {
  try {
    const result = await parseRequest(`/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, 'GET');
    return { success: true, user: result as ParseUser };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function registerUser(username: string, email: string, password: string) {
  try {
    const result = await parseRequest('/users', 'POST', {
      username, email, password, role: 'user', level: 1, isPaid: false,
      inviteCount: 0, successRegCount: 0, totalIncentive: 0,
    });
    return { success: true, user: result as ParseUser };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function logoutUser(sessionToken: string) {
  try {
    await parseRequest('/logout', 'POST', undefined, sessionToken);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getCurrentUser(sessionToken: string) {
  try {
    const result = await parseRequest('/users/me', 'GET', undefined, sessionToken);
    return { success: true, user: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function resetPassword(email: string) {
  try {
    await parseRequest('/requestPasswordReset', 'POST', { email });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Web3 登录 - 通过签名验证
 */
export async function web3Login(
  address: string,
  message: string,
  signature: string,
  timestamp: number
) {
  try {
    // 验证时间戳（5分钟内有效）
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return { success: false, error: '签名已过期，请重新登录' };
    }

    // 验证签名
    const { ethers } = await import('ethers');
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      return { success: false, error: '签名验证失败' };
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return { success: false, error: '签名与地址不匹配' };
    }

    // 查找用户
    const userResult = await queryObjects('_User', { where: { web3Address: address.toLowerCase() }, limit: 1 });
    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, error: '该账户地址未注册，请先注册' };
    }

    const user = userResult.data[0] as ParseUser;
    
    // 获取完整用户信息
    const fullUser = await parseRequest(`/users/${user.objectId}`, 'GET');
    
    return {
      success: true,
      user: {
        objectId: fullUser.objectId,
        sessionToken: fullUser.sessionToken,
        username: fullUser.username,
        email: fullUser.email,
        role: fullUser.role || 'user',
        level: fullUser.level || 1,
        isPaid: fullUser.isPaid || false,
        inviteCount: fullUser.inviteCount || 0,
        successRegCount: fullUser.successRegCount || 0,
        totalIncentive: fullUser.totalIncentive || 0,
        avatar: fullUser.avatar,
        web3Address: fullUser.web3Address,
      } as ParseUser,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Web3 注册 - 创建新用户并绑定账户地址
 * @param password - 用户设置的密码，用于后续密码登录
 */
export async function web3Register(
  address: string,
  password: string
) {
  try {
    // 验证密码
    if (!password || password.length < 6) {
      return { success: false, error: '钱包密码至少6位' };
    }

    // 检查地址是否已注册
    const existingUser = await queryObjects('_User', { where: { web3Address: address.toLowerCase() }, limit: 1 });
    if (existingUser.data && existingUser.data.length > 0) {
      return { success: false, error: '该账户地址已注册' };
    }

    // 使用账户地址作为用户名
    const username = address.toLowerCase();

    // 创建用户
    const result = await parseRequest('/users', 'POST', {
      username,
      password,
      web3Address: address.toLowerCase(),
      role: 'user',
      level: 1,
      isPaid: false,
      inviteCount: 0,
      successRegCount: 0,
      totalIncentive: 0,
    });

    return {
      success: true,
      user: {
        objectId: result.objectId,
        sessionToken: result.sessionToken,
        username: result.username,
        email: result.email,
        role: 'user',
        level: 1,
        isPaid: false,
        inviteCount: 0,
        successRegCount: 0,
        totalIncentive: 0,
        web3Address: address.toLowerCase(),
      } as ParseUser,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Web3 账户检查：检查用户是否存在
 */
export async function checkWeb3UserExists(address: string) {
  try {
    const username = address.toLowerCase();

    // 使用 /users 端点查询（而不是 /classes/_User）
    const params = new URLSearchParams();
    params.set('where', JSON.stringify({ web3Address: username }));
    params.set('limit', '1');
    
    const result = await parseRequest(`/users?${params.toString()}`, 'GET');
    
    if (!result.results || result.results.length === 0) {
      return { exists: false, error: '用户不存在，请先注册' };
    } else {
      return { exists: true, error: '用户名和密码不匹配' };
    }
  } catch (error) {
    return { exists: false, error: (error as Error).message };
  }
}

export async function changePassword(username: string, currentPassword: string, newPassword: string) {
  try {
    const loginResult = await loginUser(username, currentPassword);
    if (!loginResult.success) return { success: false, error: '当前密码错误' };
    
    const { sessionToken, objectId } = loginResult.user || {};
    if (!sessionToken || !objectId) return { success: false, error: '验证失败' };
    
    await parseRequest(`/users/${objectId}`, 'PUT', { password: newPassword }, sessionToken);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateUserProfile(
  userId: string,
  data: { username?: string; email?: string; phone?: string; bio?: string; avatar?: string; avatarKey?: string; web3Address?: string },
  sessionToken: string
) {
  try {
    const result = await parseRequest(`/users/${userId}`, 'PUT', data, sessionToken);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getUserById(userId: string) {
  try {
    const result = await parseRequest(`/users/${userId}`, 'GET');
    return { success: true, user: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============ 社交互动 ============

export async function toggleLike(productId: string, userId: string) {
  const result = await toggleRelation('Like', { productId, userId }, { productId, userId },
    { className: 'Product', objectId: productId, field: 'likeCount' });
  return { ...result, liked: result.active };
}

export async function toggleFavorite(productId: string, userId: string) {
  const result = await toggleRelation('Favorite', { productId, userId }, { productId, userId });
  return { ...result, favorited: result.active };
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) return { success: false, error: '不能关注自己' };
  const result = await toggleRelation('Follow', { followerId, followingId }, { followerId, followingId });
  return { ...result, following: result.active };
}

export async function checkLikeAndFavorite(productId: string, userId: string) {
  try {
    const [likeResult, favoriteResult] = await Promise.all([
      queryObjects('Like', { where: { productId, userId }, limit: 1 }),
      queryObjects('Favorite', { where: { productId, userId }, limit: 1 }),
    ]);
    return { success: true, liked: likeResult.data?.length > 0, favorited: favoriteResult.data?.length > 0 };
  } catch (error) {
    return { success: false, error: (error as Error).message, liked: false, favorited: false };
  }
}

export async function checkFollowing(followerId: string, followingId: string) {
  try {
    const result = await queryObjects('Follow', { where: { followerId, followingId }, limit: 1 });
    return { success: true, following: result.data?.length > 0 };
  } catch (error) {
    return { success: false, error: (error as Error).message, following: false };
  }
}

// ============ 分页查询接口 ============

export async function getUserFavorites(userId: string, page = 1, limit = 20) {
  return paginatedQuery('Favorite', { userId }, page, limit);
}

export async function getUserFollowing(userId: string, page = 1, limit = 20) {
  return paginatedQuery('Follow', { followerId: userId }, page, limit);
}

export async function getUserFollowers(userId: string, page = 1, limit = 20) {
  return paginatedQuery('Follow', { followingId: userId }, page, limit);
}

export async function getComments(productId: string, page = 1, limit = 20) {
  return paginatedQuery('Comment', { productId, parentId: null }, page, limit);
}

// ============ 评论 ============

export async function addComment(productId: string, userId: string, content: string, parentId?: string) {
  try {
    const comment = await createObject('Comment', { productId, userId, content, parentId: parentId || null });
    await parseRequest(`/classes/Product/${productId}`, 'PUT', { commentCount: { __op: 'Increment', amount: 1 } });
    return { success: true, data: comment.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteComment(commentId: string, productId: string) {
  try {
    await deleteObject('Comment', commentId);
    await parseRequest(`/classes/Product/${productId}`, 'PUT', { commentCount: { __op: 'Increment', amount: -1 } });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============ 商品 ============

export interface Product {
  objectId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  cover?: string;
  rating?: number;
  sales?: number;
  likeCount?: number;
  commentCount?: number;
  status: string;
  creatorId: string;
  creatorName?: string;
  createdAt: string;
}

export async function getProducts(options?: { category?: string; search?: string; sortBy?: string; page?: number; limit?: number }) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const where: Record<string, unknown> = { status: 'approved' };
  if (options?.category && options.category !== 'all') where.category = options.category;
  if (options?.search) where.name = { $regex: options.search, $options: 'i' };

  const orderMap: Record<string, string> = { sales: '-sales', price_asc: 'price', price_desc: '-price', rating: '-rating', newest: '-createdAt' };
  const order = orderMap[options?.sortBy || ''] || '-createdAt';

  return paginatedQuery<Product>('Product', where, page, limit, order);
}

export async function getProductById(productId: string) {
  return getObject('Product', productId);
}

// ============ 资产 ============

export interface Asset {
  objectId: string;
  name: string;
  type: string;
  status: string;
  price: number;
  views: number;
  likes: number;
  ownerId: string;
  createdAt: string;
}

export async function getUserAssets(userId: string, options?: { type?: string; status?: string; page?: number; limit?: number }) {
  const where: Record<string, unknown> = { ownerId: userId };
  if (options?.type && options.type !== 'all') where.type = options.type;
  if (options?.status && options.status !== 'all') where.status = options.status;
  return paginatedQuery<Asset>('Asset', where, options?.page || 1, options?.limit || 20);
}

// ============ AI任务 ============

export type TaskType = 'txt2img' | 'img2img' | 'txt2speech' | 'speech2txt' | 'txt2music' | 'txt2video';
export type TaskStatus = 0 | 1 | 2 | 3 | 4; // 0:排队中, 1:处理中, 2:完成, 3:失败, 4:已奖励

export interface TaskResult {
  CID?: string;
  url: string;
  thumbnail?: string;
}

export interface AITask {
  objectId?: string;
  taskId?: string;
  designer: string;  // User objectId
  executor?: string; // Web3 address
  type: TaskType;
  model: string;
  data: {
    prompt: string;
    negativePrompt?: string;
    style?: string;
    size?: string;
    quality?: string;
    referenceImage?: string;  // 图生图参考图 URL
    strength?: string;        // 图生图变化强度
    inputFile?: string;       // 语音识别输入文件 URL
    [key: string]: string | undefined;
  };
  status: TaskStatus;
  results?: TaskResult[];
  errorMessage?: string;
  cost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function createAITask(task: Omit<AITask, 'objectId' | 'createdAt'>) {
  return createObject('AITask', task);
}

export async function getAITask(taskId: string) {
  return getObject('AITask', taskId);
}

export async function getUserAITasks(userId: string, options?: { type?: string; status?: number; page?: number; limit?: number }) {
  const where: Record<string, unknown> = { designer: userId };
  if (options?.type && options.type !== 'all') where.type = options.type;
  if (options?.status !== undefined) where.status = options.status;
  return paginatedQuery<AITask>('AITask', where, options?.page || 1, options?.limit || 20);
}

export async function pollAITaskStatus(taskId: string, maxAttempts = 60, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getAITask(taskId);
    if (!result.success) return result;
    const task = result.data as AITask;
    if (task?.status === 2 || task?.status === 3) return result; // 2:完成, 3:失败
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return { success: false, error: '任务超时' };
}

// ============ 订单/交易/通知/收益 ============

export interface Order {
  objectId: string;
  orderNo: string;
  userId: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  type: 'purchase' | 'subscription' | 'recharge';
  amount: number;
  coins?: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
}

export interface Transaction {
  objectId: string;
  userId: string;
  type: 'recharge' | 'consume' | 'reward' | 'withdraw' | 'refund';
  amount: number;
  coins?: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Notification {
  objectId: string;
  userId: string;
  type: 'success' | 'info' | 'warning' | 'reward' | 'system';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface EarningRecord {
  objectId: string;
  userId: string;
  type: 'sale' | 'reward' | 'withdraw' | 'refund';
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export async function getUserOrders(userId: string, options?: { status?: string; page?: number; limit?: number }) {
  const where: Record<string, unknown> = { userId };
  if (options?.status && options.status !== 'all') where.status = options.status;
  return paginatedQuery<Order>('Order', where, options?.page || 1, options?.limit || 20);
}

export async function getUserTransactions(userId: string, options?: { type?: string; page?: number; limit?: number }) {
  const where: Record<string, unknown> = { userId };
  if (options?.type && options.type !== 'all') where.type = options.type;
  return paginatedQuery<Transaction>('Transaction', where, options?.page || 1, options?.limit || 20);
}

export async function getUserNotifications(userId: string, options?: { unreadOnly?: boolean; page?: number; limit?: number }) {
  const where: Record<string, unknown> = { userId };
  if (options?.unreadOnly) where.read = false;
  return paginatedQuery<Notification>('Notification', where, options?.page || 1, options?.limit || 20);
}

export async function markNotificationRead(notificationId: string) {
  return updateObject('Notification', notificationId, { read: true });
}

export async function markAllNotificationsRead(userId: string) {
  try {
    const result = await queryObjects('Notification', { where: { userId, read: false }, limit: 100 });
    if (result.data?.length) {
      await Promise.all(result.data.map((n: { objectId: string }) => updateObject('Notification', n.objectId, { read: true })));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getUserEarnings(userId: string, options?: { type?: string; page?: number; limit?: number }) {
  const where: Record<string, unknown> = { userId };
  if (options?.type && options.type !== 'all') where.type = options.type;
  return paginatedQuery<EarningRecord>('EarningRecord', where, options?.page || 1, options?.limit || 20);
}

export async function getUserEarningStats(userId: string) {
  try {
    const allRecords = await queryObjects('EarningRecord', { where: { userId, status: 'completed' }, limit: 1000 });
    const records = allRecords.data as EarningRecord[];
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let totalEarnings = 0, thisMonthEarnings = 0, lastMonthEarnings = 0, withdrawn = 0;
    records.forEach(r => {
      const date = new Date(r.createdAt);
      if (r.type === 'sale' || r.type === 'reward') {
        totalEarnings += r.amount;
        if (date >= thisMonth) thisMonthEarnings += r.amount;
        else if (date >= lastMonth && date <= lastMonthEnd) lastMonthEarnings += r.amount;
      } else if (r.type === 'withdraw') {
        withdrawn += Math.abs(r.amount);
      }
    });

    return { success: true, data: { totalEarnings, thisMonth: thisMonthEarnings, lastMonth: lastMonthEarnings, pending: totalEarnings - withdrawn, withdrawn } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============ 提现功能 ============

export interface WithdrawRequest {
  objectId?: string;
  userId: string;
  amount: number;
  method: 'alipay' | 'wechat' | 'bank';
  account: string;
  accountName: string;
  bankName?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectReason?: string;
  createdAt?: string;
}

export async function createWithdrawRequest(
  userId: string,
  data: { amount: number; method: 'alipay' | 'wechat' | 'bank'; account: string; accountName: string; bankName?: string }
) {
  try {
    // 检查可提现余额
    const statsResult = await getUserEarningStats(userId);
    if (!statsResult.success || !statsResult.data) {
      return { success: false, error: '获取余额失败' };
    }
    
    if (data.amount > statsResult.data.pending) {
      return { success: false, error: '提现金额超过可提现余额' };
    }
    
    if (data.amount < 10) {
      return { success: false, error: '最低提现金额为10元' };
    }

    // 检查是否有待处理的提现申请
    const pendingWithdraws = await queryObjects('WithdrawRequest', { 
      where: { userId, status: { $in: ['pending', 'processing'] } }, 
      limit: 1 
    });
    if (pendingWithdraws.data?.length > 0) {
      return { success: false, error: '您有一笔提现正在处理中，请等待完成后再申请' };
    }

    // 创建提现申请
    const result = await createObject('WithdrawRequest', {
      userId,
      amount: data.amount,
      method: data.method,
      account: data.account,
      accountName: data.accountName,
      bankName: data.bankName || '',
      status: 'pending',
    });

    if (!result.success) {
      return { success: false, error: result.error || '创建提现申请失败' };
    }

    // 创建提现记录（负数）
    await createObject('EarningRecord', {
      userId,
      type: 'withdraw',
      amount: -data.amount,
      description: `提现到${data.method === 'alipay' ? '支付宝' : data.method === 'wechat' ? '微信' : '银行卡'}`,
      status: 'completed',
      relatedId: result.data?.objectId,
    });

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getUserWithdrawRequests(userId: string, page = 1, limit = 20) {
  return paginatedQuery<WithdrawRequest>('WithdrawRequest', { userId }, page, limit);
}

// ============ 用户统计 ============

export async function getUserStats(userId: string) {
  try {
    const [assets, orders, followers, following] = await Promise.all([
      countObjects('Asset', { ownerId: userId }),
      countObjects('Order', { userId }),
      countObjects('Follow', { followingId: userId }),
      countObjects('Follow', { followerId: userId }),
    ]);
    return { success: true, data: { assetCount: assets.count, orderCount: orders.count, followerCount: followers.count, followingCount: following.count } };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
