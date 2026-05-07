'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, CreditCard, Package, AlertCircle, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<{ total_users: number; today_new: number } | null>(null);
  const [orderStats, setOrderStats] = useState<{ total: number; today_count: number; daily_trend: number[]; average_order_value: number } | null>(null);
  const [productStats, setProductStats] = useState<{ total: number; status_distribution: Record<string, number>; category_distribution: Array<{ category: string; count: number }>; top_products: Array<{ id: string; name: string; sales: number; revenue: number }>; pending_reports: number } | null>(null);
  const [revenueStats, setRevenueStats] = useState<{ total_revenue: number; this_month: number; last_month: number; today: number; payment_methods: Array<{ method: string; amount: number; percentage: number }>; daily_trend: number[] } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [users, orders, products, revenue] = await Promise.all([
          adminApi.statsUsers(),
          adminApi.statsOrders(),
          adminApi.statsProducts(),
          adminApi.statsRevenue(),
        ]);
        setUserStats(users);
        setOrderStats(orders);
        setProductStats(products);
        setRevenueStats(revenue);
      } catch (e) {
        console.error('加载统计数据失败', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingProducts = productStats?.status_distribution?.pending ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
        <p className="text-muted-foreground">平台运营数据概览</p>
      </div>

      {/* 关键指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.today_new ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              总用户 {userStats?.total_users?.toLocaleString() ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日销售额</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{revenueStats?.today?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              本月 ¥{revenueStats?.this_month?.toLocaleString() ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核商品</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProducts}</div>
            <p className="text-xs text-muted-foreground">需要及时处理</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日订单</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats?.today_count ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              客单价 ¥{orderStats?.average_order_value ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 - 本周订单和收入趋势 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>本周订单趋势</CardTitle>
            <CardDescription>每日订单数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {(orderStats?.daily_trend ?? []).map((v, i) => {
                const max = Math.max(...(orderStats?.daily_trend ?? [1]));
                return (
                  <div key={weekLabels[i]} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{v}</span>
                    <div
                      className="w-full bg-blue-500/80 rounded-t min-h-[4px]"
                      style={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本周收入趋势</CardTitle>
            <CardDescription>每日收入 (¥)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {(revenueStats?.daily_trend ?? []).map((v, i) => {
                const max = Math.max(...(revenueStats?.daily_trend ?? [1]));
                return (
                  <div key={weekLabels[i]} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">¥{v}</span>
                    <div
                      className="w-full bg-green-500/80 rounded-t min-h-[4px]"
                      style={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 商品分类占比 */}
        <Card>
          <CardHeader>
            <CardTitle>商品分类分布</CardTitle>
            <CardDescription>各分类商品数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(productStats?.category_distribution ?? []).map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="w-16 text-sm">{item.category}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${productStats?.total ? (item.count / productStats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-10 text-sm text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 待处理事项 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              待处理事项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">待审核商品</p>
                  <p className="text-sm text-muted-foreground">{pendingProducts}个商品等待审核</p>
                </div>
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-500">
                  待处理
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">待处理举报</p>
                  <p className="text-sm text-muted-foreground">{productStats?.pending_reports ?? 0}个举报待处理</p>
                </div>
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-500">
                  {(productStats?.pending_reports ?? 0) > 0 ? '紧急' : '无'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
