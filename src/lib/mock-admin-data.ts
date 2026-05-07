/**
 * Mock 数据 - 管理端和运营端
 * 后续替换为 Parse Server API 调用
 */

// ============ 统计数据 ============

export const mockDashboardStats = {
  todayUsers: 128,
  todaySales: 12580,
  pendingProducts: 23,
  todayOrders: 86,
  activeUsers: 1520,
  totalUsers: 8960,
};

export const mockProductStats = {
  total: 1256,
  approved: 980,
  pending: 45,
  rejected: 120,
  offline: 111,
  categoryDistribution: [
    { category: '图片', count: 450 },
    { category: '音频', count: 200 },
    { category: '视频', count: 180 },
    { category: '图文漫画', count: 120 },
    { category: '音乐', count: 90 },
    { category: '数字人', count: 60 },
  ],
  topProducts: [
    { id: '1', name: '梦幻星空壁纸', category: 'image', sales: 256, revenue: 7424 },
    { id: '2', name: '电子音乐合集', category: 'audio', sales: 189, revenue: 9261 },
    { id: '3', name: '赛博朋克套图', category: 'image', sales: 167, revenue: 6513 },
    { id: '4', name: '放松白噪音', category: 'audio', sales: 145, revenue: 1305 },
    { id: '5', name: '动态Logo', category: 'video', sales: 134, revenue: 11792 },
    { id: '6', name: 'Q版游戏角色', category: 'image', sales: 121, revenue: 7139 },
    { id: '7', name: '古风水墨画', category: 'image', sales: 98, revenue: 7742 },
    { id: '8', name: '说唱伴奏曲', category: 'audio', sales: 87, revenue: 3393 },
    { id: '9', name: '产品宣传视频', category: 'video', sales: 76, revenue: 7524 },
    { id: '10', name: '数字艺术NFT', category: 'image', sales: 65, revenue: 19435 },
  ],
  monthlyTrend: [320, 380, 410, 450, 520, 580, 650],
};

export const mockOrderStats = {
  total: 3456,
  completed: 2890,
  refunded: 120,
  cancelled: 446,
  averageOrderValue: 86.5,
  dailyTrend: [45, 52, 48, 61, 55, 72, 86],
  statusDistribution: [
    { status: '已完成', count: 2890 },
    { status: '待支付', count: 234 },
    { status: '已取消', count: 212 },
    { status: '已退款', count: 120 },
  ],
};

export const mockTransactionStats = {
  totalRevenue: 298560,
  thisMonth: 45800,
  lastMonth: 38200,
  dailyTrend: [3200, 4100, 3800, 5200, 4600, 5800, 6200],
  paymentMethods: [
    { method: 'Web3', amount: 180000, percentage: 60 },
    { method: '微信支付', amount: 89000, percentage: 30 },
    { method: '支付宝', amount: 29560, percentage: 10 },
  ],
  successRate: 96.8,
};

// ============ 角色管理 ============

export interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

export const mockRoles: Role[] = [
  { id: '1', name: 'admin', label: '超级管理员', description: '拥有系统全部权限', permissions: ['*'], userCount: 2, createdAt: '2024-01-01' },
  { id: '2', name: 'operator', label: '运营人员', description: '商品审批、促销管理、报表查看', permissions: ['products.review', 'coupons', 'promotions', 'recharge', 'statistics'], userCount: 5, createdAt: '2024-01-01' },
  { id: '3', name: 'channel', label: '渠道用户', description: '渠道推广、佣金管理', permissions: ['channel.manage', 'channel.stats'], userCount: 12, createdAt: '2024-02-15' },
  { id: '4', name: 'user', label: '普通用户', description: '基础用户功能', permissions: ['user.basic'], userCount: 8941, createdAt: '2024-01-01' },
];

export const allPermissions = [
  { key: 'users.manage', label: '用户管理' },
  { key: 'roles.manage', label: '角色管理' },
  { key: 'products.manage', label: '商品管理' },
  { key: 'products.review', label: '商品审批' },
  { key: 'orders.manage', label: '订单管理' },
  { key: 'coupons', label: '券码管理' },
  { key: 'promotions', label: '促销管理' },
  { key: 'recharge', label: '充值管理' },
  { key: 'statistics', label: '报表统计' },
  { key: 'settings', label: '系统设置' },
  { key: 'channel.manage', label: '渠道管理' },
  { key: 'channel.stats', label: '渠道统计' },
];

// ============ 券码管理 ============

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed' | 'percent' | 'threshold';
  value: number;
  minAmount?: number;
  scope: 'all' | 'category' | 'product';
  scopeDetail?: string;
  startDate: string;
  endDate: string;
  totalCount: number;
  usedCount: number;
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
}

