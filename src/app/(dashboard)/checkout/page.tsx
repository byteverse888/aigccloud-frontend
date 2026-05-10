'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useCartStore, useAuthStore } from '@/store';
import { assetsApi, incentiveApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { items, getTotalPrice, fetchCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const totalPrice = getTotalPrice();

  // 拉取最新账户余额
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await incentiveApi.getBalance();
        if (!cancelled) setBalance(Number(res?.balance || 0));
      } catch {
        if (!cancelled) setBalance(Number(user?.totalIncentive || 0));
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.totalIncentive]);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  const handlePayment = async () => {
    if (!user?.objectId) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }
    if (items.length === 0) {
      toast.error('购物车为空');
      return;
    }
    // 本地预判余额（后端仍会再校验一次）
    if (balance !== null && balance < totalPrice) {
      toast.error(`积分余额不足，需要 ${totalPrice} 积分，当前 ${balance}`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await assetsApi.cart.checkoutWithBalance();
      toast.success(res.message || '支付成功');
      // 同步更新本地余额展示与 auth store
      if (typeof res.balance_after === 'number') {
        setBalance(res.balance_after);
        if (user) {
          setUser({ ...user, totalIncentive: res.balance_after });
        }
      }
      // 刷新购物车（后端已清空对应项）
      await fetchCart();
      setTimeout(() => {
        router.push('/profile/orders');
      }, 1200);
    } catch (error) {
      toast.error((error as Error).message || '支付失败');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const insufficient = balance !== null && balance < totalPrice;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/cart">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回购物车
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">确认订单</h1>
        <p className="text-muted-foreground">请确认订单信息后使用账户积分余额完成支付</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 订单商品列表 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>订单商品</CardTitle>
              <CardDescription>共 {items.length} 件商品</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded" />
                    ) : (
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">数字资产 · 仅限购买 1 份</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.price} 积分</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 支付方式（仅账户余额） */}
          <Card>
            <CardHeader>
              <CardTitle>支付方式</CardTitle>
              <CardDescription>当前仅支持账户积分余额支付</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 border-2 border-primary rounded-lg bg-primary/5">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">账户积分余额</p>
                  <p className="text-sm text-muted-foreground">
                    当前余额：
                    {balanceLoading ? (
                      <Loader2 className="inline-block ml-1 h-3 w-3 animate-spin" />
                    ) : (
                      <span className={insufficient ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                        {balance ?? 0} 积分
                      </span>
                    )}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              {insufficient && !balanceLoading && (
                <p className="mt-3 text-sm text-destructive">
                  积分余额不足，还差 {totalPrice - (balance ?? 0)} 积分。可前往「充值」页面补充积分后再来支付。
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 订单摘要 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品总价</span>
                <span>{totalPrice} 积分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">优惠折扣</span>
                <span className="text-green-500">-0</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>应付积分</span>
                <span className="text-primary">{totalPrice} 积分</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing || balanceLoading || insufficient}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    支付中...
                  </>
                ) : insufficient ? (
                  '余额不足'
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    确认支付
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <p>支付成功后，商品将自动添加到「我的资产」中，可随时查看和下载。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
