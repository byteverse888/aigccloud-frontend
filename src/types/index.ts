// User Types
export interface User {
  objectId: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'operator' | 'channel' | 'admin';
  level: number;
  isPaid: boolean;
  paidExpireAt?: Date;
  web3Address?: string;
  inviteCount: number;
  successRegCount: number;
  totalIncentive: number;
  avatar?: string;
  avatarKey?: string; // S3 文件 key，用于获取预签名 URL
  createdAt: Date;
  updatedAt: Date;
}

// AITask Types
export type TaskType = 'txt2img' | 'img2img' | 'txt2speech' | 'speech2txt' | 'txt2music' | 'txt2video';
export type TaskStatus = 0 | 1 | 2 | 3 | 4; // 0:排队中, 1:被锁住, 2:制作完成, 3:失败, 4:已奖励

export interface AITask {
  objectId: string;
  type: TaskType;
  model: string;
  designer: string; // User objectId
  executor?: string; // Web3 address
  data: {
    prompt: string;
    negativePrompt?: string;
    style?: string;
    size?: string;
    quality?: string;
    [key: string]: unknown;
  };
  status: TaskStatus;
  results?: TaskResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskResult {
  CID?: string;
  url: string;
  thumbnail?: string;
}

// Product Types
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'offline';
export type ProductCategory = 'image' | 'audio' | 'video' | 'model' | 'other';

export interface Product {
  objectId: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  coverImage: string;
  images: string[];
  files: ProductFile[];
  creator: User;
  status: ProductStatus;
  reviewNote?: string;
  likes: number;
  favorites: number;
  sales: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

// Order Types
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  objectId: string;
  orderNo: string;
  user: User;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  payAmount: number;
  status: OrderStatus;
  paymentMethod?: 'wechat' | 'alipay' | 'web3';
  paymentTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

// Review Types
export interface Review {
  objectId: string;
  product: Product;
  user: User;
  rating: number;
  content: string;
  images?: string[];
  createdAt: Date;
}

// Follow Types
export interface Follow {
  objectId: string;
  follower: User;
  following: User;
  createdAt: Date;
}

// Favorite Types
export interface Favorite {
  objectId: string;
  user: User;
  product: Product;
  createdAt: Date;
}

// Notification Types
export type NotificationType = 'system' | 'order' | 'review' | 'incentive' | 'task';

export interface Notification {
  objectId: string;
  user: User;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

// Subscription Types
export type SubscriptionPlan = 'monthly' | 'halfyear' | 'yearly' | 'threeyear';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  days: number;
  description: string;
  coins: number;
}

// Incentive Types
export type IncentiveType = 'register' | 'daily_login' | 'invite' | 'task' | 'activity';

export interface Incentive {
  objectId: string;
  user: User;
  type: IncentiveType;
  amount: number;
  description: string;
  createdAt: Date;
}

// Promotion Types
export interface PromotionStats {
  inviteCount: number;
  successRegCount: number;
  totalIncentive: number;
  inviteLink: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface AIGenerateFormData {
  prompt: string;
  negativePrompt?: string;
  model: string;
  style?: string;
  size?: string;
  quality?: string;
}
