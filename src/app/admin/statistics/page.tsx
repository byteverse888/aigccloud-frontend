'use client';

import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import {
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface StatsData {
  users: { total_users: number; today_new: number; role_distribution: Record<string, number> } | null;
  orders: { total: number; today_count: number; status_distribution: Record<string, number>; daily_trend: number[]; average_order_value: number } | null;
  products: { total: number; status_distribution: Record<string, number>; category_distribution: { category: string; count: number }[]; top_products: unknown[]; pending_reports: number } | null;
  revenue: { total_revenue: number; this_month: number; last_month: number; today: number; payment_methods: { method: string; amount: number; percentage: number }[]; daily_trend: number[] } | null;
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatsData>({ users: null, orders: null, products: null, revenue: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [users, orders, products, revenue] = await Promise.all([
          adminApi.statsUsers(),
          adminApi.statsOrders(),
          adminApi.statsProducts(),
          adminApi.statsRevenue(),
        ]);
        setData({ users, orders, products, revenue });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { users, orders, products, revenue } = data;

  const monthGrowth = revenue && revenue.last_month > 0
    ? ((revenue.this_month - revenue.last_month) / revenue.last_month * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">运营统计</h2>
        <p className="text-muted-foreground">平台运营数据概览</p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="今日新增用户"
          value={users?.today_new ?? 0}
          icon={Users}
        />
        <StatCard
          title="今日销售额"
          value={`¥${(revenue?.today ?? 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="待审核商品"
          value={products?.status_distribution?.pending ?? 0}
          icon={Package}
          description="需要尽快处理"
        />
        <StatCard
          title="今日订单"
          value={orders?.today_count ?? 0}
          icon={ShoppingCart}
        />
      </div>

      {/* 第二行指标 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="活跃用户"
          value="-"
          icon={UserCheck}
          description="近7日登录"
        />
        <StatCard
          title="总注册用户"
          value={(users?.total_users ?? 0).toLocaleString()}
          icon={Users}
        />
        <StatCard
          title="本月收入"
          value={`¥${(revenue?.this_month ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          trend={{ value: Number(monthGrowth), label: '月环比' }}
        />
      </div>

      {/* 趋势概览 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">本周订单趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(orders?.daily_trend ?? []).map((value, index) => {
                const max = Math.max(...(orders?.daily_trend ?? [1]));
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-muted-foreground">{weekLabels[index] ?? ''}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${(value / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm font-medium">{value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">本周收入趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(revenue?.daily_trend ?? []).map((value, index) => {
                const max = Math.max(...(revenue?.daily_trend ?? [1]));
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-muted-foreground">{weekLabels[index] ?? ''}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${(value / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-medium">¥{value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 商品分类分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">商品分类分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {(products?.category_distribution ?? []).map((item) => (
              <div key={item.category} className="text-center p-3 rounded-lg border">
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm text-muted-foreground">{item.category}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
