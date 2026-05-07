'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function OperatorOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingProducts: 0,
    todayOrders: 0,
    todaySales: 0,
    thisMonth: 0,
    productApproved: 0,
    productPending: 0,
    productRejected: 0,
    productOffline: 0,
    orderTotal: 0,
    orderCompleted: 0,
    avgOrderValue: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, orders, revenue] = await Promise.all([
          adminApi.statsProducts(),
          adminApi.statsOrders(),
          adminApi.statsRevenue(),
        ]);

        setStats({
          pendingProducts: products.status_distribution?.pending || 0,
          todayOrders: orders.today_count || 0,
          todaySales: revenue.today || 0,
          thisMonth: revenue.this_month || 0,
          productApproved: products.status_distribution?.approved || 0,
          productPending: products.status_distribution?.pending || 0,
          productRejected: products.status_distribution?.rejected || 0,
          productOffline: products.status_distribution?.offline || 0,
          orderTotal: orders.total || 0,
          orderCompleted: orders.status_distribution?.completed || 0,
          avgOrderValue: orders.average_order_value || 0,
          successRate: orders.total > 0
            ? Math.round((orders.status_distribution?.completed || 0) / orders.total * 1000) / 10
            : 0,
        });
      } catch (e) {
        console.error('加载运营数据失败', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">运营概览</h2>
        <p className="text-muted-foreground">今日运营数据一览</p>
      </div>

      {/* 核心运营指标 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="待审批商品"
          value={stats.pendingProducts}
          icon={Package}
          description="需及时处理"
        />
        <StatCard
          title="今日订单"
          value={stats.todayOrders}
          icon={ShoppingCart}
        />
        <StatCard
          title="今日销售额"
          value={`¥${stats.todaySales.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="本月收入"
          value={`¥${stats.thisMonth.toLocaleString()}`}
          icon={TrendingUp}
        />
      </div>

      {/* 待办事项 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            待办事项
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span>待审批商品</span>
              </div>
              <Badge variant="destructive">{stats.productPending}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>待处理退款</span>
              </div>
              <Badge variant="secondary">-</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速数据 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">商品状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-600">{stats.productApproved}</div>
                <div className="text-xs text-muted-foreground">已上架</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-2xl font-bold text-yellow-600">{stats.productPending}</div>
                <div className="text-xs text-muted-foreground">审核中</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-2xl font-bold text-red-600">{stats.productRejected}</div>
                <div className="text-xs text-muted-foreground">已驳回</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="text-2xl font-bold text-gray-600">{stats.productOffline}</div>
                <div className="text-xs text-muted-foreground">已下架</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">订单概况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-600">{stats.orderTotal}</div>
                <div className="text-xs text-muted-foreground">总订单</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-600">{stats.orderCompleted}</div>
                <div className="text-xs text-muted-foreground">已完成</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                <div className="text-2xl font-bold text-orange-600">¥{stats.avgOrderValue}</div>
                <div className="text-xs text-muted-foreground">客单价</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
                <div className="text-2xl font-bold text-purple-600">{stats.successRate}%</div>
                <div className="text-xs text-muted-foreground">成功率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
