'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { adminApi } from '@/lib/api';
import { ShoppingCart, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface OrderStats {
  total: number;
  today_count: number;
  status_distribution: Record<string, number>;
  daily_trend: number[];
  average_order_value: number;
}

export default function OrderStatisticsPage() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.statsOrders().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxDaily = Math.max(...(stats.daily_trend.length ? stats.daily_trend : [1]));
  const completed = stats.status_distribution?.completed ?? 0;
  const refunded = stats.status_distribution?.refunded ?? 0;
  const cancelled = stats.status_distribution?.cancelled ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">订单统计</h2>
        <p className="text-muted-foreground">订单数据分析</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="订单总数" value={stats.total.toLocaleString()} icon={ShoppingCart} />
        <StatCard
          title="已完成"
          value={completed.toLocaleString()}
          icon={CheckCircle}
          trend={stats.total > 0 ? { value: Number(((completed / stats.total) * 100).toFixed(1)), label: '完成率' } : undefined}
        />
        <StatCard
          title="已退款"
          value={refunded}
          icon={RotateCcw}
          description={stats.total > 0 ? `退款率 ${((refunded / stats.total) * 100).toFixed(1)}%` : undefined}
        />
        <StatCard
          title="已取消"
          value={cancelled}
          icon={XCircle}
          description={stats.total > 0 ? `取消率 ${((cancelled / stats.total) * 100).toFixed(1)}%` : undefined}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">平均客单价</div>
              <div className="text-3xl font-bold">¥{stats.average_order_value.toFixed(1)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">日均订单</div>
              <div className="text-3xl font-bold">{stats.total > 0 ? Math.round(stats.total / 30) : 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订单状态分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">订单状态分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.status_distribution).map(([status, count]) => {
              const colors: Record<string, string> = {
                completed: 'bg-green-500',
                pending: 'bg-yellow-500',
                cancelled: 'bg-gray-500',
                refunded: 'bg-red-500',
                paid: 'bg-blue-500',
              };
              const labels: Record<string, string> = {
                completed: '已完成',
                pending: '待支付',
                cancelled: '已取消',
                refunded: '已退款',
                paid: '已支付',
              };
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-12 text-sm">{labels[status] || status}</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className={`${colors[status] || 'bg-primary'} h-full rounded-full`}
                      style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-20 text-sm text-right">
                    {count} ({stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 每日订单趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">本周订单趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {stats.daily_trend.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{value}</span>
                <div
                  className="w-full bg-blue-500/80 rounded-t"
                  style={{ height: `${(value / maxDaily) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{weekLabels[index] ?? ''}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
