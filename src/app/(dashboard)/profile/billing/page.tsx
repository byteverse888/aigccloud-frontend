'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Coins, ArrowLeft, Plus, Clock, CheckCircle, Loader2, QrCode, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthStore } from '@/store';
import { getUserTransactions, Transaction } from '@/lib/parse-actions';
import { paymentApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

// 金币套餐
const coinPackages = [
  { id: 'coin1000', coins: 1000, price: 10 },
  { id: 'coin5000', coins: 5000, price: 45 },
  { id: 'coin10000', coins: 10000, price: 80 },
  { id: 'coin50000', coins: 50000, price: 380 },
];

interface PaymentInfo {
  orderId: string;
  orderNo: string;
  amount: number;
  qrCode: string;
  status: string;
}

export default function BillingPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 支付弹窗状态
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    async function loadTransactions() {
      if (!user?.objectId) return;
      
      setLoading(true);
      try {
        const result = await getUserTransactions(user.objectId);
        if (result.success) {
          setTransactions(result.data);
        }
      } catch (error) {
        toast.error('加载交易记录失败');
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, [user?.objectId]);

  // 发起金币充值
  const handleRecharge = async (coins: number, price: number) => {
    if (!user?.objectId || !user?.sessionToken) {
      toast.error('请先登录');
      return;
    }

    // 检查是否绑定账户地址
    if (!user.web3Address) {
      toast.error('请先绑定账户地址，前往「设置 - 账户地址」绑定');
      return;
    }

    setPaying(true);
    try {
      const response = await paymentApi.createOrder({
        user_id: user.objectId,
        amount: price,
        type: 'recharge',
        payment_method: 'wechat',
      }, user.sessionToken);

      if (response.order_id) {
        setPaymentInfo({
          orderId: response.order_id,
          orderNo: response.order_no,
          amount: response.amount,
          qrCode: response.qr_code || '',
          status: response.status,
        });
        setPaymentOpen(true);
        startPolling(response.order_id);
      } else {
        throw new Error('创建订单失败');
      }
    } catch (error) {
      toast.error((error as Error).message || '创建订单失败');
    } finally {
      setPaying(false);
    }
  };

  // 轮询订单状态
  const startPolling = useCallback(async (orderId: string) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 180; // 6分钟超时
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPolling(false);
        toast.error('支付超时，请重试');
        return;
      }
      
      try {
        const order = await paymentApi.queryOrder(orderId);
        if (order.status === 'paid' || order.status === 'completed') {
          setPolling(false);
          setPaymentOpen(false);
          toast.success('支付成功！');
          // 刷新用户信息
          window.location.reload();
          return;
        } else if (order.status === 'failed' || order.status === 'cancelled') {
          setPolling(false);
          toast.error('支付失败或已取消');
          return;
        }
      } catch (error) {
        console.error('轮询订单状态失败:', error);
      }
      
      attempts++;
      setTimeout(poll, 2000);
    };
    
    poll();
  }, []);

  // 关闭支付弹窗
  const handleClosePayment = () => {
    setPaymentOpen(false);
    setPolling(false);
    setPaymentInfo(null);
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
              <CreditCard className="h-5 w-5" />
              充值计费
            </CardTitle>
            <CardDescription>充值金币或订阅会员</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="membership">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="membership">会员订阅</TabsTrigger>
                <TabsTrigger value="coins">金币充值</TabsTrigger>
                <TabsTrigger value="history">交易记录</TabsTrigger>
              </TabsList>

              {/* 会员订阅 - 跳转到会员中心 */}
              <TabsContent value="membership" className="mt-6">
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">会员订阅</h3>
                  <p className="text-muted-foreground mb-6">请前往会员中心订阅会员套餐</p>
                  <Link href="/profile/membership">
                    <Button>前往会员中心</Button>
                  </Link>
                </div>
              </TabsContent>

              {/* 金币充值 */}
              <TabsContent value="coins" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {coinPackages.map((pkg) => (
                    <Card key={pkg.id} className="hover:border-primary cursor-pointer transition-colors">
                      <CardContent className="p-6 text-center">
                        <Coins className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <h3 className="text-xl font-bold">{pkg.coins}</h3>
                        <p className="text-sm text-muted-foreground mb-4">金币</p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleRecharge(pkg.coins, pkg.price)}
                          disabled={paying}
                        >
                          {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          ¥{pkg.price}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* 交易记录 */}
              <TabsContent value="history" className="mt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.objectId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {tx.type === 'recharge' && <Plus className="h-5 w-5 text-green-500" />}
                          {tx.type === 'consume' && <Clock className="h-5 w-5 text-red-500" />}
                          {tx.type === 'reward' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                          <div>
                            <p className="font-medium">
                              {tx.type === 'recharge' ? '充值' : tx.type === 'consume' ? '消费' : '奖励'}
                            </p>
                            <p className="text-sm text-muted-foreground">{tx.description || `${tx.coins || tx.amount} 金币`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">暂无交易记录</div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* 支付弹窗 */}
      <Dialog open={paymentOpen} onOpenChange={handleClosePayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              微信扫码支付
            </DialogTitle>
            <DialogDescription>
              请使用微信扫描下方二维码完成支付
            </DialogDescription>
          </DialogHeader>
          
          {paymentInfo && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">¥{paymentInfo.amount}</p>
                <p className="text-sm text-muted-foreground">订单号: {paymentInfo.orderNo}</p>
              </div>
              
              <div className="flex justify-center">
                {paymentInfo.qrCode ? (
                  <div className="p-4 bg-white rounded-lg">
                    {/* 这里可以用 QRCode 组件渲染二维码 */}
                    <div className="w-48 h-48 bg-muted flex items-center justify-center rounded">
                      <div className="text-center text-muted-foreground">
                        <QrCode className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-xs break-all px-2">{paymentInfo.qrCode}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-muted flex items-center justify-center rounded">
                    <p className="text-muted-foreground text-sm">开发环境模拟支付</p>
                  </div>
                )}
              </div>
              
              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  等待支付结果...
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClosePayment}>
                  取消支付
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // 开发环境：模拟支付成功
                    toast.success('开发环境：模拟支付成功');
                    setPaymentOpen(false);
                    window.location.reload();
                  }}
                >
                  模拟支付成功
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
