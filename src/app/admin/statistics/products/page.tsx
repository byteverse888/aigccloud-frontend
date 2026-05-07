'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProductStats {
  total: number;
  status_distribution: Record<string, number>;
  category_distribution: { category: string; count: number }[];
  top_products: { objectId: string; name: string; category: string; sales: number; revenue: number }[];
  pending_reports: number;
}

export default function ProductStatisticsPage() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.statsProducts().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">商品统计</h2>
        <p className="text-muted-foreground">商品数据分析</p>
      </div>

      {/* 商品状态概览 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">商品总数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-500">{stats.status_distribution?.approved ?? 0}</div>
            <div className="text-sm text-muted-foreground">已上架</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-500">{stats.status_distribution?.pending ?? 0}</div>
            <div className="text-sm text-muted-foreground">审核中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-500">{stats.status_distribution?.rejected ?? 0}</div>
            <div className="text-sm text-muted-foreground">已驳回</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-gray-500">{stats.status_distribution?.offline ?? 0}</div>
            <div className="text-sm text-muted-foreground">已下架</div>
          </CardContent>
        </Card>
      </div>

      {/* 分类分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">分类分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.category_distribution.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="w-16 text-sm">{item.category}</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-16 text-sm text-right">
                  {item.count} ({stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 热销商品 Top */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">热销商品 Top {stats.top_products.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.top_products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无销售数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">排名</th>
                    <th className="text-left py-2 px-2">商品名称</th>
                    <th className="text-left py-2 px-2">分类</th>
                    <th className="text-right py-2 px-2">销量</th>
                    <th className="text-right py-2 px-2">收入</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_products.map((product, index) => (
                    <tr key={product.objectId} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>
                          {index + 1}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 font-medium">{product.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{product.category}</td>
                      <td className="py-2 px-2 text-right">{product.sales}</td>
                      <td className="py-2 px-2 text-right">¥{product.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