export const mockCoupons: Coupon[] = [
  { id: '1', code: 'NEW2024', type: 'fixed', value: 10, scope: 'all', startDate: '2024-01-01', endDate: '2024-12-31', totalCount: 1000, usedCount: 456, status: 'active', createdAt: '2024-01-01' },
  { id: '2', code: 'VIP20OFF', type: 'percent', value: 20, scope: 'all', startDate: '2024-03-01', endDate: '2024-06-30', totalCount: 500, usedCount: 230, status: 'active', createdAt: '2024-03-01' },
  { id: '3', code: 'IMG50', type: 'threshold', value: 50, minAmount: 200, scope: 'category', scopeDetail: '图片', startDate: '2024-02-01', endDate: '2024-04-30', totalCount: 200, usedCount: 200, status: 'expired', createdAt: '2024-02-01' },
  { id: '4', code: 'SPRING30', type: 'fixed', value: 30, scope: 'all', startDate: '2024-04-01', endDate: '2024-04-30', totalCount: 300, usedCount: 0, status: 'disabled', createdAt: '2024-03-25' },
];

// ============ 促销管理 ============

export interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'threshold' | 'gift';
  status: 'draft' | 'active' | 'paused' | 'ended';
  discount?: number;
  minAmount?: number;
  giftProduct?: string;
  startDate: string;
  endDate: string;
  productCount: number;
  orderCount: number;
  revenue: number;
  createdAt: string;
}

export const mockPromotions: Promotion[] = [
  { id: '1', name: '春季大促', type: 'discount', status: 'active', discount: 15, startDate: '2024-03-01', endDate: '2024-03-31', productCount: 50, orderCount: 320, revenue: 28600, createdAt: '2024-02-25' },
  { id: '2', name: '满200减50', type: 'threshold', status: 'active', minAmount: 200, discount: 50, startDate: '2024-03-15', endDate: '2024-04-15', productCount: 100, orderCount: 156, revenue: 31200, createdAt: '2024-03-10' },
  { id: '3', name: '买一赠一', type: 'gift', status: 'ended', giftProduct: '音乐合集', startDate: '2024-02-01', endDate: '2024-02-28', productCount: 20, orderCount: 89, revenue: 8900, createdAt: '2024-01-25' },
  { id: '4', name: '618预热', type: 'discount', status: 'draft', discount: 20, startDate: '2024-06-01', endDate: '2024-06-18', productCount: 0, orderCount: 0, revenue: 0, createdAt: '2024-05-20' },
];

// ============ 充值管理 ============

export interface RechargeRecord {
  id: string;
  userId: string;
  username: string;
  amount: number;
  bonus: number;
  method: 'wechat' | 'alipay' | 'web3';
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

export interface RechargePlan {
  id: string;
  amount: number;
  bonus: number;
  enabled: boolean;
}

export const mockRechargeRecords: RechargeRecord[] = [
  { id: '1', userId: 'u1', username: 'user1', amount: 100, bonus: 10, method: 'wechat', status: 'success', createdAt: '2024-03-15 10:30' },
  { id: '2', userId: 'u2', username: 'user2', amount: 500, bonus: 80, method: 'alipay', status: 'success', createdAt: '2024-03-15 09:20' },
  { id: '3', userId: 'u3', username: 'user3', amount: 50, bonus: 0, method: 'web3', status: 'pending', createdAt: '2024-03-14 16:45' },
  { id: '4', userId: 'u4', username: 'user4', amount: 200, bonus: 20, method: 'wechat', status: 'failed', createdAt: '2024-03-14 15:30' },
];

export const mockRechargePlans: RechargePlan[] = [
  { id: '1', amount: 50, bonus: 0, enabled: true },
  { id: '2', amount: 100, bonus: 10, enabled: true },
  { id: '3', amount: 200, bonus: 30, enabled: true },
  { id: '4', amount: 500, bonus: 80, enabled: true },
  { id: '5', amount: 1000, bonus: 200, enabled: true },
  { id: '6', amount: 2000, bonus: 500, enabled: false },
];

// ============ 账户明细 ============

export interface AccountRecord {
  id: string;
  type: 'income' | 'expense' | 'fee' | 'refund';
  category: string;
  amount: number;
  balance: number;
  description: string;
  relatedOrderNo?: string;
  createdAt: string;
}

export const mockAccountRecords: AccountRecord[] = [
  { id: '1', type: 'income', category: '商品交易', amount: 99, balance: 298560, description: '用户购买「梦幻星空壁纸」', relatedOrderNo: 'ORD20240315001', createdAt: '2024-03-15 10:30' },
  { id: '2', type: 'fee', category: '平台手续费', amount: -9.9, balance: 298550.1, description: '订单ORD20240315001手续费(10%)', relatedOrderNo: 'ORD20240315001', createdAt: '2024-03-15 10:30' },
  { id: '3', type: 'income', category: '充值', amount: 500, balance: 299050.1, description: '用户user2充值', createdAt: '2024-03-15 09:20' },
  { id: '4', type: 'refund', category: '退款', amount: -49, balance: 299001.1, description: '订单ORD20240314005退款', relatedOrderNo: 'ORD20240314005', createdAt: '2024-03-14 16:45' },
  { id: '5', type: 'expense', category: '提现', amount: -1000, balance: 298001.1, description: '创作者creator1提现', createdAt: '2024-03-14 15:30' },
];

// ============ 图表数据（通用月份标签） ============

export const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月'];
export const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
