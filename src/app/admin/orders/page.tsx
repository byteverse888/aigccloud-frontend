'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Order {
  id: string;
  orderNo: string;
  user: string;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  createdAt: string;
}

const mockOrders: Order[] = [
  { id: '1', orderNo: 'ORD20240115001', user: 'user1', amount: 299, status: 'completed', paymentMethod: '微信支付', createdAt: '2024-01-15 10:30' },
  { id: '2', orderNo: 'ORD20240115002', user: 'user2', amount: 99, status: 'paid', paymentMethod: '支付宝', createdAt: '2024-01-15 09:20' },
  { id: '3', orderNo: 'ORD20240114001', user: 'user3', amount: 499, status: 'pending', paymentMethod: '-', createdAt: '2024-01-14 16:45' },
  { id: '4', orderNo: 'ORD20240114002', user: 'user4', amount: 199, status: 'cancelled', paymentMethod: '-', createdAt: '2024-01-14 15:30' },
  { id: '5', orderNo: 'ORD20240113001', user: 'user5', amount: 149, status: 'refunded', paymentMethod: '微信支付', createdAt: '2024-01-13 11:20' },
];

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  paid: 'default',
  completed: 'success',
  cancelled: 'secondary',
  refunded: 'destructive',
};

const statusLabels: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
};

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = mockOrders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery && !order.orderNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">订单管理</h1>
        <p className="text-muted-foreground">查看和管理平台订单</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>订单列表</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待支付</SelectItem>
                  <SelectItem value="paid">已支付</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="refunded">已退款</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">订单号</th>
                  <th className="p-3 text-left text-sm font-medium">用户</th>
                  <th className="p-3 text-left text-sm font-medium">金额</th>
                  <th className="p-3 text-left text-sm font-medium">状态</th>
                  <th className="p-3 text-left text-sm font-medium">支付方式</th>
                  <th className="p-3 text-left text-sm font-medium">创建时间</th>
                  <th className="p-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-3 text-sm font-mono">{order.orderNo}</td>
                    <td className="p-3 text-sm">{order.user}</td>
                    <td className="p-3 text-sm font-bold">¥{order.amount}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{order.paymentMethod}</td>
                    <td className="p-3 text-sm">{order.createdAt}</td>
                    <td className="p-3 text-sm">
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {filteredOrders.length} 条记录
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button variant="outline" size="sm">
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
