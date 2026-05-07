'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { adminApi } from '@/lib/api';
import { DollarSign, TrendingUp, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface RevenueStats {
  total_revenue: number;
  this_month: number;
  last_month: number;
  today: number;
  payment_methods: { method: string; amount: number; percentage: number }[];
  daily_trend: number[];
}

export default function TransactionStatisticsPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.statsRevenue().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxDaily = Math.max(...(stats.daily_trend.length ? stats.daily_trend : [1]));
  const growth = stats.last_month > 0
    ? ((stats.this_month - stats.last_month) / stats.last_month * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">交易统计</h2>
        <p className="text-muted-foreground">平台交易数据分析</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总营收"
          value={`¥${stats.total_revenue.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="本月收入"
          value={`¥${stats.this_month.toLocaleString()}`}
          icon={TrendingUp}
          trend={{ value: Number(growth), label: '月环比' }}
        />
        <StatCard
          title="上月收入"
          value={`¥${stats.last_month.toLocaleString()}`}
          icon={CreditCard}
        />
        <StatCard
          title="今日收入"
          value={`¥${stats.today.toLocaleString()}`}
          icon={CheckCircle}
        />
      </div>

      {/* 支付方式分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">支付方式分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.payment_methods.map((item) => {
              const colors: Record<string, string> = {
                'Web3': 'bg-purple-500',
                '微信支付': 'bg-green-500',
                '支付宝': 'bg-blue-500',
                'wechat': 'bg-green-500',
                'alipay': 'bg-blue-500',
                'web3': 'bg-purple-500',
              };
              return (
                <div key={item.method} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.method}</span>
                    <span className="font-medium">¥{item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`${colors[item.method] || 'bg-primary'} h-full rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 每日收入趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">本周收入趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {stats.daily_trend.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium">¥{value}</span>
                <div
                  className="w-full bg-green-500/80 rounded-t"
                  style={{ height: `${(value / maxDaily) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{weekLabels[index] ?? ''}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 月度对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月度收入对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span>本月</span>
                <span className="font-medium">¥{stats.this_month.toLocaleString()}</span>
              </div>
              <div className="bg-muted rounded-full h-4 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span>上月</span>
                <span className="font-medium">¥{stats.last_month.toLocaleString()}</span>
              </div>
              <div className="bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className="bg-muted-foreground/50 h-full rounded-full"
                  style={{ width: `${stats.this_month > 0 ? (stats.last_month / stats.this_month) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
