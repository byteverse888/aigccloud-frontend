'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Package, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store';
import { getUserOrders, Order } from '@/lib/parse-actions';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { label: '待处理', color: 'warning', icon: Clock },
  paid: { label: '已支付', color: 'info', icon: Package },
  completed: { label: '已完成', color: 'success', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'destructive', icon: Clock },
  refunded: { label: '已退款', color: 'secondary', icon: Clock },
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function loadOrders() {
      if (!user?.objectId) return;
      
      setLoading(true);
      try {
        const statusFilter = activeTab === 'all' ? undefined : activeTab;
        const result = await getUserOrders(user.objectId, { status: statusFilter });
        if (result.success) {
          setOrders(result.data);
        }
      } catch (error) {
        toast.error('加载订单失败');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user?.objectId, activeTab]);

  const renderOrderList = (filterStatus?: string) => {
    const filteredOrders = filterStatus 
      ? orders.filter(o => o.status === filterStatus)
      : orders;

    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          暂无{filterStatus ? statusConfig[filterStatus as keyof typeof statusConfig]?.label : ''}订单
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
          const StatusIcon = status.icon;
          return (
            <Card key={order.objectId}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{order.productName || '订单'}</h3>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">订单号：{order.orderNo}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-primary">¥{order.amount}</span>
                      <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">查看详情</Button>
                  {order.status === 'completed' && (
                    <Button variant="outline" size="sm">再次购买</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/profile">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回用户中心
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              我的订单
            </CardTitle>
            <CardDescription>查看和管理您的订单</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">全部订单</TabsTrigger>
                <TabsTrigger value="pending">待处理</TabsTrigger>
                <TabsTrigger value="completed">已完成</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {renderOrderList()}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {renderOrderList('pending')}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {renderOrderList('completed')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
