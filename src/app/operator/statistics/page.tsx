'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import { Package, ShoppingCart, DollarSign, Loader2 } from 'lucide-react';

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function OperatorStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState<{
    total: number;
    status_distribution: Record<string, number>;
    category_distribution: { category: string; count: number }[];
    top_products: { id: string; name: string; category: string; sales: number; revenue: number }[];
  } | null>(null);
  const [orderStats, setOrderStats] = useState<{
    total: number;
    status_distribution: Record<string, number>;
    daily_trend: number[];
    average_order_value: number;
  } | null>(null);
  const [revenueStats, setRevenueStats] = useState<{
    total_revenue: number;
    this_month: number;
    last_month: number;
    payment_methods: { method: string; amount: number; percentage: number }[];
    daily_trend: number[];
  } | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, o, r] = await Promise.all([
          adminApi.statsProducts(),
          adminApi.statsOrders(),
          adminApi.statsRevenue(),
        ]);
        setProductStats(p);
        setOrderStats(o);
        setRevenueStats(r);
      } catch (e) {
        console.error('加载统计失败', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const successRate = orderStats && orderStats.total > 0
    ? Math.round((orderStats.status_distribution?.completed || 0) / orderStats.total * 1000) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">报表统计</h2>
        <p className="text-muted-foreground">运营数据报表</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" />商品统计</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="mr-2 h-4 w-4" />订单统计</TabsTrigger>
          <TabsTrigger value="transactions"><DollarSign className="mr-2 h-4 w-4" />交易统计</TabsTrigger>
        </TabsList>

        {/* 商品统计 */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{productStats?.total || 0}</div><div className="text-xs text-muted-foreground">商品总数</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-green-500">{productStats?.status_distribution?.approved || 0}</div><div className="text-xs text-muted-foreground">已上架</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-yellow-500">{productStats?.status_distribution?.pending || 0}</div><div className="text-xs text-muted-foreground">审核中</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-red-500">{productStats?.status_distribution?.rejected || 0}</div><div className="text-xs text-muted-foreground">已驳回</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">分类分布</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(productStats?.category_distribution || []).map(item => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="w-16 text-sm">{item.category}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${(item.count / (productStats?.total || 1)) * 100}%` }} />
                    </div>
                    <span className="w-10 text-sm text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">热销 Top 5</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(productStats?.top_products || []).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant={i < 3 ? 'default' : 'secondary'}>{i + 1}</Badge>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                    <span className="text-sm">销量 {p.sales} | ¥{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
                {(productStats?.top_products || []).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 订单统计 */}
        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{orderStats?.total || 0}</div><div className="text-xs text-muted-foreground">总订单</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-green-500">{orderStats?.status_distribution?.completed || 0}</div><div className="text-xs text-muted-foreground">已完成</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">¥{orderStats?.average_order_value || 0}</div><div className="text-xs text-muted-foreground">客单价</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-red-500">{orderStats?.status_distribution?.cancelled || 0}</div><div className="text-xs text-muted-foreground">已取消</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">本周订单趋势</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {(orderStats?.daily_trend || []).map((v, i) => (
                  <div key={weekLabels[i]} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs">{v}</span>
                    <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${(v / Math.max(...(orderStats?.daily_trend || [1]))) * 100}%` }} />
                    <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">订单状态分布</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(orderStats?.status_distribution || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-16 text-sm">{status}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${(count / (orderStats?.total || 1)) * 100}%` }} />
                    </div>
                    <span className="w-16 text-sm text-right">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 交易统计 */}
        <TabsContent value="transactions" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">¥{(revenueStats?.total_revenue || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">总营收</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">¥{(revenueStats?.this_month || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">本月收入</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">¥{(revenueStats?.last_month || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">上月收入</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{successRate}%</div><div className="text-xs text-muted-foreground">成功率</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">支付方式分布</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(revenueStats?.payment_methods || []).map(item => (
                  <div key={item.method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.method}</span>
                      <span>¥{item.amount.toLocaleString()} ({item.percentage}%)</span>
                    </div>
                    <div className="bg-muted rounded-full h-3 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
                {(revenueStats?.payment_methods || []).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">本周收入趋势</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {(revenueStats?.daily_trend || []).map((v, i) => (
                  <div key={weekLabels[i]} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs">¥{v}</span>
                    <div className="w-full bg-green-500/80 rounded-t" style={{ height: `${(v / Math.max(...(revenueStats?.daily_trend || [1]))) * 100}%` }} />
                    <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
